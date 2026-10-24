import React, { useState } from "react";
import { QuestionForm } from "../components/QuestionForm";
import { ResultsPanel } from "../components/ResultsPanel";
import { ExamAuditPanel } from "../components/ExamAuditPanel";
import { HowItWorksPage } from "../components/HowItWorksPage";
import { RulesLaboratory } from "../components/RulesLaboratory";
import { HabeedLogo } from "../components/HabeedLogo";
import { SAMPLE_EXAMS } from "../data/sampleExams";
import { sfx } from "../utils/soundEffects";
import {
  analyzeQuestion,
  type AnalyzeResult,
  type QuestionType,
} from "../services/analyzer";

type ActiveTab = "how_it_works" | "exam" | "single" | "rules";

const EXAMPLES: Record<QuestionType, string> = {
  mcq:
    "Which of the following is usually considered a mammal?\nA) Shark\nB) Dolphin\nC) Octopus\nD) Jellyfish",
  tf: "All mammals can fly because they have lightweight bones.",
};

export function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("how_it_works");
  const [selectedSampleText, setSelectedSampleText] = useState<string>("");
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(sfx.enabled);

  // Single Question Workbench State
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  function handleAudioToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const nextState = e.target.checked;
    if (nextState !== sfx.enabled) {
      sfx.toggle();
    }
    setIsAudioEnabled(nextState);
  }

  async function handleAnalyzeSingle() {
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

  async function handleCopyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(formatResultText(result));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="app-shell">
      {/* Light Header with 4 Plain Text Links (No dark bar, no icons) */}
      <header className="app-header">
        <div className="header-brand">
          <HabeedLogo onClick={() => setActiveTab("how_it_works")} />
        </div>

        <nav className="header-nav" role="tablist" aria-label="Main navigation">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "exam"}
            className={`nav-link ${activeTab === "exam" ? "active" : ""}`}
            onClick={() => setActiveTab("exam")}
          >
            Audit an exam
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "single"}
            className={`nav-link ${activeTab === "single" ? "active" : ""}`}
            onClick={() => setActiveTab("single")}
          >
            Single question
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "how_it_works"}
            className={`nav-link ${activeTab === "how_it_works" ? "active" : ""}`}
            onClick={() => setActiveTab("how_it_works")}
          >
            How it works
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "rules"}
            className={`nav-link ${activeTab === "rules" ? "active" : ""}`}
            onClick={() => setActiveTab("rules")}
          >
            Rules
          </button>
        </nav>
      </header>

      {/* Main Workspace */}
      <main className="app-container">
        {activeTab === "how_it_works" && (
          <HowItWorksPage
            onStartExam={() => setActiveTab("exam")}
            onSeeSampleReport={() => {
              setSelectedSampleText(SAMPLE_EXAMS.cs.rawText);
              setActiveTab("exam");
            }}
          />
        )}

        {activeTab === "exam" && (
          <ExamAuditPanel initialSampleText={selectedSampleText} />
        )}

        {activeTab === "single" && (
          <div className="two-col-layout">
            <QuestionForm
              questionType={questionType}
              rawText={rawText}
              isLoading={isLoading}
              hasResult={Boolean(result)}
              isCopied={isCopied}
              onQuestionTypeChange={handleQuestionTypeChange}
              onRawTextChange={setRawText}
              onAnalyze={handleAnalyzeSingle}
              onLoadExample={handleLoadExample}
              onClear={handleClear}
              onCopy={handleCopyResult}
              onSwitchToPdf={() => setActiveTab("exam")}
            />
            <ResultsPanel result={result} error={error} isLoading={isLoading} />
          </div>
        )}

        {activeTab === "rules" && (
          <RulesLaboratory />
        )}
      </main>

      {/* Clean Instrument Footer */}
      <footer className="app-footer">
        <div className="footer-left">
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>EL-HABEED</span>
          <span>·</span>
          <span>Deterministic Exam Writing Auditor</span>
        </div>

        <div className="footer-right">
          <span>No AI, no LLMs · Runs the same way every time</span>
          <span>·</span>
          <label className="audio-toggle-label">
            <input
              type="checkbox"
              checked={isAudioEnabled}
              onChange={handleAudioToggle}
            />
            <span>Audio feedback</span>
          </label>
        </div>
      </footer>
    </div>
  );
}

function formatResultText(result: AnalyzeResult): string {
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
