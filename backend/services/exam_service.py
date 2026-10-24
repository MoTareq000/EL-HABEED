import re
from typing import Any

from backend.models.exam import (
    AuditedQuestionResult,
    EditableQuestion,
    EvaluationStatus,
    ExamAuditResponse,
    ExamParseResponse,
    ExamQuestionResult,
    FrequentPattern,
    VulnerabilityLevel,
)
from backend.models.question import (
    AnalyzeRequest,
    McqResult,
    ParsedQuestion,
    RuleReason,
    TfResult,
)
from backend.parser.exam_parser import (
    extract_answer_key,
    extract_pdf_pages_and_text,
    extract_text_from_pdf,
    parse_exam_into_questions,
    split_questions,
)
from backend.services.analyzer import _analyze_mcq, _analyze_tf, analyze_question


def parse_exam_from_pdf_bytes(
    pdf_bytes: bytes,
    filename: str = "exam.pdf",
) -> ExamParseResponse:
    """Stage A: Ingests PDF bytes, detects scanned status, and parses into editable questions."""
    full_text, page_count, is_scanned, warning, pages_data = extract_pdf_pages_and_text(pdf_bytes)

    questions, detected_keys, unmatched_keys = parse_exam_into_questions(
        full_text, pages_data=pages_data
    )

    return ExamParseResponse(
        filename=filename,
        page_count=page_count,
        is_scanned_pdf=is_scanned,
        extraction_warning=warning,
        questions=questions,
        detected_keys=detected_keys,
        unmatched_keys=unmatched_keys,
    )


def parse_exam_from_raw_text(
    raw_text: str,
    filename: str = "Pasted Exam",
) -> ExamParseResponse:
    """Stage A: Ingests raw pasted text, parses questions and answer keys."""
    questions, detected_keys, unmatched_keys = parse_exam_into_questions(raw_text)

    return ExamParseResponse(
        filename=filename,
        page_count=1,
        is_scanned_pdf=False,
        extraction_warning=None,
        questions=questions,
        detected_keys=detected_keys,
        unmatched_keys=unmatched_keys,
    )


def audit_reviewed_questions(
    questions: list[EditableQuestion],
    filename: str = "Exam",
    official_keys: dict[str, str] | None = None,
    seed: int = 42,
) -> ExamAuditResponse:
    """Stage C, D, E, F, G:
    Runs structural audit & blind-guessing with answer key strictly isolated,
    then independently evaluates predictions against official keys and calculates
    the exact random-guessing baseline.
    """
    results: list[ExamQuestionResult] = []

    # Stage C & D: Blind guessing with ZERO answer-key access
    for idx, eq in enumerate(questions):
        q_seed = (seed * 1000 + idx + 1) & 0x7FFFFFFF

        q_type = eq.type
        q_text = eq.question_text.strip()
        choices = [c.strip() for c in eq.choices if c.strip()]
        raw_text = eq.raw_text or q_text

        # Validate question has usable content
        is_invalid = False
        warnings = list(eq.warnings)
        if q_type == "mcq" and len(choices) < 2:
            is_invalid = True
            warnings.append("MCQ requires at least 2 choices.")
        elif not q_text:
            is_invalid = True
            warnings.append("Question stem is empty.")

        if is_invalid:
            # Cannot make a meaningful guess without choices
            pred = "A" if q_type == "mcq" else "True"
            scores = {"A": 0} if q_type == "mcq" else {"True": 0, "False": 0}
            results.append(
                ExamQuestionResult(
                    id=eq.id or f"q_{idx + 1}",
                    index=idx + 1,
                    number=eq.number or str(idx + 1),
                    source_page=eq.source_page,
                    raw_text=raw_text,
                    type=q_type,
                    question_text=q_text,
                    choices=choices,
                    prediction=pred,
                    predicted_text=choices[0] if choices else pred,
                    confidence=25 if q_type == "mcq" else 50,
                    scores=scores,
                    is_tied=True,
                    tied_options=choices if choices else [pred],
                    tie_breaker_method="unparseable_fallback",
                    seed=q_seed,
                    reasons=[],
                    has_cues=False,
                    vulnerability="low",
                    primary_flaw="Uncertain Structure",
                    flaw_detail="Question could not be cleanly parsed into standard choices.",
                    official_answer=None,
                    user_key=None,
                    evaluation_status="unverified",
                    is_correct=None,
                    status="invalid",
                    warnings=warnings,
                )
            )
            continue

        # Execute blind guessing engine (NO answer keys passed)
        parsed = ParsedQuestion(
            type=q_type,
            question=q_text if q_type == "mcq" else None,
            statement=q_text if q_type == "tf" else None,
            choices=choices,
        )

        if q_type == "mcq":
            analysis = _analyze_mcq(q_text, choices, parsed, seed=q_seed)
            pred = analysis.prediction
            pred_text = analysis.predicted_text
            scores = analysis.scores
            confidence = analysis.confidence
            is_tied = analysis.is_tied
            tied_options = analysis.tied_options
            tie_method = analysis.tie_breaker_method
            reasons = analysis.reasons
        else:
            analysis_tf = _analyze_tf(q_text, parsed, seed=q_seed)
            pred = analysis_tf.prediction
            pred_text = analysis_tf.prediction
            scores = {"True": analysis_tf.true_score, "False": analysis_tf.false_score}
            confidence = analysis_tf.confidence
            is_tied = analysis_tf.is_tied
            tied_options = analysis_tf.tied_options
            tie_method = analysis_tf.tie_breaker_method
            reasons = analysis_tf.reasons

        # Stage C: Structural vulnerability assessment
        has_cues = any(r.delta != 0 for r in reasons)
        vulnerability, primary_flaw, flaw_detail = _assess_vulnerability(
            q_type, confidence, reasons, is_tied
        )

        results.append(
            ExamQuestionResult(
                id=eq.id or f"q_{idx + 1}",
                index=idx + 1,
                number=eq.number or str(idx + 1),
                source_page=eq.source_page,
                raw_text=raw_text,
                type=q_type,
                question_text=q_text,
                choices=choices,
                prediction=pred,
                predicted_text=pred_text,
                confidence=confidence,
                scores=scores,
                is_tied=is_tied,
                tied_options=tied_options,
                tie_breaker_method=tie_method,
                seed=q_seed,
                reasons=reasons,
                has_cues=has_cues,
                vulnerability=vulnerability,
                primary_flaw=primary_flaw,
                flaw_detail=flaw_detail,
                official_answer=None,  # Populated strictly in Stage F
                user_key=None,
                evaluation_status="unverified",
                is_correct=None,
                status=eq.status,
                warnings=warnings,
            )
        )

    # Stage F: Independent Evaluation against official answer keys
    keys_map = {**(official_keys or {})}
    for q in results:
        # Match by question number or index
        raw_key = keys_map.get(q.number or "") or keys_map.get(str(q.index))
        if raw_key:
            norm_key = _normalize_answer(raw_key)
            norm_pred = _normalize_answer(q.prediction)
            is_correct = norm_key == norm_pred
            q.official_answer = raw_key
            q.user_key = raw_key
            q.is_correct = is_correct
            q.evaluation_status = "correct" if is_correct else "incorrect"

    # Stage G: Metrics, Random Baseline, and Exam Report
    total = len(results)
    if total == 0:
        return ExamAuditResponse(
            filename=filename,
            total_questions=0,
            valid_questions=0,
            mcq_count=0,
            tf_count=0,
            evaluated_questions=0,
            correct_predictions=0,
            incorrect_predictions=0,
            accuracy=None,
            expected_random_baseline=25.0,
            accuracy_diff_percentage_points=None,
            tied_predictions_count=0,
            cues_detected_count=0,
            cues_detected_percentage=0.0,
            needs_review_count=0,
            avg_confidence=0,
            high_risk_count=0,
            medium_risk_count=0,
            low_risk_count=0,
            guessability_score=0,
            verdict_stamp="NO QUESTIONS",
            verdict_description="Could not detect questions in this document. Make sure questions are numbered (e.g. 1., 2.) with options like A), B).",
            frequent_patterns=[],
            teacher_advice=[],
            seed=seed,
            questions=[],
        )

    valid_questions = sum(1 for q in results if q.status != "invalid")
    mcq_count = sum(1 for q in results if q.type == "mcq")
    tf_count = total - mcq_count
    avg_confidence = round(sum(q.confidence for q in results) / total)
    high_risk_count = sum(1 for q in results if q.vulnerability == "high")
    medium_risk_count = sum(1 for q in results if q.vulnerability == "medium")
    low_risk_count = sum(1 for q in results if q.vulnerability == "low")

    tied_count = sum(1 for q in results if q.is_tied)
    cues_count = sum(1 for q in results if q.has_cues)
    cues_pct = round((cues_count / total) * 100, 1)
    needs_review_count = sum(1 for q in results if q.status == "needs_review")

    # Evaluation on verified questions
    evaluated_list = [q for q in results if q.is_correct is not None]
    evaluated_count = len(evaluated_list)
    correct_count = sum(1 for q in evaluated_list if q.is_correct is True)
    incorrect_count = sum(1 for q in evaluated_list if q.is_correct is False)

    accuracy = round((correct_count / evaluated_count) * 100, 1) if evaluated_count > 0 else None

    # Expected Random Guessing Baseline calculation:
    # For each evaluated question: 1/k for MCQ, 0.5 for TF
    if evaluated_count > 0:
        baseline_sum = 0.0
        for eq in evaluated_list:
            if eq.type == "mcq":
                k = len(eq.choices) if len(eq.choices) >= 2 else 4
                baseline_sum += 1.0 / k
            else:
                baseline_sum += 0.5
        random_baseline = round((baseline_sum / evaluated_count) * 100, 1)
        accuracy_diff = round(accuracy - random_baseline, 1) if accuracy is not None else None
    else:
        # Theoretical baseline for all valid questions
        baseline_sum = 0.0
        for eq in results:
            if eq.type == "mcq":
                k = len(eq.choices) if len(eq.choices) >= 2 else 4
                baseline_sum += 1.0 / k
            else:
                baseline_sum += 0.5
        random_baseline = round((baseline_sum / total) * 100, 1)
        accuracy_diff = None

    # Structural Guessability Score (0-100)
    guessability = round(
        (high_risk_count * 100 + medium_risk_count * 55 + low_risk_count * 25) / total
    )

    # Evidence-based Verdict Stamp
    if accuracy is not None and accuracy >= random_baseline + 20 and cues_pct >= 50:
        stamp = "LEAKY EXAM"
        desc = (
            f"High vulnerability detected. The blind-guessing algorithm achieved {accuracy}% accuracy, "
            f"substantially outperforming the expected random guessing baseline of {random_baseline}% "
            f"(+{accuracy_diff} percentage points). {cues_pct}% of questions leaked structural cues."
        )
    elif guessability >= 68:
        stamp = "LEAKY EXAM"
        desc = (
            "High structural cue density. Widespread option length disparities and absolute qualifiers "
            "provide strong heuristic signals for test-takers."
        )
    elif guessability >= 48 or (accuracy is not None and accuracy > random_baseline):
        stamp = "MODERATE RISK"
        desc = (
            f"Moderate risk. Several questions contain giveaway cues that skew odds away from the "
            f"random baseline ({random_baseline}%)."
        )
    else:
        stamp = "ROBUST EXAM"
        desc = (
            "Well balanced! Options and statements resist standard heuristic shortcuts and align "
            f"closely with the expected random baseline ({random_baseline}%)."
        )

    frequent_patterns = _compute_frequent_patterns(results, total)
    teacher_advice = _generate_teacher_advice(results)

    return ExamAuditResponse(
        filename=filename,
        total_questions=total,
        valid_questions=valid_questions,
        mcq_count=mcq_count,
        tf_count=tf_count,
        evaluated_questions=evaluated_count,
        correct_predictions=correct_count,
        incorrect_predictions=incorrect_count,
        accuracy=accuracy,
        expected_random_baseline=random_baseline,
        accuracy_diff_percentage_points=accuracy_diff,
        tied_predictions_count=tied_count,
        cues_detected_count=cues_count,
        cues_detected_percentage=cues_pct,
        needs_review_count=needs_review_count,
        avg_confidence=avg_confidence,
        high_risk_count=high_risk_count,
        medium_risk_count=medium_risk_count,
        low_risk_count=low_risk_count,
        guessability_score=guessability,
        verdict_stamp=stamp,
        verdict_description=desc,
        frequent_patterns=frequent_patterns,
        teacher_advice=teacher_advice,
        heuristic_score=correct_count if evaluated_count > 0 else None,
        heuristic_total=evaluated_count if evaluated_count > 0 else None,
        heuristic_percentage=round(accuracy) if accuracy is not None else None,
        seed=seed,
        questions=results,
    )


def audit_exam_from_pdf(
    pdf_bytes: bytes,
    filename: str = "exam.pdf",
    provided_keys: dict[str, str] | None = None,
    seed: int = 42,
) -> ExamAuditResponse:
    """Preserved endpoint: extracts, parses, audits and evaluates in one pass."""
    parse_res = parse_exam_from_pdf_bytes(pdf_bytes, filename=filename)
    combined_keys = {**parse_res.detected_keys, **(provided_keys or {})}
    return audit_reviewed_questions(
        parse_res.questions,
        filename=filename,
        official_keys=combined_keys,
        seed=seed,
    )


def audit_exam_from_text(
    text: str,
    filename: str = "Pasted Exam",
    provided_keys: dict[str, str] | None = None,
    seed: int = 42,
) -> ExamAuditResponse:
    """Preserved endpoint: parses pasted text, audits and evaluates in one pass."""
    parse_res = parse_exam_from_raw_text(text, filename=filename)
    combined_keys = {**parse_res.detected_keys, **(provided_keys or {})}
    return audit_reviewed_questions(
        parse_res.questions,
        filename=filename,
        official_keys=combined_keys,
        seed=seed,
    )


def _normalize_answer(ans: str) -> str:
    cleaned = ans.strip().upper()
    if cleaned in ("T", "TRUE"):
        return "TRUE"
    if cleaned in ("F", "FALSE"):
        return "FALSE"
    return cleaned


def _assess_vulnerability(
    q_type: str, confidence: int, reasons: list[RuleReason], is_tied: bool
) -> tuple[VulnerabilityLevel, str | None, str | None]:
    if not reasons or not any(r.delta != 0 for r in reasons):
        return "low", "Balanced Choices", "No obvious test-writing heuristics triggered."

    rule_names = [r.name for r in reasons]
    rule_ids = [r.rule for r in reasons]

    if "all_of_the_above" in rule_ids or "All Of The Above" in rule_names:
        return "high", "All Of The Above Bias", "Using 'All of the above' creates an easy deduction if two choices look right."
    if "grammar_match" in rule_ids or "Grammar Match" in rule_names:
        match_reason = next(r for r in reasons if r.rule == "grammar_match" or r.name == "Grammar Match")
        return "high", "Grammar Giveaway", match_reason.message
    if "absolute_word_penalty" in rule_ids or "Absolute Word Penalty" in rule_names:
        abs_reason = next(r for r in reasons if r.rule == "absolute_word_penalty" or r.name == "Absolute Word Penalty")
        return "high", "Absolute Word Flaw", abs_reason.message
    if "absolute_words" in rule_ids or "Absolute Words" in rule_names:
        return "high", "Absolute Word in True/False", "Absolute words (always, never, all) make statements almost certainly False."
    if ("longest_answer" in rule_ids or "Longest Answer" in rule_names) and confidence >= 60 and not is_tied:
        return "high", "Length Disparity", "The correct choice is significantly longer and more detailed than distractors."

    if confidence >= 65 and not is_tied:
        return "high", "Strong Heuristic Signal", f"Multiple cues combined to yield {confidence}% score confidence."
    if confidence >= 48 or len(reasons) >= 2:
        top_reason = max(reasons, key=lambda r: abs(r.delta))
        return "medium", top_reason.name or top_reason.rule, top_reason.message

    return "low", "Mild Cue", reasons[0].message


def _compute_frequent_patterns(
    results: list[ExamQuestionResult], total: int
) -> list[FrequentPattern]:
    counts: dict[str, list[str]] = {}
    names: dict[str, str] = {}
    descriptions: dict[str, str] = {
        "longest_answer": "Option length significantly exceeds peer distractors.",
        "moderate_word": "Soft qualifiers ('usually', 'often', 'can') increase option plausibility.",
        "absolute_word_penalty": "Rigid absolutes ('always', 'never') facilitate elimination.",
        "absolute_words": "Statements with absolutes lean overwhelmingly False.",
        "grammar_match": "Stem grammatical cues rule out incompatible choices.",
        "keyword_overlap": "Stem keywords directly echoed in answer choices.",
        "similar_option": "Near-twin option pair isolates the likely answer.",
        "opposite_pair": "Antonym pairs create a 50/50 guessing deduction.",
        "most_inclusive": "Answer choice subsumes wording of another option.",
        "all_of_the_above": "Presence of 'All of the above' bias.",
    }

    for q in results:
        seen_in_q = set()
        for r in q.reasons:
            if r.rule and r.rule not in seen_in_q and r.delta != 0:
                counts.setdefault(r.rule, []).append(q.id)
                names[r.rule] = r.name or r.rule
                seen_in_q.add(r.rule)

    patterns = []
    for r_id, q_ids in sorted(counts.items(), key=lambda item: len(item[1]), reverse=True):
        count = len(q_ids)
        pct = round((count / total) * 100, 1)
        patterns.append(
            FrequentPattern(
                rule_id=r_id,
                name=names.get(r_id, r_id),
                count=count,
                percentage=pct,
                description=descriptions.get(r_id, "Heuristic pattern detected across questions."),
                affected_question_ids=q_ids,
            )
        )
    return patterns


def _generate_teacher_advice(results: list[ExamQuestionResult]) -> list[str]:
    advice: list[str] = []
    rule_counts: dict[str, int] = {}
    for q in results:
        for r in q.reasons:
            r_key = r.name or r.rule
            rule_counts[r_key] = rule_counts.get(r_key, 0) + 1

    longest_count = rule_counts.get("Longest Answer", 0) + rule_counts.get("longest_answer", 0)
    if longest_count >= 2:
        advice.append(
            f"Length Uniformity: {longest_count} MCQs have disproportionately long options. Try padding distractors with similar detail or shortening the correct option."
        )

    abs_count = (
        rule_counts.get("Absolute Words", 0)
        + rule_counts.get("Absolute Word Penalty", 0)
        + rule_counts.get("absolute_words", 0)
        + rule_counts.get("absolute_word_penalty", 0)
    )
    if abs_count >= 1:
        advice.append(
            f"Avoid Absolutes: {abs_count} questions feature absolute qualifiers like 'always', 'never', or 'all'. Savvy students quickly eliminate these as false."
        )

    grammar_count = rule_counts.get("Grammar Match", 0) + rule_counts.get("grammar_match", 0)
    if grammar_count >= 1:
        advice.append(
            "Grammar Neutrality: At least one question stem ends with 'a/an' or singular/plural verb cues that eliminate incompatible options."
        )

    moderate_count = (
        rule_counts.get("Moderate Word", 0)
        + rule_counts.get("Moderate Words", 0)
        + rule_counts.get("moderate_word", 0)
        + rule_counts.get("moderate_words", 0)
    )
    if moderate_count >= 2:
        advice.append(
            "Hedging Bias: Several choices use soft qualifiers ('usually', 'often', 'can'). Ensure incorrect distractors also use plausible qualifiers."
        )

    opposite_count = rule_counts.get("Opposite Pair", 0) + rule_counts.get("opposite_pair", 0)
    if opposite_count >= 1:
        advice.append(
            "Antonym Traps: Opposite pairs (e.g. increase vs decrease) give away a 50/50 chance. Add plausible alternative dimensions."
        )

    if not advice:
        advice.append(
            "Great job! Your distractors and stems maintain consistent length and style, effectively resisting heuristic shortcuts."
        )
    return advice
