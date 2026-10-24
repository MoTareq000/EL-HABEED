import React from "react";
import type { QuestionType } from "../services/analyzer";

type Props = {
  questionType: QuestionType;
  rawText: string;
  isLoading: boolean;
  hasResult: boolean;
  isCopied?: boolean;
  onQuestionTypeChange: (type: QuestionType) => void;
  onRawTextChange: (value: string) => void;
  onAnalyze: () => void;
  onLoadExample: () => void;
  onClear: () => void;
  onCopy: () => void;
  onSwitchToPdf?: () => void;
};

export function QuestionForm({
  questionType,
  rawText,
  isLoading,
  hasResult,
  isCopied,
  onQuestionTypeChange,
  onRawTextChange,
  onAnalyze,
  onLoadExample,
  onClear,
  onCopy,
  onSwitchToPdf,
}: Props) {
  return (
    <div className="panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <h2 style={{ fontSize: "var(--fs-md)", fontWeight: 600, margin: "0 0 4px" }}>
            Question input
          </h2>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0 }}>
            Audit an individual question for predictable patterns.
          </p>
        </div>

        {/* MCQ vs TF Switch */}
        <div className="segmented-control" role="tablist" aria-label="Question type">
          <button
            type="button"
            role="tab"
            aria-selected={questionType === "mcq"}
            className={`segmented-btn ${questionType === "mcq" ? "active" : ""}`}
            onClick={() => onQuestionTypeChange("mcq")}
          >
            Multiple choice
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={questionType === "tf"}
            className={`segmented-btn ${questionType === "tf" ? "active" : ""}`}
            onClick={() => onQuestionTypeChange("tf")}
          >
            True / False
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="question-input-area" className="input-label">
          {questionType === "mcq" ? "Question stem and choices" : "Statement to audit"}
        </label>
        <textarea
          id="question-input-area"
          className="form-textarea"
          rows={9}
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          placeholder={
            questionType === "mcq"
              ? "Which of the following is usually considered a mammal?\nA) Shark\nB) Dolphin\nC) Octopus\nD) Jellyfish"
              : "All mammals can fly because they have lightweight bones."
          }
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onAnalyze}
            disabled={isLoading || !rawText.trim()}
          >
            {isLoading ? "Analyzing..." : "Simulate blind guess"}
          </button>

          <button className="btn btn-secondary" type="button" onClick={onLoadExample}>
            Load example
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={onClear}
            disabled={!rawText.trim()}
          >
            Clear
          </button>
        </div>

        <button
          className="btn btn-link"
          type="button"
          onClick={onCopy}
          disabled={!hasResult}
          style={{ fontSize: "var(--fs-sm)" }}
        >
          {isCopied ? "Copied" : "Copy result"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid var(--border)", fontSize: "13px", color: "var(--ink-3)" }}>
        <span>Label options like <code>A)</code> or <code>A.</code> for automatic parsing.</span>
        {onSwitchToPdf && (
          <button
            type="button"
            onClick={onSwitchToPdf}
            className="btn btn-link"
            style={{ fontSize: "13px" }}
          >
            Audit a full exam PDF →
          </button>
        )}
      </div>
    </div>
  );
}
