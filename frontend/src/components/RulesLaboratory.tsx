import React, { useState } from "react";

interface RuleDetail {
  id: string;
  name: string;
  type: "mcq" | "tf";
  category: string;
  points: string;
  delta: number;
  biasDescription: string;
  testWriterMistake: string;
  fixRecommendation: string;
}

export const ALL_RULES: RuleDetail[] = [
  {
    id: "longest_answer",
    name: "Longest choice heuristic",
    type: "mcq",
    category: "Length",
    points: "+1",
    delta: 1,
    biasDescription: "Options significantly longer than peer distractors often contain added caveats.",
    testWriterMistake: "Teachers pack qualifying clauses into the correct key to prevent grading disputes.",
    fixRecommendation: "Balance character counts across all distractors, or make a false distractor the longest.",
  },
  {
    id: "moderate_words",
    name: "Hedging qualifiers",
    type: "mcq",
    category: "Wording",
    points: "+1",
    delta: 1,
    biasDescription: "Nuanced qualifiers ('often', 'typically', 'generally', 'may') make statements defensible.",
    testWriterMistake: "Academic subjects require nuance; teachers naturally hedge true statements.",
    fixRecommendation: "Use hedging words across false distractors as well as the correct answer.",
  },
  {
    id: "absolute_word_penalty",
    name: "Absolute word penalty",
    type: "mcq",
    category: "Wording",
    points: "-1",
    delta: -1,
    biasDescription: "Rigid absolutes ('always', 'never', 'must', 'solely') are disproven by single counterexamples.",
    testWriterMistake: "Writers insert absolutes into false options to make them indisputably incorrect during drafting.",
    fixRecommendation: "Avoid universal absolutes unless they represent genuine physical or mathematical axioms.",
  },
  {
    id: "inclusive_language",
    name: "Inclusive combinations",
    type: "mcq",
    category: "Structure",
    points: "+1",
    delta: 1,
    biasDescription: "Options combining alternatives ('Both A and B', 'A and C only') are favored by test writers.",
    testWriterMistake: "Test writers create inclusive options as ways to combine multiple concepts when both are valid.",
    fixRecommendation: "Draft inclusive options that combine one true fact with one false distractor.",
  },
  {
    id: "all_of_the_above",
    name: "'All of the above' bias",
    type: "mcq",
    category: "Structure",
    points: "+1",
    delta: 1,
    biasDescription: "Option explicitly offers 'all of the above', which is mathematically deducible if two choices hold.",
    testWriterMistake: "Writers want to review multiple good points in a single question, making 'All of the above' the target.",
    fixRecommendation: "Eliminate 'All of the above' entirely; replace with targeted single best answers.",
  },
  {
    id: "none_of_the_above",
    name: "'None of the above' warning",
    type: "mcq",
    category: "Structure",
    points: "Audit (0)",
    delta: 0,
    biasDescription: "Option contains 'None of the above'. Tested as poor psychometric practice.",
    testWriterMistake: "Teachers struggle to invent a 4th distractor and use 'None of the above' as filler.",
    fixRecommendation: "Use authentic distractors reflecting common student misconceptions instead of 'None of the above'.",
  },
  {
    id: "similar_options",
    name: "Twin distractor pair",
    type: "mcq",
    category: "Similarity",
    points: "Pair (0)",
    delta: 0,
    biasDescription: "Near-twin options with high textual similarity cluster the key and an opponent.",
    testWriterMistake: "Teachers create distractors by taking the correct answer and flipping a single word or sign.",
    fixRecommendation: "Construct distractors from distinct independent concepts rather than variations of the answer.",
  },
  {
    id: "outlier_option",
    name: "Structural outlier",
    type: "mcq",
    category: "Similarity",
    points: "Audit (0)",
    delta: 0,
    biasDescription: "Options with zero grammatical or stylistic overlap with peer options stand out structurally.",
    testWriterMistake: "Writers throw in an atypical or unrelated distractor to fill space.",
    fixRecommendation: "Ensure all distractors belong to the same taxonomic category.",
  },
  {
    id: "grammatical_matching",
    name: "Grammatical agreement",
    type: "mcq",
    category: "Syntax",
    points: "+2",
    delta: 2,
    biasDescription: "Stem ending syntax ('a', 'an', singular/plural verb) grammatically fits only one choice.",
    testWriterMistake: "Writing 'An example of an:' followed by distractors starting with consonants and one vowel.",
    fixRecommendation: "Place articles ('a/an') inside each choice rather than dangling at the end of the stem.",
  },
  {
    id: "keyword_overlap",
    name: "Stem keyword repetition",
    type: "mcq",
    category: "Wording",
    points: "+1",
    delta: 1,
    biasDescription: "Distinctive stem keywords are repeated verbatim inside the answer choice.",
    testWriterMistake: "Teachers unconsciously mirror terminology from the question when formulating the answer.",
    fixRecommendation: "Use synonyms in choices or ensure distractors also share stem vocabulary.",
  },
  {
    id: "numeric_extremes",
    name: "Numeric distribution",
    type: "mcq",
    category: "Numeric",
    points: "Audit (0)",
    delta: 0,
    biasDescription: "Options fall at the outer bound or interior of a numeric range.",
    testWriterMistake: "Teachers bracket the correct number with one smaller number and one larger number.",
    fixRecommendation: "Distribute numeric distractors on a logarithmic scale or use authentic calculation errors.",
  },
  {
    id: "opposite_pairs",
    name: "Opposite pair cue",
    type: "mcq",
    category: "Similarity",
    points: "Pair (0)",
    delta: 0,
    biasDescription: "Two options form an exact conceptual opposite pair (increase/decrease, enable/disable).",
    testWriterMistake: "Drafting a true statement and its direct logical negation as the primary distractor.",
    fixRecommendation: "Introduce complementary or orthogonal choices rather than strict binary opposites.",
  },
  {
    id: "tf_absolute",
    name: "Universal assertion",
    type: "tf",
    category: "True/False",
    points: "+1 False",
    delta: 1,
    biasDescription: "Statements with 'always', 'never', or 'all' are easier to falsify with counterexamples.",
    testWriterMistake: "Universal claims are easily refuted by single counter-examples; teachers write them as false items.",
    fixRecommendation: "Scope the context to specific definitions or rewrite as positive specific claims.",
  },
  {
    id: "tf_moderate",
    name: "Qualified assertion",
    type: "tf",
    category: "True/False",
    points: "+1 True",
    delta: 1,
    biasDescription: "Statements with 'often', 'can', 'may', or 'sometimes' represent safe assertions.",
    testWriterMistake: "Writers hedge true statements to prevent them from being argued against.",
    fixRecommendation: "Test essential mechanisms without relying on soft modal verbs.",
  },
  {
    id: "tf_reason",
    name: "Causal clause",
    type: "tf",
    category: "True/False",
    points: "Audit (0)",
    delta: 0,
    biasDescription: "Statements containing causal conjunctions ('because', 'since', 'due to').",
    testWriterMistake: "Teachers pair a true fact with a bogus explanation to test reasoning.",
    fixRecommendation: "Test facts and reasons in separate questions rather than compound causal items.",
  },
  {
    id: "tf_negative",
    name: "Negative formulation",
    type: "tf",
    category: "True/False",
    points: "Audit (0)",
    delta: 0,
    biasDescription: "Negatively phrased statements ('cannot', 'is not') increase cognitive parsing difficulty.",
    testWriterMistake: "Writing negative statements causes unnecessary double-negation confusion.",
    fixRecommendation: "Formulate claims positively: state what is true rather than what is not.",
  },
  {
    id: "tf_default_bias",
    name: "Neutral tie-break",
    type: "tf",
    category: "True/False",
    points: "Seeded (0)",
    delta: 0,
    biasDescription: "In the absence of explicit markers, zero artificial True bias is added (p = 0.5).",
    testWriterMistake: "Folklore previously claimed teachers author more True items, creating systematic prediction bias.",
    fixRecommendation: "Maintain a strict 50/50 balance between True and False items on your answer key.",
  },
];

export function RulesLaboratory() {
  const [filterType, setFilterType] = useState<"all" | "mcq" | "tf">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const mcqRules = ALL_RULES.filter((r) => r.type === "mcq");
  const tfRules = ALL_RULES.filter((r) => r.type === "tf");
  const totalCount = ALL_RULES.length;

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "var(--fs-lg)", marginBottom: "8px" }}>
          Rules library
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "70ch" }}>
          All {totalCount} deterministic rules currently evaluated by EL-HABEED. Rules detect question-writing cues without relying on machine learning or language models.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
        <button
          type="button"
          className={`demo-tab-btn ${filterType === "all" ? "active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          All rules ({totalCount})
        </button>
        <button
          type="button"
          className={`demo-tab-btn ${filterType === "mcq" ? "active" : ""}`}
          onClick={() => setFilterType("mcq")}
        >
          Multiple choice ({mcqRules.length})
        </button>
        <button
          type="button"
          className={`demo-tab-btn ${filterType === "tf" ? "active" : ""}`}
          onClick={() => setFilterType("tf")}
        >
          True/False ({tfRules.length})
        </button>
      </div>

      {/* Multiple-Choice Table */}
      {(filterType === "all" || filterType === "mcq") && (
        <div style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "var(--fs-md)", marginBottom: "12px", color: "var(--ink)" }}>
            Multiple-choice rules ({mcqRules.length})
          </h2>
          <div className="table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th style={{ width: "220px" }}>Rule</th>
                  <th>What it checks</th>
                  <th style={{ width: "120px" }}>Points</th>
                  <th style={{ width: "120px" }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {mcqRules.map((rule) => {
                  const isExpanded = expandedId === rule.id;
                  return (
                    <React.Fragment key={rule.id}>
                      <tr
                        style={{ cursor: "pointer" }}
                        onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                      >
                        <td style={{ fontWeight: 600 }}>
                          <div>{rule.name}</div>
                          <span className="mono-num" style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                            #{rule.id}
                          </span>
                        </td>
                        <td style={{ color: "var(--ink-2)" }}>{rule.biasDescription}</td>
                        <td>
                          <span
                            className={`badge-delta ${
                              rule.delta > 0 ? "pos" : rule.delta < 0 ? "neg" : "zero"
                            }`}
                          >
                            {rule.points}
                          </span>
                        </td>
                        <td style={{ color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>
                          {rule.category}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                              <div>
                                <span className="section-eyebrow">Why test writers make this flaw</span>
                                <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0 }}>
                                  {rule.testWriterMistake}
                                </p>
                              </div>
                              <div>
                                <span className="section-eyebrow">How to fix the question</span>
                                <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0 }}>
                                  {rule.fixRecommendation}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* True/False Table */}
      {(filterType === "all" || filterType === "tf") && (
        <div style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "var(--fs-md)", marginBottom: "12px", color: "var(--ink)" }}>
            True/False rules ({tfRules.length})
          </h2>
          <div className="table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th style={{ width: "220px" }}>Rule</th>
                  <th>What it checks</th>
                  <th style={{ width: "120px" }}>Points</th>
                  <th style={{ width: "120px" }}>Target</th>
                </tr>
              </thead>
              <tbody>
                {tfRules.map((rule) => {
                  const isExpanded = expandedId === rule.id;
                  return (
                    <React.Fragment key={rule.id}>
                      <tr
                        style={{ cursor: "pointer" }}
                        onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                      >
                        <td style={{ fontWeight: 600 }}>
                          <div>{rule.name}</div>
                          <span className="mono-num" style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                            #{rule.id}
                          </span>
                        </td>
                        <td style={{ color: "var(--ink-2)" }}>{rule.biasDescription}</td>
                        <td>
                          <span
                            className={`badge-delta ${
                              rule.delta > 0 ? "pos" : rule.delta < 0 ? "neg" : "zero"
                            }`}
                          >
                            {rule.points}
                          </span>
                        </td>
                        <td style={{ color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>
                          {rule.category}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                              <div>
                                <span className="section-eyebrow">Why test writers make this flaw</span>
                                <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0 }}>
                                  {rule.testWriterMistake}
                                </p>
                              </div>
                              <div>
                                <span className="section-eyebrow">How to fix the question</span>
                                <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0 }}>
                                  {rule.fixRecommendation}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
