interface IntentResult {
  isEmergency: boolean;
  priority: number;
  detectedKeywords: string[];
}

const KEYWORD_SCORES: Record<string, number> = {
  // Distress triggers
  tulong: 3,
  help: 3,
  rescue: 3,
  sagipin: 3,
  sos: 3,
  // Disaster types
  baha: 2,
  flood: 2,
  sunog: 2,
  fire: 2,
  lindol: 2,
  stranded: 2,
  naiipit: 2,
  trapped: 2,
  // Children
  bata: 2,
  baby: 2,
  sanggol: 2,
  // Elderly
  matanda: 2,
  lola: 2,
  lolo: 2,
  elderly: 2,
  // Injury or death
  sugatan: 3,
  injured: 3,
  patay: 3,
  dead: 3,
  unconscious: 3,
  // Crowd multipliers
  marami: 1,
  pamilya: 1,
  many: 1,
  family: 1,
};

export function detectIntent(transcript: string): IntentResult {
  const normalized = transcript.toLowerCase();
  const words = normalized.split(/\s+/);
  
  let score = 0;
  const detectedKeywords = new Set<string>();

  for (const word of words) {
    // Basic cleaning of punctuation
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    
    if (KEYWORD_SCORES[cleanWord]) {
      score += KEYWORD_SCORES[cleanWord];
      detectedKeywords.add(cleanWord);
    }
  }

  // Cap priority at 5
  const priority = Math.min(score, 5);

  return {
    isEmergency: score >= 3,
    priority,
    detectedKeywords: Array.from(detectedKeywords),
  };
}

export function detectLocation(transcript: string): boolean {
  // Simple heuristic: checks for common location prepositions or specific place markers
  const markers = [
    "sa ", "nasa ", "brgy", "barangay", "street", "st.", "road", "ave", "city", "lungsod",
    "malapit", "near", "corner", "subdivision", "village", "sitio", "purok", "compound"
  ];
  const lower = transcript.toLowerCase();
  return markers.some(m => lower.includes(m)) || transcript.split(" ").length > 2;
}

export function detectPeopleCount(transcript: string): number | null {
  const lower = transcript.toLowerCase();
  
  // Direct number matching
  const numbers: Record<string, number> = {
    "isa": 1, "dalawa": 2, "tatlo": 3, "apat": 4, "lima": 5, "anim": 6, "pito": 7, "walo": 8, "siyam": 9, "sampu": 10,
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
  };

  for (const [word, val] of Object.entries(numbers)) {
    if (lower.includes(word)) return val;
  }
  
  const digitMatch = transcript.match(/\d+/);
  if (digitMatch) return parseInt(digitMatch[0], 10);

  // Indirect keywords
  if (lower.includes("marami") || lower.includes("pamilya") || lower.includes("kami")) return 4; // Default assumption
  if (lower.includes("ako lang") || lower.includes("mag-isa")) return 1;

  return null;
}

export function detectWaterLevel(transcript: string): string | null {
  const levels = [
    "paa", "ankle", "tuhod", "knee", "bewang", "waist", "dibdib", "chest", "leeg", "neck", "ulo", "head", "bubong", "roof", "taas", "high", "lagpas"
  ];
  const lower = transcript.toLowerCase();
  const found = levels.find(l => lower.includes(l));
  return found || null;
}
