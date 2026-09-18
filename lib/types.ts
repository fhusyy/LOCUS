export type InterestCategory =
  | "it-ai"
  | "business-finance"
  | "engineering"
  | "medicine-health"
  | "law-social"
  | "design-creative"
  | "natural-sciences"
  | "languages-pedagogy";

export type Interest =
  // IT & AI
  | "computer-science"
  | "software-engineering"
  | "data-science"
  | "cybersecurity"
  | "ai-robotics"
  | "cloud-devops"
  | "information-systems"
  // Business & Finance
  | "finance-fintech"
  | "fintech"
  | "business-mgmt"
  | "marketing-digital"
  | "economics"
  // Engineering & Tech
  | "engineering-tech"
  | "petroleum-mining"
  | "robotics-mechatronics"
  | "architecture-civil"
  // Medicine & Healthcare
  | "medicine-general"
  | "biomedicine-pharma"
  | "dentistry"
  // Law & Social Sciences
  | "law-jurisprudence"
  | "international-relations"
  | "psychology-hr"
  // Design, Media & Creative
  | "ui-ux-product"
  | "gamedev"
  | "design-multimedia"
  | "journalism-media"
  // Natural Sciences & Math
  | "applied-math"
  | "biotech-chemistry"
  // Languages & Education
  | "linguistics-translation"
  | "pedagogy";

export type City =
  | "Астана"
  | "Алматы"
  | "Каскелен"
  | "Караганда"
  | "Шымкент"
  | "Актобе"
  | "Усть-Каменогорск"
  | "Павлодар"
  | "Костанай"
  | "Семей"
  | "Атырау"
  | "Любой город Казахстана"
  | "Мюнхен (Германия)"
  | "Милан (Италия)"
  | "Тэджон (Южная Корея)";

export type UntCombination =
  | "Математика + Информатика"
  | "Математика + Физика"
  | "Математика + География"
  | "Биология + Химия"
  | "Биология + География"
  | "Иностранный язык + Всемирная история"
  | "Всемирная история + Основы права"
  | "Творческий экзамен"
  | "Ещё не определился";

export type CareerFocus =
  | "Big Tech & Релокейт"
  | "Стартапы & Предпринимательство"
  | "Стартапы & Astana Hub"
  | "Финтех & Банки (Kaspi/Halyk)"
  | "Наука & R&D (ИИ лаборатории)"
  | "Кибербезопасность & SOC"
  | "Медицина & Здравоохранение"
  | "Юриспруденция & Международное право"
  | "Геймдев & Креатив"
  | "Креативные индустрии & Дизайн"
  | "Корпоративный сектор & Big 4"
  | "Удалёнка на США/Европу"
  | "Неважно";

export type StudentProfile = {
  name: string;
  grade: "9" | "10" | "11" | "Выпускник школы" | "Студент колледжа";
  homeCity: string;
  enrollmentYear: 2027 | 2028 | 2029 | 2030;
  interests: Interest[]; // up to 3 directions
  interest?: Interest; // for backward compatibility
  untCombination: UntCombination;
  favoriteSubjects: string[];
  gpa: number; // 4.0 scale standard in KZ (2.0 - 4.0)
  unt?: number; // 0 - 140
  ielts?: number; // 0 - 9.0
  sat?: number; // 400 - 1600
  preferredCities: City[];
  preferredCountries?: string[];
  budget: number;
  onlyGrant: boolean;
  scholarshipImportant: boolean;
  language: "Казахский / русский" | "Английский" | "Неважно";
  careerFocus: CareerFocus;
  dormitoryNeeded?: boolean;
  militaryDepartment?: boolean;
};

export type Confidence = "verified" | "previous-year" | "demo";

export type Source = {
  label: string;
  url: string;
};

export type RequirementItem = {
  label: string;
  description: string;
  isMandatory: boolean;
};

export type StudentReview = {
  author: string;
  course: string;
  quote: string;
  rating: number;
};

export type Program = {
  id: string;
  university: string;
  shortName: string;
  program: string;
  code: string;
  city: City;
  country?: string;
  duration: string;
  language: "Казахский / русский" | "Английский" | "Смешанный";
  category?: InterestCategory;
  interests: Interest[];
  untCombinations: UntCombination[];
  highlights: string[];
  tuitionKzt: number;
  tuitionLabel: string;
  tuitionYear: string;
  tuitionConfidence: Confidence;
  untPaid?: number;
  untGrant?: number;
  gpaMinimum?: number; // on 4.0 scale
  ielts?: number;
  satRequirement?: number;
  alternativeEnglishExam?: boolean;
  scholarship: boolean;
  scholarshipDetails?: string;
  livingCostEstimateKzt?: number;
  applicationDeadlineEstimate?: string;
  campusInfo?: string;
  employmentRate?: string;
  acceptanceRateEstimate?: string;
  dormitoryAvailable?: boolean;
  militaryDepartmentAvailable?: boolean;
  reviews?: StudentReview[];
  requirementsChecklist?: RequirementItem[];
  careerFocus: Array<Exclude<CareerFocus, "Неважно">>;
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

export type ShortlistCategory = "target" | "reach" | "safety";

export type ShortlistItem = {
  programId: string;
  category: ShortlistCategory;
  addedAt: string;
  notes?: string;
};

export type ApplicationStage = "research" | "documents" | "submitted" | "enrolled";

export type ApplicationItem = {
  programId: string;
  stage: ApplicationStage;
  updatedAt: string;
  completedTasks: string[];
};
