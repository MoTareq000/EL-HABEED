import pytest
from backend.models.exam import EditableQuestion
from backend.services.exam_service import audit_reviewed_questions


def test_random_baseline_calculation_for_mixed_exam():
    # 2 questions with 4 choices (each baseline = 0.25)
    # 1 question with 5 choices (baseline = 0.20)
    # 1 true/false question (baseline = 0.50)
    # Total evaluated = 4 questions
    # Expected baseline = (0.25 + 0.25 + 0.20 + 0.50) / 4 = 1.20 / 4 = 0.30 -> 30.0%
    questions = [
        EditableQuestion(
            id="q_1",
            index=1,
            number="1",
            type="mcq",
            question_text="Q1",
            choices=["A", "B", "C", "D"],
            status="valid",
        ),
        EditableQuestion(
            id="q_2",
            index=2,
            number="2",
            type="mcq",
            question_text="Q2",
            choices=["A", "B", "C", "D"],
            status="valid",
        ),
        EditableQuestion(
            id="q_3",
            index=3,
            number="3",
            type="mcq",
            question_text="Q3",
            choices=["A", "B", "C", "D", "E"],
            status="valid",
        ),
        EditableQuestion(
            id="q_4",
            index=4,
            number="4",
            type="tf",
            question_text="Q4 statement",
            choices=[],
            status="valid",
        ),
    ]

    official_keys = {
        "1": "A",
        "2": "B",
        "3": "C",
        "4": "True",
    }

    res = audit_reviewed_questions(questions, official_keys=official_keys, seed=42)
    assert res.total_questions == 4
    assert res.evaluated_questions == 4
    assert res.expected_random_baseline == 30.0
    assert res.accuracy is not None
    assert res.accuracy_diff_percentage_points is not None
    # Difference = accuracy - baseline
    assert round(res.accuracy - 30.0, 1) == res.accuracy_diff_percentage_points


def test_missing_and_ambiguous_keys_marked_unverified():
    questions = [
        EditableQuestion(
            id="q_1",
            index=1,
            number="1",
            type="mcq",
            question_text="Q1 text",
            choices=["A", "B", "C", "D"],
            status="valid",
        ),
        EditableQuestion(
            id="q_2",
            index=2,
            number="2",
            type="mcq",
            question_text="Q2 text",
            choices=["A", "B", "C", "D"],
            status="valid",
        ),
    ]

    # Only provide key for question 1, leave question 2 unverified
    res = audit_reviewed_questions(questions, official_keys={"1": "A"}, seed=42)

    assert res.total_questions == 2
    assert res.evaluated_questions == 1
    # Question 2 must be unverified
    q2 = next(q for q in res.questions if q.id == "q_2")
    assert q2.evaluation_status == "unverified"
    assert q2.is_correct is None


def test_no_keys_at_all_reports_accuracy_unavailable():
    questions = [
        EditableQuestion(
            id="q_1",
            index=1,
            number="1",
            type="mcq",
            question_text="Q1 text",
            choices=["A", "B", "C", "D"],
            status="valid",
        ),
    ]

    res = audit_reviewed_questions(questions, official_keys=None, seed=42)
    assert res.evaluated_questions == 0
    assert res.accuracy is None
    assert res.accuracy_diff_percentage_points is None
    assert res.questions[0].evaluation_status == "unverified"
