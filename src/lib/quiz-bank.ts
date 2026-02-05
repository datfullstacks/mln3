import { promises as fs } from "fs";
import path from "path";

export type RoundKey = "1" | "2" | "3";

export type PillarKey = "economy" | "politics" | "law" | "culture";

export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  nearCorrect?: number[];
  explanation?: string;
  points: number;
  nearPoints?: number;
  pillar?: PillarKey;
  consequenceCorrect?: string;
  consequenceNear?: string;
  consequenceWrong?: string;
  riskPenalty?: number;
  timeLimitSec?: number;
};

export type QuizBank = {
  updatedAt: string;
  rounds: Record<RoundKey, QuizQuestion[]>;
};

const BANK_PATH = path.join(process.cwd(), "data", "quiz-bank.json");

const emptyBank = (): QuizBank => ({
  updatedAt: new Date().toISOString(),
  rounds: { "1": [], "2": [], "3": [] },
});

const normalizeBank = (data: unknown): QuizBank => {
  if (!data || typeof data !== "object") return emptyBank();
  const parsed = data as Partial<QuizBank>;
  const base = emptyBank();
  if (typeof parsed.updatedAt === "string") base.updatedAt = parsed.updatedAt;
  const rounds = (parsed.rounds ?? {}) as Partial<Record<RoundKey, QuizQuestion[]>>;
  (Object.keys(base.rounds) as RoundKey[]).forEach((key) => {
    if (Array.isArray(rounds[key])) {
      base.rounds[key] = rounds[key] as QuizQuestion[];
    }
  });
  return base;
};

export async function readQuizBank(): Promise<QuizBank> {
  await fs.mkdir(path.dirname(BANK_PATH), { recursive: true });
  try {
    const raw = await fs.readFile(BANK_PATH, "utf8");
    return normalizeBank(JSON.parse(raw));
  } catch {
    const bank = emptyBank();
    await writeQuizBank(bank);
    return bank;
  }
}

export async function writeQuizBank(bank: QuizBank): Promise<void> {
  await fs.mkdir(path.dirname(BANK_PATH), { recursive: true });
  await fs.writeFile(BANK_PATH, `${JSON.stringify(bank, null, 2)}\n`, "utf8");
}
