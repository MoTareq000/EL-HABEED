import pytest
from backend.models.exam import EditableQuestion
from backend.services.exam_service import audit_reviewed_questions


def test_predictions_do_not_change_when_official_key_changes():
    """Proves that official answer keys are strictly isolated from the blind-guessing engine.

    The algorithm's predictions must be completely independent of what is in the answer key.
    """
    questions = [
        EditableQuestion(
            id="q_1",
            index=1,
            number="1",
            type="mcq",
            question_text="Which identifier is valid in programming?",
            choices=["2ndVariable", "user_total_score", "class", "total-amount"],
            raw_text="1. Which identifier is valid?\nA) 2ndVariable\nB) user_total_score\nC) class\nD) total-amount",
            status="valid",
        ),
        EditableQuestion(
            id="q_2",
            index=2,
            number="2",
            type="tf",
            question_text="A variable declared as an integer can always store floating-point numbers.",
            choices=[],
            raw_text="2. A variable declared as an integer can always store floating-point numbers.",
            status="valid",
        ),
    ]

    seed = 999

    # Run 1: Official keys indicate 1->B, 2->False
    res_key_1 = audit_reviewed_questions(
        questions,
        filename="Exam Test",
        official_keys={"1": "B", "2": "False"},
        seed=seed,
    )

    # Run 2: Completely contrary official keys: 1->A, 2->True
    res_key_2 = audit_reviewed_questions(
        questions,
        filename="Exam Test",
        official_keys={"1": "A", "2": "True"},
        seed=seed,
    )

    # Run 3: No official keys provided at all
    res_key_none = audit_reviewed_questions(
        questions,
        filename="Exam Test",
        official_keys=None,
        seed=seed,
    )

    # Predictions MUST BE 100% IDENTICAL across all three runs!
    for q_idx in range(len(questions)):
        pred1 = res_key_1.questions[q_idx].prediction
        pred2 = res_key_2.questions[q_idx].prediction
        pred_none = res_key_none.questions[q_idx].prediction

        assert pred1 == pred2 == pred_none, (
            f"Prediction leakage detected on question {q_idx + 1}! "
            f"pred1={pred1}, pred2={pred2}, pred_none={pred_none}"
        )

        scores1 = res_key_1.questions[q_idx].scores
        scores2 = res_key_2.questions[q_idx].scores
        assert scores1 == scores2


def test_evaluation_reflects_accuracy_accurately():
    """Proves that evaluation correctly compares prediction against verified answer key."""
    questions = [
        EditableQuestion(
            id="q_1",
            index=1,
            number="1",
            type="mcq",
            question_text="Which is valid?",
            choices=["Option A", "Option B", "Option C", "Option D"],
            status="valid",
        ),
    ]

    # Predict with seed 42
    res = audit_reviewed_questions(
        questions,
        filename="Test",
        official_keys={"1": "A"},
        seed=42,
    )
    # If prediction matches "A", evaluation_status must be 'correct', else 'incorrect'
    q_res = res.questions[0]
    if q_res.prediction == "A":
        assert q_res.evaluation_status == "correct"
        assert q_res.is_correct is True
        assert res.correct_predictions == 1
    else:
        assert q_res.evaluation_status == "incorrect"
        assert q_res.is_correct is False
        assert res.incorrect_predictions == 1
