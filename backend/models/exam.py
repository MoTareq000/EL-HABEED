from typing import Any, Literal

from backend.models.question import CamelModel, QuestionType, RuleReason

QuestionStatus = Literal["valid", "needs_review", "invalid"]
EvaluationStatus = Literal["correct", "incorrect", "unverified"]
VulnerabilityLevel = Literal["high", "medium", "low"]


class EditableQuestion(CamelModel):
    id: str
    index: int
    number: str | None = None
    source_page: int | None = None
    type: QuestionType
    question_text: str
    choices: list[str] = []
    raw_text: str = ""
    status: QuestionStatus = "valid"
    warnings: list[str] = []
    official_answer: str | None = None


class ExamParseResponse(CamelModel):
    filename: str
    page_count: int
    is_scanned_pdf: bool = False
    extraction_warning: str | None = None
    questions: list[EditableQuestion] = []
    detected_keys: dict[str, str] = {}
    unmatched_keys: list[str] = []


class ExamAuditRequest(CamelModel):
    filename: str = "Exam"
    questions: list[EditableQuestion]
    official_keys: dict[str, str] | None = None
    seed: int = 42


class FrequentPattern(CamelModel):
    rule_id: str
    name: str
    count: int
    percentage: float
    description: str
    affected_question_ids: list[str] = []


class ExamQuestionResult(CamelModel):
    id: str = ""
    index: int
    number: str | None = None
    source_page: int | None = None
    raw_text: str
    type: QuestionType
    question_text: str
    choices: list[str] = []
    prediction: str
    predicted_text: str
    confidence: int
    scores: dict[str, int]
    is_tied: bool = False
    tied_options: list[str] = []
    tie_breaker_method: str = "unique_maximum"
    seed: int = 42
    reasons: list[RuleReason] = []
    has_cues: bool = False
    vulnerability: VulnerabilityLevel = "low"
    primary_flaw: str | None = None
    flaw_detail: str | None = None
    official_answer: str | None = None
    user_key: str | None = None  # Preserved alias for official_answer
    evaluation_status: EvaluationStatus = "unverified"
    is_correct: bool | None = None
    status: QuestionStatus = "valid"
    warnings: list[str] = []


AuditedQuestionResult = ExamQuestionResult


class ExamAuditResponse(CamelModel):
    filename: str
    total_questions: int
    valid_questions: int = 0
    mcq_count: int
    tf_count: int
    evaluated_questions: int = 0
    correct_predictions: int = 0
    incorrect_predictions: int = 0
    accuracy: float | None = None
    expected_random_baseline: float = 25.0
    accuracy_diff_percentage_points: float | None = None
    tied_predictions_count: int = 0
    cues_detected_count: int = 0
    cues_detected_percentage: float = 0.0
    needs_review_count: int = 0
    avg_confidence: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    guessability_score: int
    verdict_stamp: str
    verdict_description: str
    frequent_patterns: list[FrequentPattern] = []
    teacher_advice: list[str] = []
    heuristic_score: int | None = None  # Preserved alias for correct_predictions
    heuristic_total: int | None = None  # Preserved alias for evaluated_questions
    heuristic_percentage: int | None = None  # Preserved alias for accuracy
    seed: int = 42
    questions: list[ExamQuestionResult] = []


class ExamTextRequest(CamelModel):
    raw_text: str
    answer_keys: dict[str, str] | None = None
    seed: int = 42
