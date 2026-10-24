export interface QuestionKeyContext {
  number?: string | null;
  index: number;
  type?: string;
  choices?: string[];
}

/**
 * Robust Answer Key Parser for formats like:
 * 1.a
 * 2.B
 * 3.d
 * 4.f
 * 5.T
 * as well as "1: A", "1 - True", "1) B", "Q1. C"
 */
export function parseAnswerKeyText(
  rawText: string,
  questionContext?: QuestionKeyContext[]
): Record<string, string> {
  const keys: Record<string, string> = {};
  if (!rawText.trim()) return keys;

  // Build lookup map for questions by number/index
  const contextMap: Record<string, QuestionKeyContext> = {};
  if (questionContext) {
    for (const q of questionContext) {
      if (q.number) contextMap[String(q.number)] = q;
      contextMap[String(q.index)] = q;
    }
  }

  // Regex pattern matching:
  // (Optional "Question 1" / "Q1") + Number + optional punctuation/bracket + Answer (Letter A-J or True/False/T/F)
  const pattern =
    /(?:(?:Question|Q|Item|No|Part)\s*[\.#:]?\s*)?\(?\s*(\d{1,3})\s*\)?\s*[\.\:\-\)\,\/]?\s*([A-Ja-j]|True|False|T|F)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(rawText)) !== null) {
    const qNum = String(parseInt(match[1], 10));
    const rawVal = match[2].trim();
    const upper = rawVal.toUpperCase();
    const ctx = contextMap[qNum];

    if (upper === "T" || upper === "TRUE") {
      keys[qNum] = "True";
    } else if (upper === "FALSE") {
      keys[qNum] = "False";
    } else if (upper === "F") {
      // Check if this question is an MCQ with at least 6 choices (A through F)
      if (ctx && ctx.type === "mcq" && (ctx.choices?.length ?? 0) >= 6) {
        keys[qNum] = "F";
      } else {
        // Standard case: 'F' or 'f' represents False (e.g. 4.f)
        keys[qNum] = "False";
      }
    } else {
      keys[qNum] = upper;
    }
  }

  // Fallback: If no numbers were matched, but user provided line-by-line answers (e.g. "A\nB\nD\nFalse\nTrue")
  if (Object.keys(keys).length === 0) {
    const lines = rawText.split(/[\r\n,]+/).map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, idx) => {
      const qNum = String(idx + 1);
      const upper = line.toUpperCase();
      const ctx = contextMap[qNum];

      if (upper === "T" || upper === "TRUE") {
        keys[qNum] = "True";
      } else if (upper === "FALSE") {
        keys[qNum] = "False";
      } else if (upper === "F") {
        if (ctx && ctx.type === "mcq" && (ctx.choices?.length ?? 0) >= 6) {
          keys[qNum] = "F";
        } else {
          keys[qNum] = "False";
        }
      } else if (/^[A-J]$/i.test(line)) {
        keys[qNum] = upper;
      }
    });
  }

  return keys;
}

