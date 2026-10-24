import pytest
from backend.models.question import AnalyzeRequest
from backend.services.analyzer import analyze_question


def test_mcq_seeded_tie_breaking_reproducibility():
    # Four options with identical lengths and zero cue words -> completely tied scores
    raw_text = "What is X?\nA) Foo\nB) Bar\nC) Baz\nD) Qux"
    req1 = AnalyzeRequest(question_type="mcq", raw_text=raw_text, seed=42)
    req2 = AnalyzeRequest(question_type="mcq", raw_text=raw_text, seed=42)

    res1 = analyze_question(req1)
    res2 = analyze_question(req2)

    assert res1.is_tied is True
    assert set(res1.tied_options) == {"A", "B", "C", "D"}
    assert res1.tie_breaker_method == "seeded_random"
    # Same seed MUST produce identical prediction
    assert res1.prediction == res2.prediction


def test_mcq_different_seeds_produce_variation_on_ties():
    # Try different seeds on a 4-way tie to ensure randomization contract
    raw_text = "What is X?\nA) Foo\nB) Bar\nC) Baz\nD) Qux"
    predictions = set()
    for seed in range(50):
        req = AnalyzeRequest(question_type="mcq", raw_text=raw_text, seed=seed)
        res = analyze_question(req)
        predictions.add(res.prediction)

    # Over 50 seeds, a 4-way tie must produce multiple distinct choices (not just A!)
    assert len(predictions) > 1
    # Ensures no earliest-option bias (B, C, or D must be selected in some seeds)
    assert any(p != "A" for p in predictions)


def test_tf_tied_scores_random_selection():
    # Statement where True and False receive equal scores or no rules trigger
    raw_text = "Data item."
    req_seed1 = AnalyzeRequest(question_type="tf", raw_text=raw_text, seed=1)
    res1 = analyze_question(req_seed1)
    assert res1.type == "tf"
    assert res1.prediction in ["True", "False"]


def test_no_tie_when_clear_winner_exists():
    # When one option clearly wins, it must NOT be marked as tied
    raw_text = (
        "Which is true?\n"
        "A) Short.\n"
        "B) This is an extensively detailed, comprehensive, and elaborated correct explanation of the principle.\n"
        "C) Tiny."
    )
    req = AnalyzeRequest(question_type="mcq", raw_text=raw_text, seed=42)
    res = analyze_question(req)
    assert res.is_tied is False
    assert res.prediction == "B"
    assert res.tie_breaker_method == "unique_maximum"
