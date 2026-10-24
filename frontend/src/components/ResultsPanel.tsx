import type { AnalyzeResult } from "../services/analyzer";
import { HabeedMark } from "./HabeedLogo";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
  result: AnalyzeResult | null;
  error: string | null;
  isLoading: boolean;
};

export function ResultsPanel({ result, error, isLoading }: Props) {
  return (
    <div className="card" aria-live="polite">
      <div className="card-header">
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
            Forensic Telemetry
          </h2>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-secondary)" }}>
            Deterministic score breakdown and rule audit trail
          </span>
        </div>
      </div>

      <div className="card-body">
        {isLoading && (
          <div role="status" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 12px", gap: "16px" }}>
            <HabeedMark size={56} />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
              AUDITING STRUCTURAL CUES...
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="callout callout-warning" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", fontSize: "0.85rem" }}>Parsing or Analysis Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {!isLoading && !error && !result && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 16px", gap: "14px" }}>
            <div style={{ opacity: 0.6 }}>
              <HabeedMark size={48} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px" }}>
                Ready to Audit
              </h3>
              <p style={{ color: "var(--ink-secondary)", fontSize: "0.86rem", maxWidth: "340px", margin: 0, lineHeight: 1.5 }}>
                Paste a question on the left and click <strong>Simulate Blind Guess</strong> to view option score weights and rule triggers.
              </p>
            </div>
          </div>
        )}

        {/* MCQ Results */}
        {!isLoading && !error && result && result.type === "mcq" && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingBottom: "14px", borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", textTransform: "uppercase", color: "var(--ink-tertiary)", display: "block" }}>
                  Predicted Answer
                </span>
                <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                  <span style={{ color: "var(--blaze-orange)", marginRight: "6px" }}>{result.prediction}.</span>
                  <span>{result.predictedText}</span>
                </div>
              </div>

              <span className="pill pill-lime">
                <CheckCircle2 size={12} />
                {result.confidence}% Confidence
              </span>
            </div>

            {result.parsed.question && (
              <div style={{ margin: "12px 0", fontSize: "0.9rem", color: "var(--ink-secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                "{result.parsed.question}"
              </div>
            )}

            {/* Option Breakdown Table */}
            <div style={{ margin: "16px 0" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", textTransform: "uppercase", color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                Option Heuristic Scores
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {result.parsed.choices.map((choice, index) => {
                  const label = String.fromCharCode(65 + index);
                  const isWinner = label === result.prediction;
                  const score = result.scores[label] ?? 0;
                  const optionReasons = result.reasons.filter((r) => r.target === label);

                  return (
                    <div
                      key={label}
                      style={{
                        border: isWinner ? "1.5px solid var(--blaze-orange)" : "1px solid var(--border-light)",
                        backgroundColor: isWinner ? "rgba(255, 90, 0, 0.04)" : "var(--bg-surface)",
                        borderRadius: "var(--radius-sm)",
                        padding: "8px 12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                          <span className={`key-bubble ${isWinner ? "selected" : ""}`} style={{ width: "24px", height: "24px", fontSize: "0.75rem", flexShrink: 0 }}>
                            {label}
                          </span>
                          <span style={{ fontSize: "0.88rem", fontWeight: isWinner ? 600 : 400 }}>{choice}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.84rem", fontWeight: 700, color: score > 0 ? "var(--color-success)" : score < 0 ? "var(--blaze-orange)" : "var(--ink-tertiary)" }}>
                            {score > 0 ? `+${score} pts` : score < 0 ? `${score} pts` : "0 pts"}
                          </span>
                          {isWinner && <span className="pill pill-orange">Predicted</span>}
                        </div>
                      </div>

                      {optionReasons.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px", paddingLeft: "32px" }}>
                          {optionReasons.map((r, rIdx) => (
                            <span key={rIdx} className={`option-point-chip ${r.delta >= 0 ? "pos" : "neg"}`}>
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
            </div>

            {/* Rule Trail */}
            <div style={{ marginTop: "16px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", textTransform: "uppercase", color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                Triggered Heuristics ({result.reasons.length})
              </span>
              <div className="rules-container">
                {result.reasons.length === 0 ? (
                  <span style={{ fontSize: "0.82rem", color: "var(--ink-tertiary)", fontStyle: "italic" }}>
                    No specific heuristic rules fired.
                  </span>
                ) : (
                  result.reasons.map((rs, idx) => (
                    <div key={`${rs.rule}-${idx}`} className="rule-note">
                      <div>
                        <div>
                          <strong>{rs.name || rs.rule}</strong> {rs.target && `(${rs.target})`}: {rs.message}
                        </div>
                        {rs.evidence && (
                          <div style={{ fontSize: "0.75rem", color: "var(--ink-tertiary)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                            Evidence: {rs.evidence}
                          </div>
                        )}
                      </div>
                      <span className={`delta-tag ${rs.delta >= 0 ? "positive" : "negative"}`}>
                        {rs.delta >= 0 ? `+${rs.delta}` : rs.delta}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TF Results */}
        {!isLoading && !error && result && result.type === "tf" && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingBottom: "14px", borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", textTransform: "uppercase", color: "var(--ink-tertiary)", display: "block" }}>
                  Predicted Disposition
                </span>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: result.prediction === "True" ? "var(--color-success)" : "var(--blaze-orange)", marginTop: "2px" }}>
                  {result.prediction}
                </div>
              </div>

              <span className="pill pill-lime">
                <CheckCircle2 size={12} />
                {result.confidence}% Confidence
              </span>
            </div>

            {result.parsed.statement && (
              <div style={{ margin: "12px 0", fontSize: "0.9rem", color: "var(--ink-secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                "{result.parsed.statement}"
              </div>
            )}

            {/* Score Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "16px 0" }}>
              <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", padding: "12px", background: result.prediction === "True" ? "var(--acid-lime-tint)" : "var(--bg-subtle)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>True Score</span>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700, color: "var(--ink-primary)" }}>
                  {result.trueScore}
                </div>
              </div>

              <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", padding: "12px", background: result.prediction === "False" ? "var(--blaze-orange-tint)" : "var(--bg-subtle)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>False Score</span>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700, color: "var(--ink-primary)" }}>
                  {result.falseScore}
                </div>
              </div>
            </div>

            {/* Rule Trail */}
            <div style={{ marginTop: "16px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", textTransform: "uppercase", color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                Triggered Heuristics ({result.reasons.length})
              </span>
              <div className="rules-container">
                {result.reasons.length === 0 ? (
                  <span style={{ fontSize: "0.82rem", color: "var(--ink-tertiary)", fontStyle: "italic" }}>
                    No specific heuristic rules fired.
                  </span>
                ) : (
                  result.reasons.map((rs, idx) => (
                    <div key={`${rs.rule}-${idx}`} className="rule-note">
                      <div>
                        <div>
                          <strong>{rs.name || rs.rule}</strong> {rs.target && `(${rs.target})`}: {rs.message}
                        </div>
                      </div>
                      <span className={`delta-tag ${rs.delta >= 0 ? "positive" : "negative"}`}>
                        {rs.delta >= 0 ? `+${rs.delta}` : rs.delta}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
