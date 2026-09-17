export type Interest =
  | "computer-science"
  | "data-science"
  | "software-engineering"
  | "cybersecurity";

export type City = "Астана" | "Алматы" | "Каскелен" | "Любой город";

export type StudentProfile = {
  name: string;
  grade: "10" | "11" | "Выпускник";
  homeCity: string;
  enrollmentYear: 2027 | 2028;
  interest: Interest;
  favoriteSubjects: string[];
  gpa: number;
  unt?: number;
  ielts?: number;
  preferredCities: City[];
  budget: number;
  scholarshipImportant: boolean;
  language: "Английский" | "Русский / казахский" | "Неважно";
  careerFocus: "Практика" | "Исследования" | "Стартапы" | "Неважно";
};
export type Confidence = "verified" | "previous-year" | "demo";

export type Source = {
  label: string;
  url: string;
};

export type Program = {
  id: string;
  university: string;
  shortName: string;
  program: string;
  code: string;
  city: Exclude<City, "Любой город">;
  duration: string;
  language: "Английский" | "Русский / казахский" | "Смешанный";
  interests: Interest[];
  highlights: string[];
  tuitionKzt: number;
  tuitionLabel: string;
  tuitionYear: string;
  tuitionConfidence: Confidence;
  untPaid?: number;
  untGrant?: number;
  gpaMinimum?: number;
  ielts?: number;
  alternativeEnglishExam?: boolean;
  scholarship: boolean;
  careerFocus: Array<Exclude<StudentProfile["careerFocus"], "Неважно">>;
  source: Source;
  requirementsSource?: Source;
  dataNote?: string;
};

export type ScoreBreakdown = {
  academic: number;
  program: number;
  budget: number;
  language: number;
  location: number;
  preferences: number;
};

export type Match = {
  program: Program;
  score: number;
  breakdown: ScoreBreakdown;
  reasons: string[];
  gaps: string[];
};

export type RoadmapTask = {
  id: string;
  category: "profile" | "exam" | "documents" | "application";
  title: string;
  description: string;
  dateLabel: string;
  dateType: "personal" | "official" | "check";
  priority: "high" | "medium" | "low";
  reason: string;
};
