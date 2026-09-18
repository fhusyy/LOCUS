import React from "react";
import type { Match, StudentProfile, ShortlistItem, ApplicationItem } from "@/lib/types";
import { formatMoney, profileReadiness, buildRoadmap } from "@/lib/matching";
import { ScoreRing } from "@/components/ui/score-ring";
import { CheckIcon, SparkIcon, Chevron, BookmarkIcon, SlidersIcon } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";

export function DashboardView({
  profile,
  topMatches,
  targetMatch,
  shortlist,
  completedTasks,
  onNavigate,
  onToggleTask,
  onViewProgram,
  onEditProfile,
}: {
  profile: StudentProfile;
  topMatches: Match[];
  targetMatch: Match;
  shortlist: ShortlistItem[];
  completedTasks: string[];
  onNavigate: (screen: any) => void;
  onToggleTask: (taskId: string) => void;
  onViewProgram: (programId: string) => void;
  onEditProfile: () => void;
}) {
  const { t } = useI18n();
  const readiness = profileReadiness(profile);
  const tasks = buildRoadmap(profile, targetMatch);
  const nextTask = tasks.find((t) => !completedTasks.includes(t.id));
  const progressPercent = Math.round(
    (completedTasks.filter((id) => tasks.some((t) => t.id === id)).length / Math.max(1, tasks.length)) * 100
  );

  return (
    <div className="dashboard-overview container">
      {/* Top Banner */}
      <div className="dash-hero-card card-glass">
        <div className="dash-hero-content">
          <div className="dash-greeting">
            <span className="eyebrow-pill">
              <SparkIcon size={14} /> {t("dashboard.kicker")}
            </span>
            <h1>
              {t("dashboard.hello", { name: profile.name || "future student" })}
            </h1>
            <p className="dash-sub">
              Твой персональный вектор: <b>{targetMatch.program.university}</b> ({targetMatch.program.program}). Мы
              отслеживаем твои шаги до подачи документов.
            </p>
          </div>

          <div className="dash-stat-badges">
            <div className="stat-badge">
              <span className="stat-num">{progressPercent}%</span>
              <span className="stat-label">Готовность плана</span>
            </div>
            <div className="stat-badge">
              <span className="stat-num">{shortlist.length}</span>
              <span className="stat-label">В шорт-листе</span>
            </div>
            <div className="stat-badge">
              <span className="stat-num">{targetMatch.score}%</span>
              <span className="stat-label">Совместимость</span>
            </div>
          </div>
        </div>

        {/* Next Action Banner */}
        {nextTask ? (
          <div className="dash-next-action-card">
            <div className="action-tag">СЛЕДУЮЩИЙ ШАГ ПОДГОТОВКИ</div>
            <div className="action-main">
              <div className="action-info">
                <h3>{nextTask.title}</h3>
                <p>{nextTask.description}</p>
                <span className="action-deadline">🗓 {nextTask.dateLabel}</span>
              </div>
              <button className="button primary" onClick={() => onToggleTask(nextTask.id)}>
                <CheckIcon size={16} /> Отметить выполненным
              </button>
            </div>
          </div>
        ) : (
          <div className="dash-next-action-card complete">
            <div className="action-tag">ВСЕ ШАГИ ВЫПОЛНЕНЫ</div>
            <div className="action-main">
              <div>
                <h3>Все текущие контрольные точки пройдены!</h3>
                <p>Проверь официальный статус в приёмной комиссии {targetMatch.program.shortName}.</p>
              </div>
              <button className="button outline" onClick={() => onNavigate("roadmap")}>
                Открыть полный Roadmap
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target University Highlight Card */}
      <div className="dash-split-grid">
        <div className="card-glass target-highlight-card">
          <div className="section-head-sm">
            <span>ЦЕЛЕВАЯ ПРОГРАММА</span>
            <button className="text-button" onClick={() => onNavigate("roadmap")}>
              Вся дорожная карта <Chevron size={14} />
            </button>
          </div>

          <div className="target-uni-row">
            <span className="uni-mark large">{targetMatch.program.shortName.slice(0, 2)}</span>
            <div className="target-details">
              <h3>{targetMatch.program.university}</h3>
              <p className="target-prog-name">{targetMatch.program.program}</p>
              <div className="meta-chips">
                <span>{targetMatch.program.city}</span>
                <span>{targetMatch.program.tuitionLabel}</span>
                <span>ЕНТ {targetMatch.program.untPaid ?? 70}+</span>
              </div>
            </div>
            <ScoreRing value={targetMatch.score} size="normal" />
          </div>

          <div className="target-actions-row">
            <button
              className="button outline small"
              onClick={() => onViewProgram(targetMatch.program.id)}
            >
              Подробный профиль вуза
            </button>
            <button
              className="button subtle small"
              onClick={() => onNavigate("what-if")}
            >
              <SlidersIcon size={14} /> Что если изменить баллы?
            </button>
          </div>
        </div>

        {/* Readiness Profile Quick Summary */}
        <div className="card-glass readiness-summary-card">
          <div className="section-head-sm">
            <span>ДИАГНОСТИКА ПРОФИЛЯ</span>
            <button className="text-button" onClick={onEditProfile}>
              ✎ Изменить
            </button>
          </div>

          <div className="readiness-flex">
            <ScoreRing value={readiness} size="normal" />
            <div>
              <strong>{readiness >= 80 ? "Уверенная академическая база" : "Есть понятные зоны роста"}</strong>
              <p>
                ЕНТ: {profile.unt ? `${profile.unt} баллов` : "не указан"} • GPA: {profile.gpa}/5 • IELTS:{" "}
                {profile.ielts ? profile.ielts : "не сдан"}
              </p>
              <small className="budget-line">Лимит бюджета: {formatMoney(profile.budget)} в год</small>
            </div>
          </div>

          <div className="quick-nav-tiles">
            <button className="quick-tile" onClick={() => onNavigate("results")}>
              Топ рекомендации ({topMatches.length})
            </button>
            <button className="quick-tile" onClick={() => onNavigate("explore")}>
              Каталог программ
            </button>
            <button className="quick-tile" onClick={() => onNavigate("compare")}>
              Сравнить вузы
            </button>
            <button className="quick-tile" onClick={() => onNavigate("shortlist")}>
              Шорт-лист ({shortlist.length})
            </button>
          </div>
        </div>
      </div>

      {/* Recommended for You Section */}
      <div className="dash-recommendations-preview">
        <div className="preview-heading">
          <div>
            <h2>{t("dashboard.recommendations")}</h2>
            <p>Диверсифицированный топ лучших университетов Казахстана под твои параметры.</p>
          </div>
          <button className="button outline small" onClick={() => onNavigate("results")}>
            Смотреть полную диагностику <Chevron size={14} />
          </button>
        </div>

        <div className="dash-cards-grid">
          {topMatches.slice(0, 3).map((match, index) => (
            <div className="dash-match-card card-glass" key={match.program.id}>
              <div className="match-card-head">
                <span className="uni-mark">{match.program.shortName.slice(0, 2)}</span>
                <span className="rank-tag">#{index + 1} мэтч</span>
                <ScoreRing value={match.score} size="tiny" />
              </div>

              <h4>{match.program.university}</h4>
              <p className="dash-prog-name">{match.program.program}</p>

              <div className="dash-card-reasons">
                <p>
                  <CheckIcon size={12} /> {match.reasons[0]}
                </p>
              </div>

              <div className="dash-card-foot">
                <span>{match.program.tuitionLabel}</span>
                <button
                  className="button subtle small"
                  onClick={() => onViewProgram(match.program.id)}
                >
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
