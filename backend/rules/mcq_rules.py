import math
import re
from difflib import SequenceMatcher

from backend.models.question import RuleReason

MODERATE_WORDS = {
    "usually",
    "often",
    "generally",
    "sometimes",
    "many",
    "most",
    "can",
    "may",
    "typically",
    "frequently",
}

ABSOLUTE_WORDS = {
    "always",
    "never",
    "all",
    "none",
    "neither",
    "every",
    "must",
    "entirely",
    "solely",
}

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "be",
    "by",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "the",
    "to",
    "which",
    "following",
    "what",
    "who",
    "with",
    "where",
    "when",
    "why",
    "how",
    "describe",
    "describes",
    "statement",
}

OPPOSITE_PAIRS = (
    ("increase", "decrease"),
    ("increases", "decreases"),
    ("enable", "disable"),
    ("enabled", "disabled"),
    ("true", "false"),
    ("before", "after"),
    ("high", "low"),
    ("higher", "lower"),
    ("positive", "negative"),
    ("prefix", "postfix"),
)

COMMON_STEM_ASSOCIATIONS: dict[str, set[str]] = {
    "language": {"python", "java", "c", "c++", "javascript", "html", "sql", "pascal", "ruby", "rust", "swift"},
    "programming": {"python", "java", "c", "c++", "code", "coding", "compiler", "interpreter"},
    "decision": {"diamond", "if", "else", "if/else", "conditional", "condition", "branch", "boolean"},
    "loop": {"repeat", "repeating", "repetition", "iteration", "iterate", "while", "for", "cycle"},
    "input": {"enter", "entering", "entered", "keyboard", "read", "reading", "type", "typing", "scanner"},
    "output": {"print", "printing", "display", "displaying", "show", "showing", "screen", "result"},
    "symbol": {"diamond", "rectangle", "oval", "parallelogram"},
    "flowchart": {"diamond", "rectangle", "oval", "parallelogram", "process", "decision", "start", "end"},
}


def _word_count(text: str) -> int:
    return len(re.findall(r"[a-zA-Z0-9']+", text))


def longest_answer_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-01: Award +2 to the standout longest option if it is substantially longer than competitors."""
    if len(choices) < 2:
        return

    ranked = sorted(enumerate(choices), key=lambda item: len(item[1].strip()), reverse=True)
    top_index, top_choice = ranked[0]
    second_index, second_choice = ranked[1]

    top_len = len(top_choice.strip())
    second_len = len(second_choice.strip())
    top_words = _word_count(top_choice)
    second_words = _word_count(second_choice)

    # Psychometric item-writing safeguard:
    # 1. Single or two-word choices (e.g. Parallelogram vs Rectangle) vary due to English vocabulary, not teacher elaboration.
    # 2. Genuine length flaw requires multiple words (>= 3 words), more words than competitors, and a significant character margin (>= 10 chars).
    if (
        top_words >= 3
        and top_len > second_len
        and top_words > second_words
        and (top_len >= second_len * 1.25 and top_len - second_len >= 10)
    ):
        _add(
            scores,
            reasons,
            top_index,
            2,
            "longest_answer",
            "Longest Answer",
            f"Longest answer ({top_len} chars, {top_words} words): {top_choice}",
            evidence=f"Length: {top_len} chars vs 2nd longest {second_len} chars",
            limitation="Examiners often elaborate correct answers with qualifiers, but length alone does not prove correctness.",
            overlap_group="surface_form",
        )


def moderate_word_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-02: Award +2 to an option containing qualifying or hedging language."""
    for index, choice in enumerate(choices):
        matches = sorted(_word_set(choice) & MODERATE_WORDS)
        if matches:
            _add(
                scores,
                reasons,
                index,
                2,
                "moderate_word",
                "Moderate Word",
                f"Contains qualifying language: {', '.join(matches)}",
                evidence=f"Keywords: {', '.join(matches)}",
                limitation="Hedged wording is common in defensible assertions, but qualifiers alone do not guarantee correctness.",
                overlap_group="wording",
            )


def absolute_word_penalty_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-03: Deduct 3 points from an option containing rigid absolute wording."""
    for index, choice in enumerate(choices):
        matches = sorted(_word_set(choice) & ABSOLUTE_WORDS)
        if matches:
            _add(
                scores,
                reasons,
                index,
                -3,
                "absolute_word_penalty",
                "Absolute Word Penalty",
                f"Contains absolute wording: {', '.join(matches)}",
                evidence=f"Keywords: {', '.join(matches)}",
                limitation="Absolute claims ('always', 'never') are easily disproven by single counterexamples, but can be valid in axiomatic definitions.",
                overlap_group="wording",
            )


def similar_option_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-07: Audit-only pair-level cue. Near-twin distractors highlight a focused pair, but do not bias score towards either choice."""
    awarded_pairs: list[tuple[int, int]] = []
    for left in range(len(choices)):
        for right in range(left + 1, len(choices)):
            similarity = _similarity(choices[left], choices[right])
            if similarity >= 0.72:
                awarded_pairs.append((left, right))

    for left, right in awarded_pairs:
        left_label = chr(ord("A") + left)
        right_label = chr(ord("A") + right)
        _add(
            scores,
            reasons,
            left,
            0,
            "similar_option",
            "Similar Options (Pair Cue)",
            f"Unusually similar to option {right_label} (near-twin distractor pair)",
            evidence=f"High character similarity between {left_label} and {right_label}",
            limitation="Examiners frequently author a near-twin distractor alongside the key, but similarity alone does not identify which twin is correct.",
            overlap_group="option_relationships",
            audit_only=True,
        )


def outlier_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-08: Audit-only cue. Flags structural outlier distractors for teacher review without biasing scoring."""
    if len(choices) < 4:
        return

    averages: list[tuple[int, float]] = []
    for index, choice in enumerate(choices):
        similarities = [
            _similarity(choice, other)
            for other_index, other in enumerate(choices)
            if other_index != index
        ]
        averages.append((index, sum(similarities) / len(similarities)))

    ranked = sorted(averages, key=lambda item: item[1])
    if ranked[0][1] < 0.25 and ranked[1][1] - ranked[0][1] > 0.12:
        _add(
            scores,
            reasons,
            ranked[0][0],
            0,
            "outlier",
            "Outlier Option",
            "Structurally distinct in style and length from all other choices",
            evidence=f"Avg similarity to peers: {ranked[0][1]:.2f}",
            limitation="Structural divergence highlights an atypical distractor, but a distinct option may still be a valid definition or exception.",
            overlap_group="surface_form",
            audit_only=True,
        )


def most_inclusive_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-04: Award +1 to options that subsume companion options or explicitly combine alternatives."""
    normalized = [_content_words(choice) for choice in choices]
    for index, words in enumerate(normalized):
        if not words:
            continue

        contained_count = 0
        for other_index, other_words in enumerate(normalized):
            if index == other_index or not other_words:
                continue
            if other_words < words:
                contained_count += 1

        if contained_count:
            _add(
                scores,
                reasons,
                index,
                1,
                "most_inclusive",
                "Inclusive Language",
                "Subsumes content words of companion option(s)",
                evidence=f"Subsumes vocabulary of {contained_count} companion option(s)",
                limitation="Test writers occasionally write comprehensive correct choices, but students who blindly pick the most detailed option can be trapped by distractors.",
                overlap_group="combined_answers",
            )


def all_of_the_above_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-05: Award +1 to an explicit 'All of the above' option."""
    for index, choice in enumerate(choices):
        if "all of the above" in choice.lower():
            _add(
                scores,
                reasons,
                index,
                1,
                "all_of_the_above",
                "All Of The Above",
                "Option explicitly offers 'all of the above'",
                evidence="Choice contains 'all of the above'",
                limitation="Informal exams frequently use this when multiple statements are true, but standardized tests deliberately avoid it.",
                overlap_group="combined_answers",
            )


def none_of_the_above_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-06: Audit-only. Record the presence of 'None of the above' as a construct warning without score modification."""
    for index, choice in enumerate(choices):
        if "none of the above" in choice.lower():
            _add(
                scores,
                reasons,
                index,
                0,
                "none_of_the_above",
                "None Of The Above",
                "Option contains 'None of the above' (Construct Warning)",
                evidence="Choice explicitly matches 'none of the above'",
                limitation="Educational measurement research advises against 'None of the above' because it tests recognition of falsehood rather than positive knowledge, but its presence does not statistically indicate correctness.",
                overlap_group="combined_answers",
                audit_only=True,
            )


def grammar_match_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-09: Award +2 to options with demonstrable grammatical stem-agreement cues."""
    lowered = question.lower().strip()
    article_match = re.search(r"\b(a|an)\s*(?:_{2,}|$)", lowered)
    if not article_match:
        article_match = re.search(r"\b(a|an)\s+$", lowered)

    if article_match:
        expected_vowel = article_match.group(1) == "an"
        article_str = article_match.group(1)
        for index, choice in enumerate(choices):
            first_word = _first_word(choice)
            if not first_word:
                continue
            starts_with_vowel = first_word[0].lower() in "aeiou"
            if starts_with_vowel == expected_vowel:
                _add(
                    scores,
                    reasons,
                    index,
                    2,
                    "grammar_match",
                    "Grammar Match",
                    f"Option fits preceding indefinite article '{article_str}'",
                    evidence=f"Stem ends in '{article_str}', choice starts with '{first_word}'",
                    limitation="Clear grammatical giveaway caused by unedited question stems.",
                    overlap_group="grammar",
                )
        return

    if lowered.endswith((" is", " was")):
        for index, choice in enumerate(choices):
            if not _looks_plural(choice):
                _add(
                    scores,
                    reasons,
                    index,
                    2,
                    "grammar_match",
                    "Grammar Match",
                    "Singular option fits the singular verb stem",
                    evidence="Stem ends in singular verb, choice is singular",
                    limitation="Agreement cues narrow the field but cannot verify semantic truth.",
                    overlap_group="grammar",
                )

    if lowered.endswith((" are", " were")):
        for index, choice in enumerate(choices):
            if _looks_plural(choice):
                _add(
                    scores,
                    reasons,
                    index,
                    2,
                    "grammar_match",
                    "Grammar Match",
                    "Plural option fits the plural verb stem",
                    evidence="Stem ends in plural verb, choice is plural",
                    limitation="Agreement cues narrow the field but cannot verify semantic truth.",
                    overlap_group="grammar",
                )


def keyword_overlap_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-10: Award points for distinctive stem keyword and conceptual association overlap (up to +3 per option)."""
    q_words = _word_set(question) - STOPWORDS - MODERATE_WORDS - ABSOLUTE_WORDS
    keywords = {word for word in q_words if len(word) > 2}
    if not keywords:
        return

    for index, choice in enumerate(choices):
        c_words = _word_set(choice)
        matches: set[str] = set()

        # 1. Exact keyword overlap
        for kw in keywords:
            if kw in c_words:
                matches.add(kw)

        # 2. Stem/prefix root matching (e.g. program/programming, loop/loops, repeat/repeating)
        for kw in keywords:
            if len(kw) >= 4:
                for cw in c_words:
                    if len(cw) >= 4 and (kw.startswith(cw[:4]) or cw.startswith(kw[:4])):
                        if abs(len(kw) - len(cw)) <= 4:
                            matches.add(f"{kw}~{cw}")

        # 3. Domain conceptual associations (e.g. language -> python, decision -> diamond/if/else, loop -> repeat)
        for kw in keywords:
            if kw in COMMON_STEM_ASSOCIATIONS:
                assoc = COMMON_STEM_ASSOCIATIONS[kw]
                if assoc & c_words or any(a in choice.lower() for a in assoc):
                    matches.add(f"{kw}→concept")

        if matches:
            delta = min(len(matches), 3)
            _add(
                scores,
                reasons,
                index,
                delta,
                "keyword_overlap",
                "Keyword / Concept Match",
                f"Matches question keywords/concepts: {', '.join(sorted(matches)[:3])}",
                evidence=f"Stem-choice alignment: '{', '.join(sorted(matches)[:3])}'",
                limitation="Test-takers are frequently lured by distractors echoing familiar question terminology.",
                overlap_group="content",
            )


def numeric_extremes_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-11: Scores interior numeric values (+1) and penalizes extreme bounds (-1)."""
    parsed = [_extract_single_number(choice) for choice in choices]
    if any(value is None for value in parsed) or len(parsed) < 3:
        return

    numbers = [float(value) for value in parsed if value is not None]
    low = min(numbers)
    high = max(numbers)
    if math.isclose(low, high):
        return

    for index, number in enumerate(numbers):
        is_extreme = math.isclose(number, low) or math.isclose(number, high)
        position_label = "extreme bound" if is_extreme else "interior value"
        delta = -1 if is_extreme else 1
        _add(
            scores,
            reasons,
            index,
            delta,
            "numeric_extremes",
            "Numeric Distribution",
            f"Value {number} is an {position_label} in numeric range",
            evidence=f"Numeric range: {low} to {high}",
            limitation="Position within a numeric bracket alone does not establish correctness without subject-matter calculation.",
            overlap_group="numeric",
            audit_only=False,
        )


def opposite_pair_rule(
    question: str, choices: list[str], scores: list[int], reasons: list[RuleReason]
) -> None:
    """MCQ-12: Pair-level cue. Awards +1 to options that form a contrasting opposite pair."""
    lowered_choices = [choice.lower() for choice in choices]
    for first, second in OPPOSITE_PAIRS:
        first_indexes = [index for index, choice in enumerate(lowered_choices) if first in choice]
        second_indexes = [index for index, choice in enumerate(lowered_choices) if second in choice]
        if first_indexes and second_indexes:
            for index in sorted(set(first_indexes + second_indexes)):
                _add(
                    scores,
                    reasons,
                    index,
                    1,
                    "opposite_pair",
                    "Opposite Pair (Pair Cue)",
                    f"Part of a contrasting conceptual pair ({first}/{second})",
                    evidence=f"Choice contains '{first}' or '{second}' in a polar pair",
                    limitation="Polar distractors are common in binary concepts; neither is assured to be true without domain knowledge.",
                    overlap_group="option_relationships",
                    audit_only=False,
                )


def _add(
    scores: list[int],
    reasons: list[RuleReason],
    choice_index: int,
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
    scores[choice_index] += delta
    reasons.append(
        RuleReason(
            rule=rule_id,
            name=name,
            message=message,
            target=chr(ord("A") + choice_index),
            delta=delta,
            evidence=evidence,
            limitation=limitation,
            overlap_group=overlap_group,
            audit_only=audit_only,
        )
    )


def _word_set(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z']+", text.lower()))


def _content_words(text: str) -> set[str]:
    return {word for word in _word_set(text) if word not in STOPWORDS and len(word) > 2}


def _first_word(text: str) -> str:
    match = re.search(r"[A-Za-z]+", text)
    return match.group(0) if match else ""


def _looks_plural(text: str) -> bool:
    word = _first_word(text)
    return len(word) > 2 and word.lower().endswith("s")


def _similarity(left: str, right: str) -> float:
    return SequenceMatcher(None, left.lower(), right.lower()).ratio()


def _extract_single_number(text: str) -> float | None:
    matches = re.findall(r"-?\d+(?:\.\d+)?", text.replace(",", ""))
    if len(matches) != 1:
        return None
    return float(matches[0])
