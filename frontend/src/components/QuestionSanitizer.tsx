import React, { useState } from "react";
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Wand2,
  Flame,
  FileText,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { sfx } from "../utils/soundEffects";

interface SanitizePreset {
  title: string;
  flawType: string;
  originalStem: string;
  originalChoices: string[];
  flawedOptionIndex: number;
  flawNote: string;
  sanitizedStem: string;
  sanitizedChoices: string[];
  fixNote: string;
}

const PRESETS: SanitizePreset[] = [
  {
    title: "1. The Runaway Length Trap",
    flawType: "Longest Answer Bias (+3 pts)",
    originalStem: "Which statement best characterizes an immutable data structure?",
    originalChoices: [
      "Its elements can be modified at any point.",
      "A structured memory data entity whose internal state, values, and object properties cannot be altered once initialized by the runtime environment.",
      "It automatically converts numerical values to text.",
      "It requires manual memory garbage collection.",
    ],
    flawedOptionIndex: 1,
    flawNote: "Option B is 3.5x longer than any other choice. The test writer added qualifiers to be precise, accidentally handing the answer to blind guessers.",
    sanitizedStem: "Which statement best characterizes an immutable data structure?",
    sanitizedChoices: [
      "Its elements can be modified at any point during program execution.",
      "Its contents cannot be altered once initialized in runtime memory.",
      "Its allocated memory expands automatically whenever capacity is reached.",
      "Its referenced values require manual destruction upon variable exit.",
    ],
    fixNote: "All 4 distractors are now balanced in word count (9-11 words) and syntactic structure. The length heuristic fails completely.",
  },
  {
    title: "2. The Rigid Absolute Word Elimination",
    flawType: "Absolute Word Penalty (-4 pts)",
    originalStem: "In multi-threaded software architectures, how does mutual exclusion behave?",
    originalChoices: [
      "Worker threads must always acquire hardware CPU locks before any instruction can execute.",
      "Only one thread can access the critical section at any given moment.",
      "Background worker threads never consume shared heap memory.",
      "Operating system kernels solely prioritize foreground user processes.",
    ],
    flawedOptionIndex: 0,
    flawNote: "Options A, C, and D contain rigid universal words ('always', 'never', 'solely'). Test-takers eliminate all three without reading the question.",
    sanitizedStem: "In multi-threaded software architectures, how does mutual exclusion behave?",
    sanitizedChoices: [
      "Worker threads synchronize memory access through hardware cache coherence protocols.",
      "Only one thread accesses the designated critical section at any given moment.",
      "Background worker threads release priority levels during high I/O throughput.",
      "Operating system kernels distribute execution time according to thread affinity.",
    ],
    fixNote: "Replaced absolutes with authentic operational descriptions. Students must now understand concurrency concepts to answer correctly.",
  },
  {
    title: "3. 'All of the Above' Shortcut",
    flawType: "'All of the Above' Gravity (+2 pts)",
    originalStem: "Which mechanisms provide memory safety in modern programming languages?",
    originalChoices: [
      "Automated tracing garbage collection.",
      "Compile-time borrow checking and ownership semantics.",
      "Bounds-checked array index access.",
      "All of the above.",
    ],
    flawedOptionIndex: 3,
    flawNote: "If a student knows only Choice A and Choice C, they immediately deduce Choice D must be the answer, skipping Choice B.",
    sanitizedStem: "Which mechanism guarantees memory safety without runtime garbage collection pauses?",
    sanitizedChoices: [
      "Compile-time borrow checking and ownership semantics.",
      "Generational reference counting with cycle detection.",
      "Hardware page table memory virtualization.",
      "Dynamic heap allocation compaction algorithms.",
    ],
    fixNote: "Replaced the 'All of the above' cop-out with a targeted conceptual discriminator that tests precise knowledge.",
  },
  {
    title: "4. True/False Causal Explanations",
    flawType: "Causal Clause Indicator (+2 pts False)",
    originalStem: "Recursive functions never terminate because every function call consumes infinite call stack memory.",
    originalChoices: ["True", "False"],
    flawedOptionIndex: 1,
    flawNote: "Compound statements linking a claim with 'because' are statistically false 80% of the time in university tests.",
    sanitizedStem: "Recursive functions require an explicit base case to prevent stack overflow errors.",
    sanitizedChoices: ["True", "False"],
    fixNote: "Rewritten as a direct positive factual statement. Eliminates the 'because' cue while testing the exact same core concept.",
  },
];

export function QuestionSanitizer() {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const preset = PRESETS[selectedPresetIdx];

  function handleCopySanitized() {
    let text = `${preset.sanitizedStem}\n`;
    preset.sanitizedChoices.forEach((c, idx) => {
      text += `${String.fromCharCode(65 + idx)}) ${c}\n`;
    });
    navigator.clipboard.writeText(text);
    sfx.playKeySelect();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="sanitizer-container">
      {/* Header */}
      <div className="sanitizer-header">
        <div className="section-tag">
          <Wand2 size={14} color="var(--blaze-orange)" />
          <span>REPAIR WORKBENCH</span>
        </div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "6px 0", color: "var(--ink-primary)" }}>
          Question Sanitizer &amp; Repair Studio
        </h2>
        <p style={{ color: "var(--ink-secondary)", fontSize: "0.92rem", margin: 0, maxWidth: "700px" }}>
          Fix vulnerable questions by eliminating distractor cues and length imbalances while preserving the academic rigor of your exam.
        </p>
      </div>

      {/* Preset Selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className={`segmented-pill ${selectedPresetIdx === idx ? "active" : ""}`}
            onClick={() => {
              sfx.playClick();
              setSelectedPresetIdx(idx);
            }}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="sanitizer-grid">
        {/* Left: Original Vulnerable Question */}
        <div className="sanitizer-card vulnerable">
          <div className="sanitizer-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={18} color="var(--blaze-orange)" />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--blaze-orange)" }}>
                Vulnerable Question (Draft)
              </h3>
            </div>
            <span className="pill pill-orange">{preset.flawType}</span>
          </div>

          <div className="sanitizer-card-body">
            <div className="sanitizer-stem-box">
              <span className="sanitizer-box-label">QUESTION STEM</span>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--ink-primary)" }}>
                {preset.originalStem}
              </div>
            </div>

            <div className="sanitizer-choices-list">
              <span className="sanitizer-box-label">CHOICES WITH EXPLOITABLE CUES</span>
              {preset.originalChoices.map((choice, cIdx) => {
                const isFlawed = cIdx === preset.flawedOptionIndex;
                const letter = String.fromCharCode(65 + cIdx);

                return (
                  <div key={cIdx} className={`sanitizer-choice-item ${isFlawed ? "leaky-highlight" : ""}`}>
                    <span className="choice-letter-badge">{letter}</span>
                    <span style={{ flex: 1, fontSize: "0.88rem" }}>{choice}</span>
                    {isFlawed && (
                      <span className="option-point-chip neg" style={{ flexShrink: 0 }}>
                        ⚠ Leaky Target
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="callout callout-warning" style={{ marginTop: "16px" }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", fontSize: "0.82rem" }}>Why This Fails:</strong>
                <span style={{ fontSize: "0.82rem" }}>{preset.flawNote}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sanitized Immune Version */}
        <div className="sanitizer-card immune">
          <div className="sanitizer-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} color="var(--color-success)" />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--color-success)" }}>
                Sanitized Version (Immune)
              </h3>
            </div>
            <span className="pill pill-lime">0 Cues • 100% Robust</span>
          </div>

          <div className="sanitizer-card-body">
            <div className="sanitizer-stem-box">
              <span className="sanitizer-box-label">SANITIZED STEM</span>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--ink-primary)" }}>
                {preset.sanitizedStem}
              </div>
            </div>

            <div className="sanitizer-choices-list">
              <span className="sanitizer-box-label">BALANCED, IMMUNE DISTRACTORS</span>
              {preset.sanitizedChoices.map((choice, cIdx) => {
                const letter = String.fromCharCode(65 + cIdx);

                return (
                  <div key={cIdx} className="sanitizer-choice-item immune-highlight">
                    <span className="choice-letter-badge" style={{ background: "var(--color-success)", color: "#FFFFFF", borderColor: "var(--color-success)" }}>
                      {letter}
                    </span>
                    <span style={{ flex: 1, fontSize: "0.88rem" }}>{choice}</span>
                    <span className="option-point-chip pos" style={{ flexShrink: 0 }}>
                      ✓ Clean
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="callout callout-info" style={{ marginTop: "16px", backgroundColor: "#ECFDF5", borderColor: "#A7F3D0", color: "#065F46" }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", fontSize: "0.82rem" }}>Why This Succeeds:</strong>
                <span style={{ fontSize: "0.82rem" }}>{preset.fixNote}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopySanitized}
              >
                {isCopied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                <span>{isCopied ? "Copied To Clipboard!" : "Copy Sanitized Question"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
