import random
from fastapi import HTTPException

from backend.models.question import (
    AnalyzeRequest,
    AnalyzeResponse,
    McqResult,
    ParsedQuestion,
    TfResult,
)
from backend.parser.question_parser import parse_question
from backend.rules.rule_engine import run_mcq_rules, run_tf_rules


def analyze_question(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        parsed = parse_question(payload.question_type, payload.raw_text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    seed = payload.seed if payload.seed is not None else 42

    if parsed.type == "mcq":
        return _analyze_mcq(parsed.question or "", parsed.choices, parsed, seed=seed)
    return _analyze_tf(parsed.statement or "", parsed, seed=seed)


def _analyze_mcq(
    question: str,
    choices: list[str],
    parsed: ParsedQuestion,
    seed: int = 42,
    disabled_rules: set[str] | None = None,
) -> McqResult:
    scores, reasons = run_mcq_rules(question, choices, disabled_rules=disabled_rules)

    max_score = max(scores) if scores else 0
    tied_indices = [idx for idx, score in enumerate(scores) if score == max_score]
    is_tied = len(tied_indices) > 1

    rng = random.Random(seed)
    if is_tied:
        winner_index = rng.choice(tied_indices)
        tie_breaker_method = "seeded_random"
        tied_options = [chr(ord("A") + idx) for idx in tied_indices]
    else:
        winner_index = tied_indices[0] if tied_indices else 0
        tie_breaker_method = "unique_maximum"
        tied_options = []

    label = chr(ord("A") + winner_index)
    score_map = {chr(ord("A") + index): score for index, score in enumerate(scores)}
    confidence = _mcq_confidence(scores, winner_index, is_tied)

    return McqResult(
        type="mcq",
        parsed=parsed,
        prediction=label,
        predictedText=choices[winner_index] if winner_index < len(choices) else "",
        confidence=confidence,
        scores=score_map,
        isTied=is_tied,
        tiedOptions=tied_options,
        tieBreakerMethod=tie_breaker_method,
        seed=seed,
        reasons=reasons,
    )


def _analyze_tf(
    statement: str,
    parsed: ParsedQuestion,
    seed: int = 42,
    disabled_rules: set[str] | None = None,
) -> TfResult:
    scores, reasons = run_tf_rules(statement, disabled_rules=disabled_rules)

    true_score = scores["True"]
    false_score = scores["False"]

    rng = random.Random(seed)
    if true_score > false_score:
        prediction: str = "True"
        is_tied = False
        tied_options: list[str] = []
        tie_breaker_method = "unique_maximum"
    elif false_score > true_score:
        prediction = "False"
        is_tied = False
        tied_options = []
        tie_breaker_method = "unique_maximum"
    else:
        is_tied = True
        tied_options = ["True", "False"]
        tie_breaker_method = "seeded_random"
        prediction = rng.choice(["True", "False"])

    total = true_score + false_score
    if is_tied or total == 0:
        confidence = 50
    else:
        confidence = round((max(true_score, false_score) / total) * 100)

    return TfResult(
        type="tf",
        parsed=parsed,
        prediction=prediction,  # type: ignore
        confidence=confidence,
        trueScore=true_score,
        falseScore=false_score,
        isTied=is_tied,
        tiedOptions=tied_options,
        tieBreakerMethod=tie_breaker_method,
        seed=seed,
        reasons=reasons,
    )


def _mcq_confidence(scores: list[int], winner_index: int, is_tied: bool) -> int:
    num_choices = len(scores) if scores else 4
    if is_tied:
        return round(100 / num_choices)

    positive_scores = [max(score, 0) for score in scores]
    total = sum(positive_scores)
    if total > 0:
        return round((positive_scores[winner_index] / total) * 100)

    spread = sum(abs(score) for score in scores)
    if spread > 0:
        adjusted = [score - min(scores) + 1 for score in scores]
        return round((adjusted[winner_index] / sum(adjusted)) * 100)

    return round(100 / num_choices)
