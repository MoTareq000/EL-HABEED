import io
import re
from typing import Any
import pypdf

from backend.models.exam import EditableQuestion, QuestionStatus
from backend.models.question import QuestionType
from backend.parser.question_parser import (
    CHOICE_PATTERN,
    LEADING_SECTION_RE,
    NUMBERED_CHOICE_PATTERN,
    ROMAN_CHOICE_PATTERN,
    TF_PREFIX_PATTERN,
    TF_SUFFIX_PATTERN,
    TRAILING_SECTION_RE,
    _clean_str,
    clean_tf_stem,
    is_tf_question,
)

QUESTION_HEADER_PATTERN = re.compile(
    r"(?:^|\n)\s*(?:[●•○■▪►✓*–—\s]*)"
    r"(?:"
        r"(?:Question|Q|Item|Problem|Exercise|Task|No)\s*[\.#:]?\s*"
        r"|\b(?:Part|Section)\s+[A-Za-z0-9]+\s*[\.:\-]\s*"
    r")?"
    r"(?:"
        r"\(\s*(\d{1,3})\s*\)"
        r"|\[\s*(\d{1,3})\s*\]"
        r"|(\d{1,3})\s*[\.\)\:\-\/]\s*"
        r"|(\d{1,3})\s+(?=[A-Z][a-z])"
    r")",
    re.IGNORECASE,
)

ANSWER_KEY_HEADER = re.compile(
    r"(?:^|\n)\s*(?:Answer\s+Key|Answers|Solutions|Official\s+Key|Key)\s*[:\-]\s*",
    re.IGNORECASE,
)

PAGE_NUMBER_PATTERN = re.compile(
    r"(?:^|\n)\s*(?:---\s*PAGE\s*\d+\s*---|Page\s*\d+\s*(?:of\s*\d+)?)\s*(?:\n|$)",
    re.IGNORECASE,
)


def extract_pdf_pages_and_text(
    pdf_bytes: bytes,
) -> tuple[str, int, bool, str | None, list[tuple[int, str]]]:
    """Extracts text per page from PDF bytes, detects scanned/empty documents."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    except Exception as exc:
        raise ValueError(f"Invalid PDF file: {str(exc)}") from exc

    page_count = len(reader.pages)
    pages: list[tuple[int, str]] = []
    total_chars = 0

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""
        total_chars += len(page_text.strip())
        pages.append((page_num, page_text))

    full_text = "\n\n".join(text for _, text in pages if text.strip())

    is_scanned = page_count > 0 and total_chars < 50
    warning = None
    if is_scanned:
        warning = (
            "This PDF contains minimal or no extractable digital text. It may be a scanned image. "
            "OCR is not implemented; please paste the exam text directly into the text editor."
        )

    return full_text, page_count, is_scanned, warning, pages


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    full_text, _, _, _, _ = extract_pdf_pages_and_text(pdf_bytes)
    return full_text


def extract_answer_key(text: str) -> tuple[str, dict[str, str]]:
    match = ANSWER_KEY_HEADER.search(text)
    if not match:
        return text, {}

    exam_body = text[: match.start()].strip()
    key_body = text[match.end() :].strip()

    # Parse entries like: 1. A, 2: B, 3 - True, 4. F, 5.T
    pairs = re.findall(
        r"(\d{1,3})\s*[\.\:\-\)\,\/]?\s*([A-Ja-j]|True|False|T|F)\b",
        key_body,
        re.IGNORECASE,
    )
    answer_keys: dict[str, str] = {}
    for q_num, ans in pairs:
        val = ans.upper()
        if val in ("T", "TRUE"):
            answer_keys[str(int(q_num))] = "True"
        elif val in ("F", "FALSE"):
            answer_keys[str(int(q_num))] = "False"
        else:
            answer_keys[str(int(q_num))] = val

    return exam_body, answer_keys


def parse_exam_into_questions(
    raw_text: str,
    pages_data: list[tuple[int, str]] | None = None,
) -> tuple[list[EditableQuestion], dict[str, str], list[str]]:
    """Separates answer keys, segments questions, and extracts editable question cards with warnings."""
    cleaned_body, extracted_keys = extract_answer_key(raw_text)
    raw_segments = split_questions(cleaned_body)

    seen_numbers: dict[str, int] = {}
    questions: list[EditableQuestion] = []

    for index, q_type, raw_chunk in raw_segments:
        q_id = f"q_{index}"
        warnings: list[str] = []
        status: QuestionStatus = "valid"

        # Extract number if present
        header_match = QUESTION_HEADER_PATTERN.search(raw_chunk)
        detected_number = None
        if header_match:
            for g in header_match.groups():
                if g and g.isdigit():
                    detected_number = str(int(g))
                    break

        if detected_number:
            seen_numbers[detected_number] = seen_numbers.get(detected_number, 0) + 1
            if seen_numbers[detected_number] > 1:
                warnings.append(f"Duplicate question number '{detected_number}' detected.")

        # Strip header numbering from stem
        cleaned_chunk = re.sub(
            r"^\s*(?:[●•○■▪►✓*–—\s]*)(?:(?:Question|Q|Item|Problem|Exercise|Task|No)\s*[\.#:]?\s*)?(?:\(\s*\d{1,3}\s*\)|\[\s*\d{1,3}\s*\]|\d{1,3}\s*[\.\)\:\-\/]\s*)",
            "",
            raw_chunk,
            flags=re.IGNORECASE,
        ).strip()
        if not cleaned_chunk:
            cleaned_chunk = raw_chunk

        # Strip any leading section header or directions
        cleaned_chunk = LEADING_SECTION_RE.sub("", cleaned_chunk).strip()

        # Strip any trailing section header or directions (e.g. PART II: TRUE OR FALSE before next question)
        cleaned_chunk = TRAILING_SECTION_RE.sub("", cleaned_chunk).strip()

        # Determine if this item is True/False
        is_tf = is_tf_question(cleaned_chunk)
        choices: list[str] = []
        question_text = cleaned_chunk

        if not is_tf:
            # Parse choices for MCQ
            choice_matches = list(CHOICE_PATTERN.finditer(cleaned_chunk))
            if len(choice_matches) < 2:
                roman_matches = list(ROMAN_CHOICE_PATTERN.finditer(cleaned_chunk))
                if len(roman_matches) >= 2:
                    choice_matches = roman_matches

            if choice_matches:
                question_text = _clean_str(cleaned_chunk[: choice_matches[0].start()])
                for c_idx, match in enumerate(choice_matches):
                    c_start = match.end()
                    c_end = choice_matches[c_idx + 1].start() if c_idx + 1 < len(choice_matches) else len(cleaned_chunk)
                    c_str = _clean_str(cleaned_chunk[c_start:c_end])
                    # If last choice, clean any trailing section header
                    if c_idx == len(choice_matches) - 1:
                        c_str = TRAILING_SECTION_RE.sub("", c_str).strip()
                    if c_str:
                        choices.append(c_str)

            # Check if choices are actually True / False options (e.g. A) True B) False)
            lower_choices = {c.strip().lower() for c in choices}
            if len(choices) == 2 and lower_choices in ({"true", "false"}, {"t", "f"}):
                is_tf = True
                choices = []
                q_type = "tf"
            elif len(choices) == 1:
                # Exactly 1 choice detected: Incomplete MCQ needing review
                warnings.append("Less than 2 choices detected. Converted or needs review.")
                status = "needs_review"
                q_type = "mcq"
            elif len(choices) == 0:
                # Zero choices detected: True/False statement
                is_tf = True
                choices = []
                q_type = "tf"
            else:
                q_type = "mcq"

        if is_tf:
            q_type = "tf"
            choices = []
            question_text = clean_tf_stem(question_text)

        # Normalize internal whitespace
        question_text = re.sub(r"[ \t]+", " ", question_text).strip()

        if len(question_text) < 6:
            warnings.append("Question stem appears very short or incomplete.")
            status = "needs_review"

        # Determine source page
        source_page = None
        if pages_data:
            probe = question_text[:40].strip() if len(question_text) >= 40 else question_text
            for p_num, p_text in pages_data:
                if probe and probe in p_text:
                    source_page = p_num
                    break

        # Check for matched official key
        key_num = detected_number or str(index)
        assigned_key = extracted_keys.get(key_num)

        questions.append(
            EditableQuestion(
                id=q_id,
                index=index,
                number=detected_number or str(index),
                sourcePage=source_page,
                type=q_type,
                questionText=question_text,
                choices=choices,
                rawText=raw_chunk,
                status=status,
                warnings=warnings,
                officialAnswer=assigned_key,
            )
        )

    # Check for unmatched keys
    question_nums = {q.number for q in questions if q.number}
    unmatched_keys = [k for k in extracted_keys if k not in question_nums]

    return questions, extracted_keys, unmatched_keys


def split_questions(text: str) -> list[tuple[int, QuestionType, str]]:
    clean_text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove page numbers and page separators
    clean_text = PAGE_NUMBER_PATTERN.sub("\n", clean_text).strip()

    # Strategy 1: Numbered headers (1., 2., Q1, (1), etc.)
    matches = list(QUESTION_HEADER_PATTERN.finditer(clean_text))

    if len(matches) >= 2:
        items: list[tuple[int, QuestionType, str]] = []
        for i, match in enumerate(matches):
            start_idx = match.start()
            end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(clean_text)
            chunk = clean_text[start_idx:end_idx].strip()

            sub_chunks = _subdivide_if_multiple_choice_sets(chunk)
            for sub in sub_chunks:
                q_type = _detect_question_type(sub)
                items.append((len(items) + 1, q_type, sub))
        if len(items) >= 2:
            return items

    # Strategy 1B: If exactly 1 numbered question was matched
    if len(matches) == 1:
        choice_items = _split_by_choice_cycles(clean_text)
        if len(choice_items) < 2:
            q_type = _detect_question_type(clean_text)
            return [(1, q_type, clean_text)]

    # Strategy 2: Choice cycle segmentation (A... B... C... D... A... B... C... D...)
    choice_items = _split_by_choice_cycles(clean_text)
    if len(choice_items) >= 2:
        return [(i + 1, _detect_question_type(chunk), chunk) for i, chunk in enumerate(choice_items)]

    # Strategy 3: Lines where each line is a distinct True/False statement
    lines = [line.strip() for line in clean_text.split("\n") if line.strip()]
    tf_lines = [line for line in lines if is_tf_question(line)]
    if len(lines) >= 2 and len(tf_lines) >= max(2, len(lines) // 2):
        items = []
        for i, line in enumerate(lines):
            q_type = _detect_question_type(line)
            items.append((i + 1, q_type, line))
        return items

    # Strategy 4: Paragraph blocks separated by blank lines (\n\n)
    paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]
    if len(paragraphs) >= 2:
        items = []
        for i, p in enumerate(paragraphs):
            q_type = _detect_question_type(p)
            items.append((i + 1, q_type, p))
        return items

    # Strategy 5: Line by line (ONLY when lines are NOT choices under a single MCQ stem)
    if len(lines) >= 2:
        choice_lines = [l for l in lines if CHOICE_PATTERN.match(l)]
        if len(choice_lines) == 0:
            items = []
            for i, line in enumerate(lines):
                q_type = _detect_question_type(line)
                items.append((i + 1, q_type, line))
            return items

    # Fallback: single question
    q_type = _detect_question_type(clean_text)
    return [(1, q_type, clean_text)]


def _subdivide_if_multiple_choice_sets(chunk: str) -> list[str]:
    choice_matches = list(CHOICE_PATTERN.finditer(chunk))
    if len(choice_matches) < 4:
        return [chunk]

    a_indices = []
    for m in choice_matches:
        letter = next((g for g in m.groups() if g is not None), "").upper()
        if letter == "A":
            a_indices.append(m.start())

    if len(a_indices) <= 1:
        return [chunk]

    sub_chunks: list[str] = []
    prev_boundary = 0
    for i in range(1, len(a_indices)):
        curr_a = a_indices[i]
        search_zone = chunk[prev_boundary:curr_a]
        last_break = search_zone.rfind("\n")
        if last_break == -1:
            last_break = search_zone.rfind(".")
        split_pt = prev_boundary + last_break if last_break != -1 else curr_a

        first_part = chunk[prev_boundary:split_pt].strip()
        if first_part:
            sub_chunks.append(first_part)
        prev_boundary = split_pt

    last_part = chunk[prev_boundary:].strip()
    if last_part:
        sub_chunks.append(last_part)

    return sub_chunks if sub_chunks else [chunk]


def _split_by_choice_cycles(text: str) -> list[str]:
    choice_matches = list(CHOICE_PATTERN.finditer(text))
    if len(choice_matches) < 4:
        return []

    cycles: list[int] = []
    seen_letters: set[str] = set()

    for m in choice_matches:
        letter = next((g for g in m.groups() if g is not None), "").upper()
        if letter == "A" and "B" in seen_letters:
            cycles.append(m.start())
            seen_letters = {"A"}
        else:
            seen_letters.add(letter)

    if not cycles:
        return []

    questions: list[str] = []
    prev_idx = 0
    for cycle_a_pos in cycles:
        search_region = text[prev_idx:cycle_a_pos]
        last_nl = search_region.rfind("\n")
        boundary = prev_idx + last_nl if last_nl != -1 else cycle_a_pos

        q_text = text[prev_idx:boundary].strip()
        if q_text:
            questions.append(q_text)
        prev_idx = boundary

    remainder = text[prev_idx:].strip()
    if remainder:
        questions.append(remainder)

    return questions


def _detect_question_type(chunk: str) -> QuestionType:
    if is_tf_question(chunk):
        return "tf"

    choice_matches = list(CHOICE_PATTERN.finditer(chunk))
    if len(choice_matches) < 2:
        choice_matches = list(ROMAN_CHOICE_PATTERN.finditer(chunk))

    if len(choice_matches) >= 2:
        first_start = choice_matches[0].end()
        first_end = choice_matches[1].start()
        first_text = chunk[first_start:first_end].strip().lower()

        second_start = choice_matches[1].end()
        second_end = choice_matches[2].start() if len(choice_matches) > 2 else len(chunk)
        second_text = chunk[second_start:second_end].strip().lower()

        # If options are explicitly True and False, classify as True/False
        if len(choice_matches) == 2 and {first_text, second_text} in ({"true", "false"}, {"t", "f"}):
            return "tf"
        return "mcq"

    return "tf"
