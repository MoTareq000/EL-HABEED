import React from "react";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

type Props = {
  error: string | null;
  onRetry: () => void;
  onReturnToReview: () => void;
};

export function Page3Loading({ error, onRetry, onReturnToReview }: Props) {
  return (
    <div style={{ maxWidth: "560px", margin: "var(--s6) auto", width: "100%" }}>
      {!error ? (
        <div className="panel-white" style={{ padding: "var(--s6) var(--s4)", textAlign: "center" }}>
          <span className="section-eyebrow" style={{ marginBottom: "var(--s2)" }}>Stage 03</span>
          <h2 style={{ fontSize: "var(--fs-lg)", marginBottom: "var(--s2)" }}>
            Simulating blind guesses...
          </h2>
          <p style={{ maxWidth: "45ch", margin: "0 auto var(--s4)", fontSize: "var(--fs-base)" }}>
            Evaluating option length differentials, hedging qualifiers, grammar agreement, and absolute terms without subject knowledge.
          </p>
          <div className="mono-num" style={{ fontSize: "13px", color: "var(--ink-3)", display: "inline-block", padding: "4px 12px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
            Deterministic rule engine · Seed #42
          </div>
        </div>
      ) : (
        <div className="panel-white" style={{ padding: "var(--s4)", borderColor: "var(--risk-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s1)", color: "var(--risk)", marginBottom: "var(--s1)" }}>
            <AlertCircle size={20} />
            <h3 style={{ margin: 0, color: "var(--risk)" }}>Simulation error</h3>
          </div>
          <p style={{ fontSize: "var(--fs-base)", marginBottom: "var(--s3)" }}>
            {error}
          </p>
          <div style={{ display: "flex", gap: "var(--s2)" }}>
            <button className="btn btn-primary" type="button" onClick={onRetry}>
              <RefreshCw size={14} />
              <span>Retry simulation</span>
            </button>
            <button className="btn btn-secondary" type="button" onClick={onReturnToReview}>
              <ArrowLeft size={14} />
              <span>Return to review</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
