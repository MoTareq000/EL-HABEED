import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  FileCheck,
  Key,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Wand2,
} from "lucide-react";
import { parseExamPdf, parseExamText, type ExamParseResponse } from "../services/analyzer";
import { parseAnswerKeyText } from "../utils/answerKeyParser";
import { SAMPLE_EXAMS } from "../data/sampleExams";

type Props = {
  onParsed: (result: ExamParseResponse, rawSource: string) => void;
  initialText?: string;
};

export function Page1Upload({ onParsed, initialText }: Props) {
  const [inputMode, setInputMode] = useState<"pdf" | "text">(initialText ? "text" : "pdf");
  const [file, setFile] = useState<File | null>(null);
  const [examText, setExamText] = useState(initialText || "");
  const [questionTypeFilter, setQuestionTypeFilter] = useState<"both" | "mcq" | "tf">("both");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialText) {
      setExamText(initialText);
      setInputMode("text");
    }
  }, [initialText]);

  // Optional attached answer key state (e.g. 1.a, 2.B, 3.d, 4.f, 5.T)
  const [showKeyAttachment, setShowKeyAttachment] = useState(false);
  const [attachedKeyText, setAttachedKeyText] = useState("");
  const keyFileInputRef = useRef<HTMLInputElement>(null);

  // Optional Clean pasted text / Sanitizer tool state
  const [showSanitizer, setShowSanitizer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedAttachedKeys = parseAnswerKeyText(attachedKeyText);
  const attachedKeyCount = Object.keys(parsedAttachedKeys).length;

  function handleFileSelect(selectedFile: File) {
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid .pdf document.");
      return;
    }
    setFile(selectedFile);
    setError(null);
  }

  function handleKeyFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      setAttachedKeyText(content);
      setShowKeyAttachment(true);
    };
    reader.readAsText(uploadedFile);
  }

  function handleLoadSampleKey(key: "cs" | "bio" | "law") {
    setInputMode("text");
    setExamText(SAMPLE_EXAMS[key].rawText);
    setFile(null);
    setError(null);
  }

  async function handleParse() {
    setIsParsing(true);
    setError(null);

    try {
      let parsed: ExamParseResponse;
      if (inputMode === "pdf") {
        if (!file) {
          setError("Please select or drop an exam PDF first.");
          setIsParsing(false);
          return;
        }
        parsed = await parseExamPdf(file);
      } else {
        if (!examText.trim()) {
          setError("Please paste your exam text first.");
          setIsParsing(false);
          return;
        }
        parsed = await parseExamText(examText, "Pasted Exam");
      }

      if (parsed.questions.length === 0) {
        setError(
          "No questions could be detected. Please ensure questions are numbered (e.g. 1., 2.) with options like A), B)."
        );
        setIsParsing(false);
        return;
      }

      // Merge manually attached answer keys if provided by user
      if (attachedKeyCount > 0) {
        parsed.detectedKeys = {
          ...parsed.detectedKeys,
          ...parsedAttachedKeys,
        };
      }

      // Filter by question type if user specified
      if (questionTypeFilter !== "both") {
        parsed.questions = parsed.questions.filter((q) => q.type === questionTypeFilter);
      }

      onParsed(parsed, inputMode === "pdf" ? (file ? file.name : "Exam.pdf") : examText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse exam.");
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
      {/* Title & Description */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "var(--s2)" }}>
        <div>
          <span className="section-eyebrow">Stage 01</span>
          <h2>Upload and ingest exam</h2>
          <p style={{ marginTop: "4px", maxWidth: "65ch" }}>
            Upload an exam PDF or paste numbered questions. EL-HABEED detects stems, answer options, and embedded keys.
          </p>
        </div>

        {/* Ingestion Method Switcher */}
        <div className="segmented-control" role="tablist" aria-label="Ingestion method">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "pdf"}
            className={`segmented-btn ${inputMode === "pdf" ? "active" : ""}`}
            onClick={() => {
              setInputMode("pdf");
              setError(null);
            }}
          >
            PDF document
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "text"}
            className={`segmented-btn ${inputMode === "text" ? "active" : ""}`}
            onClick={() => {
              setInputMode("text");
              setError(null);
            }}
          >
            Paste text
          </button>
        </div>
      </div>

      {/* Scope and Sample Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--s2)", padding: "var(--s2)", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 500 }}>
            Question scope:
          </span>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${questionTypeFilter === "both" ? "active" : ""}`}
              onClick={() => setQuestionTypeFilter("both")}
            >
              All (MCQ + T/F)
            </button>
            <button
              type="button"
              className={`segmented-btn ${questionTypeFilter === "mcq" ? "active" : ""}`}
              onClick={() => setQuestionTypeFilter("mcq")}
            >
              MCQs only
            </button>
            <button
              type="button"
              className={`segmented-btn ${questionTypeFilter === "tf" ? "active" : ""}`}
              onClick={() => setQuestionTypeFilter("tf")}
            >
              True/False only
            </button>
          </div>
        </div>

        <button type="button" className="btn btn-secondary" onClick={() => handleLoadSampleKey("cs")} style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}>
          <FileText size={15} />
          <span>Load CS 101 sample</span>
        </button>
      </div>

      {/* Mode 1: PDF Dropzone */}
      {inputMode === "pdf" ? (
        <div className="panel" style={{ padding: "var(--s3)" }}>
          <div
            className={`upload-dropzone ${isDragging ? "dragover" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Upload PDF file dropzone"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              aria-label="Choose exam PDF file"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            {file ? <FileCheck size={36} color="var(--ok)" /> : <Upload size={36} color="var(--ink-3)" />}
            <div className="upload-title" style={{ marginTop: "var(--s1)" }}>
              {file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : "Drop exam PDF here, or click to browse"}
            </div>
            <div className="upload-subtitle">
              {file
                ? "Document ready for structural analysis"
                : "Extracts questions, answer options, page numbers, and embedded keys."}
            </div>

            {file && (
              <span className="badge-delta pos" style={{ marginTop: "var(--s1)" }}>
                <Check size={14} style={{ marginRight: "4px" }} />
                PDF loaded
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Mode 2: Paste Exam Text */
        <div className="panel" style={{ padding: "var(--s3)" }}>
          <label htmlFor="exam-textarea" className="input-label">
            Exam text with numbered questions
          </label>
          <textarea
            id="exam-textarea"
            className="form-textarea"
            rows={12}
            value={examText}
            onChange={(e) => setExamText(e.target.value)}
            aria-label="Pasted exam text"
            placeholder={"1. Which of the following identifier names is valid?\nA) 2ndVariable\nB) user_total_score\nC) class\nD) total-amount\n\n2. A while loop evaluates its condition before executing body statements.\n\nAnswer Key:\n1. B\n2. True"}
          />
        </div>
      )}

      {/* Optional Answer Key Section */}
      <div className="panel" style={{ padding: "var(--s2) var(--s3)" }}>
        <button
          type="button"
          onClick={() => setShowKeyAttachment(!showKeyAttachment)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
            <Key size={16} color="var(--ink-2)" />
            <span>Answer key (optional)</span>
            {attachedKeyCount > 0 && (
              <span className="badge-delta pos" style={{ marginLeft: "var(--s1)" }}>
                {attachedKeyCount} keys detected
              </span>
            )}
          </div>
          {showKeyAttachment ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showKeyAttachment && (
          <div style={{ paddingTop: "var(--s2)", marginTop: "var(--s1)", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)" }}>
              Upload a <code>.txt</code> file or paste answers (e.g. <code>1.A</code>, <code>2.C</code>, <code>3.True</code>, <code>4.False</code>). When provided, EL-HABEED evaluates whether detected cues pointed at the real answer.
            </p>
            <div style={{ display: "flex", gap: "var(--s1)", alignItems: "center" }}>
              <input
                type="file"
                ref={keyFileInputRef}
                accept=".txt,.csv,.key,.text"
                style={{ display: "none" }}
                onChange={handleKeyFileUpload}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => keyFileInputRef.current?.click()}
                style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}
              >
                <Upload size={14} />
                <span>Upload key (.txt)</span>
              </button>
              {attachedKeyText.trim() && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAttachedKeyText("")}
                  style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}
                >
                  Clear key
                </button>
              )}
            </div>
            <textarea
              className="form-textarea"
              rows={4}
              value={attachedKeyText}
              onChange={(e) => setAttachedKeyText(e.target.value)}
              placeholder={"1. B\n2. C\n3. B\n4. True\n5. False"}
            />
          </div>
        )}
      </div>

      {/* Optional "Clean pasted text" collapsible step (Integrated Sanitizer) */}
      <div className="panel" style={{ padding: "var(--s2) var(--s3)" }}>
        <button
          type="button"
          onClick={() => setShowSanitizer(!showSanitizer)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
            <Wand2 size={16} color="var(--ink-2)" />
            <span>Clean pasted text (optional repair guidelines)</span>
          </div>
          {showSanitizer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showSanitizer && (
          <div style={{ paddingTop: "var(--s2)", marginTop: "var(--s1)", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)" }}>
              Before running your final audit, use these guidelines to remove unintentional giveaways from your draft questions:
            </p>
            <ul className="advice-list">
              <li>
                <strong>Runaway length:</strong> Balance all distractors to approximately the same word count (9–12 words).
              </li>
              <li>
                <strong>Absolute words:</strong> Replace rigid universal terms like <em>always</em>, <em>never</em>, or <em>solely</em> with specific operational descriptions.
              </li>
              <li>
                <strong>Combination options:</strong> Avoid <em>All of the above</em> or <em>Both A and B</em>; replace them with focused conceptual discriminators.
              </li>
              <li>
                <strong>True/False causal clauses:</strong> Avoid linking clauses with <em>because</em>; write direct factual statements instead.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Error Callout */}
      {error && (
        <div className="callout callout-warning" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", marginBottom: "2px" }}>Parsing notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s2)", marginTop: "var(--s2)" }}>
        {((inputMode === "pdf" && file) || (inputMode === "text" && examText.trim())) && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (inputMode === "pdf") setFile(null);
              else setExamText("");
              setError(null);
            }}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleParse}
          disabled={isParsing || (inputMode === "pdf" ? !file : !examText.trim())}
        >
          <span>{isParsing ? "Extracting questions..." : "Parse and review exam"}</span>
        </button>
      </div>
    </div>
  );
}
