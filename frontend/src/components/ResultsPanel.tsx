import React from "react";
import type { AnalyzeResult } from "../services/analyzer";

type Props = {
  result: AnalyzeResult | null;
  error: string | null;
  isLoading: boolean;
};

export function ResultsPanel({ result, error, isLoading }: Props) {
  return (
    <div className="panel" aria-live="polite" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
        <h2 style={{ fontSize: "var(--fs-md)", fontWeight: 600, margin: "0 0 4px" }}>
          Analysis telemetry
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0 }}>
          Deterministic score breakdown and rule audit trail.
        </p>
      </div>

      {isLoading && (
        <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--ink-2)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)" }}>
            Analyzing question structure...
          </p>
        </div>
      )}

      {!isLoading && error && (
        <div style={{ padding: "16px", backgroundColor: "var(--risk-bg)", border: "1px solid var(--risk-border)", borderRadius: "var(--radius)", color: "var(--risk)" }}>
          <strong style={{ display: "block", fontSize: "var(--fs-sm)", marginBottom: "4px" }}>
            Parsing or analysis error
          </strong>
          <span style={{ fontSize: "var(--fs-sm)" }}>{error}</span>
        </div>
      )}

      {!isLoading && !error && !result && (
        <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--ink-3)" }}>
          <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", marginBottom: "8px" }}>
            No question analyzed yet
          </p>
          <p style={{ fontSize: "var(--fs-sm)", maxWidth: "340px", margin: "0 auto" }}>
            Paste a question on the left and click <strong>Simulate blind guess</strong> to inspect rule weights and cues.
          </p>
        </div>
      )}

      {!isLoading && !error && result && (
        <div>
          {/* Prediction Banner */}
          <div style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "20px" }}>
            <span className="section-eyebrow" style={{ marginBottom: "4px" }}>Algorithm prediction</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: "var(--ink)" }}>
                {result.type === "mcq" ? (
                  <>
                    Option {result.prediction}{" "}
                    <span style={{ fontSize: "var(--fs-base)", fontWeight: 400, color: "var(--ink-2)" }}>
                      ({result.predictedText})
                    </span>
                  </>
                ) : (
                  <span>{result.prediction}</span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {result.isTied && (
                  <span className="badge-delta zero" style={{ fontSize: "12px" }}>
                    Seeded tie-break ({result.tiedOptions.join(", ")})
                  </span>
                )}
                <span className="mono-num" style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                  Confidence: {result.confidence}%
                </span>
              </div>
            </div>
          </div>

          {/* Option Scores Table */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Option scores
            </h3>
            <div className="table-container">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Option</th>
                    <th>Text</th>
                    <th style={{ width: "90px", textAlign: "end" }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {result.type === "mcq" ? (
                    result.parsed.choices.map((choice, index) => {
                      const label = String.fromCharCode(65 + index);
                      const score = result.scores[label] ?? 0;
                      const isPredicted = label === result.prediction;
                      return (
                        <tr key={label} style={isPredicted ? { backgroundColor: "var(--surface)" } : {}}>
                          <td style={{ fontWeight: 600 }}>{label}</td>
                          <td style={{ color: isPredicted ? "var(--ink)" : "var(--ink-2)" }}>{choice}</td>
                          <td style={{ textAlign: "end" }}>
                            <span className="mono-num" style={{ fontWeight: 600 }}>
                              {score > 0 ? `+${score}` : score}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <>
                      <tr style={result.prediction === "True" ? { backgroundColor: "var(--surface)" } : {}}>
                        <td style={{ fontWeight: 600 }}>True</td>
                        <td style={{ color: "var(--ink-2)" }}>Statement is true</td>
                        <td style={{ textAlign: "end" }}>
                          <span className="mono-num" style={{ fontWeight: 600 }}>
                            {result.trueScore}
                          </span>
                        </td>
                      </tr>
                      <tr style={result.prediction === "False" ? { backgroundColor: "var(--surface)" } : {}}>
                        <td style={{ fontWeight: 600 }}>False</td>
                        <td style={{ color: "var(--ink-2)" }}>Statement is false</td>
                        <td style={{ textAlign: "end" }}>
                          <span className="mono-num" style={{ fontWeight: 600 }}>
                            {result.falseScore}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Marker's Notes / Detected Cues */}
          <div>
            <h3 style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Marker's notes ({result.reasons.length} cues detected)
            </h3>
            {result.reasons.length === 0 ? (
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>
                No explicit writing cues detected. This question is balanced and neutral.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {result.reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>
                          {reason.name || reason.rule}
                        </span>
                        {reason.target && (
                          <span className="mono-num" style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                            Target: {reason.target}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0 }}>
                        {reason.message}
                      </p>
                      {reason.evidence && (
                        <div style={{ fontSize: "12px", color: "var(--ink-3)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                          Evidence: {reason.evidence}
                        </div>
                      )}
                    </div>

                    <span
                      className={`badge-delta ${
                        reason.delta > 0 ? "pos" : reason.delta < 0 ? "neg" : "zero"
                      }`}
                    >
                      {reason.delta > 0 ? `+${reason.delta}` : reason.delta}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
