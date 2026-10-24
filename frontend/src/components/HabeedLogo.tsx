import React from "react";

type Props = {
  onClick?: () => void;
};

export function HabeedLogo({ onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="brand-link"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="EL-HABEED home"
    >
      <span className="brand-title">EL-HABEED</span>
      <span className="brand-ar" dir="rtl">
        الهَبِّيد
      </span>
    </div>
  );
}
