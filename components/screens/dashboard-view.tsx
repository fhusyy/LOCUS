import React from "react";
import type { Match, StudentProfile, ShortlistItem, ApplicationItem } from "@/lib/types";
import { formatMoney, profileReadiness, buildRoadmap } from "@/lib/matching";
import { ScoreRing } from "@/components/ui/score-ring";
import { CheckIcon, SparkIcon, Chevron, BookmarkIcon, SlidersIcon } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";
import { localizeDisplay } from "@/lib/display-localization";

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
  const { t, tr, locale } = useI18n();
  const ld = (value: string) => localizeDisplay(value, locale);
  const readiness = profileReadiness(profile);
  const tasks = buildRoadmap(profile, targetMatch);
  const nextTask = tasks.find((t) => !completedTasks.includes(t.id));
  const progressPercent = Math.round(
    (completedTasks.filter((id) => tasks.some((t) => t.id === id)).length / Math.max(1, tasks.length)) * 100
  );
  const localTask = nextTask && locale !== "ru" ? {
    title: nextTask.id === "shortlist" ? (locale === "en" ? `Finalize your shortlist and verify code ${targetMatch.program.code}` : `${targetMatch.program.code} кодын тексеріп, таңдаулы тізімді бекіт`) : nextTask.id === "documents" ? (locale === "en" ? "Collect the applicant document package" : "Талапкер құжаттарының пакетін жина") : nextTask.id === "verify-deadlines" ? (locale === "en" ? "Apply for the state-grant competition" : "Мемлекеттік грант конкурсына өтінім бер") : nextTask.id === "apply" ? (locale === "en" ? `Complete enrollment at ${targetMatch.program.shortName}` : `${targetMatch.program.shortName} ЖОО-сына қабылдануды аяқта`) : nextTask.id === "unt" ? (locale === "en" ? "Prepare for the UNT" : "ҰБТ-ға дайындал") : (locale === "en" ? "Confirm the language requirement" : "Тіл талабын раста"),
    description: nextTask.id === "shortlist" ? (locale === "en" ? "Compare your target with 2–3 alternatives." : "Мақсатты нұсқаны 2–3 балама ЖОО-мен салыстыр.") : nextTask.id === "documents" ? (locale === "en" ? "Prepare your ID, certificate, UNT result, and medical documents." : "Жеке куәлік, аттестат, ҰБТ нәтижесі және медициналық құжаттарды дайында.") : nextTask.id === "verify-deadlines" ? (locale === "en" ? "Submit your university choices for the national grant competition." : "Мемлекеттік грант конкурсына ЖОО таңдауларыңды тапсыр.") : nextTask.id === "apply" ? (locale === "en" ? "Submit originals and sign the enrollment agreement." : "Құжат түпнұсқаларын тапсырып, келісімшартқа қол қой.") : nextTask.id === "unt" ? (locale === "en" ? "Take practice tests and strengthen your core subjects." : "Сынақ тесттерін тапсырып, бейіндік пәндерді күшейт.") : (locale === "en" ? "Pass IELTS or the university internal exam." : "IELTS немесе ЖОО-ның ішкі емтиханын тапсыр."),
  } : nextTask;

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
              {tr("Твой персональный вектор:")} <b>{targetMatch.program.university}</b> ({targetMatch.program.program}). {tr("Мы отслеживаем твои шаги до подачи документов.")}
            </p>
          </div>

          <div className="dash-stat-badges">
            <div className="stat-badge">
              <span className="stat-num">{progressPercent}%</span>
              <span className="stat-label">{tr("Готовность плана")}</span>
            </div>
            <div className="stat-badge">
              <span className="stat-num">{shortlist.length}</span>
              <span className="stat-label">{tr("В шорт-листе")}</span>
            </div>
            <div className="stat-badge">
              <span className="stat-num">{targetMatch.score}%</span>
              <span className="stat-label">{tr("Совместимость")}</span>
            </div>
          </div>
        </div>

        {/* Next Action Banner */}
        {nextTask ? (
          <div className="dash-next-action-card">
            <div className="action-tag">{tr("Следующий шаг подготовки")}</div>
            <div className="action-main">
              <div className="action-info">
                <h3>{localTask?.title}</h3>
                <p>{localTask?.description}</p>
                <span className="action-deadline">🗓 {ld(nextTask.dateLabel)}</span>
              </div>
              <button className="button primary" onClick={() => onToggleTask(nextTask.id)}>
                <CheckIcon size={16} /> {tr("Отметить выполненным")}
              </button>
            </div>
          </div>
        ) : (
          <div className="dash-next-action-card complete">
            <div className="action-tag">{locale === "en" ? "ALL STEPS COMPLETED" : locale === "kk" ? "БАРЛЫҚ ҚАДАМ ОРЫНДАЛДЫ" : "ВСЕ ШАГИ ВЫПОЛНЕНЫ"}</div>
            <div className="action-main">
              <div>
                <h3>{locale === "en" ? "All current milestones are complete!" : locale === "kk" ? "Барлық ағымдағы бақылау қадамдары аяқталды!" : "Все текущие контрольные точки пройдены!"}</h3>
                <p>{locale === "en" ? `Confirm your official status with the ${targetMatch.program.shortName} admissions office.` : locale === "kk" ? `${targetMatch.program.shortName} қабылдау комиссиясынан ресми мәртебеңді нақтыла.` : `Проверь официальный статус в приёмной комиссии ${targetMatch.program.shortName}.`}</p>
              </div>
              <button className="button outline" onClick={() => onNavigate("roadmap")}>
                {locale === "en" ? "Open full roadmap" : locale === "kk" ? "Толық жол картасын ашу" : "Открыть полный Roadmap"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target University Highlight Card */}
      <div className="dash-split-grid">
        <div className="card-glass target-highlight-card">
          <div className="section-head-sm">
            <span>{tr("ЦЕЛЕВАЯ ПРОГРАММА")}</span>
            <button className="text-button" onClick={() => onNavigate("roadmap")}>
              {tr("Вся дорожная карта")} <Chevron size={14} />
            </button>
          </div>

          <div className="target-uni-row">
            <span className="uni-mark large">{targetMatch.program.shortName.slice(0, 2)}</span>
            <div className="target-details">
              <h3>{targetMatch.program.university}</h3>
              <p className="target-prog-name">{targetMatch.program.program}</p>
              <div className="meta-chips">
                <span>{ld(targetMatch.program.city)}</span>
                <span>{ld(targetMatch.program.tuitionLabel)}</span>
                <span>{locale === "kk" ? "ҰБТ" : "UNT"} {targetMatch.program.untPaid ?? 70}+</span>
              </div>
            </div>
            <ScoreRing value={targetMatch.score} size="normal" />
          </div>

          <div className="target-actions-row">
            <button
              className="button outline small"
              onClick={() => onViewProgram(targetMatch.program.id)}
            >
              {tr("Подробный профиль вуза")}
            </button>
            <button
              className="button subtle small"
              onClick={() => onNavigate("what-if")}
            >
              <SlidersIcon size={14} /> {tr("Что если изменить баллы?")}
            </button>
          </div>
        </div>

        {/* Readiness Profile Quick Summary */}
        <div className="card-glass readiness-summary-card">
          <div className="section-head-sm">
            <span>{tr("ДИАГНОСТИКА ПРОФИЛЯ")}</span>
            <button className="text-button" onClick={onEditProfile}>
              ✎ {tr("Изменить")}
            </button>
          </div>

          <div className="readiness-flex">
            <ScoreRing value={readiness} size="normal" />
            <div>
            <strong>{tr(readiness >= 80 ? "Уверенная академическая база" : "Есть понятные зоны роста")}</strong>
              <p>
                {locale === "kk" ? "ҰБТ" : "UNT"}: {profile.unt ? `${profile.unt} ${locale === "en" ? "points" : locale === "kk" ? "балл" : "баллов"}` : (locale === "en" ? "not provided" : locale === "kk" ? "көрсетілмеген" : "не указан")} • GPA: {profile.gpa}/4 • IELTS:{" "}
                {profile.ielts ? profile.ielts : (locale === "en" ? "not taken" : locale === "kk" ? "тапсырылмаған" : "не сдан")}
              </p>
              <small className="budget-line">{locale === "en" ? "Annual budget limit" : locale === "kk" ? "Жылдық бюджет лимиті" : "Лимит бюджета"}: {formatMoney(profile.budget)} {locale === "en" ? "per year" : locale === "kk" ? "жылына" : "в год"}</small>
            </div>
          </div>

          <div className="quick-nav-tiles">
            <button className="quick-tile" onClick={() => onNavigate("results")}>
              {tr("Топ рекомендации")} ({topMatches.length})
            </button>
            <button className="quick-tile" onClick={() => onNavigate("explore")}>
              {tr("Каталог программ")}
            </button>
            <button className="quick-tile" onClick={() => onNavigate("compare")}>
              {tr("Сравнить вузы")}
            </button>
            <button className="quick-tile" onClick={() => onNavigate("shortlist")}>
              {locale === "en" ? "Shortlist" : locale === "kk" ? "Таңдаулы тізім" : "Шорт-лист"} ({shortlist.length})
            </button>
          </div>
        </div>
      </div>

      {/* Recommended for You Section */}
      <div className="dash-recommendations-preview">
        <div className="preview-heading">
          <div>
            <h2>{t("dashboard.recommendations")}</h2>
              <p>{tr("Диверсифицированный топ лучших университетов Казахстана под твои параметры.")}</p>
          </div>
          <button className="button outline small" onClick={() => onNavigate("results")}>
            {tr("Смотреть полную диагностику")} <Chevron size={14} />
          </button>
        </div>

        <div className="dash-cards-grid">
          {topMatches.slice(0, 3).map((match, index) => (
            <div className="dash-match-card card-glass" key={match.program.id}>
              <div className="match-card-head">
                <span className="uni-mark">{match.program.shortName.slice(0, 2)}</span>
                <span className="rank-tag">#{index + 1} {tr("мэтч")}</span>
                <ScoreRing value={match.score} size="tiny" />
              </div>

              <h4>{match.program.university}</h4>
              <p className="dash-prog-name">{match.program.program}</p>

              <div className="dash-card-reasons">
                <p>
                  <CheckIcon size={12} /> {ld(match.reasons[0])}
                </p>
              </div>

              <div className="dash-card-foot">
                <span>{ld(match.program.tuitionLabel)}</span>
                <button
                  className="button subtle small"
                  onClick={() => onViewProgram(match.program.id)}
                >
                  {tr("Подробнее")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
