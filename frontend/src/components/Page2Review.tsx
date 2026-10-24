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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
      {/* Title & Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "var(--s2)" }}>
        <div>
          <span className="section-eyebrow">Stage 02</span>
          <h2>Review extracted questions and keys</h2>
          <p style={{ marginTop: "4px", maxWidth: "65ch" }}>
            Verify question stems and options. Click any choice to designate it as the official answer key for validation.
          </p>
        </div>
      </div>

      {/* Success Notice for Key Import / Clearing */}
      {keySuccessNotice && (
        <div className="callout callout-ok">
          <Check size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Answer key updated:</strong> {keySuccessNotice}
          </div>
        </div>
      )}

      {/* Scanned PDF warning notice if applicable */}
      {parsedData.isScannedPdf && parsedData.extractionWarning && (
        <div className="callout callout-warning" role="alert">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", marginBottom: "2px" }}>Scanned document notice</strong>
            <span>{parsedData.extractionWarning}</span>
          </div>
        </div>
      )}

      {/* Summary Stats Strip (1px border cards, no shadows) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--s2)" }}>
        <div className="panel" style={{ padding: "var(--s2)" }}>
          <div style={{ fontSize: "13px", color: "var(--ink-3)", marginBottom: "2px" }}>Total questions</div>
          <div className="mono-num" style={{ fontSize: "var(--fs-md)", fontWeight: 700 }}>{totalQuestions}</div>
        </div>
        <div className="panel" style={{ padding: "var(--s2)" }}>
          <div style={{ fontSize: "13px", color: "var(--ink-3)", marginBottom: "2px" }}>Multiple choice</div>
          <div className="mono-num" style={{ fontSize: "var(--fs-md)", fontWeight: 700 }}>{mcqCount}</div>
        </div>
        <div className="panel" style={{ padding: "var(--s2)" }}>
          <div style={{ fontSize: "13px", color: "var(--ink-3)", marginBottom: "2px" }}>True / False</div>
          <div className="mono-num" style={{ fontSize: "var(--fs-md)", fontWeight: 700 }}>{tfCount}</div>
        </div>
        <div className="panel" style={{ padding: "var(--s2)" }}>
          <div style={{ fontSize: "13px", color: "var(--ink-3)", marginBottom: "2px" }}>Official answer keys</div>
          <div className="mono-num" style={{ fontSize: "var(--fs-md)", fontWeight: 700, color: keysCount > 0 ? "var(--ok)" : "var(--ink-3)" }}>
            {keysCount} / {totalQuestions}
          </div>
        </div>
        {needsReviewCount > 0 && (
          <div className="panel" style={{ padding: "var(--s2)", borderColor: "var(--warn-border)", backgroundColor: "var(--warn-bg)" }}>
            <div style={{ fontSize: "13px", color: "var(--warn)", marginBottom: "2px" }}>Needs review</div>
            <div className="mono-num" style={{ fontSize: "var(--fs-md)", fontWeight: 700, color: "var(--warn)" }}>{needsReviewCount}</div>
          </div>
        )}
      </div>

      {/* Filter and Key Actions Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--s2)" }}>
        <div className="segmented-control" role="tablist" aria-label="Question filters">
          <button
            type="button"
            role="tab"
            aria-selected={filterType === "all"}
            className={`segmented-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All items ({questions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === "mcq"}
            className={`segmented-btn ${filterType === "mcq" ? "active" : ""}`}
            onClick={() => setFilterType("mcq")}
          >
            MCQ ({mcqCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === "tf"}
            className={`segmented-btn ${filterType === "tf" ? "active" : ""}`}
            onClick={() => setFilterType("tf")}
          >
            True/False ({tfCount})
          </button>
          {needsReviewCount > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={filterType === "needs_review"}
              className={`segmented-btn ${filterType === "needs_review" ? "active" : ""}`}
              onClick={() => setFilterType("needs_review")}
            >
              Needs review ({needsReviewCount})
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "var(--s1)", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsKeyModalOpen(true)}
            style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}
          >
            <Key size={14} />
            <span>Import answer key</span>
          </button>

          {keysCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearAllKeys}
              style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}
            >
              <span>Clear keys</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
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
            style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}
          >
            <Plus size={14} />
            <span>Add question</span>
          </button>
        </div>
      </div>

      {/* Question Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
        {filteredQuestions.map((q) => {
          const qKey = q.number || String(q.index);
          const currentKey = officialKeys[qKey] || "";
          const hasWarning = q.warnings.length > 0;

          return (
            <div
              key={q.id}
              className="panel"
              style={{
                padding: "var(--s3)",
                borderColor: hasWarning ? "var(--warn-border)" : "var(--border)",
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--s1)", marginBottom: "var(--s2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
                  <span className="mono-num" style={{ fontWeight: 700, padding: "2px 8px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                    #{q.number || q.index}
                  </span>

                  <select
                    value={q.type}
                    onChange={(e) => handleTypeChange(q.id, e.target.value as QuestionType)}
                    aria-label={`Question type for item ${q.number || q.index}`}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "var(--fs-sm)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--ink)",
                    }}
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="tf">True / False</option>
                  </select>

                  {q.warnings.length > 0 && (
                    <span className="badge-delta neg" style={{ fontSize: "12px" }}>
                      {q.warnings[0]}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDeleteQuestion(q.id)}
                  style={{ minHeight: "32px", padding: "4px 8px", fontSize: "13px", color: "var(--risk)", borderColor: "var(--border)" }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>

              {/* Stem Input */}
              <div style={{ marginBottom: "var(--s2)" }}>
                <textarea
                  className="form-textarea"
                  value={q.questionText}
                  onChange={(e) => handleStemChange(q.id, e.target.value)}
                  rows={2}
                  aria-label={`Question stem for item ${q.number || q.index}`}
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>

              {/* Choices (MCQ only) - Clickable row to toggle official key */}
              {q.type === "mcq" && (
                <div style={{ marginBottom: "var(--s2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s1)" }}>
                    <span style={{ fontSize: "13px", color: "var(--ink-3)", fontWeight: 500 }}>
                      Answer choices ({q.choices.length}) — Click row to designate as official key
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddChoice(q.id)}
                      className="btn btn-secondary"
                      style={{ minHeight: "28px", padding: "2px 8px", fontSize: "12px" }}
                    >
                      <Plus size={12} />
                      <span>Add option</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {q.choices.map((choice, cIdx) => {
                      const letter = String.fromCharCode(65 + cIdx);
                      const isSelected = currentKey.toUpperCase() === letter;

                      return (
                        <div
                          key={cIdx}
                          className={`choice-btn ${isSelected ? "selected-key" : ""}`}
                          onClick={() => handleKeyChange(qKey, letter)}
                          title={`Click to set option ${letter} as official answer key`}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)", flex: 1 }}>
                            <span
                              className="mono-num"
                              style={{
                                width: "28px",
                                height: "28px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: isSelected ? "1px solid var(--ok)" : "1px solid var(--border)",
                                borderRadius: "var(--radius)",
                                backgroundColor: isSelected ? "var(--ok-bg)" : "var(--bg)",
                                color: isSelected ? "var(--ok)" : "var(--ink)",
                                fontWeight: 700,
                              }}
                            >
                              {letter}
                            </span>
                            <input
                              type="text"
                              className="form-input"
                              value={choice}
                              aria-label={`Option ${letter} for question ${q.number || q.index}`}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleChoiceChange(q.id, cIdx, e.target.value)}
                              style={{ minHeight: "36px", padding: "6px 10px", fontSize: "var(--fs-sm)" }}
                            />
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)", marginLeft: "var(--s2)" }}>
                            {isSelected && (
                              <span className="badge-delta pos" style={{ fontSize: "12px" }}>
                                <Check size={12} style={{ marginRight: "3px" }} />
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
                                className="btn btn-secondary"
                                style={{ minHeight: "28px", padding: "2px 6px", fontSize: "12px", border: "none" }}
                                title="Delete option"
                              >
                                <Trash2 size={13} color="var(--ink-3)" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Choices (True / False only) */}
              {q.type === "tf" && (
                <div style={{ marginBottom: "var(--s2)" }}>
                  <span style={{ fontSize: "13px", color: "var(--ink-3)", fontWeight: 500, display: "block", marginBottom: "var(--s1)" }}>
                    Click True or False to designate official key
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s2)" }}>
                    <div
                      className={`choice-btn ${currentKey === "True" ? "selected-key" : ""}`}
                      onClick={() => handleKeyChange(qKey, "True")}
                      role="button"
                      tabIndex={0}
                    >
                      <strong style={{ fontSize: "var(--fs-sm)" }}>True</strong>
                      {currentKey === "True" && (
                        <span className="badge-delta pos" style={{ fontSize: "12px" }}>
                          <Check size={12} style={{ marginRight: "3px" }} /> Key
                        </span>
                      )}
                    </div>

                    <div
                      className={`choice-btn ${currentKey === "False" ? "selected-key" : ""}`}
                      onClick={() => handleKeyChange(qKey, "False")}
                      role="button"
                      tabIndex={0}
                    >
                      <strong style={{ fontSize: "var(--fs-sm)" }}>False</strong>
                      {currentKey === "False" && (
                        <span className="badge-delta pos" style={{ fontSize: "12px" }}>
                          <Check size={12} style={{ marginRight: "3px" }} /> Key
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Official Key Indicator Row */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--s1)", paddingTop: "var(--s1)", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Key size={14} color="var(--ink-3)" />
                  <span style={{ fontSize: "13px", color: "var(--ink-2)" }}>Official key:</span>
                  <span className="mono-num" style={{ fontSize: "13px", fontWeight: 700, color: currentKey ? "var(--ok)" : "var(--ink-3)" }}>
                    {currentKey || "(None assigned)"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {q.type === "mcq" ? (
                    q.choices.map((_, cIdx) => {
                      const label = String.fromCharCode(65 + cIdx);
                      const isSelected = currentKey.toUpperCase() === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          className="segmented-btn"
                          style={{
                            padding: "3px 8px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            fontWeight: isSelected ? 700 : 500,
                            backgroundColor: isSelected ? "var(--ok-bg)" : "transparent",
                            color: isSelected ? "var(--ok)" : "var(--ink-2)",
                            border: isSelected ? "1px solid var(--ok-border)" : "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                          }}
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
                        className="segmented-btn"
                        style={{
                          padding: "3px 8px",
                          fontSize: "12px",
                          fontWeight: currentKey === "True" ? 700 : 500,
                          backgroundColor: currentKey === "True" ? "var(--ok-bg)" : "transparent",
                          color: currentKey === "True" ? "var(--ok)" : "var(--ink-2)",
                          border: currentKey === "True" ? "1px solid var(--ok-border)" : "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                        }}
                        onClick={() => handleKeyChange(qKey, "True")}
                      >
                        True
                      </button>
                      <button
                        type="button"
                        className="segmented-btn"
                        style={{
                          padding: "3px 8px",
                          fontSize: "12px",
                          fontWeight: currentKey === "False" ? 700 : 500,
                          backgroundColor: currentKey === "False" ? "var(--ok-bg)" : "transparent",
                          color: currentKey === "False" ? "var(--ok)" : "var(--ink-2)",
                          border: currentKey === "False" ? "1px solid var(--ok-border)" : "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                        }}
                        onClick={() => handleKeyChange(qKey, "False")}
                      >
                        False
                      </button>
                    </>
                  )}
                  {currentKey && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ minHeight: "26px", padding: "2px 6px", fontSize: "11px", marginLeft: "4px" }}
                      onClick={() => handleKeyChange(qKey, currentKey)}
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
            <strong style={{ display: "block", marginBottom: "2px" }}>Validation notice</strong>
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--s2)", paddingTop: "var(--s3)", borderTop: "1px solid var(--border)" }}>
        <button className="btn btn-secondary" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to upload</span>
        </button>

        <button className="btn btn-primary" type="button" onClick={handleSubmit}>
          <span>Simulate blind guessing</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Answer Key Import Modal */}
      {isKeyModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--s3)",
            zIndex: 100,
          }}
          onClick={() => setIsKeyModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="panel-white"
            style={{ maxWidth: "560px", width: "100%", padding: "var(--s4)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s2)" }}>
              <h3 style={{ margin: 0 }}>Import official answer key</h3>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: "32px", padding: "4px 8px" }}
                onClick={() => setIsKeyModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "var(--fs-sm)", marginBottom: "var(--s2)" }}>
              Upload a text file or paste answers matching standard format (e.g. <code>1.A</code>, <code>2.B</code>, <code>3.True</code>, <code>4.False</code>).
            </p>

            <div style={{ display: "flex", gap: "var(--s1)", marginBottom: "var(--s2)" }}>
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
                <span>Upload .txt file</span>
              </button>
              {modalKeyText.trim() && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalKeyText("")}
                  style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              className="form-textarea"
              rows={6}
              value={modalKeyText}
              onChange={(e) => setModalKeyText(e.target.value)}
              placeholder={"1. B\n2. C\n3. B\n4. True\n5. False"}
              style={{ marginBottom: "var(--s2)" }}
            />

            {liveKeyCount > 0 && (
              <div className="panel" style={{ padding: "var(--s2)", marginBottom: "var(--s3)" }}>
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ok)", marginBottom: "4px" }}>
                  ✓ {liveKeyCount} keys detected
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxHeight: "80px", overflowY: "auto" }}>
                  {Object.entries(liveParsedKeys).slice(0, 12).map(([num, ans]) => (
                    <span key={num} className="mono-num" style={{ fontSize: "12px", padding: "2px 6px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                      Q{num}: {ans}
                    </span>
                  ))}
                  {liveKeyCount > 12 && (
                    <span className="mono-num" style={{ fontSize: "12px", padding: "2px 6px", color: "var(--ink-3)" }}>
                      +{liveKeyCount - 12} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--s2)" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsKeyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={liveKeyCount === 0}
                onClick={handleApplyKeys}
              >
                Apply {liveKeyCount > 0 ? `${liveKeyCount} keys` : "keys"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
