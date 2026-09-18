import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { matchPrograms } from "./matching";
import type { Program, StudentProfile } from "./types";

export type UniversityCatalogEntry = {
  id: string;
  name: string;
  officialNameRu: string;
  city: string;
  region: string;
  focusAreas: string[];
  programs: string[];
  tuitionKztMin?: number;
  tuitionKztMax?: number;
  languages: string[];
  admissionRequirements: string[];
  website?: string;
  detailsSourceUrl?: string;
  registrySourceUrl: string;
  dataStatus: "curated_program_data" | "official_registry_only";
  lastVerified: string;
};

export type UniversityCandidate = UniversityCatalogEntry & {
  matchScore?: number;
  matchedPrograms: Array<{
    id: string;
    name: string;
    score: number;
    tuition: string;
    language: string;
    reasons: string[];
    gaps: string[];
  }>;
};

const catalogPath = path.join(process.cwd(), "data", "kazakhstan-universities.csv");

const programUniversityAliases: Record<string, string> = {
  "Astana IT University": "aitu",
  "Kazakh-British Technical University": "kbtu",
  "International Information Technology University": "iitu",
  "SDU University": "sdu",
  "Nazarbayev University": "nu",
  "Satbayev University": "satbayev",
  "KIMEP University": "kimep",
  "Al-Farabi Kazakh National University": "kaznu",
  "Maqsut Narikbayev University (KAZGUU)": "mnu",
  "Karaganda Buketov University": "buketov",
  "Auezov South Kazakhstan University": "auezov",
  "Zhubanov Aktobe Regional University": "zhubanov",
  "Asfendiyarov Kazakh National Medical University": "kaznmu",
  "Astana Medical University": "amu",
  "Almaty Management University": "almau",
  "Kazakh Leading Academy of Architecture and Civil Engineering": "iec",
  "Kazakh Ablai Khan University of International Relations and World Languages": "ablaikhan",
};

const interestFocus: Record<string, string[]> = {
  "computer-science": ["it", "computer", "technology"],
  "software-engineering": ["it", "software", "technology"],
  "data-science": ["it", "ai", "data", "natural sciences"],
  cybersecurity: ["it", "cybersecurity"],
  "ai-robotics": ["ai", "robotics", "engineering", "it"],
  "cloud-devops": ["it", "software", "technology"],
  "information-systems": ["it", "information systems", "business"],
  "finance-fintech": ["finance", "business", "economics", "it"],
  fintech: ["finance", "business", "it"],
  "business-mgmt": ["business", "management", "economics"],
  "marketing-digital": ["business", "media", "marketing"],
  economics: ["economics", "business", "finance"],
  "engineering-tech": ["engineering", "technology"],
  "petroleum-mining": ["petroleum", "mining", "engineering"],
  "robotics-mechatronics": ["robotics", "engineering", "technology"],
  "architecture-civil": ["architecture", "civil engineering", "design"],
  "medicine-general": ["medicine", "health"],
  "biomedicine-pharma": ["medicine", "health", "pharmacy", "natural sciences"],
  dentistry: ["medicine", "health"],
  "law-jurisprudence": ["law"],
  "international-relations": ["international relations", "social sciences", "languages"],
  "psychology-hr": ["psychology", "social sciences", "business"],
  "ui-ux-product": ["design", "it", "arts"],
  gamedev: ["it", "design", "arts"],
  "design-multimedia": ["design", "arts", "media"],
  "journalism-media": ["journalism", "media", "humanities"],
  "applied-math": ["natural sciences", "mathematics", "it"],
  "biotech-chemistry": ["natural sciences", "medicine", "agriculture"],
  "linguistics-translation": ["languages", "humanities", "international relations"],
  pedagogy: ["education", "pedagogy"],
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

const splitKnown = (value: string) =>
  value && value !== "unknown" ? value.split("|").map((item) => item.trim()).filter(Boolean) : [];

const optionalNumber = (value: string) => {
  if (!value || value === "unknown") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const optionalText = (value: string) => (value && value !== "unknown" ? value : undefined);

let catalogPromise: Promise<UniversityCatalogEntry[]> | undefined;

export function loadUniversityCatalog(): Promise<UniversityCatalogEntry[]> {
  if (!catalogPromise) {
    catalogPromise = readFile(catalogPath, "utf8").then((raw) => {
      const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
      const headers = parseCsvLine(lines[0]);

      return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

        return {
          id: row.id,
          name: row.name,
          officialNameRu: row.official_name_ru,
          city: row.city,
          region: row.region,
          focusAreas: splitKnown(row.focus_areas),
          programs: splitKnown(row.programs),
          tuitionKztMin: optionalNumber(row.tuition_kzt_min),
          tuitionKztMax: optionalNumber(row.tuition_kzt_max),
          languages: splitKnown(row.languages),
          admissionRequirements: splitKnown(row.admission_requirements),
          website: optionalText(row.website),
          detailsSourceUrl: optionalText(row.details_source_url),
          registrySourceUrl: row.registry_source_url,
          dataStatus: row.data_status as UniversityCatalogEntry["dataStatus"],
          lastVerified: row.last_verified,
        } satisfies UniversityCatalogEntry;
      });
    });
  }

  return catalogPromise;
}

export async function findUniversityForProgram(program: Pick<Program, "university">) {
  const catalog = await loadUniversityCatalog();
  const id = programUniversityAliases[program.university];
  return id ? catalog.find((entry) => entry.id === id) : undefined;
}

function catalogRelevance(entry: UniversityCatalogEntry, profile: StudentProfile) {
  const interests = profile.interests?.length ? profile.interests : profile.interest ? [profile.interest] : [];
  const desiredFocus = new Set(interests.flatMap((interest) => interestFocus[interest] ?? []).map((item) => item.toLowerCase()));
  const entryFocus = entry.focusAreas.map((item) => item.toLowerCase());
  const focusMatches = entryFocus.filter((item) => desiredFocus.has(item)).length;
  const cityMatch =
    profile.preferredCities.includes("Любой город Казахстана") ||
    profile.preferredCities.some((city) => city === entry.city);
  const budgetMatch = entry.tuitionKztMin ? entry.tuitionKztMin <= profile.budget : false;

  return focusMatches * 24 + (cityMatch ? 22 : 0) + (budgetMatch ? 16 : 0) + (entry.programs.length ? 12 : 0);
}

export async function selectUniversityCandidates(profile: StudentProfile, limit = 12): Promise<UniversityCandidate[]> {
  const catalog = await loadUniversityCatalog();
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const candidates = new Map<string, UniversityCandidate>();

  for (const match of matchPrograms(profile)) {
    const catalogId = programUniversityAliases[match.program.university];
    if (!catalogId) continue;
    const entry = byId.get(catalogId);
    if (!entry) continue;

    const existing = candidates.get(catalogId) ?? { ...entry, matchedPrograms: [] };
    existing.matchScore = Math.max(existing.matchScore ?? 0, match.score);
    existing.matchedPrograms.push({
      id: match.program.id,
      name: match.program.program,
      score: match.score,
      tuition: match.program.tuitionLabel,
      language: match.program.language,
      reasons: match.reasons.slice(0, 3),
      gaps: match.gaps.slice(0, 2),
    });
    candidates.set(catalogId, existing);
  }

  const rankedCatalog = [...catalog].sort((left, right) => catalogRelevance(right, profile) - catalogRelevance(left, profile));
  for (const entry of rankedCatalog) {
    if (candidates.size >= limit) break;
    if (!candidates.has(entry.id)) candidates.set(entry.id, { ...entry, matchedPrograms: [] });
  }

  return [...candidates.values()]
    .sort((left, right) => (right.matchScore ?? catalogRelevance(right, profile)) - (left.matchScore ?? catalogRelevance(left, profile)))
    .slice(0, limit);
}
