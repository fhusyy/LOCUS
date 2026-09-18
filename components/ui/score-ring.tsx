import React from "react";

export function ScoreRing({
  value,
  size = "normal",
  showLabel = true,
}: {
  value: number;
  size?: "tiny" | "small" | "normal" | "large";
  showLabel?: boolean;
}) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  const toneClass =
    normalized >= 85 ? "score-high" : normalized >= 70 ? "score-good" : normalized >= 50 ? "score-mid" : "score-low";

  return (
    <div
      className={`score-ring ${size} ${toneClass}`}
      style={{ "--score": `${normalized * 3.6}deg` } as React.CSSProperties}
      aria-label={`Совместимость: ${normalized} из 100`}
    >
      <div className="score-inner">
        <strong>{normalized}</strong>
        {showLabel && size !== "tiny" && <small>/100</small>}
      </div>
    </div>
  );
}
