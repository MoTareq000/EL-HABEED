import pytest
from backend.models.question import AnalyzeRequest
from backend.services.analyzer import analyze_question
from backend.rules.rule_engine import run_mcq_rules, run_tf_rules
from backend.rules import mcq_rules


def test_mcq_longest_answer_rule():
    question = "What is encapsulation?"
    choices = [
        "A brief concept.",
        "A mechanism that binds together code and the data it manipulates, protecting both from outside interference and misuse.",
        "Short phrase.",
        "A simple data type.",
    ]
    scores, reasons = run_mcq_rules(question, choices)
    # The standout longest choice receives points, without polluting second longest
    assert scores[1] >= 1
    assert scores[0] == 0
    rule_names = [r.name for r in reasons]
    assert "Longest Answer" in rule_names


def test_mcq_moderate_and_absolute_words():
    question = "Which statement is valid?"
    choices = [
        "Variables can usually hold temporary data.",
        "Functions must always execute forever.",
        "Constants never change entirely under any circumstance.",
        "Simple syntax.",
    ]
    scores, reasons = run_mcq_rules(question, choices)
    # Choice 0 has moderate words 'usually', 'can' (+3)
    # Choice 1 has absolute words 'must', 'always' (-4)
    # Choice 2 has absolute words 'never', 'entirely' (-4)
    assert scores[0] > scores[1]
    assert scores[0] > scores[2]


def test_mcq_mandatory_prediction():
    payload = AnalyzeRequest(
        question_type="mcq",
        raw_text="Which is valid?\nA) Option One\nB) Option Two\nC) Option Three\nD) Option Four",
        seed=123,
    )
    result = analyze_question(payload)
    assert result.type == "mcq"
    assert result.prediction in ["A", "B", "C", "D"]
    assert result.predicted_text != ""
    assert isinstance(result.confidence, int)


def test_mcq_order_independence():
    question = "Which is an operating system?"
    choices = [
        "Windows is widely used.",
        "Linux can run servers.",
        "Mac OS operates computers.",
        "All of the above",
    ]
    # Execute default order
    scores_1, reasons_1 = run_mcq_rules(question, choices)

    # Invert order of execution manually
    from backend.rules.rule_engine import MCQ_RULES
    scores_2 = [0 for _ in choices]
    reasons_2 = []
    for r in reversed(MCQ_RULES):
        r(question, choices, scores_2, reasons_2)

    # Scores should be identical regardless of rule order
    assert scores_1 == scores_2
