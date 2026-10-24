import pytest
from backend.models.question import AnalyzeRequest
from backend.services.analyzer import analyze_question
from backend.rules.rule_engine import run_tf_rules


def test_tf_absolute_rule():
    statement = "All programmers must always write perfect code without bugs."
    scores, reasons = run_tf_rules(statement)
    assert scores["False"] > scores["True"]
    assert any(r.name == "Absolute Words" for r in reasons)


def test_tf_moderate_rule():
    statement = "Functions can usually return values to their callers."
    scores, reasons = run_tf_rules(statement)
    assert scores["True"] > scores["False"]
    assert any(r.name == "Moderate Words" for r in reasons)


def test_tf_reason_and_negatives():
    statement = "The software is not reliable because memory is not allocated."
    scores, reasons = run_tf_rules(statement)
    # Under v2, 'because' and 'not' are audit-only construct warnings with delta == 0
    assert scores["False"] == 0
    assert scores["True"] == 0
    rule_names = [r.name for r in reasons]
    assert any("Causal" in name for name in rule_names)
    assert any("Negation" in name for name in rule_names)


def test_tf_default_rule():
    statement = "Earth orbit."
    scores, reasons = run_tf_rules(statement)
    # Under v2, zero heuristic signal means neutral 0-0 scores (handled by seeded tie-break)
    assert scores["True"] == 0
    assert scores["False"] == 0
