import { Eraser, FlaskConical, Play, Copy, Check, FileUp } from "lucide-react";
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
    <div className="card">
      <div className="card-header">
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
            Question Input Workbench
          </h2>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-secondary)" }}>
            Audit an individual question for exploitable test-taking cues
          </span>
        </div>

        {/* MCQ vs TF Switch */}
        <div className="segmented-pills" role="tablist" aria-label="Question Type">
          <button
            type="button"
            role="tab"
            aria-selected={questionType === "mcq"}
            className={`segmented-pill ${questionType === "mcq" ? "active" : ""}`}
            onClick={() => onQuestionTypeChange("mcq")}
          >
            Multiple Choice
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={questionType === "tf"}
            className={`segmented-pill ${questionType === "tf" ? "active" : ""}`}
            onClick={() => onQuestionTypeChange("tf")}
          >
            True / False
          </button>
        </div>
      </div>

      <div className="card-body">
        <textarea
          aria-label="Question text input"
          className="editor-textarea"
          rows={9}
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          placeholder={
            questionType === "mcq"
              ? "Which of the following is usually considered a mammal?\nA) Shark\nB) Dolphin\nC) Octopus\nD) Jellyfish"
              : "All mammals can fly because they have lightweight bones."
          }
        />

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginTop: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button
              className="btn btn-primary"
              type="button"
              onClick={onAnalyze}
              disabled={isLoading || !rawText.trim()}
            >
              <Play size={14} fill="currentColor" />
              <span>{isLoading ? "Simulating..." : "Simulate Blind Guess"}</span>
            </button>
            <button className="btn btn-secondary" type="button" onClick={onLoadExample}>
              <FlaskConical size={14} />
              <span>Load Example</span>
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onClear}
              disabled={!rawText.trim()}
            >
              <Eraser size={14} />
              <span>Clear</span>
            </button>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={onCopy}
            disabled={!hasResult}
          >
            {isCopied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
            <span>{isCopied ? "Copied" : "Copy Output"}</span>
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-light)", fontSize: "0.78rem", color: "var(--ink-tertiary)" }}>
          <span>Label options like <code>A)</code> or <code>A.</code> for automatic parsing.</span>
          {onSwitchToPdf && (
            <button
              type="button"
              onClick={onSwitchToPdf}
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--blaze-orange)", padding: 0 }}
            >
              Have a full PDF exam? Switch to 4-Page Auditor →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
