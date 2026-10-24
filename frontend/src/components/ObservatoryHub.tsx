import React, { useState } from "react";
import {
  ShieldAlert,
  Sparkles,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  Sliders,
  Scale,
  BrainCircuit,
  Eye,
  Key,
  Flame,
  FileText,
  AlertTriangle,
  Play,
  Check,
} from "lucide-react";
import { sfx } from "../utils/soundEffects";

type Props = {
  onStartExam: () => void;
  onLoadSample: (sampleType: "cs" | "bio" | "law") => void;
  onOpenLab: () => void;
  onOpenSanitizer: () => void;
};

export function ObservatoryHub({
  onStartExam,
  onLoadSample,
  onOpenLab,
  onOpenSanitizer,
}: Props) {
  const [activeFlawDemo, setActiveFlawDemo] = useState<"length" | "absolute" | "inclusive" | "tf">("length");
  const [lengthFactor, setLengthFactor] = useState<number>(3);
  const [absoluteWord, setAbsoluteWord] = useState<"always" | "typically">("always");
  const [hasAllAbove, setHasAllAbove] = useState<boolean>(true);

  return (
    <div className="observatory-container">
      {/* Ambient Radial Mesh Background */}
      <div className="observatory-mesh" aria-hidden="true" />

      {/* Hero Section */}
      <section className="observatory-hero">
        <div className="hero-badge-pill">
          <span className="live-pulse-dot" />
          <span>DETERMINISTIC HEURISTICS ENGINE • ZERO LLM • 100% AUDITABLE</span>
        </div>

        <h1 className="hero-title">
          Can Someone Pass Your Exam <br />
          <span className="hero-gradient-text">Without Knowing The Subject?</span>
        </h1>

        <p className="hero-subtitle">
          <strong>EL-HABEED</strong> (الهَبِّيد) is a deterministic exam auditor and blind-guessing simulator.
          It tests whether question drafting flaws, distractor length biases, and linguistic patterns allow
          blind guessing algorithms to exploit your test.
        </p>

        {/* Primary CTA Cluster */}
        <div className="hero-cta-cluster">
          <button
            type="button"
            className="btn btn-primary btn-hero"
            onClick={() => {
              sfx.playClick();
              onStartExam();
            }}
          >
            <Sparkles size={18} />
            <span>Audit Your Exam (PDF or Text)</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-hero"
            onClick={() => {
              sfx.playClick();
              onLoadSample("cs");
            }}
          >
            <Play size={16} />
            <span>Run CS101 Midterm Demo</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-hero"
            onClick={() => {
              sfx.playClick();
              onOpenLab();
            }}
          >
            <Sliders size={16} />
            <span>Explore 17 Rules Codex</span>
          </button>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div className="hero-metrics-bar">
          <div className="hero-metric-item">
            <span className="metric-val">17</span>
            <span className="metric-desc">Deterministic Rules</span>
          </div>
          <div className="hero-metric-divider" />
          <div className="hero-metric-item">
            <span className="metric-val">0.0%</span>
            <span className="metric-desc">AI Hallucinations</span>
          </div>
          <div className="hero-metric-divider" />
          <div className="hero-metric-item">
            <span className="metric-val">100%</span>
            <span className="metric-desc">Monte Carlo Seeded</span>
          </div>
          <div className="hero-metric-divider" />
          <div className="hero-metric-item">
            <span className="metric-val">No Auth</span>
            <span className="metric-desc">Instant Private Audit</span>
          </div>
        </div>
      </section>

      {/* Interactive Micro-Lab / Flaw Demonstrator */}
      <section className="observatory-section">
        <div className="section-header-compact">
          <div className="section-tag">
            <Flame size={14} color="var(--blaze-orange)" />
            <span>TACTILE EXPERIMENT</span>
          </div>
          <h2 className="section-title">See How Blind Guessers Exploit Exam Writing</h2>
          <p className="section-subtitle">
            Interact with common test-writing habits below and watch the deterministic scoring algorithm shift in real time.
          </p>
        </div>

        {/* Flaw Selector Pills */}
        <div className="segmented-pills flaw-nav" role="tablist">
          <button
            type="button"
            className={`segmented-pill ${activeFlawDemo === "length" ? "active" : ""}`}
            onClick={() => {
              sfx.playClick();
              setActiveFlawDemo("length");
            }}
          >
            1. The "Longest Choice" Giveaway
          </button>
          <button
            type="button"
            className={`segmented-pill ${activeFlawDemo === "absolute" ? "active" : ""}`}
            onClick={() => {
              sfx.playClick();
              setActiveFlawDemo("absolute");
            }}
          >
            2. The "Absolute Word" Penalty
          </button>
          <button
            type="button"
            className={`segmented-pill ${activeFlawDemo === "inclusive" ? "active" : ""}`}
            onClick={() => {
              sfx.playClick();
              setActiveFlawDemo("inclusive");
            }}
          >
            3. "All of the Above" Magnet
          </button>
          <button
            type="button"
            className={`segmented-pill ${activeFlawDemo === "tf" ? "active" : ""}`}
            onClick={() => {
              sfx.playClick();
              setActiveFlawDemo("tf");
            }}
          >
            4. True/False Explanatory Bias
          </button>
        </div>

        {/* Flaw Interactive Card */}
        <div className="flaw-demo-card">
          {activeFlawDemo === "length" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--ink-primary)" }}>
                    Rule: Longest Option Heuristic (+3 Points)
                  </h3>
                  <span style={{ fontSize: "0.84rem", color: "var(--ink-secondary)" }}>
                    Teachers tend to add qualifiers and careful definitions to correct answers, inadvertently making them longer than distractors.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--ink-secondary)" }}>
                    Option C Length:
                  </span>
                  <div className="segmented-pills">
                    {[1, 2, 3, 5].map((factor) => (
                      <button
                        key={factor}
                        type="button"
                        className={`segmented-pill ${lengthFactor === factor ? "active" : ""}`}
                        onClick={() => {
                          sfx.playClick();
                          setLengthFactor(factor);
                        }}
                      >
                        {factor === 1 ? "Equal" : factor === 2 ? "2x" : factor === 3 ? "3x" : "5x"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flaw-options-grid">
                <div className="flaw-option-row">
                  <span className="choice-letter-badge">A</span>
                  <span className="flaw-option-text">A syntax token in compiler parsing</span>
                  <span className="option-point-chip" style={{ color: "var(--ink-tertiary)" }}>0 pts</span>
                </div>
                <div className="flaw-option-row">
                  <span className="choice-letter-badge">B</span>
                  <span className="flaw-option-text">A primitive integer identifier</span>
                  <span className="option-point-chip" style={{ color: "var(--ink-tertiary)" }}>0 pts</span>
                </div>
                <div className={`flaw-option-row ${lengthFactor >= 2 ? "highlight-leaky" : ""}`}>
                  <span className="choice-letter-badge" style={lengthFactor >= 2 ? { background: "var(--color-success)", color: "#FFF" } : {}}>C</span>
                  <span className="flaw-option-text">
                    {lengthFactor === 1 && "A conditional control flow construct"}
                    {lengthFactor === 2 && "A conditional control flow construct that evaluates a boolean condition to determine execution branch"}
                    {lengthFactor === 3 && "A conditional control flow selection construct that evaluates boolean truth states to choose between sequential evaluation branches, preserving runtime integrity"}
                    {lengthFactor === 5 && "A conditional control flow selection construct that rigorously evaluates boolean expressions in order to systematically determine execution paths, guaranteeing complete deterministic branching across all runtime environments"}
                  </span>
                  {lengthFactor >= 2 ? (
                    <span className="option-point-chip pos">+3 pts Longest</span>
                  ) : (
                    <span className="option-point-chip" style={{ color: "var(--ink-tertiary)" }}>0 pts</span>
                  )}
                </div>
                <div className="flaw-option-row">
                  <span className="choice-letter-badge">D</span>
                  <span className="flaw-option-text">A hardware CPU register</span>
                  <span className="option-point-chip" style={{ color: "var(--ink-tertiary)" }}>0 pts</span>
                </div>
              </div>

              <div className="flaw-verdict-banner">
                <Scale size={18} color={lengthFactor >= 2 ? "var(--blaze-orange)" : "var(--color-success)"} />
                <div>
                  <strong>{lengthFactor >= 2 ? "VULNERABILITY DETECTED" : "IMMUNE DRAFT"}</strong>:{" "}
                  {lengthFactor >= 2
                    ? "Option C is significantly longer than peer distractors (+3 pts). A blind guesser picks Option C without knowing computer science."
                    : "Distractors have balanced lengths. The length heuristic fails to isolate an answer."}
                </div>
              </div>
            </div>
          )}

          {activeFlawDemo === "absolute" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--ink-primary)" }}>
                    Rule: Absolute Word Elimination (-4 Points)
                  </h3>
                  <span style={{ fontSize: "0.84rem", color: "var(--ink-secondary)" }}>
                    Options containing rigid universal absolutes ('always', 'never', 'must', 'solely') are almost never correct because real-world exceptions exist.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--ink-secondary)" }}>
                    Distractor Wording:
                  </span>
                  <div className="segmented-pills">
                    <button
                      type="button"
                      className={`segmented-pill ${absoluteWord === "always" ? "active" : ""}`}
                      onClick={() => {
                        sfx.playClick();
                        setAbsoluteWord("always");
                      }}
                    >
                      "always" (Absolute)
                    </button>
                    <button
                      type="button"
                      className={`segmented-pill ${absoluteWord === "typically" ? "active" : ""}`}
                      onClick={() => {
                        sfx.playClick();
                        setAbsoluteWord("typically");
                      }}
                    >
                      "typically" (Moderate)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flaw-options-grid">
                <div className={`flaw-option-row ${absoluteWord === "always" ? "highlight-penalized" : ""}`}>
                  <span className="choice-letter-badge">A</span>
                  <span className="flaw-option-text">
                    Variables declared as integers <strong>{absoluteWord}</strong> require manual allocation by the caller.
                  </span>
                  {absoluteWord === "always" ? (
                    <span className="option-point-chip neg">-4 pts Absolute</span>
                  ) : (
                    <span className="option-point-chip pos">+2 pts Moderate</span>
                  )}
                </div>
                <div className="flaw-option-row">
                  <span className="choice-letter-badge">B</span>
                  <span className="flaw-option-text">Memory blocks are reserved sequentially</span>
                  <span className="option-point-chip" style={{ color: "var(--ink-tertiary)" }}>0 pts</span>
                </div>
              </div>

              <div className="flaw-verdict-banner">
                <ShieldAlert size={18} color="var(--blaze-orange)" />
                <div>
                  {absoluteWord === "always" ? (
                    <span><strong>EASY ELIMINATION</strong>: Test-takers immediately discard Option A due to rigid universal wording, increasing blind guess accuracy on remaining choices from 50% to 100%.</span>
                  ) : (
                    <span><strong>WELL CONSTRUCTED</strong>: Moderate wording ("typically") prevents automatic elimination by test-taking heuristics.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeFlawDemo === "inclusive" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--ink-primary)" }}>
                    Rule: "All of the Above" Gravitational Bias (+2 Points)
                  </h3>
                  <span style={{ fontSize: "0.84rem", color: "var(--ink-secondary)" }}>
                    Teachers write "All of the above" predominantly when it is the intended answer. Test-takers need only verify two options to guarantee the answer.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      sfx.playClick();
                      setHasAllAbove(!hasAllAbove);
                    }}
                  >
                    Toggle: {hasAllAbove ? "With 'All of the above'" : "With Distinct Choice"}
                  </button>
                </div>
              </div>

              <div className="flaw-options-grid">
                <div className="flaw-option-row">
                  <span className="choice-letter-badge">A</span>
                  <span className="flaw-option-text">Encapsulates object state</span>
                  <span className="option-point-chip" style={{ color: "var(--ink-tertiary)" }}>0 pts</span>
                </div>
                <div className="flaw-option-row">
                  <span className="choice-letter-badge">B</span>
                  <span className="flaw-option-text">Implements interface inheritance</span>
                  <span className="option-point-chip" style={{ color: "var(--ink-tertiary)" }}>0 pts</span>
                </div>
                <div className={`flaw-option-row ${hasAllAbove ? "highlight-leaky" : ""}`}>
                  <span className="choice-letter-badge" style={hasAllAbove ? { background: "var(--color-success)", color: "#FFF" } : {}}>C</span>
                  <span className="flaw-option-text">
                    {hasAllAbove ? "All of the above" : "Provides compile-time type reflection"}
                  </span>
                  {hasAllAbove ? (
                    <span className="option-point-chip pos">+2 pts Inclusive</span>
                  ) : (
                    <span className="option-point-chip" style={{ color: "var(--ink-tertiary)" }}>0 pts</span>
                  )}
                </div>
              </div>

              <div className="flaw-verdict-banner">
                <CheckCircle2 size={18} color="var(--blaze-orange)" />
                <div>
                  {hasAllAbove ? (
                    <span><strong>FLAW IDENTIFIED</strong>: "All of the above" creates an asymmetric shortcut. The blind guesser awards +2 points to Option C.</span>
                  ) : (
                    <span><strong>SOUND QUESTION DESIGN</strong>: Distinct distractors force full comprehension rather than partial recognition.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeFlawDemo === "tf" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--ink-primary)" }}>
                    Rule: True/False Justification Words (+2 Points to False)
                  </h3>
                  <span style={{ fontSize: "0.84rem", color: "var(--ink-secondary)" }}>
                    Statements containing explanatory connectors ('because', 'since', 'due to') are statistically engineered to present false causal relationships.
                  </span>
                </div>
              </div>

              <div className="flaw-options-grid">
                <div className="flaw-option-row highlight-leaky" style={{ padding: "14px 18px" }}>
                  <span style={{ fontSize: "0.94rem", lineHeight: 1.5, color: "var(--ink-primary)" }}>
                    "Recursive functions terminate automatically <strong>because</strong> call stack frames are infinite."
                  </span>
                  <span className="option-point-chip neg">-2 pts False Causal</span>
                </div>
              </div>

              <div className="flaw-verdict-banner">
                <Scale size={18} color="var(--blaze-orange)" />
                <div>
                  <strong>AUTOMATIC 'FALSE' PREDICTION</strong>: The algorithm detects the causal clause ("because"), marks the reason suspicious, and correctly predicts <strong>False</strong> with 80% confidence.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 1-Click Sample Exam Gallery */}
      <section className="observatory-section">
        <div className="section-header-compact">
          <div className="section-tag">
            <FileText size={14} color="var(--blaze-orange)" />
            <span>READY EXAM SUITES</span>
          </div>
          <h2 className="section-title">Launch A Pre-Configured Benchmark Audit</h2>
          <p className="section-subtitle">
            Experience how the simulator scores real-world exams across different academic domains in one click.
          </p>
        </div>

        <div className="sample-cards-grid">
          <div
            className="sample-exam-card"
            onClick={() => {
              sfx.playClick();
              onLoadSample("cs");
            }}
          >
            <div className="sample-card-header">
              <span className="pill pill-dark">CS 101</span>
              <span className="pill pill-orange">50% Leaky</span>
            </div>
            <h3 className="sample-card-title">Computer Science Midterm</h3>
            <p className="sample-card-desc">
              12 questions (8 MCQ + 4 T/F). Contains classic length biases, absolute words, and inclusive option traps.
            </p>
            <div className="sample-card-footer">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--blaze-orange)", fontWeight: 600 }}>
                Run CS101 Audit →
              </span>
            </div>
          </div>

          <div
            className="sample-exam-card"
            onClick={() => {
              sfx.playClick();
              onLoadSample("bio");
            }}
          >
            <div className="sample-card-header">
              <span className="pill pill-dark">BIO 204</span>
              <span className="pill pill-lime">Robust Exam</span>
            </div>
            <h3 className="sample-card-title">Cellular Biology &amp; Physiology</h3>
            <p className="sample-card-desc">
              8 questions with balanced distractor lengths, nuanced moderate qualifiers, and tight distractor clusters.
            </p>
            <div className="sample-card-footer">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--blaze-orange)", fontWeight: 600 }}>
                Run Biology Audit →
              </span>
            </div>
          </div>

          <div
            className="sample-exam-card"
            onClick={() => {
              sfx.playClick();
              onLoadSample("law");
            }}
          >
            <div className="sample-card-header">
              <span className="pill pill-dark">LAW 310</span>
              <span className="pill pill-orange">Severe Flaws</span>
            </div>
            <h3 className="sample-card-title">Legal Ethics &amp; Jurisprudence</h3>
            <p className="sample-card-desc">
              8 questions demonstrating the "Opposite Pair" giveaway and extreme qualifier eliminations.
            </p>
            <div className="sample-card-footer">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--blaze-orange)", fontWeight: 600 }}>
                Run Law Ethics Audit →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Stage Scientific Architecture */}
      <section className="observatory-section">
        <div className="section-header-compact">
          <div className="section-tag">
            <BrainCircuit size={14} color="var(--blaze-orange)" />
            <span>AUDIT PIPELINE</span>
          </div>
          <h2 className="section-title">The Deterministic Pipeline</h2>
          <p className="section-subtitle">
            EL-HABEED strictly separates answer key evaluation from blind prediction generation.
          </p>
        </div>

        <div className="pipeline-steps-grid">
          <div className="pipeline-step-card">
            <div className="pipeline-step-num">01</div>
            <h4 className="pipeline-step-title">Ingestion &amp; Parsing</h4>
            <p className="pipeline-step-text">
              Segments stems, options, and T/F markers. Strips trailing leaked section headers and handles noisy formatting.
            </p>
          </div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-num">02</div>
            <h4 className="pipeline-step-title">Isolated Key Storage</h4>
            <p className="pipeline-step-text">
              Official answers are stored in a partitioned data structure. The guessing engine is air-gapped from keys.
            </p>
          </div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-num">03</div>
            <h4 className="pipeline-step-title">Structural Cue Audit</h4>
            <p className="pipeline-step-text">
              Runs 17 deterministic hypotheses. Scores options consistently with zero order-dependent bias.
            </p>
          </div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-num">04</div>
            <h4 className="pipeline-step-title">Monte Carlo Guesser</h4>
            <p className="pipeline-step-text">
              Selects highest scoring choices. Ties broken via reproducible seeded pseudo-randomness (seed parameter).
            </p>
          </div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-num">05</div>
            <h4 className="pipeline-step-title">Independent Evaluation</h4>
            <p className="pipeline-step-text">
              Compares blind predictions to official keys and calculates the Vulnerability Index against pure chance.
            </p>
          </div>
        </div>
      </section>

      {/* Manifesto Callout Banner */}
      <section className="manifesto-card">
        <div style={{ maxWidth: "720px" }}>
          <span className="pill pill-lime" style={{ marginBottom: "12px" }}>
            PRIVACY &amp; DEPLOYMENT READY
          </span>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "6px 0", color: "#FFFFFF" }}>
            Zero Login. Zero Cloud Leaks. 100% Deterministic.
          </h3>
          <p style={{ color: "var(--ink-inverse-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: "8px 0 16px 0" }}>
            Exams are confidential institutional assets. EL-HABEED runs without sending your questions to third-party LLM providers,
            storing zero student data, and requiring no accounts or credit cards.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                sfx.playClick();
                onStartExam();
              }}
            >
              <span>Start An Exam Audit</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                sfx.playClick();
                onOpenSanitizer();
              }}
            >
              <span>Open Question Repair Studio</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
