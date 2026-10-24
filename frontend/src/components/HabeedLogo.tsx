import React from "react";

type Props = {
  size?: number;
  showWordmark?: boolean;
  theme?: "dark" | "light";
  onClick?: () => void;
};

export function HabeedMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="35 25 150 155"
      role="img"
      aria-label="EL-HABEED Blindfolded Dice-Roller Logo"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      {/* Head / Crown Outline (Blaze Orange) */}
      <path
        d="M 70 62 C 70 30, 126 30, 126 62"
        stroke="#FF5A00"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Blindfold Band (Acid Chartreuse) */}
      <path
        d="M 65 61 C 82 55, 114 55, 131 61 C 134 69, 133 78, 129 85 C 115 84, 108 79, 98 79 C 88 79, 81 84, 67 85 C 63 78, 62 69, 65 61 Z"
        fill="#B8FF01"
      />
      {/* Jaw, Neck & Left Shoulder (Blaze Orange) */}
      <path
        d="M 72 90 C 75 103, 84 112, 95 114"
        stroke="#FF5A00"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 124 89 C 122 96, 119 101, 115 105"
        stroke="#FF5A00"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 84 110 L 84 123 C 73 128, 53 132, 48 144 L 46 164 L 78 164"
        stroke="#FF5A00"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 84 123 C 92 132, 101 134, 108 134"
        stroke="#FF5A00"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 86 164 C 96 164, 105 163, 112 159"
        stroke="#FF5A00"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Kinetic Motion Arcs (Acid Chartreuse) */}
      <path
        d="M 152 67 C 162 74, 166 86, 165 98"
        stroke="#B8FF01"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 144 75 C 151 81, 155 89, 154 97"
        stroke="#B8FF01"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 98 152 L 108 148"
        stroke="#B8FF01"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 110 172 C 117 171, 123 169, 128 165"
        stroke="#B8FF01"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* 3D Isometric Tumbling Die */}
      <path
        d="M 121 108 L 143 124 L 171 112"
        stroke="#FF5A00"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 143 124 L 136 159"
        stroke="#FF5A00"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 144 95 L 170 109 C 174 111, 175 115, 174 120 L 167 148 C 166 153, 162 156, 157 158 L 138 163 C 133 164, 128 162, 124 159 L 112 144 C 109 140, 109 135, 111 130 L 118 109 C 120 104, 125 100, 131 98 Z"
        stroke="#B8FF01"
        strokeWidth="5.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Die Pips (Acid Chartreuse) */}
      <circle cx="137" cy="108" r="3.2" fill="#B8FF01" />
      <circle cx="152" cy="112" r="3.2" fill="#B8FF01" />
      <circle cx="123" cy="128" r="3.2" fill="#B8FF01" />
      <circle cx="127" cy="144" r="3.2" fill="#B8FF01" />
      <circle cx="161" cy="127" r="3.2" fill="#B8FF01" />
      <circle cx="154" cy="138" r="3.2" fill="#B8FF01" />
      <circle cx="146" cy="149" r="3.2" fill="#B8FF01" />
    </svg>
  );
}

export function HabeedLogo({ size = 36, showWordmark = true, theme = "dark", onClick }: Props) {
  const isDark = theme === "dark";

  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      <div
        style={{
          background: isDark ? "rgba(255, 255, 255, 0.06)" : "var(--bg-dark)",
          padding: "4px",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HabeedMark size={size} />
      </div>

      {showWordmark && (
        <div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "1.05rem",
              letterSpacing: "-0.01em",
              color: isDark ? "var(--ink-inverse)" : "var(--ink-primary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              lineHeight: 1.2,
            }}
          >
            <span>EL-HABEED</span>
            <span style={{ color: "var(--acid-lime)" }} aria-hidden="true">/</span>
            <span style={{ fontFamily: "var(--font-ar)" }} dir="rtl">
              الهَبِّيد
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              letterSpacing: "0.06em",
              color: isDark ? "var(--ink-inverse-muted)" : "var(--ink-secondary)",
              textTransform: "uppercase",
            }}
          >
            Deterministic Exam Auditor
          </div>
        </div>
      )}
    </div>
  );
}
