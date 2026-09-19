"use client";

import React from "react";
import { useI18n } from "@/components/i18n-provider";

export function ScoreRing({
  value,
  size = "normal",
  showLabel = true,
}: {
  value: number;
  size?: "tiny" | "small" | "normal" | "large";
  showLabel?: boolean;
}) {
  const { locale } = useI18n();
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  const toneClass =
    normalized >= 85 ? "score-high" : normalized >= 70 ? "score-good" : normalized >= 50 ? "score-mid" : "score-low";

  return (
    <div
      className={`score-ring ${size} ${toneClass}`}
      style={{ "--score": `${normalized * 3.6}deg` } as React.CSSProperties}
      aria-label={locale === "en" ? `Fit: ${normalized} out of 100` : locale === "kk" ? `Сәйкестік: 100-ден ${normalized}` : `Совместимость: ${normalized} из 100`}
    >
      <div className="score-inner">
        <strong>{normalized}</strong>
        {showLabel && size !== "tiny" && <small>/100</small>}
      </div>
    </div>
  );
}
