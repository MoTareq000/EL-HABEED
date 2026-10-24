import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  Check,
  FileCheck,
  Key,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { parseExamPdf, parseExamText, type ExamParseResponse } from "../services/analyzer";
import { parseAnswerKeyText } from "../utils/answerKeyParser";

const SAMPLE_EXAM_TEXT = `CS 101: Introduction to Programming — Midterm Examination
Time Allowed: 60 Minutes | Total Marks: 50

PART I: MULTIPLE CHOICE QUESTIONS

1. Which of the following identifier names is valid according to standard programming language rules?
A) 2ndVariable
B) user_total_score
C) class
D) total-amount

2. In an if-else conditional selection construct, which scenario accurately describes program execution flow?
A) Both branches execute sequentially during each evaluation
B) Neither branch can execute regardless of condition validity
C) The if-block executes only when the boolean condition evaluates to true, otherwise the else-block executes
D) Only the else-block executes in all program runs

3. What occurs when a loop counter variable fails to advance toward the loop termination condition?
A) A compile-time syntax error occurs immediately
B) An infinite loop occurs during program execution
C) The loop terminates prematurely on iteration zero
D) The operating system restarts automatically

4. What is the primary purpose of a function's return statement?
A) To terminate execution and send a value back to the caller
B) To allocate global memory identifiers across files
C) To pause program execution until keyboard input is entered
D) To duplicate the function body across multiple classes

5. In a zero-indexed array containing 8 elements, what is the valid index of the final element?
A) 0
B) 7
C) 8
D) 9

6. In arithmetic expressions, how does the prefix increment operator (++x) differ from the postfix increment operator (x++)?
A) Prefix increments the value before expression evaluation, while postfix increments after evaluation
B) Prefix decreases the variable while postfix increases the variable
C) Prefix works only with floating-point variables while postfix works with integers
D) There is no functional difference between prefix and postfix operators

7. Where can a local variable declared inside a function block be accessed?
A) Anywhere throughout all source files in the application
B) Only within the specific function where it is defined
C) By any running background process in the system
D) Nowhere because local variables are never allocated in RAM

8. Which statement best characterizes an immutable data structure?
A) Its elements can be modified at any point during runtime
B) Its contents cannot be altered once created
C) It automatically converts all numerical values into text
D) It requires manual destruction by the user CPU

PART II: TRUE OR FALSE QUESTIONS

9. A program can contain multiple nested if-statements within a single function body.

10. A variable declared as an integer can always store floating-point decimal numbers without precision loss.

11. Recursive functions never terminate because every function call consumes infinite call stack memory.

12. A while loop evaluates its boolean condition before executing the loop body statements.

Answer Key:
1. B
2. C
3. B
4. A
5. B
6. A
7. B
8. B
9. True
10. False
11. False
12. True`;

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
    <div className="upload-container">
      {/* Title & Introduction */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink-primary)" }}>
            Ingest &amp; Extract Exam Assessment
          </h2>
          <p style={{ color: "var(--ink-secondary)", fontSize: "0.9rem", marginTop: "4px", maxWidth: "600px" }}>
            Upload an exam PDF or paste text. EL-HABEED detects question stems, answer options, and embedded answer keys.
          </p>
        </div>

        {/* Input Format Switcher */}
        <div className="segmented-pills" role="tablist" aria-label="Ingestion Method">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "pdf"}
            className={`segmented-pill ${inputMode === "pdf" ? "active" : ""}`}
            onClick={() => {
              setInputMode("pdf");
              setError(null);
            }}
          >
            PDF Document
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "text"}
            className={`segmented-pill ${inputMode === "text" ? "active" : ""}`}
            onClick={() => {
              setInputMode("text");
              setError(null);
            }}
          >
            Paste Text
          </button>
        </div>
      </div>

      {/* Scope Selector Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "var(--bg-surface)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
            Question Scope:
          </span>
          <div className="segmented-pills">
            <button
              type="button"
              className={`segmented-pill ${questionTypeFilter === "both" ? "active" : ""}`}
              onClick={() => setQuestionTypeFilter("both")}
            >
              All (MCQ + T/F)
            </button>
            <button
              type="button"
              className={`segmented-pill ${questionTypeFilter === "mcq" ? "active" : ""}`}
              onClick={() => setQuestionTypeFilter("mcq")}
            >
              MCQs Only
            </button>
            <button
              type="button"
              className={`segmented-pill ${questionTypeFilter === "tf" ? "active" : ""}`}
              onClick={() => setQuestionTypeFilter("tf")}
            >
              True/False Only
            </button>
          </div>
        </div>

        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleLoadSampleKey("cs")}>
          <FileText size={14} />
          <span>Load Sample Midterm (CS 101)</span>
        </button>
      </div>

      {/* Mode 1: PDF Dropzone */}
      {inputMode === "pdf" ? (
        <div>
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
            <div className="upload-icon">
              {file ? <FileCheck size={40} color="var(--blaze-orange)" /> : <Upload size={38} />}
            </div>
            <div className="upload-title">
              {file
                ? `${file.name} (${Math.round(file.size / 1024)} KB)`
                : "Drop exam PDF here, or browse files"}
            </div>
            <div className="upload-subtitle">
              {file
                ? "File ready for structural boundary extraction"
                : "Extracts questions, answer options, page numbers, and embedded keys."}
            </div>

            {file && (
              <div style={{ marginTop: "14px" }}>
                <span className="pill pill-lime">
                  <Check size={12} />
                  Ready to Extract
                </span>
              </div>
            )}
          </div>

          {/* Optional Answer Key Attachment Section */}
          <div style={{ marginTop: "16px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--bg-surface)" }}>
            <button
              type="button"
              onClick={() => setShowKeyAttachment(!showKeyAttachment)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--bg-subtle)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--ink-primary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={14} color="var(--blaze-orange)" />
                <span>Attach Answer Key File or Text (Optional)</span>
                {attachedKeyCount > 0 && (
                  <span className="pill pill-lime" style={{ fontSize: "0.72rem" }}>
                    {attachedKeyCount} keys detected
                  </span>
                )}
              </div>
              {showKeyAttachment ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showKeyAttachment && (
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                  Upload a <code>.txt</code> file or paste answers (e.g. <code>1.a</code>, <code>2.B</code>, <code>3.d</code>, <code>4.f</code>, <code>5.T</code>).
                </p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="file"
                    ref={keyFileInputRef}
                    accept=".txt,.csv,.key,.text"
                    style={{ display: "none" }}
                    onChange={handleKeyFileUpload}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => keyFileInputRef.current?.click()}
                  >
                    <Upload size={13} />
                    <span>Upload Key (.txt)</span>
                  </button>
                  {attachedKeyText.trim() && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAttachedKeyText("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  className="editor-textarea"
                  rows={4}
                  value={attachedKeyText}
                  onChange={(e) => setAttachedKeyText(e.target.value)}
                  placeholder={"1.a\n2.B\n3.d\n4.f\n5.T"}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            {file && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
              >
                Clear File
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleParse}
              disabled={isParsing || !file}
            >
              <Sparkles size={16} />
              <span>{isParsing ? "Extracting Questions..." : "Parse & Review Exam"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Mode 2: Paste Exam Text */
        <div>
          <div style={{ position: "relative" }}>
            <textarea
              className="editor-textarea"
              rows={14}
              value={examText}
              onChange={(e) => setExamText(e.target.value)}
              aria-label="Pasted exam text"
              placeholder="Paste numbered exam questions here. For example:&#10;&#10;1. Which of the following identifier names is valid?&#10;A) 2ndVariable&#10;B) user_total_score&#10;C) class&#10;D) total-amount&#10;&#10;2. A while loop evaluates its condition before executing body statements.&#10;&#10;Answer Key:&#10;1. B&#10;2. True"
            />
          </div>

          {/* Optional Answer Key Attachment Section */}
          <div style={{ marginTop: "16px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--bg-surface)" }}>
            <button
              type="button"
              onClick={() => setShowKeyAttachment(!showKeyAttachment)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--bg-subtle)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--ink-primary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={14} color="var(--blaze-orange)" />
                <span>Attach Answer Key File or Text (Optional)</span>
                {attachedKeyCount > 0 && (
                  <span className="pill pill-lime" style={{ fontSize: "0.72rem" }}>
                    {attachedKeyCount} keys detected
                  </span>
                )}
              </div>
              {showKeyAttachment ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showKeyAttachment && (
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                  Upload a <code>.txt</code> file or paste answers (e.g. <code>1.a</code>, <code>2.B</code>, <code>3.d</code>, <code>4.f</code>, <code>5.T</code>).
                </p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="file"
                    ref={keyFileInputRef}
                    accept=".txt,.csv,.key,.text"
                    style={{ display: "none" }}
                    onChange={handleKeyFileUpload}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => keyFileInputRef.current?.click()}
                  >
                    <Upload size={13} />
                    <span>Upload Key (.txt)</span>
                  </button>
                  {attachedKeyText.trim() && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAttachedKeyText("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  className="editor-textarea"
                  rows={4}
                  value={attachedKeyText}
                  onChange={(e) => setAttachedKeyText(e.target.value)}
                  placeholder={"1.a\n2.B\n3.d\n4.f\n5.T"}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setExamText("");
                setError(null);
              }}
              disabled={!examText.trim()}
            >
              Clear Text
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleParse}
              disabled={isParsing || !examText.trim()}
            >
              <Sparkles size={16} />
              <span>{isParsing ? "Parsing Questions..." : "Parse & Review Exam"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Callout */}
      {error && (
        <div className="callout callout-warning" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem" }}>Ingestion Notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
