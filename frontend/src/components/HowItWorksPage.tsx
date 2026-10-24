import React, { useState } from "react";

type Props = {
  onStartExam: () => void;
  onSeeSampleReport: () => void;
};

export function HowItWorksPage({ onStartExam, onSeeSampleReport }: Props) {
  const [activeFlawDemo, setActiveFlawDemo] = useState<"length" | "absolute" | "inclusive" | "tf">("length");
  const [lengthFactor, setLengthFactor] = useState<number>(3);
  const [absoluteWord, setAbsoluteWord] = useState<"always" | "typically">("always");
  const [hasAllAbove, setHasAllAbove] = useState<boolean>(true);

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
      {/* Phase 3: Home Hero */}
      <section className="hero-layout">
        <div className="hero-text">
          <h1 className="hero-title">
            Can someone pass your exam without knowing the subject?
          </h1>

          <p className="hero-subtext">
            EL-HABEED checks whether your question wording gives answers away. It applies fixed, auditable rules, with no AI, and reports the evidence.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onStartExam}
            >
              Audit an exam
            </button>

            <button
              type="button"
              className="btn btn-link"
              onClick={onSeeSampleReport}
            >
              See a sample report
            </button>
          </div>
        </div>

        {/* Right column: Sample report card built from verified CS101 demo */}
        <div className="sample-report-card">
          <div className="sample-report-header">
            <span className="section-eyebrow" style={{ marginBottom: "4px" }}>Sample audit report</span>
            <div style={{ fontWeight: 600, fontSize: "var(--fs-base)", color: "var(--ink)" }}>
              CS 101: Introduction to Programming
            </div>
          </div>

          <div className="sample-stat-grid">
            <div className="sample-stat-box">
              <div className="sample-stat-val">12</div>
              <div className="sample-stat-label">Questions analyzed</div>
            </div>
            <div className="sample-stat-box">
              <div className="sample-stat-val" style={{ color: "var(--accent)" }}>50.0%</div>
              <div className="sample-stat-label">Heuristic score</div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--ink-2)", marginBottom: "4px" }}>
              <span>Risk breakdown</span>
              <span className="mono-num">3 High · 5 Med · 4 Low</span>
            </div>
            <div className="risk-bar" role="progressbar" aria-label="Risk distribution">
              <div className="risk-bar-segment high" style={{ width: "25%" }} title="High risk: 25%" />
              <div className="risk-bar-segment med" style={{ width: "42%" }} title="Medium risk: 42%" />
              <div className="risk-bar-segment low" style={{ width: "33%" }} title="Low risk: 33%" />
            </div>
          </div>

          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border)", fontSize: "13px", color: "var(--ink-3)" }}>
            Random guessing chance: <strong className="mono-num" style={{ color: "var(--ink-2)" }}>33.3%</strong> (+16.7% advantage from writing cues).
          </div>
        </div>
      </section>

      {/* Evidence line under the hero */}
      <div className="evidence-strip">
        <div>
          On the sample exam, rule-based guessing scored <strong>50.0%</strong> (chance: <strong>33.3%</strong>).
        </div>
        <div style={{ marginInlineStart: "auto", color: "var(--ink-3)" }}>
          No AI, no LLMs · Runs the same way every time
        </div>
      </div>

      {/* Phase 4: Interactive Demo Section */}
      <section className="demo-section">
        <h2 style={{ fontSize: "var(--fs-lg)", marginBottom: "8px" }}>
          How blind guessers exploit exam writing
        </h2>
        <p style={{ color: "var(--ink-2)", marginBottom: "24px" }}>
          Test writers leave unconscious linguistic footprints. Compare how minor drafting changes shift the algorithm's prediction without altering subject difficulty.
        </p>

        {/* 4 Plain Underlined Tabs */}
        <div className="demo-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeFlawDemo === "length"}
            className={`demo-tab-btn ${activeFlawDemo === "length" ? "active" : ""}`}
            onClick={() => setActiveFlawDemo("length")}
          >
            Longest choice
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFlawDemo === "absolute"}
            className={`demo-tab-btn ${activeFlawDemo === "absolute" ? "active" : ""}`}
            onClick={() => setActiveFlawDemo("absolute")}
          >
            Absolute word
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFlawDemo === "inclusive"}
            className={`demo-tab-btn ${activeFlawDemo === "inclusive" ? "active" : ""}`}
            onClick={() => setActiveFlawDemo("inclusive")}
          >
            All of the above
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFlawDemo === "tf"}
            className={`demo-tab-btn ${activeFlawDemo === "tf" ? "active" : ""}`}
            onClick={() => setActiveFlawDemo("tf")}
          >
            True/False bias
          </button>
        </div>

        {/* Demo Pane: Longest choice */}
        {activeFlawDemo === "length" && (
          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                Question: <strong>What is a conditional statement?</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>Option C length:</span>
                <div className="segmented-control">
                  {[1, 2, 3].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`segmented-btn ${lengthFactor === f ? "active" : ""}`}
                      onClick={() => setLengthFactor(f)}
                    >
                      {f === 1 ? "Equal (1x)" : f === 2 ? "Detailed (2x)" : "Long (3x)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className={`demo-choice-row ${lengthFactor === 1 ? "winning" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">A</span>
                  <span>A syntax token in compiler parsing</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>

              <div className="demo-choice-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">B</span>
                  <span>A primitive integer identifier</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>

              <div className={`demo-choice-row ${lengthFactor >= 2 ? "winning" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">C</span>
                  <span>
                    {lengthFactor === 1 && "A conditional control flow construct"}
                    {lengthFactor === 2 && "A conditional control flow construct that evaluates a boolean condition to determine execution branch"}
                    {lengthFactor === 3 && "A conditional control flow selection construct that rigorously evaluates boolean expressions in order to determine execution paths and runtime branching"}
                  </span>
                </div>
                {lengthFactor >= 2 ? (
                  <span className="badge-delta pos">+1</span>
                ) : (
                  <span className="badge-delta zero">0</span>
                )}
              </div>

              <div className="demo-choice-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">D</span>
                  <span>A hardware CPU register</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>
            </div>

            <div className="demo-explanation-line">
              {lengthFactor >= 2 ? (
                <>
                  <strong>Predicted: Option C.</strong> It is substantially longer than competing distractors (+1 point). Test writers pack necessary definitions into correct answers, inadvertently creating an easy guess.
                </>
              ) : (
                <>
                  <strong>Predicted: Tied.</strong> Distractors have balanced lengths. The length heuristic cannot isolate an answer, forcing a coin-toss guess.
                </>
              )}
            </div>
          </div>
        )}

        {/* Demo Pane: Absolute word */}
        {activeFlawDemo === "absolute" && (
          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                Question: <strong>Which statement accurately describes process scheduling?</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>Distractor wording:</span>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${absoluteWord === "always" ? "active" : ""}`}
                    onClick={() => setAbsoluteWord("always")}
                  >
                    "always" (Absolute)
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${absoluteWord === "typically" ? "active" : ""}`}
                    onClick={() => setAbsoluteWord("typically")}
                  >
                    "typically" (Moderate)
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className={`demo-choice-row ${absoluteWord === "always" ? "" : "winning"}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">A</span>
                  <span>
                    Foreground interactive processes {absoluteWord === "always" ? "always preempt" : "typically preempt"} background batch tasks.
                  </span>
                </div>
                {absoluteWord === "always" ? (
                  <span className="badge-delta neg">-1</span>
                ) : (
                  <span className="badge-delta pos">+1</span>
                )}
              </div>

              <div className={`demo-choice-row ${absoluteWord === "always" ? "winning" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">B</span>
                  <span>The operating system balances CPU time among ready threads.</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>

              <div className="demo-choice-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">C</span>
                  <span>Hard drives execute CPU instructions directly without RAM.</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>
            </div>

            <div className="demo-explanation-line">
              {absoluteWord === "always" ? (
                <>
                  <strong>Predicted: Option B.</strong> Option A was penalized (-1) for using the rigid absolute "always", leaving Option B as the highest-scoring candidate.
                </>
              ) : (
                <>
                  <strong>Predicted: Option A.</strong> Softening "always" to "typically" removed the penalty and added a moderate-word cue (+1), making Option A the winner.
                </>
              )}
            </div>
          </div>
        )}

        {/* Demo Pane: All of the above */}
        {activeFlawDemo === "inclusive" && (
          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                Question: <strong>Which features are provided by object-oriented programming?</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>Option D format:</span>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${hasAllAbove ? "active" : ""}`}
                    onClick={() => setHasAllAbove(true)}
                  >
                    All of the above
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${!hasAllAbove ? "active" : ""}`}
                    onClick={() => setHasAllAbove(false)}
                  >
                    Concrete choice
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="demo-choice-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">A</span>
                  <span>Encapsulation of data and behavior</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>

              <div className="demo-choice-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">B</span>
                  <span>Inheritance across hierarchical classes</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>

              <div className="demo-choice-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">C</span>
                  <span>Polymorphic method invocation</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>

              <div className={`demo-choice-row ${hasAllAbove ? "winning" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">D</span>
                  <span>{hasAllAbove ? "All of the above" : "Automatic quantum encryption"}</span>
                </div>
                {hasAllAbove ? (
                  <span className="badge-delta pos">+1</span>
                ) : (
                  <span className="badge-delta zero">0</span>
                )}
              </div>
            </div>

            <div className="demo-explanation-line">
              {hasAllAbove ? (
                <>
                  <strong>Predicted: Option D.</strong> "All of the above" triggers a +1 composite cue. If a student recognizes even two plausible options, Option D is guaranteed mathematically.
                </>
              ) : (
                <>
                  <strong>Predicted: Tied.</strong> Replacing "All of the above" with a concrete concept eliminates the shortcut and forces genuine knowledge verification.
                </>
              )}
            </div>
          </div>
        )}

        {/* Demo Pane: True/False bias */}
        {activeFlawDemo === "tf" && (
          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ marginBottom: "16px", fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              Statement: <strong>All operating systems must never permit unprivileged processes to access hardware.</strong>
            </div>

            <div>
              <div className="demo-choice-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">True</span>
                  <span>Statement is accurate as written</span>
                </div>
                <span className="badge-delta zero">0</span>
              </div>

              <div className="demo-choice-row winning">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="demo-letter-box">False</span>
                  <span>Statement is falsified by universal absolutes ("All", "must never")</span>
                </div>
                <span className="badge-delta pos">+1</span>
              </div>
            </div>

            <div className="demo-explanation-line">
              <strong>Predicted: False.</strong> Universal statements with rigid absolutes are easy to falsify because embedded systems or direct memory access (DMA) drivers serve as counterexamples.
            </div>
          </div>
        )}

        {/* Honest Caveat Line */}
        <p style={{ marginTop: "16px", fontSize: "var(--fs-sm)", color: "var(--ink-3)", fontStyle: "italic" }}>
          A detected cue is not proof that guessing works. The audit report shows whether each cue pointed at the real answer when a key is provided.
        </p>
      </section>

      {/* 4 Numbered Steps: How it works */}
      <section style={{ borderTop: "1px solid var(--border)", paddingTop: "48px", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--fs-lg)", marginBottom: "8px" }}>
          How the audit works
        </h2>
        <p style={{ color: "var(--ink-2)", maxWidth: "70ch", marginBottom: "24px" }}>
          EL-HABEED executes a four-stage deterministic pipeline. The guessing algorithm never inspects your answer key during prediction.
        </p>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01 / INGEST &amp; PARSE</div>
            <h3 style={{ fontSize: "var(--fs-base)", marginBottom: "8px" }}>Parse structure</h3>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              Extracts questions and options from your PDF or pasted text, detecting boundaries, numbering, and question types.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">02 / STRUCTURAL AUDIT</div>
            <h3 style={{ fontSize: "var(--fs-base)", marginBottom: "8px" }}>Scan heuristics</h3>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              Applies 17 deterministic rules to detect length disparities, hedging qualifiers, absolute penalties, and grammar cues.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">03 / BLIND SIMULATION</div>
            <h3 style={{ fontSize: "var(--fs-base)", marginBottom: "8px" }}>Simulate guesser</h3>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              The algorithm selects answers using only question text and options. Tied choices are broken using reproducible random seeds.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">04 / INDEPENDENT EVALUATION</div>
            <h3 style={{ fontSize: "var(--fs-base)", marginBottom: "8px" }}>Compare with key</h3>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              Predictions are compared against your official key to measure whether the writing flaws genuinely gave answers away.
            </p>
          </div>
        </div>

        <div className="panel" style={{ background: "var(--bg)", borderLeft: "4px solid var(--ink-2)" }}>
          <strong style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--ink)", marginBottom: "4px" }}>
            Scientific limitation
          </strong>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0 }}>
            Heuristic cues represent writing patterns, not universal laws of correctness. Some absolute statements are genuine axioms, and some long answers are necessary definitions. An audit report provides an objective baseline to help teachers review exam construct validity.
          </p>
        </div>
      </section>
    </div>
  );
}
