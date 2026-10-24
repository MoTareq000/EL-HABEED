# EL-HABEED UI Redesign & Engine v2 Design Notes

## 1. Project Overview & Architectural Direction
EL-HABEED has been redesigned from a generic "AI startup" presentation into a clean, authoritative **academic audit instrument and forensic laboratory report**.

The project maintains 100% deterministic rule scoring with zero AI/LLM involvement, seeded tie-breaking (#42), and strict isolation between official answer keys and the heuristic prediction engine.

---

## 2. Design System & Tokens
All gradients, glow effects, box-shadows, emojis, and decorative icons were eliminated. The application strictly adheres to the tokens defined in Section 3 of `EL-HABEED_UI_REDESIGN_PLAN.md`:

- **Colors:**
  - Background: `--bg: #FFFFFF`
  - Subtle panels: `--surface: #F7F7F5`
  - Structural rules: `--border: #E3E3DF`
  - Primary text: `--ink: #16181D`
  - Secondary text: `--ink-2: #4A4F5A` (min contrast 4.5:1)
  - Captions/metadata: `--ink-3: #6B7280`
  - Single accent: `--accent: #C2410C` (used exclusively for primary buttons, active nav underlines, winning option borders, and high-risk flags)
  - Semantic indicators: `--ok: #166534`, `--warn: #92400E`, `--risk: #B91C1C`
- **Typography:**
  - UI Font: `Inter`, system-ui, sans-serif
  - Arabic Font: `IBM Plex Sans Arabic`, `Noto Naskh Arabic`, sans-serif
  - Numbers/Code only: `IBM Plex Mono`, monospace (14px min)
- **Shape & Elevation:**
  - Radius: uniform `--radius: 6px`
  - Elevation: `--shadow: none` (clean 1px solid borders)

---

## 3. Implementation Summary by Phase

### Phase 1: Foundations
- Completely rewrote `frontend/src/styles.css` with CSS variables, base resets, two button variants only (`.btn-primary` solid accent, `.btn-secondary` 1px border), clean tables, and mono badge deltas.
- Removed all legacy glowing dot pills, gradient hero overlays, and drop shadows.

### Phase 2: Header & Navigation
- Replaced dark top bar with a clean white header with a 1px bottom border.
- Integrated wordmark: `EL-HABEED` with Arabic `الهَبِّيد` rendered cleanly in `--font-ar`.
- Exactly 4 plain text links (no icons, no pill buttons): **Audit an exam · Single question · How it works · Rules**.
- Active link indication uses a subtle 2px accent bottom border.
- Audio toggle relocated to a quiet checkbox in the footer, off by default.
- Moved Question Sanitizer into the exam audit ingestion flow as an optional "Clean pasted text" collapsible step.

### Phase 3: Home Hero & Evidence Line
- Redesigned `HowItWorksPage.tsx` hero to a left-aligned, two-column layout on desktop.
- Right column: live sample report card rendered from real CS 101 Midterm data (question count, risk distribution bar, heuristic score).
- Evidence line: *"On the sample exam, rule-based guessing scored 58% (chance: 28%)."* dynamically computed from real question choices.
- Removed all vanity claims ("0.0% AI Hallucinations", "Monte Carlo seeded"). Replaced with factual statement: *"No AI, no LLMs · Runs the same way every time"*.

### Phase 4: Interactive Flaw Demonstrator
- Elevated the flaw demonstrator directly below the hero.
- 4 plain underlined tabs: *Longest choice*, *Absolute word*, *All of the above*, *True/False bias*.
- Winning option highlighted with a 2px `--accent` left border and clear explanation line.
- Point deltas displayed with high-contrast mono badges (`+1`, `-1`, `0`).
- Included clear disclaimer caveat: *"A detected cue is not proof that guessing works. The audit report shows whether each cue pointed at the real answer when a key is provided."*

### Phase 5: Audit an Exam Flow
- **Stage 01 (Upload & Ingest):** Clean PDF dropzone and paste-text mode, scope selector (All / MCQ / T/F), attached answer key uploader/paster, and optional "Clean pasted text" collapsible guidelines.
- **Stage 02 (Review & Answer Key):** Summary statistics, live filter control, inline editable question stems and choices, clickable option buttons to designate official keys, and answer key import modal.
- **Stage 03 (Blind Simulation):** Replaced bouncy animations with a quiet inline *"Simulating blind guesses..."* state.
- **Stage 04 (Audit Results):**
  - Replaced single guessability number with two readouts: **Cue exposure** (%) and **Heuristic score vs chance** (with baseline dynamically computed on frontend as average of `1/choices`).
  - Plain text verdict label with 4px colored left border (`Leaky`, `Moderate`, `Robust`).
  - Risk filter segmented control (`All`, `High`, `Medium`, `Low`) with counts.
  - Question list table (`#`, `Question`, `Type`, `Predicted`, `Confidence`, `Risk`, `Key match`) with expandable rows for per-option scores and Marker's notes mono deltas.
  - Bulleted "What to change" educator advice section.
  - Segregated "Could not be analyzed" section for uncertain structure questions, ensuring they do not distort high-risk percentages.

### Phase 6: Single Question Workbench
- Clean two-column desktop workbench (`QuestionForm.tsx` on left, `ResultsPanel.tsx` on right).
- Replaced loading bubble animations with a simple inline *"Analyzing..."* text state.
- Option score breakdown table and Marker's notes with mono deltas.

### Phase 7: Rules Laboratory
- Transformed into a clean table (Rule, What it checks, Points, Category) grouped by MCQ and True/False rules.
- Rule count dynamically calculated from backend `ALL_RULES` metadata.

### Phase 8: Backend Engine v2 & Vercel Deployment
- Upgraded rule engine heuristics to v2 conservative weights with overlap guards (`backend/rules/rule_engine.py`).
- Converted dubious folklore rules (extreme numbers, outlier options, "because" clauses) to audit-only findings (0 pts).
- Created Vercel serverless integration (`api/index.py`, `vercel.json`, root `requirements.txt`).
- All 27 backend tests passing via pytest.
- Production build passes with 0 TypeScript/bundler errors (`npm run build`).

---

## 4. Key Files Modified / Created
- `DESIGN_NOTES.md`
- `frontend/src/styles.css`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/components/HabeedLogo.tsx`
- `frontend/src/components/HowItWorksPage.tsx`
- `frontend/src/components/RulesLaboratory.tsx`
- `frontend/src/components/QuestionForm.tsx`
- `frontend/src/components/ResultsPanel.tsx`
- `frontend/src/components/ExamAuditPanel.tsx`
- `frontend/src/components/Page1Upload.tsx`
- `frontend/src/components/Page2Review.tsx`
- `frontend/src/components/Page3Loading.tsx`
- `frontend/src/components/Page4Results.tsx`
- `backend/rules/mcq_rules.py`
- `backend/rules/tf_rules.py`
- `backend/rules/rule_engine.py`
- `backend/models/question.py`
- `backend/tests/test_mcq_scoring.py`
- `backend/tests/test_tf_scoring.py`
- `api/index.py`
- `vercel.json`
- `package.json`
- `requirements.txt`
