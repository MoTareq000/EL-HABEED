export type QuestionType = "mcq" | "tf";
export type QuestionStatus = "valid" | "needs_review" | "invalid";
export type EvaluationStatus = "correct" | "incorrect" | "unverified";
export type VulnerabilityLevel = "high" | "medium" | "low";

export type RuleReason = {
  rule: string;
  name: string;
  message: string;
  target: string | null;
  delta: number;
  evidence?: string | null;
  limitation?: string | null;
};

export type ParsedQuestion = {
  type: QuestionType;
  question?: string | null;
  statement?: string | null;
  choices: string[];
};

export type McqResult = {
  type: "mcq";
  parsed: ParsedQuestion;
  prediction: string;
  predictedText: string;
  confidence: number;
  scores: Record<string, number>;
  isTied: boolean;
  tiedOptions: string[];
  tieBreakerMethod: string;
  seed: number;
  reasons: RuleReason[];
};

export type TfResult = {
  type: "tf";
  parsed: ParsedQuestion;
  prediction: "True" | "False";
  confidence: number;
  trueScore: number;
  falseScore: number;
  isTied: boolean;
  tiedOptions: string[];
  tieBreakerMethod: string;
  seed: number;
  reasons: RuleReason[];
};

export type AnalyzeResult = McqResult | TfResult;

export type EditableQuestion = {
  id: string;
  index: number;
  number?: string | null;
  sourcePage?: number | null;
  type: QuestionType;
  questionText: string;
  choices: string[];
  rawText: string;
  status: QuestionStatus;
  warnings: string[];
  officialAnswer?: string | null;
};

export type ExamParseResponse = {
  filename: string;
  pageCount: number;
  isScannedPdf: boolean;
  extractionWarning?: string | null;
  questions: EditableQuestion[];
  detectedKeys: Record<string, string>;
  unmatchedKeys: string[];
};

export type FrequentPattern = {
  ruleId: string;
  name: string;
  count: number;
  percentage: number;
  description: string;
  affectedQuestionIds: string[];
};

export type ExamQuestionResult = {
  id: string;
  index: number;
  number?: string | null;
  sourcePage?: number | null;
  rawText: string;
  type: QuestionType;
  questionText: string;
  choices: string[];
  prediction: string;
  predictedText: string;
  confidence: number;
  scores: Record<string, number>;
  isTied: boolean;
  tiedOptions: string[];
  tieBreakerMethod: string;
  seed: number;
  reasons: RuleReason[];
  hasCues: boolean;
  vulnerability: VulnerabilityLevel;
  primaryFlaw?: string | null;
  flawDetail?: string | null;
  officialAnswer?: string | null;
  userKey?: string | null;
  evaluationStatus: EvaluationStatus;
  isCorrect?: boolean | null;
  status: QuestionStatus;
  warnings: string[];
};

export type ExamAuditResponse = {
  filename: string;
  totalQuestions: number;
  validQuestions: number;
  mcqCount: number;
  tfCount: number;
  evaluatedQuestions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  accuracy?: number | null;
  expectedRandomBaseline: number;
  accuracyDiffPercentagePoints?: number | null;
  tiedPredictionsCount: number;
  cuesDetectedCount: number;
  cuesDetectedPercentage: number;
  needsReviewCount: number;
  avgConfidence: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  guessabilityScore: number;
  verdictStamp: string;
  verdictDescription: string;
  frequentPatterns: FrequentPattern[];
  teacherAdvice: string[];
  heuristicScore?: number | null;
  heuristicTotal?: number | null;
  heuristicPercentage?: number | null;
  seed: number;
  questions: ExamQuestionResult[];
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

export async function analyzeQuestion(
  questionType: QuestionType,
  rawText: string,
  seed = 42,
): Promise<AnalyzeResult> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ questionType, rawText, seed }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to analyze the question.");
  }

  return response.json();
}

export async function parseExamPdf(file: File): Promise<ExamParseResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/exam/parse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to parse the exam PDF.");
  }

  return response.json();
}

export async function parseExamText(
  rawText: string,
  filename = "Pasted Exam",
): Promise<ExamParseResponse> {
  const response = await fetch(`${API_BASE}/api/exam/parse-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw_text: rawText, filename }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to parse exam text.");
  }

  return response.json();
}

export async function auditReviewedExam(
  questions: EditableQuestion[],
  filename: string,
  officialKeys?: Record<string, string>,
  seed = 42,
): Promise<ExamAuditResponse> {
  const response = await fetch(`${API_BASE}/api/exam/audit-reviewed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      questions,
      officialKeys,
      seed,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to complete exam audit.");
  }

  return response.json();
}

// Legacy upload endpoints
export async function uploadExamPdf(
  file: File,
  answerKeys?: Record<string, string>,
): Promise<ExamAuditResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (answerKeys && Object.keys(answerKeys).length > 0) {
    formData.append("answer_keys", JSON.stringify(answerKeys));
  }

  const response = await fetch(`${API_BASE}/api/exam/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to analyze the exam PDF.");
  }

  return response.json();
}

export async function analyzeExamText(
  rawText: string,
  answerKeys?: Record<string, string>,
): Promise<ExamAuditResponse> {
  const response = await fetch(`${API_BASE}/api/exam/analyze-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rawText, answerKeys }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Unable to analyze the exam text.");
  }

  return response.json();
}
