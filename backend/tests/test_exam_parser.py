import pytest
from backend.parser.exam_parser import (
    extract_answer_key,
    parse_exam_into_questions,
    split_questions,
)


def test_extract_answer_key():
    text = (
        "1. Question One\nA) A1\nB) B1\n\n"
        "2. Question Two\nA) A2\nB) B2\n\n"
        "Answer Key:\n"
        "1. B\n"
        "2: True\n"
    )
    exam_body, keys = extract_answer_key(text)
    assert "Answer Key:" not in exam_body
    assert keys["1"] == "B"
    assert keys["2"] == "True"


def test_parse_exam_into_questions_with_warnings():
    text = (
        "1. Which is valid?\nA) OnlyOneChoice\n\n"  # Missing choices -> should flag warning
        "2. Is this statement true or false?\n\n"
        "Answer Key:\n"
        "1. A\n"
        "2. True\n"
    )
    questions, keys, unmatched = parse_exam_into_questions(text)
    assert len(questions) == 2
    assert questions[0].number == "1"
    assert questions[0].status == "needs_review"
    assert any("Less than 2 choices" in w for w in questions[0].warnings)

    assert questions[1].number == "2"
    assert questions[1].type == "tf"
    assert questions[1].official_answer == "True"


def test_scanned_pdf_detection():
    # If PDF reader produces almost no text, extract_pdf_pages_and_text flags it
    from backend.parser.exam_parser import extract_pdf_pages_and_text
    import io, pypdf

    # Create empty PDF
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=200, height=200)
    out = io.BytesIO()
    writer.write(out)
    pdf_bytes = out.getvalue()

    full_text, page_count, is_scanned, warning, pages_data = extract_pdf_pages_and_text(pdf_bytes)
    assert page_count == 1
    assert is_scanned is True
    assert warning is not None
    assert "scanned image" in warning


def test_true_false_suffix_stripping_and_classification():
    """Verify that [ ] True [ ] False and parenthetical suffixes are stripped from stems."""
    text = (
        "1. Comments in code are executed by the computer just like normal instructions. [ ] True [ ] False\n"
        "2. A while loop terminates when condition is false. (True/False)\n"
        "3. Recursive functions require a base case. [True / False]\n"
        "4. Variables can change types dynamically. (T/F)\n"
        "5. Comments are executed. [X] True [ ] False\n"
    )
    questions, _, _ = parse_exam_into_questions(text)
    assert len(questions) == 5

    assert questions[0].type == "tf"
    assert questions[0].question_text == "Comments in code are executed by the computer just like normal instructions."
    assert questions[0].choices == []

    assert questions[1].type == "tf"
    assert questions[1].question_text == "A while loop terminates when condition is false."

    assert questions[2].type == "tf"
    assert questions[2].question_text == "Recursive functions require a base case."

    assert questions[3].type == "tf"
    assert questions[3].question_text == "Variables can change types dynamically."

    assert questions[4].type == "tf"
    assert questions[4].question_text == "Comments are executed."


def test_unnumbered_tf_questions_not_collapsed():
    """Verify unnumbered True/False questions on separate lines do not get merged."""
    text = (
        "Comments in code are executed by the computer just like normal instructions. [ ] True [ ] False\n"
        "A while loop terminates when condition is false and checks its predicate before iteration. [ ] True [ ] False\n"
        "An integer variable cannot hold floating point numbers. [ ] True [ ] False\n"
    )
    questions, _, _ = parse_exam_into_questions(text)
    assert len(questions) == 3
    for q in questions:
        assert q.type == "tf"
        assert "[ ] True" not in q.question_text
        assert "[ ] False" not in q.question_text


def test_single_mcq_not_split_into_multiple_questions():
    """Ensure a single MCQ is parsed as 1 question with 4 choices, not 5 separate items."""
    text = (
        "1. Which identifier is valid?\n"
        "A) 2var\n"
        "B) my_var\n"
        "C) class\n"
        "D) total\n"
    )
    questions, _, _ = parse_exam_into_questions(text)
    assert len(questions) == 1
    assert questions[0].type == "mcq"
    assert questions[0].question_text == "Which identifier is valid?"
    assert len(questions[0].choices) == 4
    assert questions[0].choices == ["2var", "my_var", "class", "total"]


def test_trailing_section_header_stripped_from_last_choice():
    """Ensure section headers and instructions between MCQ and T/F don't leak into the last option."""
    text = (
        "1. Which identifier is valid?\n"
        "A) 2var\n"
        "B) my_var\n"
        "C) class\n"
        "D) total\n\n"
        "PART II: TRUE OR FALSE\n"
        "Directions: Mark True or False for each statement.\n\n"
        "2. Comments in code are executed by the computer. [ ] True [ ] False\n"
    )
    questions, _, _ = parse_exam_into_questions(text)
    assert len(questions) == 2
    assert questions[0].choices[-1] == "total"
    assert "PART II" not in questions[0].choices[-1]
    assert "Directions" not in questions[0].choices[-1]

    assert questions[1].type == "tf"
    assert questions[1].question_text == "Comments in code are executed by the computer."


def test_mcq_with_true_false_choices_converted_to_tf():
    """MCQ with choices A) True B) False should be converted to clean True/False."""
    text = (
        "1. Python is an interpreted language.\n"
        "A) True\n"
        "B) False\n"
    )
    questions, _, _ = parse_exam_into_questions(text)
    assert len(questions) == 1
    assert questions[0].type == "tf"
    assert questions[0].question_text == "Python is an interpreted language."
    assert questions[0].choices == []


def test_single_question_workbench_parser():
    """Verify single question parser cleans [ ] True [ ] False even if user left type as mcq."""
    from backend.parser.question_parser import parse_question

    raw = "Comments in code are executed by the computer just like normal instructions. [ ] True [ ] False"
    parsed_tf = parse_question("tf", raw)
    assert parsed_tf.type == "tf"
    assert parsed_tf.statement == "Comments in code are executed by the computer just like normal instructions."

    # Even if question_type passed was "mcq", auto-detect as tf instead of throwing No choices found
    parsed_auto = parse_question("mcq", raw)
    assert parsed_auto.type == "tf"
    assert parsed_auto.statement == "Comments in code are executed by the computer just like normal instructions."

