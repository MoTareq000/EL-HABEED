import re

from backend.models.question import RuleReason

ABSOLUTE_WORDS = {"always", "never", "all", "only", "every", "must"}
MODERATE_WORDS = {"usually", "often", "many", "some", "can", "may", "generally", "typically"}
REASON_WORDS = {"because", "since", "due to", "reason"}
NEGATIVE_WORDS = {"not", "cannot", "isn't", "aren't", "won't", "unlikely"}


def absolute_words_rule(statement: str, scores: dict[str, int], reasons: list[RuleReason]) -> None:
    """TF-01: Award +3 to False if the statement contains rigid absolute assertions."""
    words = sorted(_find_words(statement, ABSOLUTE_WORDS))
    if words:
        _add(
            scores,
            reasons,
            "False",
            3,
            "absolute_words",
            "Absolute Words",
            f'Contains absolute wording: "{", ".join(words)}"',
            evidence=f'Found absolute qualifier(s): "{", ".join(words)}"',
            limitation="Academic statements with absolutes are easier to falsify, though fundamental principles can be universal.",
            overlap_group="tf_wording",
        )


def moderate_words_rule(statement: str, scores: dict[str, int], reasons: list[RuleReason]) -> None:
    """TF-02: Award +2 to True if the statement contains qualifying language."""
    words = sorted(_find_words(statement, MODERATE_WORDS))
    if words:
        _add(
            scores,
            reasons,
            "True",
            2,
            "moderate_words",
            "Moderate Words",
            f'Contains qualifying language: "{", ".join(words)}"',
            evidence=f'Found moderate qualifier(s): "{", ".join(words)}"',
            limitation="Hedged claims are safe assertions that tend to hold true, though exceptions exist.",
            overlap_group="tf_wording",
        )


def reason_words_rule(statement: str, scores: dict[str, int], reasons: list[RuleReason]) -> None:
    """TF-03: Audit-only. Flags causal clauses for teacher review without biasing scoring."""
    lowered = statement.lower()
    matches = sorted(word for word in REASON_WORDS if word in lowered)
    if matches:
        _add(
            scores,
            reasons,
            "False",
            0,
            "reason_words",
            "Causal Clause (Audit Only)",
            f'Contains causal phrasing: "{", ".join(matches)}"',
            evidence=f'Found causal conjunction(s): "{", ".join(matches)}"',
            limitation="Statement contains an explanatory clause. While complex clauses can introduce false relationships, causal statements in science and medicine are frequently valid.",
            overlap_group="tf_wording",
            audit_only=True,
        )


def multiple_negatives_rule(statement: str, scores: dict[str, int], reasons: list[RuleReason]) -> None:
    """TF-04: Audit-only. Flags negation patterns that increase cognitive difficulty without biasing truth value."""
    words = sorted(_find_words(statement, NEGATIVE_WORDS))
    if words:
        _add(
            scores,
            reasons,
            "False",
            0,
            "multiple_negatives",
            "Negation Structure (Audit Only)",
            f'Contains negative wording: "{", ".join(words)}"',
            evidence=f'Found negative word(s): "{", ".join(words)}"',
            limitation="Negation increases reading complexity and cognitive load, but negation alone does not determine whether a statement is false.",
            overlap_group="tf_wording",
            audit_only=True,
        )


def _add(
    scores: dict[str, int],
    reasons: list[RuleReason],
    target: str,
    delta: int,
    rule_id: str,
    name: str,
    message: str,
    evidence: str | None = None,
    limitation: str | None = None,
    overlap_group: str | None = None,
    audit_only: bool = False,
) -> None:
    if audit_only:
        delta = 0
    scores[target] += delta
    reasons.append(
        RuleReason(
            rule=rule_id,
            name=name,
            message=message,
            target=target,
            delta=delta,
            evidence=evidence,
            limitation=limitation,
            overlap_group=overlap_group,
            audit_only=audit_only,
        )
    )


def _find_words(statement: str, vocab: set[str]) -> set[str]:
    words = set(re.findall(r"[a-zA-Z']+", statement.lower()))
    return words & vocab
