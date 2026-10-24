import React, { useState } from "react";
import { Download, Share2, RefreshCw, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import type { ExamAuditResponse } from "../services/analyzer";

type Props = {
  result: ExamAuditResponse;
  onAnalyzeAnother: () => void;
  onReviewFlagged?: () => void;
};

export function Page4Results({ result, onAnalyzeAnother, onReviewFlagged }: Props) {
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 1. Separate questions with uncertain structure from analyzed questions
  const uncertainQuestions = result.questions.filter(
    (q) => q.primaryFlaw === "Uncertain Structure" || q.status === "needs_review"
  );
  const analyzedQuestions = result.questions.filter(
    (q) => q.primaryFlaw !== "Uncertain Structure" && q.status !== "needs_review"
  );

  const totalAnalyzed = analyzedQuestions.length;
  const cuesDetected = analyzedQuestions.filter((q) => q.hasCues).length;
  const cueExposurePct = totalAnalyzed > 0 ? Math.round((cuesDetected / totalAnalyzed) * 100) : 0;

  // 2. Chance baseline calculated on frontend
  const chancePct =
    totalAnalyzed > 0
      ? Math.round(
          (analyzedQuestions.reduce((sum, q) => {
            if (q.type === "mcq" && q.choices && q.choices.length > 0) {
              return sum + 1 / q.choices.length;
            }
            return sum + 0.5;
          }, 0) /
            totalAnalyzed) *
            100
        )
      : 25;

  const hasKey = typeof result.accuracy === "number" && result.evaluatedQuestions > 0;
  const heuristicScore = result.correctPredictions;
  const heuristicTotal = result.evaluatedQuestions;
  const heuristicPct = result.accuracy ?? 0;

  // 3. Verdict stamp class
  let verdictClass = "moderate";
  const stampLower = result.verdictStamp?.toLowerCase() || "";
  if (stampLower.includes("leaky") || cueExposurePct >= 60) {
    verdictClass = "leaky";
  } else if (stampLower.includes("robust") || cueExposurePct < 25) {
    verdictClass = "robust";
  }

  // 4. Counts for risk filter
  const highRiskCount = analyzedQuestions.filter((q) => q.vulnerability === "high").length;
  const mediumRiskCount = analyzedQuestions.filter((q) => q.vulnerability === "medium").length;
  const lowRiskCount = analyzedQuestions.filter((q) => q.vulnerability === "low").length;

  const filteredQuestions = analyzedQuestions.filter((q) => {
    if (riskFilter === "all") return true;
    return q.vulnerability === riskFilter;
  });

  function handleDownloadReport() {
    const lines = [
      `# EL-HABEED Exam Audit & Blind-Guessing Simulation Report`,
      `**Filename:** ${result.filename}`,
      `**Verdict:** ${result.verdictStamp}`,
      `**Description:** ${result.verdictDescription}`,
      `**Cue Exposure:** ${cueExposurePct}% (${cuesDetected} of ${totalAnalyzed} questions contain cues)`,
      `**Heuristic Score vs Chance:** ${
        hasKey
          ? `${heuristicScore}/${heuristicTotal} (${heuristicPct}%) vs Chance ${chancePct}%`
          : "No answer key provided"
      }`,
      ``,
      `## What to change`,
      ...(result.teacherAdvice || []).map((a) => `- ${a}`),
      ``,
      `## Detailed Question Audit`,
      ...analyzedQuestions.map((q) => {
        return [
          `### Question #${q.number || q.index} [${q.type.toUpperCase()}]`,
          `**Stem:** ${q.questionText}`,
          q.type === "mcq"
            ? `**Choices:**\n${q.choices.map((c, i) => `  ${String.fromCharCode(65 + i)}) ${c}`).join("\n")}`
            : "",
          `**Predicted:** ${q.prediction} (${q.confidence}% confidence)`,
          `**Official Answer:** ${q.officialAnswer || "Unverified"}`,
          `**Risk:** ${q.vulnerability}`,
          `**Rules Triggered:**`,
          ...q.reasons.map((r) => `  - [${r.delta >= 0 ? `+${r.delta}` : r.delta} pts] ${r.name || r.rule}: ${r.message}`),
          ``,
        ]
          .filter(Boolean)
          .join("\n");
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EL_HABEED_Audit_${result.filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EL_HABEED_Results_${result.filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
    downloadAnchor.click();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
      {/* Header & Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "var(--s2)" }}>
        <div>
          <span className="section-eyebrow">Stage 04</span>
          <h2>Audit results: {result.filename}</h2>
          <p style={{ marginTop: "4px" }}>
            {totalAnalyzed} valid question{totalAnalyzed === 1 ? "" : "s"} evaluated using deterministic rule heuristics.
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--s1)", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" type="button" onClick={handleDownloadReport} style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}>
            <Download size={14} />
            <span>Download report (.md)</span>
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleExportJson} style={{ minHeight: "36px", padding: "6px 12px", fontSize: "var(--fs-sm)" }}>
            <Share2 size={14} />
            <span>Export JSON</span>
          </button>
          <button className="btn btn-primary" type="button" onClick={onAnalyzeAnother} style={{ minHeight: "36px", padding: "6px 14px", fontSize: "var(--fs-sm)" }}>
            <RefreshCw size={14} />
            <span>Audit another exam</span>
          </button>
        </div>
      </div>

      {/* Results Header: Two clearly labeled readouts */}
      <div className="readouts-grid">
        {/* Readout 1: Cue exposure */}
        <div className="readout-card">
          <span className="readout-label">Cue exposure</span>
          <div className="readout-num">{cueExposurePct}%</div>
          <div className="readout-sub">
            {cuesDetected} of {totalAnalyzed} questions contain at least one detected structural giveaway.
          </div>
        </div>

        {/* Readout 2: Heuristic score vs chance */}
        <div className="readout-card">
          <span className="readout-label">Heuristic score vs chance</span>
          {hasKey ? (
            <>
              <div className="readout-num">
                {heuristicScore}/{heuristicTotal}{" "}
                <span style={{ fontSize: "var(--fs-md)", fontWeight: 500, color: "var(--ink-2)" }}>
                  ({heuristicPct}%)
                </span>
              </div>
              <div className="readout-sub">
                Random guessing baseline: <strong>{chancePct}%</strong>. Heuristic edge:{" "}
                <strong>
                  {heuristicPct - chancePct >= 0 ? `+${heuristicPct - chancePct}` : heuristicPct - chancePct} pts
                </strong>
                .
              </div>
            </>
          ) : (
            <>
              <div className="readout-num" style={{ fontSize: "var(--fs-lg)", color: "var(--ink-3)" }}>
                Unkeyed
              </div>
              <div className="readout-sub">
                Add an answer key to measure whether the cues actually work.
                {onReviewFlagged && (
                  <button
                    type="button"
                    className="btn-link"
                    style={{ display: "block", marginTop: "4px", fontSize: "var(--fs-sm)" }}
                    onClick={onReviewFlagged}
                  >
                    Return to Step 2 to assign keys →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Verdict Stamp: Plain text label with 4px colored left border */}
      <div className={`verdict-box ${verdictClass}`}>
        <div className="verdict-title">{result.verdictStamp || "Audit Verdict"}</div>
        <div className="verdict-desc">{result.verdictDescription}</div>
      </div>

      {/* Teacher Advice: Simple bulleted "What to change" section */}
      <div className="advice-box">
        <h3 style={{ fontSize: "var(--fs-base)", marginBottom: "var(--s1)", fontWeight: 600 }}>
          What to change
        </h3>
        <ul className="advice-list">
          {result.teacherAdvice && result.teacherAdvice.length > 0 ? (
            result.teacherAdvice.map((advice, idx) => <li key={idx}>{advice}</li>)
          ) : (
            <li>No major structural flaws detected. The question wording resists blind guessing.</li>
          )}
        </ul>
      </div>

      {/* Could not be analyzed section (Uncertain structure) */}
      {uncertainQuestions.length > 0 && (
        <div className="callout callout-warning">
          <div>
            <strong style={{ display: "block", marginBottom: "2px" }}>
              Could not be analyzed ({uncertainQuestions.length})
            </strong>
            <span style={{ fontSize: "var(--fs-sm)" }}>
              {uncertainQuestions.length} item(s) had irregular structure or missing choices and were excluded from headline percentages. Ensure questions have clear numbers (e.g. <code>1.</code>) and distinct choices.
            </span>
          </div>
        </div>
      )}

      {/* Question Table & Risk Filter Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "var(--s2)", marginTop: "var(--s2)" }}>
        <h3 style={{ fontSize: "var(--fs-base)", fontWeight: 600 }}>
          Item evaluation ({filteredQuestions.length})
        </h3>

        {/* Risk Filter Segmented Control */}
        <div className="segmented-control" role="tablist" aria-label="Risk filter">
          <button
            type="button"
            role="tab"
            aria-selected={riskFilter === "all"}
            className={`segmented-btn ${riskFilter === "all" ? "active" : ""}`}
            onClick={() => setRiskFilter("all")}
          >
            All ({analyzedQuestions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={riskFilter === "high"}
            className={`segmented-btn ${riskFilter === "high" ? "active" : ""}`}
            onClick={() => setRiskFilter("high")}
          >
            High ({highRiskCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={riskFilter === "medium"}
            className={`segmented-btn ${riskFilter === "medium" ? "active" : ""}`}
            onClick={() => setRiskFilter("medium")}
          >
            Medium ({mediumRiskCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={riskFilter === "low"}
            className={`segmented-btn ${riskFilter === "low" ? "active" : ""}`}
            onClick={() => setRiskFilter("low")}
          >
            Low ({lowRiskCount})
          </button>
        </div>
      </div>

      {/* Question List Clean Table */}
      <div className="table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th style={{ width: "48px" }}>#</th>
              <th>Question</th>
              <th style={{ width: "80px" }}>Type</th>
              <th style={{ width: "90px" }}>Predicted</th>
              <th style={{ width: "90px" }}>Confidence</th>
              <th style={{ width: "100px" }}>Risk</th>
              <th style={{ width: "90px" }}>Key match</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q) => {
              const isExpanded = expandedId === q.id;
              const truncatedStem =
                q.questionText.length > 70 ? `${q.questionText.slice(0, 70)}…` : q.questionText;

              return (
                <React.Fragment key={q.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="mono-num" style={{ fontWeight: 600 }}>
                      #{q.number || q.index}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{truncatedStem}</span>
                        {isExpanded ? <ChevronUp size={14} color="var(--ink-3)" /> : <ChevronDown size={14} color="var(--ink-3)" />}
                      </div>
                    </td>
                    <td className="mono-num" style={{ fontSize: "13px" }}>
                      {q.type.toUpperCase()}
                    </td>
                    <td className="mono-num" style={{ fontWeight: 600 }}>
                      {q.prediction}
                    </td>
                    <td className="mono-num">
                      {q.confidence}%
                    </td>
                    <td>
                      <span className={`risk-indicator risk-${q.vulnerability}`}>
                        <span className="risk-dot" />
                        <span>{q.vulnerability === "high" ? "High" : q.vulnerability === "medium" ? "Medium" : "Low"}</span>
                      </span>
                    </td>
                    <td>
                      {q.evaluationStatus === "correct" ? (
                        <span style={{ color: "var(--ok)", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600 }}>
                          <Check size={14} strokeWidth={2.5} /> Correct
                        </span>
                      ) : q.evaluationStatus === "incorrect" ? (
                        <span style={{ color: "var(--risk)", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600 }}>
                          <X size={14} strokeWidth={2.5} /> Wrong
                        </span>
                      ) : (
                        <span style={{ color: "var(--ink-3)", fontSize: "13px" }}>—</span>
                      )}
                    </td>
                  </tr>

                  {/* Expandable Row with Marker's Notes and Choices */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ backgroundColor: "var(--surface)", padding: "var(--s3)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                          <div>
                            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", fontWeight: 600 }}>
                              Full question stem
                            </span>
                            <p style={{ marginTop: "4px", fontSize: "var(--fs-base)", color: "var(--ink)", fontWeight: 500 }}>
                              {q.questionText}
                            </p>
                          </div>

                          {/* Choices & Option Scores */}
                          {q.type === "mcq" && (
                            <div>
                              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", fontWeight: 600, display: "block", marginBottom: "var(--s1)" }}>
                                Option scores &amp; prediction
                              </span>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {q.choices.map((choice, cIdx) => {
                                  const letter = String.fromCharCode(65 + cIdx);
                                  const isPred = letter === q.prediction;
                                  const isOfficial = q.officialAnswer?.toUpperCase() === letter;
                                  const score = q.scores[letter] ?? 0;

                                  return (
                                    <div
                                      key={letter}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 12px",
                                        backgroundColor: "var(--bg)",
                                        border: isPred ? "2px solid var(--accent)" : "1px solid var(--border)",
                                        borderRadius: "var(--radius)",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
                                        <span className="mono-num" style={{ fontWeight: 700, width: "24px" }}>
                                          {letter})
                                        </span>
                                        <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink)" }}>
                                          {choice}
                                        </span>
                                      </div>

                                      <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)" }}>
                                        <span
                                          className={`badge-delta ${score > 0 ? "pos" : score < 0 ? "neg" : "zero"}`}
                                        >
                                          {score > 0 ? `+${score}` : score} pts
                                        </span>
                                        {isPred && (
                                          <span className="badge-delta" style={{ backgroundColor: "var(--accent)", color: "var(--accent-ink)" }}>
                                            Predicted
                                          </span>
                                        )}
                                        {isOfficial && (
                                          <span className="badge-delta pos">
                                            Official key
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {q.type === "tf" && (
                            <div>
                              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", fontWeight: 600, display: "block", marginBottom: "var(--s1)" }}>
                                Option scores
                              </span>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s2)" }}>
                                <div
                                  style={{
                                    padding: "8px 12px",
                                    backgroundColor: "var(--bg)",
                                    border: q.prediction === "True" ? "2px solid var(--accent)" : "1px solid var(--border)",
                                    borderRadius: "var(--radius)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <span>True</span>
                                  <span className="mono-num" style={{ fontWeight: 600 }}>{q.scores["True"] ?? 0} pts</span>
                                </div>
                                <div
                                  style={{
                                    padding: "8px 12px",
                                    backgroundColor: "var(--bg)",
                                    border: q.prediction === "False" ? "2px solid var(--accent)" : "1px solid var(--border)",
                                    borderRadius: "var(--radius)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <span>False</span>
                                  <span className="mono-num" style={{ fontWeight: 600 }}>{q.scores["False"] ?? 0} pts</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Marker's notes */}
                          <div>
                            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", fontWeight: 600, display: "block", marginBottom: "var(--s1)" }}>
                              Marker's notes ({q.reasons.length})
                            </span>
                            {q.reasons.length > 0 ? (
                              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                                {q.reasons.map((r, rIdx) => (
                                  <li key={rIdx} style={{ fontSize: "var(--fs-sm)", display: "flex", alignItems: "flex-start", gap: "var(--s1)" }}>
                                    <span className={`badge-delta ${r.delta > 0 ? "pos" : r.delta < 0 ? "neg" : "zero"}`} style={{ flexShrink: 0 }}>
                                      {r.delta > 0 ? `+${r.delta}` : r.delta}
                                    </span>
                                    <span>
                                      <strong>{r.name || r.rule}</strong>: {r.message}
                                      {r.evidence && (
                                        <span style={{ color: "var(--ink-3)", marginLeft: "4px" }}>
                                          (evidence: <code>{r.evidence}</code>)
                                        </span>
                                      )}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>
                                No specific writing cues detected.
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
