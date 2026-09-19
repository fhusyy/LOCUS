import React, { useState } from "react";
import type { Match, Program, StudentProfile, ShortlistItem, ApplicationItem, ApplicationStage } from "@/lib/types";
import { formatMoney, categorizeProgram } from "@/lib/matching";
import { ScoreRing } from "@/components/ui/score-ring";
import { CategoryBadge } from "@/components/ui/confidence-badge";
import { BookmarkIcon, CheckIcon, Chevron, ExternalLinkIcon, MapPinIcon } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";
import { localizeDisplay } from "@/lib/display-localization";

const stagesList: Array<{ key: ApplicationStage; label: string }> = [
  { key: "research", label: "1. Исследование" },
  { key: "documents", label: "2. Сбор документов" },
  { key: "submitted", label: "3. Заявка подана" },
  { key: "enrolled", label: "4. Зачисление / Грант" },
];

export function ShortlistView({
  shortlist,
  applications,
  allMatches,
  profile,
  currentTargetId,
  onRemoveShortlist,
  onUpdateCategory,
  onUpdateStage,
  onSetTarget,
  onViewProgram,
  onExploreMore,
}: {
  shortlist: ShortlistItem[];
  applications: ApplicationItem[];
  allMatches: Match[];
  profile: StudentProfile;
  currentTargetId: string;
  onRemoveShortlist: (programId: string) => void;
  onUpdateCategory: (programId: string, cat: ShortlistItem["category"]) => void;
  onUpdateStage: (programId: string, stage: ApplicationStage) => void;
  onSetTarget: (programId: string) => void;
  onViewProgram: (programId: string) => void;
  onExploreMore: () => void;
}) {
  const { t, tr } = useI18n();
  const [activeTab, setActiveTab] = useState<"shortlist" | "tracker">("shortlist");

  // Map matches to shortlisted programs
  const shortlistedMatches = shortlist
    .map((item) => {
      const match = allMatches.find((m) => m.program.id === item.programId);
      return match ? { item, match } : null;
    })
    .filter(Boolean) as Array<{ item: ShortlistItem; match: Match }>;

  const targetGroup = shortlistedMatches.filter((x) => x.item.category === "target");
  const reachGroup = shortlistedMatches.filter((x) => x.item.category === "reach");
  const safetyGroup = shortlistedMatches.filter((x) => x.item.category === "safety");

  return (
    <div className="shortlist-page container">
      {/* Header */}
      <div className="section-heading-block">
        <div className="eyebrow-pill">
          <BookmarkIcon size={14} /> {t("shortlist.kicker")}
        </div>
        <h1>{t("shortlist.title")}</h1>
        <p className="subtitle">
          {t("shortlist.description")}
        </p>

        {/* View Toggle Tabs */}
        <div className="tab-pill-switcher">
          <button
            className={`tab-pill-btn ${activeTab === "shortlist" ? "active" : ""}`}
            onClick={() => setActiveTab("shortlist")}
          >
            {tr("Портфель программ")} ({shortlist.length})
          </button>
          <button
            className={`tab-pill-btn ${activeTab === "tracker" ? "active" : ""}`}
            onClick={() => setActiveTab("tracker")}
          >
            {tr("Трекер статуса заявок")} ({shortlist.length})
          </button>
        </div>
      </div>

      {shortlistedMatches.length === 0 ? (
        <div className="empty-state-card card-glass">
          <div className="empty-icon" style={{ fontSize: "32px", opacity: 0.3, marginBottom: "12px" }}>—</div>
          <h3>{tr("Твой шорт-лист пока пуст")}</h3>
          <p>
            {tr("Добавляй понравившиеся университеты из Рекомендаций или Каталога, чтобы сравнивать их и отслеживать прогресс.")}
          </p>
          <button className="button primary" onClick={onExploreMore}>
            {tr("Перейти в каталог программ")} <Chevron />
          </button>
        </div>
      ) : activeTab === "shortlist" ? (
        /* SHORTLIST CATEGORIZED VIEW */
        <div className="shortlist-groups">
          {/* Target Group */}
          <section className="portfolio-group">
            <div className="group-heading">
              <span className="dot-indicator target" />
              <h3>{tr("Целевые программы (Target)")} — {targetGroup.length}</h3>
              <p>{tr("Оптимальное соотношение баллов и желаемого направления.")}</p>
            </div>
            {targetGroup.length > 0 ? (
              <div className="portfolio-grid">
                {targetGroup.map(({ item, match }) => (
                  <ShortlistCard
                    key={item.programId}
                    item={item}
                    match={match}
                    isTarget={currentTargetId === item.programId}
                    onRemove={() => onRemoveShortlist(item.programId)}
                    onChangeCat={(c) => onUpdateCategory(item.programId, c)}
                    onSetTarget={() => onSetTarget(item.programId)}
                    onView={() => onViewProgram(item.programId)}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-group-hint">{tr("Нет программ в этой категории. Добавь из каталога.")}</p>
            )}
          </section>

          {/* Reach Group */}
          <section className="portfolio-group">
            <div className="group-heading">
              <span className="dot-indicator reach" />
              <h3>{tr("Амбициозные траектории (Reach)")} — {reachGroup.length}</h3>
              <p>{tr("Высокая конкуренция за грант или повышенные требования к языку/ЕНТ.")}</p>
            </div>
            {reachGroup.length > 0 ? (
              <div className="portfolio-grid">
                {reachGroup.map(({ item, match }) => (
                  <ShortlistCard
                    key={item.programId}
                    item={item}
                    match={match}
                    isTarget={currentTargetId === item.programId}
                    onRemove={() => onRemoveShortlist(item.programId)}
                    onChangeCat={(c) => onUpdateCategory(item.programId, c)}
                    onSetTarget={() => onSetTarget(item.programId)}
                    onView={() => onViewProgram(item.programId)}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-group-hint">{tr("Рекомендуется добавить 1–2 амбициозных варианта для максимизации шансов.")}</p>
            )}
          </section>

          {/* Safety Group */}
          <section className="portfolio-group">
            <div className="group-heading">
              <span className="dot-indicator safety" />
              <h3>{tr("Надёжные варианты (Safety)")} — {safetyGroup.length}</h3>
              <p>{tr("Твой профиль уже сейчас полностью соответствует или превосходит планку поступления.")}</p>
            </div>
            {safetyGroup.length > 0 ? (
              <div className="portfolio-grid">
                {safetyGroup.map(({ item, match }) => (
                  <ShortlistCard
                    key={item.programId}
                    item={item}
                    match={match}
                    isTarget={currentTargetId === item.programId}
                    onRemove={() => onRemoveShortlist(item.programId)}
                    onChangeCat={(c) => onUpdateCategory(item.programId, c)}
                    onSetTarget={() => onSetTarget(item.programId)}
                    onView={() => onViewProgram(item.programId)}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-group-hint">{tr("Добавь хотя бы 1 надёжный вуз для уверенности и спокойствия.")}</p>
            )}
          </section>
        </div>
      ) : (
        /* APPLICATION PIPELINE TRACKER */
        <div className="application-tracker card-glass">
          <div className="tracker-table-header">
            <div className="col-uni">{tr("Университет / Программа")}</div>
            <div className="col-pipeline">{tr("Статус в приёмной комиссии")}</div>
            <div className="col-actions">{tr("Действия")}</div>
          </div>

          <div className="tracker-list">
            {shortlistedMatches.map(({ item, match }) => {
              const app = applications.find((a) => a.programId === item.programId);
              const currentStage = app?.stage ?? "research";
              const stageIndex = stagesList.findIndex((s) => s.key === currentStage);

              return (
                <div className="tracker-row" key={item.programId}>
                  <div className="col-uni">
                    <div className="uni-row-title">
                      <span className="uni-mark small">{match.program.shortName.slice(0, 2)}</span>
                      <div>
                        <strong>{match.program.university}</strong>
                        <p>{match.program.program}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-pipeline">
                    <div className="stage-steps-bar">
                      {stagesList.map((st, idx) => {
                        const isDone = idx < stageIndex;
                        const isCurrent = idx === stageIndex;
                        return (
                          <button
                            key={st.key}
                            className={`stage-step-btn ${isDone ? "done" : ""} ${isCurrent ? "active" : ""}`}
                            onClick={() => onUpdateStage(item.programId, st.key)}
                            title={`${tr("Перевести в статус")}: ${tr(st.label)}`}
                          >
                            <span className="step-circle">{isDone ? <CheckIcon size={12} /> : idx + 1}</span>
                            <span className="step-text">{tr(st.label).replace(/^\d+\.\s*/, "")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="col-actions">
                    <button
                      className="button subtle small"
                      onClick={() => onViewProgram(item.programId)}
                    >
                      {tr("Детали")}
                    </button>
                    {currentTargetId !== item.programId && (
                      <button
                        className="button outline small"
                        onClick={() => onSetTarget(item.programId)}
                        title={tr("Построить персональный roadmap для этой программы")}
                      >
                        {tr("Сделать целью")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ShortlistCard({
  item,
  match,
  isTarget,
  onRemove,
  onChangeCat,
  onSetTarget,
  onView,
}: {
  item: ShortlistItem;
  match: Match;
  isTarget: boolean;
  onRemove: () => void;
  onChangeCat: (cat: ShortlistItem["category"]) => void;
  onSetTarget: () => void;
  onView: () => void;
}) {
  const { tr, locale } = useI18n();
  const ld = (value: string) => localizeDisplay(value, locale);
  return (
    <div className={`portfolio-card card-glass ${isTarget ? "is-target" : ""}`}>
      <div className="card-top-row">
        <span className="uni-mark">{match.program.shortName.slice(0, 2)}</span>
        <div className="card-badges">
          <ScoreRing value={match.score} size="tiny" />
          <button className="remove-card-btn" onClick={onRemove} title={tr("Удалить из шорт-листа")}>
            ✕
          </button>
        </div>
      </div>

      <div className="card-info">
        <small className="card-city">{ld(match.program.city)} • {ld(match.program.duration)}</small>
        <h4>{match.program.university}</h4>
        <p className="card-sub">{match.program.program}</p>

        <div className="price-tag-row">
          <strong>{ld(match.program.tuitionLabel)}</strong>
          {match.program.untGrant && <small>{tr("Грант ЕНТ")} {match.program.untGrant}+</small>}
        </div>
      </div>

      {/* Category selector */}
      <div className="cat-selector-row">
        <label>{tr("Категория:")}</label>
        <select
          value={item.category}
          onChange={(e) => onChangeCat(e.target.value as ShortlistItem["category"])}
        >
          <option value="target">{ld("Целевой (Target)")}</option>
          <option value="reach">{ld("Амбициозный (Reach)")}</option>
          <option value="safety">{ld("Надёжный (Safety)")}</option>
        </select>
      </div>

      <div className="card-bottom-actions">
        <button className="button outline small" onClick={onView}>
          {tr("Подробнее")}
        </button>
        {isTarget ? (
          <span className="target-active-pill">
            <CheckIcon size={14} /> {tr("Главная цель")}
          </span>
        ) : (
          <button className="button primary small" onClick={onSetTarget}>
            {tr("Выбрать целью")}
          </button>
        )}
      </div>
    </div>
  );
}
