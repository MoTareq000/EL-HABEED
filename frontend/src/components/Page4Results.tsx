import React, { useState } from "react";
import {
  Download,
  Share2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
} from "lucide-react";
import type { ExamAuditResponse } from "../services/analyzer";

type Props = {
  result: ExamAuditResponse;
  onAnalyzeAnother: () => void;
  onReviewFlagged?: () => void;
};

export function Page4Results({ result, onAnalyzeAnother, onReviewFlagged }: Props) {
  const [filterMode, setFilterMode] = useState<"all" | "correct" | "incorrect" | "cues" | "tied">("all");
  const [isPointingSystemOpen, setIsPointingSystemOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Filter questions
  const filteredQuestions = result.questions.filter((q) => {
    if (filterMode === "all") return true;
    if (filterMode === "correct") return q.isCorrect === true;
    if (filterMode === "incorrect") return q.isCorrect === false;
    if (filterMode === "cues") return q.hasCues;
    if (filterMode === "tied") return q.isTied;
    return true;
  });

  // #1 Main problem detection
  const topPattern = result.frequentPatterns.length > 0 ? result.frequentPatterns[0] : null;

  function handleDownloadReport() {
    const lines = [
      `# EL-HABEED Exam Audit & Blind-Guessing Simulation Report`,
      `**Filename:** ${result.filename}`,
      `**Verdict:** ${result.verdictStamp}`,
      `**Description:** ${result.verdictDescription}`,
      `**Algorithm Grade / Accuracy:** ${result.accuracy !== null ? `${result.accuracy}% (${result.correctPredictions}/${result.evaluatedQuestions} verified answers)` : "N/A (No answer key provided)"}`,
      `**Vulnerability Index:** ${result.guessabilityScore}%`,
      `**Expected Random Guessing Baseline:** ${result.expectedRandomBaseline}%`,
      `**Heuristic Edge Over Random Chance:** ${typeof result.accuracyDiffPercentagePoints === "number" ? `+${result.accuracyDiffPercentagePoints} percentage points` : "N/A"}`,
      `**Primary Exam Flaw:** ${topPattern ? `${topPattern.name} — ${topPattern.count} questions (${topPattern.percentage}%)` : "No major structural flaw detected"}`,
      `**Questions with Cues:** ${result.cuesDetectedCount} of ${result.totalQuestions} (${result.cuesDetectedPercentage}%)`,
      `**Tied Predictions:** ${result.tiedPredictionsCount}`,
      `**Reproducible Random Seed:** ${result.seed}`,
      ``,
      `## Detailed Question Audit`,
      ...result.questions.map((q) => {
        return [
          `### Question ${q.number || q.index} [${q.type.toUpperCase()}]`,
          `**Stem:** ${q.questionText}`,
          q.type === "mcq" ? `**Choices:**\n${q.choices.map((c, i) => `  ${String.fromCharCode(65 + i)}) ${c}`).join("\n")}` : "",
          `**Algorithm Prediction:** ${q.prediction} (${q.confidence}% heuristic confidence)`,
          q.isTied ? `*Tie status:* Tied top score among options [${q.tiedOptions.join(", ")}]. Chosen via seeded random roll.` : `*Tie status:* Unique maximum score.`,
          `**Official Answer:** ${q.officialAnswer || "Unverified"}`,
          `**Evaluation Status:** ${q.evaluationStatus}`,
          `**Point Score per Option:**`,
          ...Object.entries(q.scores).map(([lbl, sc]) => `  - Option ${lbl}: ${sc >= 0 ? `+${sc}` : sc} pts`),
          `**Rules Triggered:**`,
          ...q.reasons.map((r) => `  - [${r.delta >= 0 ? `+${r.delta}` : r.delta} pts] ${r.name || r.rule}${r.target ? ` (${r.target})` : ""}: ${r.message} (${r.evidence || ""})`),
          ``,
        ].filter(Boolean).join("\n");
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

  // Friendly pattern flaw explanation
  function getPatternFriendlySummary(pat: typeof topPattern) {
    if (!pat) {
      return {
        title: "No Major Structural Flaw Detected",
        subtitle: "Options and question stems have balanced length, neutral wording, and resist blind guessing.",
        isClean: true,
      };
    }

    const ruleId = pat.ruleId.toLowerCase();
    const pct = Math.round(pat.percentage);

    if (ruleId.includes("longest")) {
      return {
        title: `${pct}% of questions leaked by Longest Answer`,
        subtitle: `In ${pat.count} of ${result.totalQuestions} questions, the correct choice is significantly longer and more detailed than the distractors.`,
        isClean: false,
      };
    }
    if (ruleId.includes("absolute")) {
      return {
        title: `${pct}% of questions contain Absolute Words ('always', 'never', 'only')`,
        subtitle: `In ${pat.count} questions, rigid words make distractors obvious and easily eliminated without subject knowledge.`,
        isClean: false,
      };
    }
    if (ruleId.includes("moderate") || ruleId.includes("qualifier")) {
      return {
        title: `${pct}% of questions use Hedging Qualifiers ('usually', 'often', 'can')`,
        subtitle: `Educators hedge correct answers with nuance, giving away the answer to test-wise guessers.`,
        isClean: false,
      };
    }
    if (ruleId.includes("grammar")) {
      return {
        title: `${pct}% of questions have Grammar Agreement Leaks`,
        subtitle: `Question stems ending in 'a/an' or singular/plural cues rule out incompatible distractors.`,
        isClean: false,
      };
    }
    if (ruleId.includes("keyword")) {
      return {
        title: `${pct}% of questions echo Stem Keywords in the choice`,
        subtitle: `Vocabulary from the question stem is directly repeated inside the answer choice.`,
        isClean: false,
      };
    }

    return {
      title: `${pct}% of questions affected by ${pat.name}`,
      subtitle: pat.description,
      isClean: false,
    };
  }

  const mainFlaw = getPatternFriendlySummary(topPattern);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header & Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
            Exam Forensic Vulnerability Report
          </h2>
          <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
            Exam: <strong>{result.filename}</strong> • Evaluated strictly without AI or subject knowledge
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" type="button" onClick={handleDownloadReport}>
            <Download size={14} />
            <span>Download Report (.md)</span>
          </button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={handleExportJson}>
            <Share2 size={14} />
            <span>Export JSON</span>
          </button>
          <button className="btn btn-dark btn-sm" type="button" onClick={onAnalyzeAnother}>
            <RefreshCw size={14} />
            <span>Audit Another Exam</span>
          </button>
        </div>
      </div>

      {/* The 3 Core Takeaways (Zero Clutter Grid) */}
      <div className="metric-triad">
        {/* Card 1: Algorithm Grade / Score */}
        <div className="metric-card">
          <div>
            <div className="metric-card-label">Algorithm Blind Guess Score</div>
            <div className="metric-card-num" style={{ color: typeof result.accuracy === "number" && result.accuracy >= 50 ? "var(--blaze-orange)" : "var(--color-success)" }}>
              {typeof result.accuracy === "number" ? `${result.accuracy}%` : "N/A"}
            </div>
          </div>
          <div className="metric-card-sub">
            {typeof result.accuracy === "number" ? (
              <>
                <strong>{result.correctPredictions} of {result.evaluatedQuestions}</strong> correct answers guessed purely by surface cues.
                <div style={{ marginTop: "4px", color: "var(--ink-tertiary)" }}>
                  Random chance is {result.expectedRandomBaseline}%. Edge: <strong>+{result.accuracyDiffPercentagePoints} pts</strong>
                </div>
              </>
            ) : (
              "No answer key provided. Accuracy could not be calculated."
            )}
          </div>
        </div>

        {/* Card 2: Vulnerability Index */}
        <div className="metric-card">
          <div>
            <div className="metric-card-label">Vulnerability Index</div>
            <div className="metric-card-num" style={{ color: result.guessabilityScore >= 60 ? "var(--blaze-orange)" : "var(--color-success)" }}>
              {result.guessabilityScore}%
            </div>
          </div>
          <div className="metric-card-sub">
            <span className={`pill ${result.guessabilityScore >= 60 ? "pill-orange" : "pill-lime"}`} style={{ marginBottom: "4px", display: "inline-block" }}>
              {result.verdictStamp}
            </span>
            <div>
              <strong>{result.cuesDetectedPercentage}% of questions</strong> contain detectable formatting giveaways.
            </div>
          </div>
        </div>

        {/* Card 3: The Main Problem in the Exam (Hero Callout) */}
        <div className={`metric-card ${mainFlaw.isClean ? "clean-problem" : "hero-problem"}`}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              {mainFlaw.isClean ? <CheckCircle2 size={16} color="var(--color-success)" /> : <AlertTriangle size={16} color="var(--blaze-orange)" />}
              <span className="metric-card-label" style={{ color: mainFlaw.isClean ? "var(--color-success)" : "var(--blaze-orange)", margin: 0 }}>
                #1 Main Problem in Exam
              </span>
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink-primary)", lineHeight: 1.3, marginTop: "4px" }}>
              {mainFlaw.title}
            </div>
          </div>
          <div className="metric-card-sub" style={{ color: "var(--ink-secondary)", fontSize: "0.85rem" }}>
            {mainFlaw.subtitle}
          </div>
        </div>
      </div>

      {/* Pointing System Ribbon */}
      <div className="pointing-system-bar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} color="var(--blaze-orange)" />
            <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--ink-primary)" }}>
              How the Algorithm Assigns Points (Pointing System)
            </span>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsPointingSystemOpen(!isPointingSystemOpen)}
            style={{ fontSize: "0.78rem", color: "var(--ink-secondary)" }}
          >
            <span>{isPointingSystemOpen ? "Hide Rules" : "Show Point Rules"}</span>
            {isPointingSystemOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {isPointingSystemOpen && (
          <div className="pointing-rules-grid">
            <div className="pointing-rule-item">
              <span className="option-point-chip pos">+3 pts</span>
              <span><strong>Longest Answer:</strong> Choice strictly longer than all peers</span>
            </div>
            <div className="pointing-rule-item">
              <span className="option-point-chip pos">+3 pts</span>
              <span><strong>Hedging Qualifiers:</strong> <em>usually, often, typically, can, may</em></span>
            </div>
            <div className="pointing-rule-item">
              <span className="option-point-chip pos">+3 pts</span>
              <span><strong>Grammar Match:</strong> Stem article (<em>a</em> vs <em>an</em>) agreement</span>
            </div>
            <div className="pointing-rule-item">
              <span className="option-point-chip pos">+2 pts</span>
              <span><strong>Stem Keyword Echo:</strong> Key question words repeated in choice</span>
            </div>
            <div className="pointing-rule-item">
              <span className="option-point-chip neg">-4 pts</span>
              <span><strong>Absolute Words:</strong> <em>always, never, all, none, only, must</em></span>
            </div>
            <div className="pointing-rule-item">
              <span className="option-point-chip neg">-2 pts</span>
              <span><strong>Extreme Value:</strong> Isolated numerical outlier</span>
            </div>
          </div>
        )}
      </div>

      {/* Questions Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--ink-primary)" }}>
          Detailed Questions &amp; Option Points ({filteredQuestions.length})
        </h3>

        <div className="segmented-pills" role="tablist" aria-label="Question filters">
          <button
            type="button"
            className={`segmented-pill ${filterMode === "all" ? "active" : ""}`}
            onClick={() => setFilterMode("all")}
          >
            All ({result.questions.length})
          </button>
          {result.evaluatedQuestions > 0 && (
            <>
              <button
                type="button"
                className={`segmented-pill ${filterMode === "correct" ? "active" : ""}`}
                onClick={() => setFilterMode("correct")}
              >
                Guessed Correctly ({result.correctPredictions})
              </button>
              <button
                type="button"
                className={`segmented-pill ${filterMode === "incorrect" ? "active" : ""}`}
                onClick={() => setFilterMode("incorrect")}
              >
                Guessed Incorrectly ({result.incorrectPredictions})
              </button>
            </>
          )}
          <button
            type="button"
            className={`segmented-pill ${filterMode === "cues" ? "active" : ""}`}
            onClick={() => setFilterMode("cues")}
          >
            Has Cues ({result.cuesDetectedCount})
          </button>
          {result.tiedPredictionsCount > 0 && (
            <button
              type="button"
              className={`segmented-pill ${filterMode === "tied" ? "active" : ""}`}
              onClick={() => setFilterMode("tied")}
            >
              Tied Top Score ({result.tiedPredictionsCount})
            </button>
          )}
        </div>
      </div>

      {/* Detailed Question Cards with Clear Point Breakdowns */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {filteredQuestions.map((q) => {
          const isExpanded = expandedIndex === q.index;

          return (
            <div
              key={q.id || q.index}
              className={`audit-item-card risk-${q.vulnerability}`}
            >
              {/* Question Header */}
              <div className="audit-item-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="pill pill-dark">
                    Question #{q.number || q.index}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--ink-secondary)" }}>
                    [{q.type === "mcq" ? "MCQ" : "True/False"}]
                  </span>
                  {q.sourcePage && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--ink-tertiary)" }}>
                      Page {q.sourcePage}
                    </span>
                  )}
                  <span className={q.vulnerability === "high" ? "pill pill-orange" : q.vulnerability === "medium" ? "pill pill-neutral" : "pill pill-lime"}>
                    {q.vulnerability === "high" ? "High Vulnerability" : q.vulnerability === "medium" ? "Moderate Cue" : "Balanced"}
                  </span>
                </div>

                <div>
                  {q.evaluationStatus === "correct" && (
                    <span className="pill pill-lime">
                      <CheckCircle2 size={12} />
                      Algorithm Guessed Correctly
                    </span>
                  )}
                  {q.evaluationStatus === "incorrect" && (
                    <span className="pill pill-orange">
                      <XCircle size={12} />
                      Algorithm Guessed Wrong
                    </span>
                  )}
                  {q.evaluationStatus === "unverified" && (
                    <span className="pill pill-neutral">
                      No Official Key Provided
                    </span>
                  )}
                </div>
              </div>

              {/* Question Body */}
              <div className="audit-item-body">
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ink-primary)", lineHeight: 1.5, marginBottom: "14px" }}>
                  {q.questionText}
                </div>

                {/* Controlled Tie Notice */}
                {q.isTied && (
                  <div className="callout callout-warning" style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.82rem" }}>
                      <strong>Seeded Tie-Breaker:</strong> Options [{q.tiedOptions.join(", ")}] shared the identical top score. Answer <strong>{q.prediction}</strong> was picked via controlled random roll (Seed #{q.seed}).
                    </span>
                  </div>
                )}

                {/* Primary Flaw Alert if any */}
                {q.primaryFlaw && (
                  <div style={{ fontSize: "0.84rem", color: q.vulnerability === "high" ? "var(--blaze-orange)" : "var(--ink-secondary)", marginBottom: "10px" }}>
                    <strong>Detected Cue:</strong> {q.primaryFlaw} — {q.flawDetail}
                  </div>
                )}

                {/* Option Point Breakdown (MCQ) */}
                {q.type === "mcq" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {q.choices.map((choice, cIdx) => {
                      const label = String.fromCharCode(65 + cIdx);
                      const isPred = label === q.prediction;
                      const isKey = q.officialAnswer?.toUpperCase() === label;
                      const score = q.scores[label] ?? 0;

                      // Reasons specifically targeting this option
                      const optionReasons = q.reasons.filter((r) => r.target === label);

                      return (
                        <div
                          key={label}
                          style={{
                            border: isPred ? "1.5px solid var(--blaze-orange)" : "1px solid var(--border-light)",
                            backgroundColor: isPred ? "rgba(255, 90, 0, 0.04)" : "var(--bg-surface)",
                            borderRadius: "var(--radius-sm)",
                            padding: "10px 12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                              <span
                                className={`key-bubble ${isPred ? "selected" : ""}`}
                                style={{ width: "26px", height: "26px", fontSize: "0.78rem", flexShrink: 0 }}
                              >
                                {label}
                              </span>
                              <span style={{ fontSize: "0.9rem", color: "var(--ink-primary)", fontWeight: isPred ? 600 : 400 }}>
                                {choice}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                              {/* Total Points Badge */}
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "0.85rem",
                                  fontWeight: 700,
                                  color: score > 0 ? "var(--color-success)" : score < 0 ? "var(--blaze-orange)" : "var(--ink-tertiary)",
                                  minWidth: "48px",
                                  textAlign: "right",
                                }}
                              >
                                {score > 0 ? `+${score} pts` : score < 0 ? `${score} pts` : "0 pts"}
                              </span>

                              {isPred && (
                                <span className="pill pill-orange">
                                  Algorithm Guess
                                </span>
                              )}
                              {isKey && (
                                <span className="pill pill-lime">
                                  Official Key
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Specific Point Reasons for this option */}
                          {optionReasons.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px", paddingLeft: "36px" }}>
                              {optionReasons.map((r, rIdx) => (
                                <span
                                  key={rIdx}
                                  className={`option-point-chip ${r.delta >= 0 ? "pos" : "neg"}`}
                                  title={r.message}
                                >
                                  {r.delta >= 0 ? `+${r.delta}` : r.delta} pts: {r.name || r.rule}
                                  {r.evidence ? ` (${r.evidence})` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Option Point Breakdown (True / False) */}
                {q.type === "tf" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                    {/* True Card */}
                    <div
                      style={{
                        border: q.prediction === "True" ? "1.5px solid var(--blaze-orange)" : "1px solid var(--border-light)",
                        backgroundColor: q.prediction === "True" ? "rgba(255, 90, 0, 0.04)" : "var(--bg-subtle)",
                        borderRadius: "var(--radius-sm)",
                        padding: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.95rem" }}>True</strong>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.9rem" }}>
                          {q.scores["True"] ?? 0} pts
                        </span>
                      </div>
                      {q.prediction === "True" && (
                        <div style={{ marginTop: "4px" }}>
                          <span className="pill pill-orange">Algorithm Guess</span>
                        </div>
                      )}
                    </div>

                    {/* False Card */}
                    <div
                      style={{
                        border: q.prediction === "False" ? "1.5px solid var(--blaze-orange)" : "1px solid var(--border-light)",
                        backgroundColor: q.prediction === "False" ? "rgba(255, 90, 0, 0.04)" : "var(--bg-subtle)",
                        borderRadius: "var(--radius-sm)",
                        padding: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.95rem" }}>False</strong>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.9rem" }}>
                          {q.scores["False"] ?? 0} pts
                        </span>
                      </div>
                      {q.prediction === "False" && (
                        <div style={{ marginTop: "4px" }}>
                          <span className="pill pill-orange">Algorithm Guess</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
