from collections import defaultdict
from collections.abc import Callable

from backend.models.question import RuleReason
from backend.rules import mcq_rules, tf_rules

McqRule = Callable[[str, list[str], list[int], list[RuleReason]], None]
TfRule = Callable[[str, dict[str, int], list[RuleReason]], None]

MCQ_RULES: list[McqRule] = [
    mcq_rules.longest_answer_rule,
    mcq_rules.moderate_word_rule,
    mcq_rules.absolute_word_penalty_rule,
    mcq_rules.similar_option_rule,
    mcq_rules.outlier_rule,
    mcq_rules.most_inclusive_rule,
    mcq_rules.grammar_match_rule,
    mcq_rules.keyword_overlap_rule,
    mcq_rules.numeric_extremes_rule,
    mcq_rules.opposite_pair_rule,
    mcq_rules.none_of_the_above_rule,
    mcq_rules.all_of_the_above_rule,
]

TF_RULES: list[TfRule] = [
    tf_rules.absolute_words_rule,
    tf_rules.moderate_words_rule,
    tf_rules.reason_words_rule,
    tf_rules.multiple_negatives_rule,
]

# NEW-04 Overlap Group Limits
OVERLAP_GROUP_CAPS: dict[str, tuple[int, int]] = {
    # (min_negative_cap, max_positive_cap)
    "wording": (-1, 2),
    "combined_answers": (0, 1),
    "surface_form": (0, 1),
    "grammar": (0, 2),
    "option_relationships": (0, 0),
    "numeric": (0, 0),
}


def run_mcq_rules(
    question: str,
    choices: list[str],
    disabled_rules: set[str] | None = None,
) -> tuple[list[int], list[RuleReason]]:
    raw_scores = [0 for _ in choices]
    raw_reasons: list[RuleReason] = []
    active_disabled = disabled_rules or set()

    for rule in MCQ_RULES:
        rule_name = getattr(rule, "__name__", "")
        if rule_name in active_disabled:
            continue
        rule(question, choices, raw_scores, raw_reasons)

    # Apply Overlap Guard (NEW-04)
    final_scores = [0 for _ in choices]
    choice_reasons: dict[int, list[RuleReason]] = defaultdict(list)

    for r in raw_reasons:
        if r.target:
            idx = ord(r.target) - ord("A")
            if 0 <= idx < len(choices):
                choice_reasons[idx].append(r)

    for idx in range(len(choices)):
        group_deltas: dict[str, list[int]] = defaultdict(list)
        for r in choice_reasons[idx]:
            grp = r.overlap_group or "default"
            group_deltas[grp].append(r.delta)

        total_choice_score = 0
        for grp, deltas in group_deltas.items():
            grp_sum = sum(deltas)
            if grp in OVERLAP_GROUP_CAPS:
                min_cap, max_cap = OVERLAP_GROUP_CAPS[grp]
                grp_sum = max(min_cap, min(max_cap, grp_sum))
            total_choice_score += grp_sum

        final_scores[idx] = total_choice_score

    return final_scores, raw_reasons


def run_tf_rules(
    statement: str,
    disabled_rules: set[str] | None = None,
) -> tuple[dict[str, int], list[RuleReason]]:
    scores = {"True": 0, "False": 0}
    reasons: list[RuleReason] = []
    active_disabled = disabled_rules or set()

    for rule in TF_RULES:
        rule_name = getattr(rule, "__name__", "")
        if rule_name in active_disabled:
            continue
        rule(statement, scores, reasons)

    return scores, reasons
