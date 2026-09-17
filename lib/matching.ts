import { programs } from "./programs";
import type { Match, Program, RoadmapTask, ScoreBreakdown, StudentProfile } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function academicScore(profile: StudentProfile, program: Program) {
  const untTarget = program.untPaid ?? 50;
  const untScore = profile.unt
    ? profile.unt >= untTarget + 20
      ? 100
      : profile.unt >= untTarget
        ? 72 + ((profile.unt - untTarget) / 20) * 28
        : 25 + (profile.unt / untTarget) * 35
    : 42;
  const gpaScore = program.gpaMinimum
    ? profile.gpa >= program.gpaMinimum
      ? 100
      : 35 + (profile.gpa / program.gpaMinimum) * 40
    : profile.gpa >= 4.3
      ? 100
      : profile.gpa >= 3.8
        ? 82
        : 65;

  return clamp(untScore * 0.7 + gpaScore * 0.3);
}
function budgetScore(profile: StudentProfile, program: Program) {
  if (program.tuitionKzt <= profile.budget) return 100;
  const ratio = program.tuitionKzt / profile.budget;
  if (ratio <= 1.15) return 72;
  if (ratio <= 1.35) return 48;
  return program.scholarship && profile.scholarshipImportant ? 28 : 12;
}

function languageScore(profile: StudentProfile, program: Program) {
  if (profile.language === "Неважно") return 88;
  if (profile.language === program.language) {
    if (!program.ielts) return 100;
    if (profile.ielts && profile.ielts >= program.ielts) return 100;
    return program.alternativeEnglishExam ? 68 : 35;
  }
  if (program.language === "Смешанный") return 78;
  return 48;
}

function locationScore(profile: StudentProfile, program: Program) {
  if (profile.preferredCities.includes("Любой город")) return 88;
  return profile.preferredCities.includes(program.city) ? 100 : 42;
}

function preferenceScore(profile: StudentProfile, program: Program) {
  let score = profile.careerFocus === "Неважно" || program.careerFocus.includes(profile.careerFocus) ? 100 : 58;
  if (profile.scholarshipImportant && program.scholarship) score = Math.min(100, score + 8);
  return score;
}

export function matchPrograms(profile: StudentProfile): Match[] {
  return programs
    .map((program) => {
      const breakdown: ScoreBreakdown = {
        academic: academicScore(profile, program),
        program: program.interests[0] === profile.interest ? 100 : program.interests.includes(profile.interest) ? 78 : 22,
        budget: budgetScore(profile, program),
        language: languageScore(profile, program),
        location: locationScore(profile, program),
        preferences: preferenceScore(profile, program),
      };
      const score = clamp(
        breakdown.academic * 0.25 +
          breakdown.program * 0.25 +
          breakdown.budget * 0.2 +
          breakdown.language * 0.1 +
          breakdown.location * 0.1 +
          breakdown.preferences * 0.1,
      );

      const reasons: string[] = [];
      const gaps: string[] = [];
      if (breakdown.program >= 90) reasons.push(`Программа точно совпадает с выбранным направлением.`);
      else if (breakdown.program >= 70) reasons.push(`Программа близка к выбранному направлению и оставляет пространство для специализации.`);
      if (breakdown.budget === 100) reasons.push(`Стоимость укладывается в бюджет ${formatMoney(profile.budget)} в год.`);
      if (breakdown.location === 100) reasons.push(`${program.city} входит в список предпочтительных городов.`);
      if (program.ielts && profile.ielts && profile.ielts >= program.ielts) {
        reasons.push(`IELTS ${profile.ielts} соответствует указанному минимуму ${program.ielts}.`);
      }
      if (program.scholarship && profile.scholarshipImportant) reasons.push(`Есть траектория поступления на грант или внутреннюю поддержку.`);

      if (breakdown.budget < 70) gaps.push(`Стоимость выше выбранного бюджета — нужен грант или пересмотр лимита.`);
      if (program.untPaid && (!profile.unt || profile.unt < program.untPaid)) {
        gaps.push(`Нужно подтвердить ЕНТ не ниже ${program.untPaid}.`);
      } else if (program.untGrant && profile.unt && profile.unt < program.untGrant) {
        gaps.push(`Для конкурентной грантовой траектории ориентир — ЕНТ ${program.untGrant}+.`);
      }
      if (program.ielts && (!profile.ielts || profile.ielts < program.ielts)) {
        gaps.push(
          program.alternativeEnglishExam
            ? `IELTS ${program.ielts} либо внутренний экзамен по английскому.`
            : `Нужно получить IELTS не ниже ${program.ielts}.`,
        );
      }

      return { program, score, breakdown, reasons: reasons.slice(0, 4), gaps };
    })
    .sort((a, b) => b.score - a.score);
}

export function profileReadiness(profile: StudentProfile) {
  let score = 38;
  if (profile.gpa) score += 16;
  if (profile.unt) score += 20;
  if (profile.ielts) score += 12;
  if (profile.preferredCities.length) score += 7;
  if (profile.budget) score += 7;
  return Math.min(100, score);
}

export function buildRoadmap(profile: StudentProfile, match: Match): RoadmapTask[] {
  const targetUnt = match.program.untGrant ?? Math.max(match.program.untPaid ?? 50, 90);
  const tasks: RoadmapTask[] = [
    {
      id: "shortlist",
      category: "profile",
      title: "Зафиксировать шорт-лист из 3 программ",
      description: `Сравни ${match.program.shortName} ещё с двумя вариантами и сохрани финальный список.`,
      dateLabel: "До 30 сентября 2026",
      dateType: "personal",
      priority: "high",
      reason: "Шорт-лист определяет, какие экзамены и документы готовить в первую очередь.",
    },
  ];

  if (!profile.ielts || (match.program.ielts && profile.ielts < match.program.ielts)) {
    tasks.push({
      id: "english",
      category: "exam",
      title: match.program.alternativeEnglishExam ? "Выбрать IELTS или внутренний English test" : "Запланировать IELTS",
      description: match.program.ielts
        ? `Цель — IELTS ${match.program.ielts}+ для ${match.program.shortName}.`
        : "Проверь формат внутреннего экзамена и пройди диагностический тест.",
      dateLabel: "Октябрь–декабрь 2026",
      dateType: "personal",
      priority: "high",
      reason: "Результат английского влияет на доступность англоязычной программы.",
    });
  }

  if (!profile.unt || profile.unt < targetUnt) {
    tasks.push({
      id: "unt",
      category: "exam",
      title: `Составить план подготовки к ЕНТ ${targetUnt}+`,
      description: "Проведи пробный тест, найди слабые темы по математике и информатике и заложи 2 контрольные точки.",
      dateLabel: "До 15 октября 2026",
      dateType: "personal",
      priority: "high",
      reason: `Текущий результат ${profile.unt ?? "не указан"}; выбранная траектория требует более сильного балла.`,
    });
  }

  tasks.push(
    {
      id: "documents",
      category: "documents",
      title: "Собрать базовый пакет документов",
      description: "Удостоверение, аттестат с приложением, фото, медицинские формы и сертификаты экзаменов.",
      dateLabel: "Январь–март 2027",
      dateType: "personal",
      priority: "medium",
      reason: "Ранний сбор документов уменьшает риск задержек в приёмной кампании.",
    },
    {
      id: "verify-deadlines",
      category: "application",
      title: "Перепроверить официальные сроки 2027",
      description: `Открой источник ${match.program.shortName} и внеси опубликованные даты в календарь сразу после обновления приёмной кампании.`,
      dateLabel: "Когда вуз опубликует приём 2027",
      dateType: "check",
      priority: "high",
      reason: "Официальные дедлайны набора 2027 ещё могут измениться — сервис не подменяет их прогнозом.",
    },
    {
      id: "apply",
      category: "application",
      title: `Подать заявку в ${match.program.shortName}`,
      description: `Загрузи документы на ${match.program.program} и проверь статус в личном кабинете.`,
      dateLabel: "Срок уточнить на официальном сайте",
      dateType: "check",
      priority: "medium",
      reason: "Финальный шаг после подтверждения требований и дат набора.",
    },
  );

  return tasks;
}

export function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₸`;
}
