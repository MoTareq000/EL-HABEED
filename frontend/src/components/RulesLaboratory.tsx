import React, { useState } from "react";
import {
  Sliders,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
} from "lucide-react";
import { sfx } from "../utils/soundEffects";

interface RuleDetail {
  id: string;
  name: string;
  type: "mcq" | "tf";
  category: "length" | "wording" | "similarity" | "meta" | "tf";
  points: string;
  delta: number;
  biasDescription: string;
  testWriterMistake: string;
  exploitation: string;
  fixRecommendation: string;
  sampleQuestion: string;
  sampleVulnerableChoice: string;
}

const ALL_RULES: RuleDetail[] = [
  {
    id: "longest_answer",
    name: "Longest Choice Heuristic",
    type: "mcq",
    category: "length",
    points: "+1 pt",
    delta: 1,
    biasDescription: "Options significantly longer than peer distractors can indicate added caveats, but length alone does not guarantee correctness.",
    testWriterMistake: "Teachers pack necessary qualifying clauses into the correct answer to prevent student grading disputes.",
    exploitation: "Blind guessers prioritize the standout longest answer choice without reading the question stem.",
    fixRecommendation: "Either balance the word count across all distractors, or intentionally make a distractor the longest.",
    sampleQuestion: "What is an immutable data structure?",
    sampleVulnerableChoice: "A structured data entity whose memory state and internal properties cannot be altered once initialized by the runtime environment.",
  },
  {
    id: "moderate_words",
    name: "Moderate Language Advantage",
    type: "mcq",
    category: "wording",
    points: "+1 pt",
    delta: 1,
    biasDescription: "Options containing nuanced qualifiers ('often', 'typically', 'generally', 'may') are more defensible than rigid assertions.",
    testWriterMistake: "Science and humanities require nuance; teachers naturally use moderate words for truth statements.",
    exploitation: "Guessers eliminate blunt categorical choices in favor of hedging qualifiers.",
    fixRecommendation: "Use hedging words across false distractors as well as the keyed answer.",
    sampleQuestion: "How do compiler optimization passes behave?",
    sampleVulnerableChoice: "They generally attempt to eliminate dead code blocks where control flow guarantees no side effects.",
  },
  {
    id: "absolute_word_penalty",
    name: "Absolute Word Elimination",
    type: "mcq",
    category: "wording",
    points: "-1 pt",
    delta: -1,
    biasDescription: "Options containing rigid absolutes ('always', 'never', 'must', 'solely') are frequently disproven by single exceptions.",
    testWriterMistake: "Writers insert absolutes into false options to make them indisputably incorrect during drafting.",
    exploitation: "Students immediately eliminate options with 'always' or 'never', drastically narrowing the odds.",
    fixRecommendation: "Avoid universal absolutes unless they represent genuine physical or mathematical axioms.",
    sampleQuestion: "Which scenario describes thread synchronization?",
    sampleVulnerableChoice: "Mutex locks must always execute before any memory register is accessed in all hardware architectures.",
  },
  {
    id: "inclusive_language",
    name: "Inclusive Answer Synergy",
    type: "mcq",
    category: "meta",
    points: "+1 pt",
    delta: 1,
    biasDescription: "Options like 'Both A and B' or 'A and C only' are frequently favored in informal teacher-made exams.",
    testWriterMistake: "Test writers create inclusive options as clever ways to combine multiple concepts, usually when both are valid.",
    exploitation: "Whenever an inclusive option appears, the algorithm weights it as a potential composite target.",
    fixRecommendation: "Draft inclusive options that combine one true fact with one false distractor.",
    sampleQuestion: "Which factors contribute to algorithmic space complexity?",
    sampleVulnerableChoice: "Both recursive call stack depth and auxiliary heap allocations.",
  },
  {
    id: "all_of_the_above",
    name: "'All of the Above' Trap",
    type: "mcq",
    category: "meta",
    points: "+1 pt",
    delta: 1,
    biasDescription: "'All of the above' is a classic test-author shortcut that can be exploited if even two choices are verified.",
    testWriterMistake: "Writers want to review multiple good points in a single question, making 'All of the above' the target.",
    exploitation: "A student who identifies just two plausible options can deduce that 'All of the above' is the key.",
    fixRecommendation: "Eliminate 'All of the above' entirely; replace with targeted multi-select or single best answer.",
    sampleQuestion: "Which features are supported in modern object-oriented languages?",
    sampleVulnerableChoice: "All of the above",
  },
  {
    id: "none_of_the_above",
    name: "'None of the Above' Warning",
    type: "mcq",
    category: "meta",
    points: "Audit (0 pts)",
    delta: 0,
    biasDescription: "'None of the above' does not reliably favor truth or falsehood, but is recognized as poor psychometric practice.",
    testWriterMistake: "Teachers struggle to invent a 4th distractor and use 'None of the above' as filler.",
    exploitation: "Flagged for teacher review as a construct warning without adding artificial scoring points.",
    fixRecommendation: "Use authentic distractors reflecting common student misconceptions instead of 'None of the above'.",
    sampleQuestion: "What is the Big-O time complexity of binary search?",
    sampleVulnerableChoice: "None of the above",
  },
  {
    id: "similar_options",
    name: "Twin Distractors (Pair Cue)",
    type: "mcq",
    category: "similarity",
    points: "Pair Cue (0 pts)",
    delta: 0,
    biasDescription: "When two options are nearly identical in wording, teachers often pair the key with a near-twin distractor.",
    testWriterMistake: "Teachers create distractors by taking the correct answer and flipping a single word or sign.",
    exploitation: "Flagged as a pair cue. Because the algorithm cannot determine which twin is correct without domain knowledge, no point bias is awarded.",
    fixRecommendation: "Construct distractors from distinct independent concepts rather than variations of the answer.",
    sampleQuestion: "In prefix increment (++x), when does incrementation occur?",
    sampleVulnerableChoice: "Increments the operand value before expression evaluation is performed.",
  },
  {
    id: "outlier_option",
    name: "Structural Outlier",
    type: "mcq",
    category: "similarity",
    points: "Audit (0 pts)",
    delta: 0,
    biasDescription: "Options that share zero grammatical or conceptual overlap with peer options stand out structurally.",
    testWriterMistake: "Writers throw in an atypical or unrelated distractor to fill space.",
    exploitation: "Reported as an audit finding. Does not penalize points, as outliers can legitimately be correct definitions.",
    fixRecommendation: "Ensure all distractors belong to the same taxonomic category.",
    sampleQuestion: "Which of the following is a sorting algorithm?",
    sampleVulnerableChoice: "The operating system desktop wallpaper.",
  },
  {
    id: "grammatical_matching",
    name: "Grammatical Fit & Agreement",
    type: "mcq",
    category: "length",
    points: "+2 pts",
    delta: 2,
    biasDescription: "The question stem's ending syntax ('an', 'a', plural verb) grammatically matches only the correct option.",
    testWriterMistake: "Writing 'An example of an:' followed by distractors starting with consonants and one vowel.",
    exploitation: "A pure English grammar check eliminates incompatible options without any subject comprehension.",
    fixRecommendation: "Place articles ('a/an') inside each choice rather than dangling at the end of the stem.",
    sampleQuestion: "An algorithm with logarithmic efficiency is an:",
    sampleVulnerableChoice: "Optimal divide-and-conquer strategy.",
  },
  {
    id: "keyword_overlap",
    name: "Stem-to-Option Keyword Echo",
    type: "mcq",
    category: "wording",
    points: "+1 pt (capped)",
    delta: 1,
    biasDescription: "Key technical words in the question stem are repeated verbatim inside the answer choice.",
    testWriterMistake: "Teachers unconsciously mirror terminology from the question when formulating the answer.",
    exploitation: "Guessers match tokens between stem and choices to locate the echo (capped at +1 per option).",
    fixRecommendation: "Use synonyms in the choices or ensure distractors also share stem vocabulary.",
    sampleQuestion: "What guarantees memory integrity in managed runtime environments?",
    sampleVulnerableChoice: "A garbage collection process that preserves memory integrity across heap allocations.",
  },
  {
    id: "numerical_middle",
    name: "Numeric Distribution",
    type: "mcq",
    category: "length",
    points: "Audit (0 pts)",
    delta: 0,
    biasDescription: "Position in a numeric range alone does not establish correctness without mathematical calculation.",
    testWriterMistake: "Teachers bracket the correct number with one smaller number and one larger number.",
    exploitation: "Reported for audit without scoring modification.",
    fixRecommendation: "Distribute numeric distractors log-scale or use authentic formula calculation errors.",
    sampleQuestion: "What is the default TCP window size in bytes?",
    sampleVulnerableChoice: "65,535 (middle option between 1,024 and 1,048,576)",
  },
  {
    id: "opposite_pairs",
    name: "Opposite Pair (Pair Cue)",
    type: "mcq",
    category: "similarity",
    points: "Pair Cue (0 pts)",
    delta: 0,
    biasDescription: "When two options represent exact conceptual opposites, they narrow student attention to the binary pair.",
    testWriterMistake: "Drafting a true statement and its direct logical negation as the primary distractor.",
    exploitation: "Reported as a pair cue without artificial point inflation towards either side.",
    fixRecommendation: "Introduce complementary or orthogonal choices rather than strict binary opposites.",
    sampleQuestion: "In call-by-value semantics, how are caller variables affected?",
    sampleVulnerableChoice: "Original variables remain completely unchanged (vs. Original variables are modified).",
  },
  {
    id: "tf_absolute",
    name: "True/False Absolute Assertion",
    type: "tf",
    category: "tf",
    points: "+1 to False",
    delta: 1,
    biasDescription: "True/False statements with 'always', 'never', or 'all' are easier to falsify in open academic domains.",
    testWriterMistake: "Universal claims are easily refuted by single counter-examples; teachers write them as false items.",
    exploitation: "Absolute words provide a calibrated +1 clue favoring False.",
    fixRecommendation: "Scope the context to specific definitions or rewrite as positive specific claims.",
    sampleQuestion: "Integers can always store decimal numbers without precision loss.",
    sampleVulnerableChoice: "False (+1 to False)",
  },
  {
    id: "tf_moderate",
    name: "True/False Moderate Assertion",
    type: "tf",
    category: "tf",
    points: "+1 to True",
    delta: 1,
    biasDescription: "True/False statements with 'often', 'can', 'may', or 'sometimes' represent defensible textbook facts.",
    testWriterMistake: "Writers hedge true statements to prevent them from being argued against.",
    exploitation: "Hedging words provide a calibrated +1 clue favoring True.",
    fixRecommendation: "Test essential mechanisms without relying on soft modal verbs.",
    sampleQuestion: "A program can contain multiple nested if-statements within a function body.",
    sampleVulnerableChoice: "True (+1 to True)",
  },
  {
    id: "tf_reason",
    name: "True/False Causal Clause",
    type: "tf",
    category: "tf",
    points: "Audit (0 pts)",
    delta: 0,
    biasDescription: "Causal clauses ('because', 'since') require independent verification, but are frequently true in STEM disciplines.",
    testWriterMistake: "Teachers pair a true fact with a bogus explanation to test reasoning.",
    exploitation: "Reported as a readability warning without assuming falsehood.",
    fixRecommendation: "Test facts and reasons in separate questions rather than compound causal items.",
    sampleQuestion: "Recursive functions require a base case because stack frames consume memory.",
    sampleVulnerableChoice: "Audit finding: compound causal statement",
  },
  {
    id: "tf_negative",
    name: "True/False Negation Formulation",
    type: "tf",
    category: "tf",
    points: "Audit (0 pts)",
    delta: 0,
    biasDescription: "Negatively phrased statements ('cannot', 'is not') increase cognitive parsing load.",
    testWriterMistake: "Writing negative statements causes unnecessary double-negation confusion.",
    exploitation: "Reported as an item-construction advisory without biasing truth value.",
    fixRecommendation: "Formulate claims positively: state what is true rather than what is not.",
    sampleQuestion: "Local variables are not allocated in physical RAM.",
    sampleVulnerableChoice: "Audit finding: negative formulation",
  },
  {
    id: "tf_default_bias",
    name: "Neutral Seeded Tie-Breaker",
    type: "tf",
    category: "tf",
    points: "Neutral Seeded",
    delta: 0,
    biasDescription: "When no explicit markers fire, zero artificial True bias is added. Neutral seeded randomization determines the blind guess.",
    testWriterMistake: "Folklore previously claimed teachers author more True items, creating systematic prediction bias.",
    exploitation: "Neutral p=0.5 tie-breaking preserves the scientific validity of the expected random baseline.",
    fixRecommendation: "Maintain a strict 50/50 balance between True and False items on your answer key.",
    sampleQuestion: "A while loop evaluates its boolean condition before executing loop body statements.",
    sampleVulnerableChoice: "Neutral tie-break (p = 0.5)",
  },
];

export function RulesLaboratory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>("longest_answer");

  const filteredRules = ALL_RULES.filter((rule) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "mcq" && rule.type === "mcq") ||
      (selectedCategory === "tf" && rule.type === "tf") ||
      rule.category === selectedCategory;

    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.biasDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="lab-container">
      {/* Header */}
      <div className="lab-header">
        <div>
          <div className="section-tag">
            <Sliders size={14} color="var(--blaze-orange)" />
            <span>CODEX &amp; HEURISTIC ARCHITECTURE</span>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "6px 0", color: "var(--ink-primary)" }}>
            The 17 Deterministic Rules
          </h2>
          <p style={{ color: "var(--ink-secondary)", fontSize: "0.92rem", margin: 0, maxWidth: "700px" }}>
            Every point scored by EL-HABEED comes from these peer-reviewed psychometric heuristics.
            Zero neural networks, zero black-box weights.
          </p>
        </div>

        {/* Search Input */}
        <div className="lab-search-box">
          <Search size={15} color="var(--ink-tertiary)" />
          <input
            type="text"
            placeholder="Search rules, keywords, biases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="lab-search-input"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="segmented-pills" role="tablist" style={{ marginBottom: "20px" }}>
        <button
          type="button"
          className={`segmented-pill ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => {
            sfx.playClick();
            setSelectedCategory("all");
          }}
        >
          All 17 Rules
        </button>
        <button
          type="button"
          className={`segmented-pill ${selectedCategory === "mcq" ? "active" : ""}`}
          onClick={() => {
            sfx.playClick();
            setSelectedCategory("mcq");
          }}
        >
          MCQ Heuristics (12)
        </button>
        <button
          type="button"
          className={`segmented-pill ${selectedCategory === "tf" ? "active" : ""}`}
          onClick={() => {
            sfx.playClick();
            setSelectedCategory("tf");
          }}
        >
          True/False Heuristics (5)
        </button>
        <button
          type="button"
          className={`segmented-pill ${selectedCategory === "length" ? "active" : ""}`}
          onClick={() => {
            sfx.playClick();
            setSelectedCategory("length");
          }}
        >
          Length &amp; Formatting
        </button>
        <button
          type="button"
          className={`segmented-pill ${selectedCategory === "wording" ? "active" : ""}`}
          onClick={() => {
            sfx.playClick();
            setSelectedCategory("wording");
          }}
        >
          Linguistic Modals
        </button>
      </div>

      {/* Rules Grid */}
      <div className="rules-grid">
        {filteredRules.map((rule) => {
          const isExpanded = expandedRuleId === rule.id;

          return (
            <div
              key={rule.id}
              className={`rule-lab-card ${isExpanded ? "expanded" : ""}`}
              onClick={() => {
                sfx.playClick();
                setExpandedRuleId(isExpanded ? null : rule.id);
              }}
            >
              <div className="rule-lab-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className={`pill ${rule.type === "mcq" ? "pill-dark" : "pill-orange"}`}>
                    {rule.type.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-tertiary)" }}>
                    #{rule.id}
                  </span>
                </div>

                <span className={`option-point-chip ${rule.delta > 0 ? "pos" : "neg"}`}>
                  {rule.points}
                </span>
              </div>

              <h3 className="rule-lab-title">{rule.name}</h3>
              <p className="rule-lab-desc">{rule.biasDescription}</p>

              {isExpanded && (
                <div className="rule-lab-details" onClick={(e) => e.stopPropagation()}>
                  <div className="rule-detail-section">
                    <span className="rule-detail-heading">Why Test Writers Make This Flaw</span>
                    <p className="rule-detail-text">{rule.testWriterMistake}</p>
                  </div>

                  <div className="rule-detail-section">
                    <span className="rule-detail-heading">How Blind Guessers Exploit It</span>
                    <p className="rule-detail-text">{rule.exploitation}</p>
                  </div>

                  <div className="rule-detail-section">
                    <span className="rule-detail-heading">How To Fix The Question</span>
                    <p className="rule-detail-text">{rule.fixRecommendation}</p>
                  </div>

                  <div className="rule-sample-box">
                    <div style={{ fontSize: "0.76rem", fontFamily: "var(--font-mono)", color: "var(--ink-secondary)", marginBottom: "4px" }}>
                      VULNERABLE SAMPLE ITEM
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "6px", color: "var(--ink-primary)" }}>
                      {rule.sampleQuestion}
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "var(--blaze-orange)", padding: "6px 10px", background: "var(--blaze-orange-tint)", borderRadius: "var(--radius-sm)" }}>
                      Target: {rule.sampleVulnerableChoice}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--blaze-orange)", fontWeight: 600 }}>
                  {isExpanded ? "Collapse Details ↑" : "Inspect Rule Breakdown →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
