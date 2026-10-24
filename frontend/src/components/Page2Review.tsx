import React, { useState, useRef } from "react";
import {
  AlertTriangle,
  Key,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import type { EditableQuestion, ExamParseResponse, QuestionType } from "../services/analyzer";
import { parseAnswerKeyText } from "../utils/answerKeyParser";

type Props = {
  parsedData: ExamParseResponse;
  rawSource: string;
  onBack: () => void;
  onSubmit: (questions: EditableQuestion[], officialKeys: Record<string, string>) => void;
};

export function Page2Review({ parsedData, onBack, onSubmit }: Props) {
  const [questions, setQuestions] = useState<EditableQuestion[]>(parsedData.questions);
  const [officialKeys, setOfficialKeys] = useState<Record<string, string>>({
    ...parsedData.detectedKeys,
  });
  const [filterType, setFilterType] = useState<"all" | "mcq" | "tf" | "needs_review">("all");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Answer Key Import Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [modalKeyText, setModalKeyText] = useState("");
  const [keySuccessNotice, setKeySuccessNotice] = useState<string | null>(null);
  const keyFileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const totalQuestions = questions.length;
  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const tfCount = questions.filter((q) => q.type === "tf").length;
  const needsReviewCount = questions.filter((q) => q.status === "needs_review").length;
  const keysCount = Object.keys(officialKeys).filter((k) => officialKeys[k]).length;

  // Real-time detection in the import modal
  const liveParsedKeys = parseAnswerKeyText(modalKeyText, questions);
  const liveKeyCount = Object.keys(liveParsedKeys).length;

  function handleStemChange(id: string, text: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, questionText: text } : q))
    );
  }

  function handleTypeChange(id: string, newType: QuestionType) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const choices = newType === "mcq" && q.choices.length === 0 ? ["Option A", "Option B"] : q.choices;
          return { ...q, type: newType, choices };
        }
        return q;
      })
    );
  }

  function handleChoiceChange(id: string, choiceIndex: number, text: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updatedChoices = [...q.choices];
          updatedChoices[choiceIndex] = text;
          return { ...q, choices: updatedChoices };
        }
        return q;
      })
    );
  }

  function handleAddChoice(id: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const label = String.fromCharCode(65 + q.choices.length);
          return { ...q, choices: [...q.choices, `Option ${label}`] };
        }
        return q;
      })
    );
  }

  function handleRemoveChoice(id: string, choiceIndex: number) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updatedChoices = q.choices.filter((_, idx) => idx !== choiceIndex);
          return { ...q, choices: updatedChoices };
        }
        return q;
      })
    );
  }

  function handleDeleteQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function handleKeyChange(qNumberOrIndex: string, selectedKey: string) {
    setOfficialKeys((prev) => {
      const next = { ...prev };
      if (next[qNumberOrIndex] === selectedKey) {
        delete next[qNumberOrIndex];
      } else {
        next[qNumberOrIndex] = selectedKey;
      }
      return next;
    });
  }

  function handleKeyFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      setModalKeyText(content);
    };
    reader.readAsText(uploadedFile);
  }

  function handleApplyKeys() {
    if (liveKeyCount === 0) return;
    setOfficialKeys((prev) => ({
      ...prev,
      ...liveParsedKeys,
    }));
    setKeySuccessNotice(`Applied ${liveKeyCount} answer key item(s) successfully.`);
    setIsKeyModalOpen(false);
    setModalKeyText("");
    setTimeout(() => setKeySuccessNotice(null), 5000);
  }

  function handleClearAllKeys() {
    if (window.confirm("Clear all assigned official answer keys?")) {
      setOfficialKeys({});
      setKeySuccessNotice("All official answer keys cleared.");
      setTimeout(() => setKeySuccessNotice(null), 3000);
    }
  }

  function handleSubmit() {
    setValidationError(null);

    if (questions.length === 0) {
      setValidationError("The exam must have at least one valid question.");
      return;
    }

    const invalidQuestions = questions.filter(
      (q) => !q.questionText.trim() || (q.type === "mcq" && q.choices.length < 2)
    );

    if (invalidQuestions.length > 0) {
      setValidationError(
        `Resolve issues on ${invalidQuestions.length} question(s): Question stems cannot be blank, and MCQs need at least 2 choices.`
      );
      return;
    }

    onSubmit(questions, officialKeys);
  }

  const filteredQuestions = questions.filter((q) => {
    if (filterType === "all") return true;
    if (filterType === "mcq") return q.type === "mcq";
    if (filterType === "tf") return q.type === "tf";
    if (filterType === "needs_review") return q.status === "needs_review" || q.warnings.length > 0;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title & Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink-primary)" }}>
            Review Extracted Questions &amp; Assign Keys
          </h2>
          <p style={{ color: "var(--ink-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Click any answer choice or use the Import button to map official answers (e.g. 1.a, 2.B, 3.d, 4.f, 5.T).
          </p>
        </div>
      </div>

      {/* Success Notice for Key Import / Clearing */}
      {keySuccessNotice && (
        <div className="callout" style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46" }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem" }}>Answer Key Updated</strong>
            <span>{keySuccessNotice}</span>
          </div>
        </div>
      )}

      {/* Scanned PDF warning notice if applicable */}
      {parsedData.isScannedPdf && parsedData.extractionWarning && (
        <div className="callout callout-warning" role="alert">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem" }}>Scanned Document Notice</strong>
            <span>{parsedData.extractionWarning}</span>
          </div>
        </div>
      )}

      {/* Summary Stats Strip */}
      <div className="stats-summary-bar">
        <div className="stat-cell">
          <div className="stat-cell-label">Total Questions</div>
          <div className="stat-cell-value">{totalQuestions}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">Multiple Choice</div>
          <div className="stat-cell-value">{mcqCount}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">True / False</div>
          <div className="stat-cell-value">{tfCount}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">Official Answer Key</div>
          <div className="stat-cell-value" style={{ color: keysCount > 0 ? "var(--color-success)" : "var(--ink-tertiary)" }}>
            {keysCount} / {totalQuestions}
          </div>
        </div>
        {needsReviewCount > 0 && (
          <div className="stat-cell" style={{ backgroundColor: "var(--blaze-orange-tint)" }}>
            <div className="stat-cell-label" style={{ color: "var(--blaze-orange)" }}>Needs Review</div>
            <div className="stat-cell-value" style={{ color: "var(--blaze-orange)" }}>{needsReviewCount}</div>
          </div>
        )}
      </div>

      {/* Filter and Key Actions Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div className="segmented-pills" role="tablist" aria-label="Question filters">
          <button
            type="button"
            role="tab"
            aria-selected={filterType === "all"}
            className={`segmented-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Items ({questions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === "mcq"}
            className={`segmented-pill ${filterType === "mcq" ? "active" : ""}`}
            onClick={() => setFilterType("mcq")}
          >
            MCQ ({mcqCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === "tf"}
            className={`segmented-pill ${filterType === "tf" ? "active" : ""}`}
            onClick={() => setFilterType("tf")}
          >
            True/False ({tfCount})
          </button>
          {needsReviewCount > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={filterType === "needs_review"}
              className={`segmented-pill ${filterType === "needs_review" ? "active" : ""}`}
              onClick={() => setFilterType("needs_review")}
            >
              Needs Review ({needsReviewCount})
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsKeyModalOpen(true)}
            title="Upload or paste an official answer key file"
          >
            <Key size={14} color="var(--blaze-orange)" />
            <span>Import Answer Key</span>
          </button>

          {keysCount > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClearAllKeys}
              title="Clear all assigned keys"
            >
              <span>Clear Keys</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const nextIndex = questions.length + 1;
              const newQ: EditableQuestion = {
                id: `q_${Date.now()}`,
                index: nextIndex,
                number: String(nextIndex),
                type: "mcq",
                questionText: "New question stem...",
                choices: ["Option A", "Option B", "Option C", "Option D"],
                rawText: "",
                status: "valid",
                warnings: [],
              };
              setQuestions([...questions, newQ]);
            }}
          >
            <Plus size={14} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Question Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {filteredQuestions.map((q) => {
          const qKey = q.number || String(q.index);
          const currentKey = officialKeys[qKey] || "";
          const hasWarning = q.warnings.length > 0;

          return (
            <div
              key={q.id}
              className={`question-review-card ${hasWarning ? "has-warning" : ""}`}
            >
              {/* Card Header */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="pill pill-dark">
                    #{q.number || q.index}
                  </span>

                  <select
                    value={q.type}
                    onChange={(e) => handleTypeChange(q.id, e.target.value as QuestionType)}
                    aria-label={`Question type for item ${q.number || q.index}`}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.78rem",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      background: "var(--bg-surface)",
                    }}
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="tf">True / False</option>
                  </select>

                  {q.warnings.length > 0 && (
                    <span className="pill pill-orange">
                      ⚠ {q.warnings[0]}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-danger-ghost btn-sm"
                  onClick={() => handleDeleteQuestion(q.id)}
                  title="Delete question"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>

              {/* Stem Input */}
              <div style={{ marginBottom: "14px" }}>
                <textarea
                  value={q.questionText}
                  onChange={(e) => handleStemChange(q.id, e.target.value)}
                  rows={2}
                  aria-label={`Question stem for item ${q.number || q.index}`}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.92rem",
                    lineHeight: 1.5,
                    background: "var(--bg-canvas)",
                  }}
                />
              </div>

              {/* Choices (MCQ only) - DIRECTLY CLICKABLE */}
              {q.type === "mcq" && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                      Answer Choices ({q.choices.length}) — Click row or letter to set official key
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddChoice(q.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                    >
                      <Plus size={12} />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div>
                    {q.choices.map((choice, cIdx) => {
                      const letter = String.fromCharCode(65 + cIdx);
                      const isSelected = currentKey.toUpperCase() === letter;

                      return (
                        <div
                          key={cIdx}
                          className={`choice-edit-row ${isSelected ? "selected-key" : ""}`}
                          onClick={() => handleKeyChange(qKey, letter)}
                          title={`Click to set option ${letter} as official answer key`}
                        >
                          <div
                            className={`choice-radio-indicator ${isSelected ? "checked" : ""}`}
                            aria-hidden="true"
                          >
                            {isSelected && <div className="choice-radio-dot" />}
                          </div>

                          <span className="choice-letter-badge">{letter}</span>

                          <input
                            type="text"
                            className="choice-input"
                            value={choice}
                            aria-label={`Option ${letter} for question ${q.number || q.index}`}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleChoiceChange(q.id, cIdx, e.target.value)}
                          />

                          {isSelected && (
                            <span className="pill pill-lime" style={{ flexShrink: 0, fontSize: "0.72rem" }}>
                              <Check size={12} />
                              Key
                            </span>
                          )}

                          {q.choices.length > 2 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveChoice(q.id, cIdx);
                              }}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "4px", color: "var(--ink-tertiary)" }}
                              title="Delete option"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Choices (True / False only) - DIRECTLY CLICKABLE CARDS */}
              {q.type === "tf" && (
                <div style={{ marginBottom: "14px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--ink-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Click True or False to Set Official Key
                  </span>
                  <div className="tf-choice-grid">
                    <div
                      className={`tf-choice-card ${currentKey === "True" ? "selected-key" : ""}`}
                      onClick={() => handleKeyChange(qKey, "True")}
                      role="button"
                      tabIndex={0}
                      aria-label={`Set True as official key for question ${q.number || q.index}`}
                    >
                      <div className="tf-choice-label">
                        <div className={`choice-radio-indicator ${currentKey === "True" ? "checked" : ""}`}>
                          {currentKey === "True" && <div className="choice-radio-dot" />}
                        </div>
                        <span>True</span>
                      </div>
                      {currentKey === "True" && (
                        <span className="pill pill-lime" style={{ fontSize: "0.72rem" }}>
                          <Check size={12} />
                          Key
                        </span>
                      )}
                    </div>

                    <div
                      className={`tf-choice-card ${currentKey === "False" ? "selected-key" : ""}`}
                      onClick={() => handleKeyChange(qKey, "False")}
                      role="button"
                      tabIndex={0}
                      aria-label={`Set False as official key for question ${q.number || q.index}`}
                    >
                      <div className="tf-choice-label">
                        <div className={`choice-radio-indicator ${currentKey === "False" ? "checked" : ""}`}>
                          {currentKey === "False" && <div className="choice-radio-dot" />}
                        </div>
                        <span>False</span>
                      </div>
                      {currentKey === "False" && (
                        <span className="pill pill-lime" style={{ fontSize: "0.72rem" }}>
                          <Check size={12} />
                          Key
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Official Answer Key Indicator Row */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px", paddingTop: "10px", borderTop: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Key size={13} color="var(--blaze-orange)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-secondary)" }}>
                    Official Key:
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: currentKey ? "var(--color-success)" : "var(--ink-tertiary)" }}>
                    {currentKey ? currentKey : "(None assigned)"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {q.type === "mcq" ? (
                    q.choices.map((_, cIdx) => {
                      const label = String.fromCharCode(65 + cIdx);
                      const isSelected = currentKey.toUpperCase() === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          className={`key-bubble ${isSelected ? "selected" : ""}`}
                          aria-label={`Set ${label} as official key for question ${q.number || q.index}`}
                          onClick={() => handleKeyChange(qKey, label)}
                        >
                          {label}
                        </button>
                      );
                    })
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`key-tf-btn ${currentKey === "True" ? "selected" : ""}`}
                        onClick={() => handleKeyChange(qKey, "True")}
                      >
                        True
                      </button>
                      <button
                        type="button"
                        className={`key-tf-btn ${currentKey === "False" ? "selected" : ""}`}
                        onClick={() => handleKeyChange(qKey, "False")}
                      >
                        False
                      </button>
                    </>
                  )}
                  {currentKey && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "2px 6px", fontSize: "0.72rem", color: "var(--ink-tertiary)" }}
                      onClick={() => handleKeyChange(qKey, currentKey)}
                      title="Clear key for this question"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="callout callout-warning" role="alert">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem" }}>Validation Notice</strong>
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-light)" }}>
        <button className="btn btn-secondary" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Ingestion</span>
        </button>

        <button className="btn btn-primary" type="button" onClick={handleSubmit}>
          <span>Run Blindfold Simulation</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Answer Key Import Modal */}
      {isKeyModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsKeyModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="key-import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={18} color="var(--blaze-orange)" />
                <h3 id="modal-title" style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--ink-primary)" }}>
                  Import Official Answer Key
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsKeyModalOpen(false)}
                aria-label="Close modal"
                style={{ padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", margin: 0 }}>
                Upload a text file or paste answers matching standard format (e.g. <code>1.a</code>, <code>2.B</code>, <code>3.d</code>, <code>4.f</code>, <code>5.T</code>).
              </p>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                  <Upload size={14} />
                  <span>Upload .txt File</span>
                </button>
                {modalKeyText.trim() && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setModalKeyText("")}
                  >
                    Clear Input
                  </button>
                )}
              </div>

              <textarea
                className="editor-textarea"
                rows={7}
                value={modalKeyText}
                onChange={(e) => setModalKeyText(e.target.value)}
                placeholder={"1.a\n2.B\n3.d\n4.f\n5.T"}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
              />

              {/* Live Detection Information */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  background: "var(--bg-subtle)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: liveKeyCount > 0 ? "var(--color-success)" : "var(--ink-tertiary)",
                    }}
                  >
                    {liveKeyCount > 0
                      ? `✓ ${liveKeyCount} answer key item(s) detected`
                      : "Waiting for answer key input..."}
                  </span>
                </div>

                {liveKeyCount > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "80px", overflowY: "auto" }}>
                    {Object.entries(liveParsedKeys).slice(0, 15).map(([num, ans]) => (
                      <span
                        key={num}
                        className="pill pill-light"
                        style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}
                      >
                        Q{num}: <strong>{ans}</strong>
                      </span>
                    ))}
                    {liveKeyCount > 15 && (
                      <span className="pill pill-light" style={{ fontSize: "0.72rem" }}>
                        +{liveKeyCount - 15} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsKeyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={liveKeyCount === 0}
                onClick={handleApplyKeys}
              >
                <Check size={14} />
                <span>Apply {liveKeyCount > 0 ? `${liveKeyCount} Keys` : "Keys"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
