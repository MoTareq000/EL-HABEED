import { useState } from "react";
import { QuestionForm } from "../components/QuestionForm";
import { ResultsPanel } from "../components/ResultsPanel";
import { ExamAuditPanel } from "../components/ExamAuditPanel";
import { ObservatoryHub } from "../components/ObservatoryHub";
import { RulesLaboratory } from "../components/RulesLaboratory";
import { QuestionSanitizer } from "../components/QuestionSanitizer";
import { HabeedLogo } from "../components/HabeedLogo";
import { SAMPLE_EXAMS } from "../data/sampleExams";
import { sfx } from "../utils/soundEffects";
import {
  analyzeQuestion,
  type AnalyzeResult,
  type QuestionType,
} from "../services/analyzer";
import {
  Compass,
  FileCheck,
  BookOpen,
  Sliders,
  Wand2,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  ShieldAlert,
} from "lucide-react";

type AuditorTab = "observatory" | "exam" | "laboratory" | "sanitizer" | "single";

const EXAMPLES: Record<QuestionType, string> = {
  mcq:
    "Which of the following is usually considered a mammal?\nA) Shark\nB) Dolphin\nC) Octopus\nD) Jellyfish",
  tf: "All mammals can fly because they have lightweight bones.",
};

export function HomePage() {
  const [activeTab, setActiveTab] = useState<AuditorTab>("observatory");
  const [selectedSampleText, setSelectedSampleText] = useState<string>("");
  const [isSoundOn, setIsSoundOn] = useState<boolean>(sfx.enabled);
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  function handleTabChange(tab: AuditorTab) {
    sfx.playClick();
    setActiveTab(tab);
  }

  function handleToggleSound() {
    const enabled = sfx.toggle();
    setIsSoundOn(enabled);
  }

  async function handleAnalyze() {
    if (!rawText.trim()) {
      setError("Please paste a question to audit.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextResult = await analyzeQuestion(questionType, rawText);
      setResult(nextResult);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuestionTypeChange(type: QuestionType) {
    setQuestionType(type);
    setResult(null);
    setError(null);
  }

  function handleLoadExample() {
    setRawText(EXAMPLES[questionType]);
    setResult(null);
    setError(null);
  }

  function handleClear() {
    setRawText("");
    setResult(null);
    setError(null);
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(formatResult(result));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="header-brand">
          <HabeedLogo size={32} showWordmark={true} theme="dark" onClick={() => handleTabChange("observatory")} />
        </div>

        <div className="header-actions">
          {/* Mode Switcher */}
          <nav className="mode-segmented" role="tablist" aria-label="Auditor Modes">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "observatory"}
              className={activeTab === "observatory" ? "active" : ""}
              onClick={() => handleTabChange("observatory")}
            >
              <Compass size={14} />
              <span>Observatory</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "exam"}
              className={activeTab === "exam" ? "active" : ""}
              onClick={() => handleTabChange("exam")}
            >
              <FileCheck size={14} />
              <span>Exam Auditor</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "laboratory"}
              className={activeTab === "laboratory" ? "active" : ""}
              onClick={() => handleTabChange("laboratory")}
            >
              <Sliders size={14} />
              <span>Rules Codex</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "sanitizer"}
              className={activeTab === "sanitizer" ? "active" : ""}
              onClick={() => handleTabChange("sanitizer")}
            >
              <Wand2 size={14} />
              <span>Sanitizer</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "single"}
              className={activeTab === "single" ? "active" : ""}
              onClick={() => handleTabChange("single")}
            >
              <BookOpen size={14} />
              <span>Single Item</span>
            </button>
          </nav>

          {/* Sound Toggle */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{
              color: isSoundOn ? "var(--acid-lime)" : "var(--ink-inverse-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
            }}
            onClick={handleToggleSound}
            title={isSoundOn ? "Tactile Audio: Enabled (Click to Mute)" : "Tactile Audio: Muted (Click to Enable)"}
            aria-label="Toggle sound effects"
          >
            {isSoundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
              {isSoundOn ? "AUDIO ON" : "AUDIO"}
            </span>
          </button>

          {/* Quick Guide Button */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: "var(--ink-inverse-muted)" }}
            onClick={() => setIsGuideOpen(true)}
            aria-label="How heuristic marking works"
          >
            <HelpCircle size={15} />
            <span style={{ fontSize: "0.78rem" }}>Guide</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="app-container">
        {activeTab === "observatory" && (
          <ObservatoryHub
            onStartExam={() => {
              sfx.playClick();
              setActiveTab("exam");
            }}
            onLoadSample={(sampleType) => {
              sfx.playKeySelect();
              setSelectedSampleText(SAMPLE_EXAMS[sampleType].rawText);
              setActiveTab("exam");
            }}
            onOpenLab={() => {
              sfx.playClick();
              setActiveTab("laboratory");
            }}
            onOpenSanitizer={() => {
              sfx.playClick();
              setActiveTab("sanitizer");
            }}
          />
        )}

        {activeTab === "exam" && (
          <ExamAuditPanel initialSampleText={selectedSampleText} />
        )}

        {activeTab === "laboratory" && (
          <RulesLaboratory />
        )}

        {activeTab === "sanitizer" && (
          <QuestionSanitizer />
        )}

        {activeTab === "single" && (
          <div className="workbench-grid">
            <QuestionForm
              questionType={questionType}
              rawText={rawText}
              isLoading={isLoading}
              hasResult={Boolean(result)}
              isCopied={isCopied}
              onQuestionTypeChange={handleQuestionTypeChange}
              onRawTextChange={setRawText}
              onAnalyze={handleAnalyze}
              onLoadExample={handleLoadExample}
              onClear={handleClear}
              onCopy={handleCopy}
              onSwitchToPdf={() => setActiveTab("exam")}
            />
            <ResultsPanel result={result} error={error} isLoading={isLoading} />
          </div>
        )}
      </main>

      {/* Modern High-Trust Production Footer */}
      <footer className="app-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: "var(--ink-primary)" }}>EL-HABEED / الهَبِّيد</span>
          <span className="pill pill-lime">DETERMINISTIC HEURISTICS</span>
          <span className="pill pill-neutral">ZERO AI / LLMS</span>
          <span className="pill pill-neutral">100% PRIVATE • ZERO ACCOUNTS REQUIRED</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "var(--ink-secondary)", fontSize: "0.8rem" }}>
          <span>Production v2.4 • Controlled Seeded Tie-Breaking • Open Psychometric Auditor</span>
        </div>
      </footer>

      {/* Heuristics Guide Modal */}
      {isGuideOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsGuideOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-title"
        >
          <div className="modal-content">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} color="var(--blaze-orange)" />
                <h3 id="guide-title" style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                  Forensic Heuristic Rules
                </h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setIsGuideOpen(false)}
                aria-label="Close dialog"
                style={{ padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>
                Test writers exhibit psychological patterns when drafting exams. Correct answers are often crafted with caution—resulting in greater length, hedging qualifiers, and precise grammar. Distractors are frequently written hastily with absolute words or extreme numerical values.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="callout callout-info">
                  <span className="pill pill-lime" style={{ height: "fit-content" }}>+1 PT</span>
                  <div>
                    <strong style={{ display: "block", color: "var(--ink-primary)", fontSize: "0.85rem" }}>Longest Answer</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>Options substantially longer than competitors receive a calibrated +1 clue.</span>
                  </div>
                </div>

                <div className="callout callout-warning">
                  <span className="pill pill-orange" style={{ height: "fit-content" }}>-1 PT</span>
                  <div>
                    <strong style={{ display: "block", color: "var(--ink-primary)", fontSize: "0.85rem" }}>Absolute Modifiers</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>Options containing rigid absolutes ("always", "never", "only", "must") receive a -1 penalty.</span>
                  </div>
                </div>

                <div className="callout callout-info">
                  <span className="pill pill-lime" style={{ height: "fit-content" }}>+1 PT</span>
                  <div>
                    <strong style={{ display: "block", color: "var(--ink-primary)", fontSize: "0.85rem" }}>Hedging Qualifiers</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>Moderate words ("may", "generally", "tend to") that preserve scientific nuance favor the option.</span>
                  </div>
                </div>

                <div className="callout callout-info">
                  <span className="pill pill-lime" style={{ height: "fit-content" }}>+1 PT</span>
                  <div>
                    <strong style={{ display: "block", color: "var(--ink-primary)", fontSize: "0.85rem" }}>Stem Keyword Overlap</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>Repetition of specific vocabulary from the question stem inside an option (capped at +1).</span>
                  </div>
                </div>

                <div className="callout callout-info">
                  <span className="pill pill-lime" style={{ height: "fit-content" }}>+2 PTS</span>
                  <div>
                    <strong style={{ display: "block", color: "var(--ink-primary)", fontSize: "0.85rem" }}>Grammatical Agreement</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>Indefinite articles ("a" vs "an") or subject-verb concord that syntactically match choice openings.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsGuideOpen(false);
                  handleTabChange("laboratory");
                }}
              >
                Open Full 17-Rule Codex →
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsGuideOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatResult(result: AnalyzeResult) {
  if (result.type === "mcq") {
    const rows = result.parsed.choices
      .map((choice, index) => {
        const label = String.fromCharCode(65 + index);
        return `${label}. ${choice}: ${result.scores[label]}`;
      })
      .join("\n");
    const reasons = result.reasons
      .map(
        (reason) =>
          `${reason.rule}${reason.target ? ` (${reason.target})` : ""}: ${
            reason.delta >= 0 ? `+${reason.delta}` : reason.delta
          } (${reason.message})`
      )
      .join("\n");
    return `Predicted Answer: ${result.prediction}. ${result.predictedText}\nConfidence: ${result.confidence}%\n\nScores:\n${rows}\n\nMarker's Notes:\n${reasons}`;
  }

  const reasons = result.reasons
    .map(
      (reason) =>
        `${reason.rule} (${reason.target}): ${
          reason.delta >= 0 ? `+${reason.delta}` : reason.delta
        } (${reason.message})`
    )
    .join("\n");
  return `Prediction: ${result.prediction}\nTrue Score: ${result.trueScore}\nFalse Score: ${result.falseScore}\nConfidence: ${result.confidence}%\n\nMarker's Notes:\n${reasons}`;
}
