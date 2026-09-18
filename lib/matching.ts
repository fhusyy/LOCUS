import { programs } from "./programs";
import type { Interest, Match, Program, RoadmapTask, ScoreBreakdown, StudentProfile } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function academicScore(profile: StudentProfile, program: Program) {
  const untTarget = program.untPaid ?? 50;
  const untScore = profile.unt
    ? profile.unt >= untTarget + 20
      ? 100
      : profile.unt >= untTarget
        ? 72 + ((profile.unt - untTarget) / 20) * 28
        : 25 + (profile.unt / untTarget) * 35
    : 50;

  // GPA is on 4.0 scale (standard across KZ colleges/NIS/high schools)
  const gpaTarget = program.gpaMinimum ?? 3.0;
  let gpaScore = 70;
  if (profile.gpa >= 3.8) gpaScore = 100;
  else if (profile.gpa >= 3.5) gpaScore = 88;
  else if (profile.gpa >= gpaTarget) gpaScore = 78;
  else gpaScore = 50 + (profile.gpa / gpaTarget) * 25;

  // Combination fit
  let combBonus = 0;
  if (program.untCombinations.includes(profile.untCombination)) {
    combBonus = 10;
  } else if (profile.untCombination === "Ещё не определился") {
    combBonus = 0;
  } else {
    combBonus = -10;
  }

  return clamp(untScore * 0.65 + gpaScore * 0.25 + combBonus);
}

function budgetScore(profile: StudentProfile, program: Program) {
  if (profile.onlyGrant) {
    if (program.scholarship) {
      if (profile.unt && program.untGrant && profile.unt >= program.untGrant) return 100;
      return 75;
    }
    return 20;
  }

  if (program.tuitionKzt <= profile.budget) return 100;
  const ratio = program.tuitionKzt / profile.budget;
  if (ratio <= 1.15) return 72;
  if (ratio <= 1.35) return 48;
  return program.scholarship && profile.scholarshipImportant ? 35 : 15;
}

function languageScore(profile: StudentProfile, program: Program) {
  if (profile.language === "Неважно") return 90;

  if (profile.language === "Казахский / русский") {
    if (program.language === "Казахский / русский" || program.language === "Смешанный") return 100;
    if (program.alternativeEnglishExam) return 75;
    return 50;
  }

  if (profile.language === "Английский") {
    if (program.language === "Английский") {
      if (!program.ielts) return 100;
      if (profile.ielts && profile.ielts >= program.ielts) return 100;
      return program.alternativeEnglishExam ? 75 : 45;
    }
    if (program.language === "Смешанный") return 80;
    return 40;
  }

  return 70;
}

function locationScore(profile: StudentProfile, program: Program) {
  if (profile.preferredCities.includes("Любой город Казахстана")) return 92;
  return profile.preferredCities.includes(program.city as any) ? 100 : 45;
}

function preferenceScore(profile: StudentProfile, program: Program) {
  let score = profile.careerFocus === "Неважно" || program.careerFocus.includes(profile.careerFocus as any) ? 100 : 65;
  if (profile.scholarshipImportant && program.scholarship) score = Math.min(100, score + 8);
  return score;
}

export function matchPrograms(profile: StudentProfile): Match[] {
  const userInterests: Interest[] =
    profile.interests && profile.interests.length > 0
      ? profile.interests
      : profile.interest
      ? [profile.interest]
      : [];

  return programs
    .map((program) => {
      let programInterestScore = 35;
      if (userInterests.length === 0) {
        programInterestScore = 75;
      } else if (userInterests.includes(program.interests[0])) {
        programInterestScore = 100;
      } else if (program.interests.some((i) => userInterests.includes(i))) {
        programInterestScore = 88;
      } else {
        programInterestScore = 30;
      }

      const breakdown: ScoreBreakdown = {
        academic: academicScore(profile, program),
        program: programInterestScore,
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

      if (breakdown.program >= 90) {
        reasons.push(`Программа точно соответствует выбранной специальности: ${program.program}.`);
      } else if (breakdown.program >= 70) {
        reasons.push(`Программа даёт сильную базу для твоего профессионального направления.`);
      }

      if (program.untCombinations.includes(profile.untCombination)) {
        reasons.push(`Профильные предметы ЕНТ (${profile.untCombination}) подходят для поступления.`);
      }

      if (profile.onlyGrant && program.scholarship) {
        reasons.push(`Доступен конкурс на государственные гранты МОН/Минздрава РК.`);
      } else if (breakdown.budget === 100) {
        reasons.push(`Стоимость (${program.tuitionLabel}) полностью укладывается в твой бюджет.`);
      }

      if (breakdown.location === 100) {
        reasons.push(`Кампус (${program.city}) входит в список твоих приоритетных городов.`);
      }

      if (program.careerFocus.includes(profile.careerFocus as any)) {
        reasons.push(`Карьерная экосистема вуза развивает направление «${profile.careerFocus}».`);
      }

      if (program.ielts && profile.ielts && profile.ielts >= program.ielts) {
        reasons.push(`Твой балл IELTS ${profile.ielts} закрывает языковой порог программы (${program.ielts}).`);
      }

      // Gaps / bottlenecks
      if (profile.onlyGrant && program.untGrant && (!profile.unt || profile.unt < program.untGrant)) {
        gaps.push(`Для гарантированного гранта в ${program.shortName} ориентир ЕНТ — ${program.untGrant}+ баллов.`);
      } else if (breakdown.budget < 70 && !profile.onlyGrant) {
        gaps.push(`Стоимость выше выбранного лимита — потребуется грант МОН РК или внутренняя стипендия.`);
      }

      if (program.untPaid && (!profile.unt || profile.unt < program.untPaid)) {
        gaps.push(`Порог ЕНТ для платного обучения — от ${program.untPaid} баллов.`);
      }

      if (program.ielts && (!profile.ielts || profile.ielts < program.ielts)) {
        gaps.push(
          program.alternativeEnglishExam
            ? `Требуется IELTS ${program.ielts} либо успешная сдача внутреннего вступительного теста вуза.`
            : `Для прямого зачисления необходим официальный IELTS от ${program.ielts}.`,
        );
      }

      if (profile.untCombination !== "Ещё не определился" && !program.untCombinations.includes(profile.untCombination)) {
        gaps.push(`Требуемая комбинация ЕНТ: ${program.untCombinations.join(" или ")}.`);
      }

      return {
        program,
        score,
        breakdown,
        reasons: reasons.slice(0, 4),
        gaps,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function profileReadiness(profile: StudentProfile) {
  let score = 40;
  if (profile.gpa >= 3.5) score += 15;
  if (profile.unt) score += 20;
  if (profile.ielts) score += 10;
  if (profile.preferredCities.length > 0) score += 5;
  if (profile.untCombination !== "Ещё не определился") score += 10;
  return Math.min(100, score);
}

export function buildRoadmap(profile: StudentProfile, match: Match): RoadmapTask[] {
  const targetUnt = match.program.untGrant ?? Math.max(match.program.untPaid ?? 65, 95);
  const tasks: RoadmapTask[] = [
    {
      id: "shortlist",
      category: "profile",
      title: `Зафиксировать шорт-лист и проверить шифр ${match.program.code}`,
      description: `Сравни ${match.program.shortName} (${match.program.program}) с 2–3 альтернативными вузами в шорт-листе.`,
      dateLabel: `Осень ${profile.enrollmentYear - 1} / Зима`,
      dateType: "personal",
      priority: "high",
      reason: "Чёткий список определяет приоритетные предметы подготовки и даты сдачи экзаменов.",
    },
  ];

  if (!profile.ielts || (match.program.ielts && profile.ielts < match.program.ielts)) {
    tasks.push({
      id: "english",
      category: "exam",
      title: match.program.alternativeEnglishExam
        ? `IELTS ${match.program.ielts ?? 5.5}+ либо внутренний экзамен ${match.program.shortName}`
        : `Сдать официальный IELTS ${match.program.ielts}+`,
      description: match.program.alternativeEnglishExam
        ? `В ${match.program.shortName} действует внутреннее тестирование уровня языка перед зачислением.`
        : `Для англоязычной программы требуется сертификат не ниже ${match.program.ielts}.`,
      dateLabel: "До апреля " + profile.enrollmentYear,
      dateType: "personal",
      priority: "high",
      reason: "Языковой сертификат освобождает от обязательных языковых курсов и даёт допуск к лекциям.",
    });
  }

  if (!profile.unt || profile.unt < targetUnt) {
    tasks.push({
      id: "unt",
      category: "exam",
      title: `Подготовка к ЕНТ (${profile.untCombination}): цель ${targetUnt}+`,
      description: `Регулярно проходить пробные тестирования по профильным предметам и подтянуть математическую грамотность.`,
      dateLabel: `Январь – Июнь ${profile.enrollmentYear}`,
      dateType: "personal",
      priority: "high",
      reason: profile.onlyGrant
        ? `Для гранта в ${match.program.shortName} критически важен конкурентный балл ЕНТ.`
        : `Высокий балл ЕНТ гарантирует зачисление и даёт право претендовать на внутренние скидки.`,
    });
  }

  tasks.push(
    {
      id: "documents",
      category: "documents",
      title: "Собрать пакет абитуриента РК (форма 075/у, аттестат, ЭЦП)",
      description: "Удостоверение личности, аттестат с GPA, сертификат ЕНТ, медицинская справка 075/у, карта прививок 063.",
      dateLabel: `Июнь ${profile.enrollmentYear}`,
      dateType: "personal",
      priority: "medium",
      reason: "Электронная подача через eGov/Platonus требует полного пакета отсканированных документов.",
    },
    {
      id: "verify-deadlines",
      category: "application",
      title: `Подача заявления на конкурс грантов МОН РК`,
      description: `Конкурс грантов обычно проходит с 13 по 20 июля. Необходимо указать 4 вуза/образовательные программы.`,
      dateLabel: `13–20 июля ${profile.enrollmentYear}`,
      dateType: "official",
      priority: "high",
      reason: "Официальный республиканский конкурс распределения грантов.",
    },
    {
      id: "apply",
      category: "application",
      title: `Зачисление в ${match.program.shortName}`,
      description: `Подписание договора, подача оригиналов документов и заселение в общежитие / получение студенческого.`,
      dateLabel: `Август ${profile.enrollmentYear}`,
      dateType: "check",
      priority: "medium",
      reason: "Финальный этап поступления перед началом академического года 1 сентября.",
    },
  );

  return tasks;
}

export function formatMoney(value: number) {
  if (value === 0) return "Грант (0 ₸)";
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₸`;
}

export function categorizeProgram(profile: StudentProfile, match: Match): "target" | "reach" | "safety" {
  const isBudgetOk = profile.onlyGrant ? match.program.scholarship : match.program.tuitionKzt <= profile.budget;
  const untTarget = profile.onlyGrant ? (match.program.untGrant ?? 90) : (match.program.untPaid ?? 60);
  const isUntSufficient = !profile.unt || profile.unt >= untTarget;

  if (match.score >= 82 && isBudgetOk && isUntSufficient) {
    return "safety";
  }
  if (match.score >= 68) {
    return "target";
  }
  return "reach";
}

export type WhatIfComparison = {
  currentTop: Match;
  simulatedTop: Match;
  scoreDelta: number;
  unlockedPrograms: string[];
  newlyRestrictedPrograms: string[];
};

export function calculateWhatIf(
  currentProfile: StudentProfile,
  simulatedProfile: StudentProfile
): WhatIfComparison {
  const currentMatches = matchPrograms(currentProfile);
  const simulatedMatches = matchPrograms(simulatedProfile);

  const currentTop = currentMatches[0];
  const simulatedTop = simulatedMatches[0];
  const scoreDelta = simulatedTop.score - currentTop.score;

  const currentAffordable = new Set(
    currentMatches.filter((m) => m.program.tuitionKzt <= currentProfile.budget).map((m) => m.program.id)
  );
  const simAffordable = new Set(
    simulatedMatches.filter((m) => m.program.tuitionKzt <= simulatedProfile.budget).map((m) => m.program.id)
  );

  const unlockedPrograms = simulatedMatches
    .filter((m) => !currentAffordable.has(m.program.id) && simAffordable.has(m.program.id))
    .map((m) => m.program.shortName);

  const newlyRestrictedPrograms = currentMatches
    .filter((m) => currentAffordable.has(m.program.id) && !simAffordable.has(m.program.id))
    .map((m) => m.program.shortName);

  return {
    currentTop,
    simulatedTop,
    scoreDelta,
    unlockedPrograms,
    newlyRestrictedPrograms,
  };
}
