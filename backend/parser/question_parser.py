import re

from backend.models.question import ParsedQuestion, QuestionType

# Supports A), A., A-, A:, A/, (A), [A], {A}, and newline + A Option, with optional bullets
CHOICE_PATTERN = re.compile(
    r"(?:^|[\s\n●•○■▪►✓*–—]+)"
    r"(?:"
        r"\(\s*([A-Ja-j])\s*\)"
        r"|\[\s*([A-Ja-j])\s*\]"
        r"|\{\s*([A-Ja-j])\s*\}"
        r"|([A-Ja-j])\s*[\)\.\:\-\/]"
        r"|(?<=\n)\s*([A-Ja-j])\s+(?=[A-Za-z0-9])"
    r")\s*"
)

# Numbered choices fallback: (1), [1], 1), 1.
NUMBERED_CHOICE_PATTERN = re.compile(
    r"(?:^|[\s\n●•○■▪►✓*–—]+)"
    r"(?:"
        r"\(\s*([1-9]|10)\s*\)"
        r"|\[\s*([1-9]|10)\s*\]"
        r"|([1-9]|10)\s*[\)\.\:\-]"
    r")\s*"
)

# Roman numeral choices fallback: (i), (ii), (iii), (iv)
ROMAN_CHOICE_PATTERN = re.compile(
    r"(?:^|[\s\n●•○■▪►✓*–—]+)"
    r"(?:"
        r"\(\s*(i{1,3}|iv|v|vi{0,3}|ix|x)\s*\)"
        r"|\[\s*(i{1,3}|iv|v|vi{0,3}|ix|x)\s*\]"
        r"|(i{1,3}|iv|v|vi{0,3}|ix|x)\s*[\)\.\:\-]"
    r")\s*",
    re.IGNORECASE,
)

# Detects and strips True/False suffixes like [ ] True [ ] False, (True/False), (T/F), etc.
TF_SUFFIX_PATTERN = re.compile(
    r"\s*(?:"
    r"(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*True\b\s*(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*False\b"
    r"|(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*False\b\s*(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*True\b"
    r"|(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*T\b\s*(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*F\b"
    r"|(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*F\b\s*(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*T\b"
    r"|(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*(?:True|False|T|F)\b"
    r"|[\(\[]\s*True\s*(?:\/|\\|or|\-)\s*False\s*[\)\]]"
    r"|[\(\[]\s*False\s*(?:\/|\\|or|\-)\s*True\s*[\)\]]"
    r"|[\(\[]\s*T\s*(?:\/|\\|or|\-)\s*F\s*[\)\]]"
    r"|[\(\[]\s*F\s*(?:\/|\\|or|\-)\s*T\s*[\)\]]"
    r"|[\(\[]\s*(?:True|False)\s*[\)\]]"
    r"|(?:[:\-–—]\s*)?(?:True\s*(?:\/|or)\s*False|T\s*\/\s*F)\s*\??"
    r")\s*$",
    re.IGNORECASE,
)

# Detects leading True/False prefixes like [ ] True [ ] False: Statement...
TF_PREFIX_PATTERN = re.compile(
    r"^\s*(?:"
    r"(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*True\b\s*(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*False\b"
    r"|(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*False\b\s*(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*True\b"
    r"|(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*T\b\s*(?:\[\s*[xX_–—\s]?\s*\]|\(\s*[xX_–—\s]?\s*\)|[☐☑◯○●])\s*F\b"
    r"|[\(\[]\s*True\s*(?:\/|\\|or|\-)\s*False\s*[\)\]]"
    r"|[\(\[]\s*T\s*(?:\/|\\|or|\-)\s*F\s*[\)\]]"
    r"|(?:True\s*\/\s*False|T\s*\/\s*F)\s*[:\-–—]?"
    r")\s*[:\-–—]?\s*",
    re.IGNORECASE,
)

# Trailing section headers / instructions leaking into the last choice
TRAILING_SECTION_RE = re.compile(
    r"\n+\s*(?:"
    r"(?:PART|SECTION)\s+[IVXLCDM0-9A-Z]+.*"
    r"|(?:DIRECTIONS?|INSTRUCTIONS?)\s*[:\-].*"
    r"|TRUE\s+OR\s+FALSE\s*[:\-].*"
    r"|MULTIPLE\s+CHOICE\s*[:\-].*"
    r"|ANSWER\s+THE\s+FOLLOWING.*"
    r"|READ\s+EACH\s+QUESTION.*"
    r")$",
    re.IGNORECASE | re.DOTALL,
)

# Leading section headers / directions at the start of a stem
LEADING_SECTION_RE = re.compile(
    r"^\s*(?:"
    r"(?:PART|SECTION)\s+[IVXLCDM0-9A-Z]+[^\n]*\n*"
    r"|(?:DIRECTIONS?|INSTRUCTIONS?)\s*[:\-][^\n]*\n*"
    r"|(?:TRUE\s+OR\s+FALSE|MULTIPLE\s+CHOICE)\s*[:\-][^\n]*\n*"
    r"|(?:ANSWER\s+THE\s+FOLLOWING|READ\s+EACH\s+QUESTION)[^\n]*\n*"
    r")+\s*",
    re.IGNORECASE,
)


def clean_tf_stem(text: str) -> str:
    """Strips leading or trailing True/False markers, checkboxes, and residual brackets."""
    cleaned = TF_PREFIX_PATTERN.sub("", text)
    cleaned = TF_SUFFIX_PATTERN.sub("", cleaned)
    cleaned = re.sub(r"\s*[\(\[]\s*[\)\]]\s*$", "", cleaned)
    return cleaned.strip(" :,●•○■▪►✓*–—\t\r\n")


def is_tf_question(text: str) -> bool:
    """Returns True if the text contains explicit True/False checkbox or indicator patterns."""
    return bool(TF_PREFIX_PATTERN.search(text) or TF_SUFFIX_PATTERN.search(text))


def _clean_str(text: str) -> str:
    cleaned = text.strip(" ;,●•○■▪►✓*–—\t\r\n")
    if cleaned.startswith("(") and not cleaned.endswith(")"):
        cleaned = cleaned[1:].strip()
    elif cleaned.endswith(")") and "(" not in cleaned:
        cleaned = cleaned[:-1].strip()
    return cleaned


def parse_question(question_type: QuestionType, raw_text: str) -> ParsedQuestion:
    cleaned = raw_text.strip()
    has_tf_markers = is_tf_question(cleaned)

    # If explicitly requested as TF, or if it clearly possesses True/False markers
    if question_type == "tf" or has_tf_markers:
        # Check if user entered MCQ choices (e.g. A) ... B) ...) despite selecting TF
        c_matches = list(CHOICE_PATTERN.finditer(cleaned))
        if len(c_matches) >= 2 and question_type == "mcq" and not has_tf_markers:
            # Let MCQ parser try
            try:
                return _parse_mcq(cleaned)
            except ValueError:
                pass

        stmt = clean_tf_stem(cleaned)
        stmt = " ".join(stmt.split())
        return ParsedQuestion(type="tf", statement=stmt)

    # Standard MCQ parsing
    parsed_mcq = _parse_mcq(cleaned)
    # Check if the extracted choices are actually True and False
    lower_choices = {c.strip().lower() for c in parsed_mcq.choices}
    if len(parsed_mcq.choices) == 2 and lower_choices in ({"true", "false"}, {"t", "f"}):
        clean_stem = clean_tf_stem(parsed_mcq.question or cleaned)
        return ParsedQuestion(type="tf", statement=clean_stem)

    return parsed_mcq


def _parse_mcq(raw_text: str) -> ParsedQuestion:
    cleaned_input = LEADING_SECTION_RE.sub("", raw_text).strip()

    # Strategy 1: Standard A-J choice pattern
    matches = list(CHOICE_PATTERN.finditer(cleaned_input))

    # Strategy 2: Fallback to Roman numerals (i), (ii), (iii), (iv)
    if len(matches) < 2:
        roman_matches = list(ROMAN_CHOICE_PATTERN.finditer(cleaned_input))
        if len(roman_matches) >= 2:
            matches = roman_matches

    # Strategy 3: Fallback to Numbered choices (1), (2), (3), (4)
    if len(matches) < 2:
        num_matches = list(NUMBERED_CHOICE_PATTERN.finditer(cleaned_input))
        if len(num_matches) >= 2:
            matches = num_matches

    if not matches:
        raise ValueError("No choices found. Use labels like A), A., or A- before each option.")

    question = _clean_str(cleaned_input[: matches[0].start()])
    choices: list[str] = []

    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(cleaned_input)
        choice = _clean_str(cleaned_input[start:end])
        # If last choice, clean any trailing section header or directions
        if index == len(matches) - 1:
            choice = TRAILING_SECTION_RE.sub("", choice).strip()
        if choice:
            choices.append(choice)

    if len(choices) < 2:
        raise ValueError("At least two choices are required for an MCQ.")

    return ParsedQuestion(type="mcq", question=question, choices=choices[:10])
