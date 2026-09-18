import React, { useState } from "react";
import type { Match, Program, StudentProfile } from "@/lib/types";
import { formatMoney, categorizeProgram } from "@/lib/matching";
import { ScoreRing } from "@/components/ui/score-ring";
import { ConfidenceBadge, CategoryBadge } from "@/components/ui/confidence-badge";
import { CheckIcon, CloseIcon, ExternalLinkIcon, MapPinIcon, BookmarkIcon } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";

export function UniversityModal({
  program,
  match,
  profile,
  isShortlisted,
  isTarget,
  onClose,
  onToggleShortlist,
  onSetTarget,
}: {
  program: Program;
  match?: Match;
  profile: StudentProfile;
  isShortlisted: boolean;
  isTarget: boolean;
  onClose: () => void;
  onToggleShortlist: () => void;
  onSetTarget: () => void;
}) {
  const { t, locale } = useI18n();
  const category = match ? categorizeProgram(profile, match) : "target";
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvisorText, setAiAdvisorText] = useState<string | null>(null);

  const handleAskGemini = async () => {
    try {
      setAiLoading(true);
      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-uniflow-locale": locale },
        body: JSON.stringify({
          taskType: "why_fits",
          locale,
          studentProfile: profile,
          targetProgram: {
            id: program.id,
            name: program.program,
            university: program.university,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAdvisorText(data.response);
      } else {
        setAiAdvisorText(data.error || t("results.aiError"));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("results.aiError");
      setAiAdvisorText(`${t("ai.connectionError")}: ${message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="uni-mark large">{program.shortName.slice(0, 2)}</span>
            <div>
              <div className="modal-eyebrow">
                <span className="location-tag"><MapPinIcon size={14} /> {program.city}, Казахстан</span>
                <span>•</span>
                <span>{program.duration}</span>
                <span>•</span>
                <span className="lang-tag">Язык: {program.language}</span>
              </div>
              <h2>{program.university}</h2>
              <p className="modal-program-name">
                {program.program} <span className="program-code">{program.code}</span>
              </p>
            </div>
          </div>
          <button className="icon-button close-button" onClick={onClose} aria-label={t("modal.close")}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Niche-style Top Metrics Bar */}
          <div className="modal-metrics-bar">
            {match && (
              <div className="metric-box fit-highlight">
                <ScoreRing value={match.score} size="small" />
                <div>
                  <small>Совместимость</small>
                  <strong>{match.score}% соответствие</strong>
                  <CategoryBadge category={category} />
                </div>
              </div>
            )}
            <div className="metric-box">
              <small>Стоимость обучения</small>
              <strong>{program.tuitionLabel}</strong>
              <ConfidenceBadge confidence={program.tuitionConfidence} />
            </div>
            {program.livingCostEstimateKzt && (
              <div className="metric-box">
                <small>Ориентир проживания</small>
                <strong>~{formatMoney(program.livingCostEstimateKzt)} / мес</strong>
                <span className="metric-sub">Общежитие / питание</span>
              </div>
            )}
            {program.employmentRate && (
              <div className="metric-box">
                <small>Трудоустройство</small>
                <strong className="text-accent">{program.employmentRate}</strong>
                <span className="metric-sub">{program.acceptanceRateEstimate || "Селективный приём"}</span>
              </div>
            )}
          </div>

          {/* UNT Combinations Pill Row */}
          <div className="unt-comb-badge-row">
            <span>Профильные предметы ЕНТ для этой программы:</span>
            <div className="comb-tags">
              {program.untCombinations.map((comb) => (
                <strong key={comb} className="comb-tag">
                  {comb}
                </strong>
              ))}
            </div>
          </div>

          {/* Fit Reasons and Gaps */}
          {match && (
            <div className="modal-section match-analysis">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ margin: 0 }}>Объективная диагностика профиля</h3>
                <button
                  className="button small"
                  style={{
                    background: "linear-gradient(135deg, #fe7505, #e24012)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "12px",
                    padding: "6px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(254, 117, 5, 0.25)"
                  }}
                  disabled={aiLoading}
                  onClick={handleAskGemini}
                >
                  ✨ {aiLoading ? t("ai.loading") : t("ai.ask")}
                </button>
              </div>

              {aiAdvisorText && (
                <div
                  style={{
                    background: "#040915",
                    color: "#f7f6f4",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    border: "1px solid rgba(254, 117, 5, 0.3)",
                    boxShadow: "0 8px 24px rgba(4, 9, 21, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#fe7505", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <span>⚡ {t("ai.expertise")}</span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{aiAdvisorText}</div>
                </div>
              )}

              <div className="analysis-grid">
                <div className="analysis-card positive">
                  <h4>✓ Почему подходит твоему выбору</h4>
                  <ul>
                    {match.reasons.map((r) => (
                      <li key={r}>
                        <CheckIcon size={14} /> <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="analysis-card attention">
                  <h4>! На что обратить внимание</h4>
                  {match.gaps.length > 0 ? (
                    <ul>
                      {match.gaps.map((g) => (
                        <li key={g}>
                          <span className="gap-bullet">!</span> <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="clean-status">У тебя нет критических несовпадений по требованиям этой программы.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Checklist of Requirements */}
          <div className="modal-section">
            <h3>Чек-лист официальных требований к абитуриенту</h3>
            <div className="requirements-checklist">
              {program.requirementsChecklist && program.requirementsChecklist.length > 0 ? (
                program.requirementsChecklist.map((req, i) => (
                  <div className="checklist-item" key={i}>
                    <span className={`check-badge ${req.isMandatory ? "mandatory" : "optional"}`}>
                      {req.isMandatory ? "Обязательно" : "Рекомендуется"}
                    </span>
                    <div>
                      <strong>{req.label}</strong>
                      <p>{req.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="checklist-item">
                  <span className="check-badge mandatory">Обязательно</span>
                  <div>
                    <strong>Сертификат ЕНТ и аттестат</strong>
                    <p>Порог: {program.untPaid ?? 65}+ баллов</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Reviews / Niche style quotes */}
          {program.reviews && program.reviews.length > 0 && (
            <div className="modal-section">
              <h3>Отзывы студентов и выпускников</h3>
              <div className="reviews-grid">
                {program.reviews.map((rev, i) => (
                  <div className="review-card" key={i}>
                    <div className="review-head">
                      <strong>{rev.author}</strong>
                      <span className="review-course">{rev.course}</span>
                      <span className="review-rating">★ {rev.rating}</span>
                    </div>
                    <p className="review-quote">«{rev.quote}»</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scholarship & Campus Information */}
          <div className="modal-section two-col">
            <div className="info-card">
              <h4>Гранты и финансирование</h4>
              <p>{program.scholarshipDetails || "Доступны государственные гранты МОН РК по конкурсу ЕНТ."}</p>
              {program.untGrant && (
                <div className="grant-target">
                  <span>Рекомендуемый ориентир ЕНТ для гранта:</span>
                  <strong>{program.untGrant}+ баллов</strong>
                </div>
              )}
            </div>
            <div className="info-card">
              <h4>Кампус и студенческая инфраструктура</h4>
              <p>{program.campusInfo || "Современная академическая среда с лабораториями и общежитиями."}</p>
              {program.applicationDeadlineEstimate && (
                <div className="grant-target">
                  <span>Ориентир дедлайна приёма:</span>
                  <strong>{program.applicationDeadlineEstimate}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Official Transparency Notice */}
          <div className="transparency-callout">
            <div>
              <strong>Честность и прозрачность данных</strong>
              <p>
                Uniflow агрегирует официальные тарифы и критерии ({program.tuitionYear}). Финальные даты заседаний приёмных комиссий и распределения грантов сверяй на официальном портале вуза.
              </p>
            </div>
            <a
              href={program.source.url}
              target="_blank"
              rel="noreferrer"
              className="button outline small external-link-btn"
            >
              Сайт {program.shortName} <ExternalLinkIcon size={14} />
            </a>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-footer">
          <button
            className={`button ${isShortlisted ? "secondary" : "outline"}`}
            onClick={onToggleShortlist}
          >
            <BookmarkIcon filled={isShortlisted} size={16} />
            {isShortlisted ? "В шорт-листе" : "Добавить в шорт-лист"}
          </button>
          <button
            className={`button ${isTarget ? "dark disabled" : "primary"}`}
            disabled={isTarget}
            onClick={() => {
              onSetTarget();
              onClose();
            }}
          >
            {isTarget ? "Выбрано главной целью" : "Выбрать целью и открыть Roadmap →"}
          </button>
        </div>
      </div>
    </div>
  );
}
