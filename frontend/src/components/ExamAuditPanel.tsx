import React, { useState } from "react";
import { Page1Upload } from "./Page1Upload";
import { Page2Review } from "./Page2Review";
import { Page3Loading } from "./Page3Loading";
import { Page4Results } from "./Page4Results";
import {
  auditReviewedExam,
  type EditableQuestion,
  type ExamAuditResponse,
  type ExamParseResponse,
} from "../services/analyzer";
import { Check } from "lucide-react";

interface ExamAuditPanelProps {
  initialSampleText?: string;
}

export function ExamAuditPanel({ initialSampleText }: ExamAuditPanelProps = {}) {
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4>(1);
  const [parsedData, setParsedData] = useState<ExamParseResponse | null>(null);
  const [rawSource, setRawSource] = useState<string>("");
  const [reviewedQuestions, setReviewedQuestions] = useState<EditableQuestion[]>([]);
  const [officialKeys, setOfficialKeys] = useState<Record<string, string>>({});
  const [auditResult, setAuditResult] = useState<ExamAuditResponse | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Stage A callback: Parsed exam data ready
  function handleParsed(result: ExamParseResponse, source: string) {
    setParsedData(result);
    setRawSource(source);
    setReviewedQuestions(result.questions);
    setOfficialKeys(result.detectedKeys);
    setCurrentPage(2);
  }

  // Stage B callback: Reviewed questions & official keys submitted
  async function handleSubmitReview(
    questions: EditableQuestion[],
    keys: Record<string, string>
  ) {
    setReviewedQuestions(questions);
    setOfficialKeys(keys);
    setAuditError(null);
    setCurrentPage(3);

    try {
      const filename = parsedData ? parsedData.filename : "Exam";
      const result = await auditReviewedExam(questions, filename, keys, 42);
      setAuditResult(result);
      setCurrentPage(4);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Analysis failed unexpectedly.");
    }
  }

  // Retry handler
  async function handleRetry() {
    setAuditError(null);
    try {
      const filename = parsedData ? parsedData.filename : "Exam";
      const result = await auditReviewedExam(reviewedQuestions, filename, officialKeys, 42);
      setAuditResult(result);
      setCurrentPage(4);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Analysis failed unexpectedly.");
    }
  }

  function handleReset() {
    setCurrentPage(1);
    setParsedData(null);
    setRawSource("");
    setReviewedQuestions([]);
    setOfficialKeys({});
    setAuditResult(null);
    setAuditError(null);
  }

  const steps = [
    { num: 1, label: "01", title: "Upload & ingest" },
    { num: 2, label: "02", title: "Review & answer key" },
    { num: 3, label: "03", title: "Blind simulation" },
    { num: 4, label: "04", title: "Audit results" },
  ];

  return (
    <div className="audit-flow-container">
      {/* Precision Stepper */}
      <nav className="audit-stepper" aria-label="Exam audit stages">
        {steps.map((step) => {
          const isCurrent = currentPage === step.num;
          const isDone = currentPage > step.num;
          const canNavigate = step.num < currentPage || (step.num === 2 && Boolean(parsedData));

          return (
            <button
              key={step.num}
              type="button"
              className={`stepper-step ${isCurrent ? "active" : ""} ${isDone ? "done" : ""}`}
              disabled={!canNavigate && !isCurrent}
              onClick={() => {
                if (canNavigate) {
                  setCurrentPage(step.num as 1 | 2 | 3 | 4);
                }
              }}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="stepper-step-num">
                {step.label}
              </div>
              <div className="stepper-step-title">
                <span>{step.title}</span>
                {isDone && <Check size={14} color="var(--ok)" strokeWidth={2.5} />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Page 1: Upload Exam */}
      {currentPage === 1 && <Page1Upload onParsed={handleParsed} initialText={initialSampleText} />}

      {/* Page 2: Review Parsed Questions and Provide Answers */}
      {currentPage === 2 && parsedData && (
        <Page2Review
          parsedData={parsedData}
          rawSource={rawSource}
          onBack={() => setCurrentPage(1)}
          onSubmit={handleSubmitReview}
        />
      )}

      {/* Page 3: Analysis Loading */}
      {currentPage === 3 && (
        <Page3Loading
          error={auditError}
          onRetry={handleRetry}
          onReturnToReview={() => setCurrentPage(2)}
        />
      )}

      {/* Page 4: Exam Analysis Results */}
      {currentPage === 4 && auditResult && (
        <Page4Results
          result={auditResult}
          onAnalyzeAnother={handleReset}
          onReviewFlagged={() => setCurrentPage(2)}
        />
      )}
    </div>
  );
}

