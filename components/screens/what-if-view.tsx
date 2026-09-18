import React, { useState } from "react";
import type { Match, StudentProfile, City, Interest, UntCombination } from "@/lib/types";
import { formatMoney, matchPrograms, calculateWhatIf } from "@/lib/matching";
import { ScoreRing } from "@/components/ui/score-ring";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { SparkIcon, CheckIcon, Chevron } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";

export function WhatIfView({
  profile,
  onApplyProfile,
  onViewProgram,
}: {
  profile: StudentProfile;
  onApplyProfile: (updated: StudentProfile) => void;
  onViewProgram: (programId: string) => void;
}) {
  const { t, locale } = useI18n();
  const [simProfile, setSimProfile] = useState<StudentProfile>({ ...profile });

  const patchSim = (patch: Partial<StudentProfile>) => {
    setSimProfile((prev) => ({ ...prev, ...patch }));
  };

  const comparison = calculateWhatIf(profile, simProfile);
  const currentTop = comparison.currentTop;
  const simulatedTop = comparison.simulatedTop;
  const delta = simulatedTop.score - currentTop.score;

  const applyChanges = () => {
    onApplyProfile(simProfile);
  };

  const resetToCurrent = () => {
    setSimProfile({ ...profile });
  };

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAskGeminiScenario = async () => {
    try {
      setAiLoading(true);
      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-uniflow-locale": locale },
        body: JSON.stringify({
          taskType: "scenario",
          locale,
          studentProfile: profile,
          simulatedProfile: simProfile,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.response);
      } else {
        setAiAnalysis(data.error || t("results.aiError"));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("results.aiError");
      setAiAnalysis(`${t("ai.connectionError")}: ${message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="what-if-page container">
      <div className="section-heading-block">
        <div className="eyebrow-pill">
          <SparkIcon size={14} /> {t("whatIf.kicker")}
        </div>
        <h1>{t("whatIf.title")}</h1>
        <p className="subtitle">
          {t("whatIf.description")}
        </p>
      </div>

      {/* Quick Presets */}
      <div className="presets-bar">
        <span className="presets-label">Быстрые сценарии:</span>
        <button
          className="preset-pill"
          onClick={() => patchSim({ unt: Math.min(140, (profile.unt ?? 85) + 15) })}
        >
          +15 баллов к ЕНТ (цель на грант)
        </button>
        <button
          className="preset-pill"
          onClick={() => patchSim({ gpa: 3.9 })}
        >
          Отличный аттестат (GPA 3.9 / 4.0)
        </button>
        <button
          className="preset-pill"
          onClick={() => patchSim({ ielts: 6.5, language: "Английский" })}
        >
          IELTS 6.5 (для NU и КБТУ)
        </button>
        <button
          className="preset-pill"
          onClick={() => patchSim({ onlyGrant: true })}
        >
          Только государственный грант
        </button>
        <button
          className="preset-pill"
          onClick={() => patchSim({ budget: Math.min(8_000_000, profile.budget + 1_000_000), onlyGrant: false })}
        >
          +1 млн ₸ к бюджету
        </button>
        <button className="preset-pill reset" onClick={resetToCurrent}>
          Сбросить к моему профилю
        </button>
      </div>

      <div className="what-if-grid">
        {/* Controls Sidebar */}
        <div className="what-if-controls card-glass">
          <h3>Параметры симуляции</h3>

          {/* UNT */}
          <div className="control-group">
            <div className="control-header">
              <label htmlFor="sim-unt">Балл ЕНТ (из 140)</label>
              <strong className="control-value">{simProfile.unt ?? "не указан"}</strong>
            </div>
            <input
              id="sim-unt"
              type="range"
              min="50"
              max="140"
              step="1"
              value={simProfile.unt ?? 85}
              onChange={(e) => patchSim({ unt: Number(e.target.value) })}
              className="range-slider"
            />
            <div className="slider-ticks">
              <span>50 (порог)</span>
              <span>85 (платное)</span>
              <span>102 (грант AITU)</span>
              <span>125 (NU)</span>
            </div>
          </div>

          {/* GPA on 4.0 scale */}
          <div className="control-group">
            <div className="control-header">
              <label htmlFor="sim-gpa">Средний балл GPA (шкала 4.0)</label>
              <strong className="control-value">{simProfile.gpa.toFixed(2)} / 4.0</strong>
            </div>
            <input
              id="sim-gpa"
              type="range"
              min="2.5"
              max="4.0"
              step="0.05"
              value={simProfile.gpa}
              onChange={(e) => patchSim({ gpa: Number(e.target.value) })}
              className="range-slider"
            />
            <div className="slider-ticks">
              <span>2.5</span>
              <span>3.2</span>
              <span>3.6</span>
              <span>4.0 (макс)</span>
            </div>
          </div>

          {/* IELTS */}
          <div className="control-group">
            <div className="control-header">
              <label htmlFor="sim-ielts">IELTS балл</label>
              <strong className="control-value">{simProfile.ielts ? `${simProfile.ielts} / 9.0` : "Без IELTS"}</strong>
            </div>
            <input
              id="sim-ielts"
              type="range"
              min="4.5"
              max="9.0"
              step="0.5"
              value={simProfile.ielts ?? 5.5}
              onChange={(e) => patchSim({ ielts: Number(e.target.value) })}
              className="range-slider"
            />
            <div className="slider-ticks">
              <span>4.5</span>
              <span>5.5 (SDU/КБТУ)</span>
              <span>6.5 (NU)</span>
              <span>9.0</span>
            </div>
          </div>

          {/* Budget & Grant toggle */}
          <div className="control-group">
            <label className="toggle-row" style={{ marginBottom: "10px" }}>
              <span>
                <strong>Рассматриваю только грант</strong>
                <small>Исключить платное обучение</small>
              </span>
              <input
                type="checkbox"
                checked={simProfile.onlyGrant}
                onChange={(e) => patchSim({ onlyGrant: e.target.checked })}
              />
              <i />
            </label>

            {!simProfile.onlyGrant && (
              <>
                <div className="control-header">
                  <label htmlFor="sim-budget">Годовой бюджет</label>
                  <strong className="control-value">{formatMoney(simProfile.budget)} / год</strong>
                </div>
                <input
                  id="sim-budget"
                  type="range"
                  min="1000000"
                  max="6000000"
                  step="250000"
                  value={simProfile.budget}
                  onChange={(e) => patchSim({ budget: Number(e.target.value) })}
                  className="range-slider"
                />
                <div className="slider-ticks">
                  <span>1 млн ₸</span>
                  <span>2.5 млн ₸</span>
                  <span>4 млн ₸</span>
                  <span>6 млн ₸</span>
                </div>
              </>
            )}
          </div>

          {/* Preferred City */}
          <div className="control-group">
            <label>Приоритетные города РК</label>
            <div className="city-toggle-grid">
              {(["Астана", "Алматы", "Каскелен", "Караганда", "Шымкент", "Любой город Казахстана"] as City[]).map((city) => {
                const active = simProfile.preferredCities.includes(city);
                return (
                  <button
                    key={city}
                    className={`city-toggle-btn ${active ? "active" : ""}`}
                    onClick={() => {
                      if (city === "Любой город Казахстана") {
                        patchSim({ preferredCities: ["Любой город Казахстана"] });
                      } else {
                        const next = active
                          ? simProfile.preferredCities.filter((c) => c !== city)
                          : [...simProfile.preferredCities.filter((c) => c !== "Любой город Казахстана"), city];
                        patchSim({ preferredCities: next.length === 0 ? ["Любой город Казахстана"] : next });
                      }
                    }}
                  >
                    {active && <CheckIcon size={12} />} {city}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="apply-section">
            <button className="button primary full-width" onClick={applyChanges}>
              Применить симуляцию к профилю <Chevron />
            </button>
          </div>
        </div>

        {/* Results Comparison Side */}
        <div className="what-if-results">
          {/* Delta Banner */}
          <div className="diff-banner card-glass">
            <div className="diff-header">
              <span className="diff-kicker">СРАВНЕНИЕ РЕЗУЛЬТАТОВ</span>
              <span className={`diff-pill ${delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral"}`}>
                {delta > 0 ? `+${delta}% совместимости` : delta < 0 ? `${delta}%` : "Без изменений"}
              </span>
            </div>

            <div className="before-after-cards">
              {/* CURRENT */}
              <div className="state-card current-state">
                <span className="state-badge">ТЕКУЩИЙ ПРОФИЛЬ</span>
                <div className="state-header">
                  <span className="uni-mark">{currentTop.program.shortName.slice(0, 2)}</span>
                  <div>
                    <h4>{currentTop.program.university}</h4>
                    <p>{currentTop.program.program}</p>
                  </div>
                </div>
                <div className="state-score-row">
                  <ScoreRing value={currentTop.score} size="small" />
                  <div className="state-meta">
                    <span>{currentTop.program.tuitionLabel}</span>
                    <small>{currentTop.program.city}</small>
                  </div>
                </div>
              </div>

              <div className="diff-arrow">→</div>

              {/* SIMULATED */}
              <div className="state-card simulated-state">
                <span className="state-badge sim">СИМУЛЯЦИЯ</span>
                <div className="state-header">
                  <span className="uni-mark">{simulatedTop.program.shortName.slice(0, 2)}</span>
                  <div>
                    <h4>{simulatedTop.program.university}</h4>
                    <p>{simulatedTop.program.program}</p>
                  </div>
                </div>
                <div className="state-score-row">
                  <ScoreRing value={simulatedTop.score} size="small" />
                  <div className="state-meta">
                    <strong className="text-accent">{simulatedTop.program.tuitionLabel}</strong>
                    <small>{simulatedTop.program.city}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Program Impact Highlights */}
            {comparison.unlockedPrograms.length > 0 && (
              <div className="impact-callout unlocked">
                <CheckIcon size={16} />
                <div>
                  <strong>Новые открытые возможности:</strong>
                  <p>
                    С симулированными параметрами программы{" "}
                    <b>{comparison.unlockedPrograms.join(", ")}</b> теперь доступны по твоим критериям отбора!
                  </p>
                </div>
              </div>
            )}

            {comparison.newlyRestrictedPrograms.length > 0 && (
              <div className="impact-callout restricted">
                <span>!</span>
                <div>
                  <strong>Ограничения по стоимости:</strong>
                  <p>
                    Программы <b>{comparison.newlyRestrictedPrograms.join(", ")}</b> потребуют грантовой траектории или повышенного балла ЕНТ.
                  </p>
                </div>
              </div>
            )}
          </div>

            {/* Gemini AI Strategic Advice */}
            <div style={{ marginTop: "16px", marginBottom: "16px" }}>
              <button
                className="button small"
                style={{
                  background: "linear-gradient(135deg, #fe7505, #e24012)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "999px",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  padding: "8px 18px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(254, 117, 5, 0.25)",
                  width: "100%",
                  justifyContent: "center"
                }}
                disabled={aiLoading}
                onClick={handleAskGeminiScenario}
              >
                ✨ {aiLoading ? t("whatIf.aiLoading") : t("whatIf.aiButton")}
              </button>

              {aiAnalysis && (
                <div
                  style={{
                    marginTop: "12px",
                    background: "#040915",
                    color: "#f7f6f4",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    border: "1px solid rgba(254, 117, 5, 0.3)",
                    boxShadow: "0 8px 24px rgba(4, 9, 21, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#fe7505", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <span>⚡ {t("ai.expertise")}</span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>
                </div>
              )}
            </div>

            {/* Top simulated matches table */}
          <div className="simulated-ranking card-glass">
            <h3>Топ программ по симулированному профилю</h3>
            <div className="sim-ranking-list">
              {matchPrograms(simProfile)
                .slice(0, 4)
                .map((match, idx) => (
                  <div className="sim-rank-item" key={match.program.id}>
                    <span className="rank-num">0{idx + 1}</span>
                    <span className="uni-mark small">{match.program.shortName.slice(0, 2)}</span>
                    <div className="sim-info">
                      <strong>{match.program.university}</strong>
                      <p>{match.program.program} • {match.program.city}</p>
                    </div>
                    <div className="sim-tuition">
                      <span>{match.program.tuitionLabel}</span>
                    </div>
                    <ScoreRing value={match.score} size="tiny" />
                    <button
                      className="button subtle small"
                      onClick={() => onViewProgram(match.program.id)}
                    >
                      Подробнее
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
