import React from "react";
import { AlertCircle, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { HabeedMark } from "./HabeedLogo";

type Props = {
  error: string | null;
  onRetry: () => void;
  onReturnToReview: () => void;
};

export function Page3Loading({ error, onRetry, onReturnToReview }: Props) {
  return (
    <div className="simulation-screen">
      <div className="simulation-card">
        {!error ? (
          <div>
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative" }}>
                <HabeedMark size={72} />
              </div>
            </div>

            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--ink-primary)", marginBottom: "8px" }}>
              Simulating Blind Guessing
            </h2>

            <p style={{ color: "var(--ink-secondary)", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: "460px", margin: "0 auto 24px" }}>
              EL-HABEED is evaluating option length differentials, hedging qualifiers, and absolute terms without subject-matter knowledge.
            </p>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-subtle)", padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
              <Loader2 size={14} className="spinner-icon" color="var(--blaze-orange)" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-secondary)" }}>
                Deterministic Heuristics Engine • Seed #42
              </span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--blaze-orange)", marginBottom: "8px" }}>
              <AlertCircle size={20} />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Simulation Failed</h3>
            </div>

            <p style={{ color: "var(--ink-secondary)", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "20px" }}>
              {error}
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-primary btn-sm" type="button" onClick={onRetry}>
                <RefreshCw size={14} />
                <span>Retry Simulation</span>
              </button>
              <button className="btn btn-secondary btn-sm" type="button" onClick={onReturnToReview}>
                <ArrowLeft size={14} />
                <span>Return to Review</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
