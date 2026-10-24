from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

QuestionType = Literal["mcq", "tf"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AnalyzeRequest(CamelModel):
    question_type: QuestionType
    raw_text: str = Field(min_length=1)
    seed: int | None = 42


class RuleReason(CamelModel):
    rule: str
    name: str = ""
    message: str
    target: str | None = None
    delta: int
    evidence: str | None = None
    limitation: str | None = None
    overlap_group: str | None = None
    audit_only: bool = False


class ParsedQuestion(CamelModel):
    type: QuestionType
    question: str | None = None
    statement: str | None = None
    choices: list[str] = []


class McqResult(CamelModel):
    type: Literal["mcq"]
    parsed: ParsedQuestion
    prediction: str
    predicted_text: str
    confidence: int
    scores: dict[str, int]
    is_tied: bool = False
    tied_options: list[str] = []
    tie_breaker_method: str = "unique_maximum"
    seed: int = 42
    reasons: list[RuleReason] = []


class TfResult(CamelModel):
    type: Literal["tf"]
    parsed: ParsedQuestion
    prediction: Literal["True", "False"]
    confidence: int
    true_score: int
    false_score: int
    is_tied: bool = False
    tied_options: list[str] = []
    tie_breaker_method: str = "unique_maximum"
    seed: int = 42
    reasons: list[RuleReason] = []


AnalyzeResponse = McqResult | TfResult
