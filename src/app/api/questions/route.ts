import { NextResponse } from "next/server";
import { readQuizBank, writeQuizBank, type RoundKey } from "@/lib/quiz-bank";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUND_KEYS = new Set<RoundKey>(["1", "2", "3"]);
const PILLAR_KEYS = new Set(["economy", "politics", "law", "culture"]);

export async function GET(request: Request) {
  const bank = await readQuizBank();
  const { searchParams } = new URL(request.url);
  const roundParam = searchParams.get("round");
  const roundKey = roundParam as RoundKey | null;
  if (roundKey && ROUND_KEYS.has(roundKey)) {
    return NextResponse.json({ round: roundKey, questions: bank.rounds[roundKey] ?? [] });
  }
  return NextResponse.json(bank);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const round = typeof body.round === "string" ? body.round.trim() : "";
  if (!ROUND_KEYS.has(round)) {
    return NextResponse.json({ error: "Invalid round." }, { status: 400 });
  }
  const roundKey = round as RoundKey;

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const optionsInput: unknown[] = Array.isArray(body.options) ? body.options : [];
  const options = optionsInput
    .filter((option: unknown): option is string => typeof option === "string")
    .map((option) => option.trim())
    .filter((option) => option.length > 0);

  if (!text || options.length < 2) {
    return NextResponse.json(
      { error: "Question text and at least 2 options are required." },
      { status: 400 }
    );
  }

  const correctIndex =
    typeof body.correctIndex === "number" ? body.correctIndex : 0;
  if (correctIndex < 0 || correctIndex >= options.length) {
    return NextResponse.json({ error: "Correct index is invalid." }, { status: 400 });
  }

  const explanation =
    typeof body.explanation === "string" ? body.explanation.trim() : "";
  const consequenceCorrect =
    typeof body.consequenceCorrect === "string"
      ? body.consequenceCorrect.trim()
      : "";
  const consequenceNear =
    typeof body.consequenceNear === "string"
      ? body.consequenceNear.trim()
      : "";
  const consequenceWrong =
    typeof body.consequenceWrong === "string"
      ? body.consequenceWrong.trim()
      : "";
  const pillar =
    typeof body.pillar === "string" && PILLAR_KEYS.has(body.pillar)
      ? body.pillar
      : undefined;
  const riskPenalty =
    typeof body.riskPenalty === "number" ? body.riskPenalty : undefined;
  const timeLimitSec =
    typeof body.timeLimitSec === "number" ? body.timeLimitSec : undefined;
  const points = typeof body.points === "number" ? body.points : 1;
  const nearPoints =
    typeof body.nearPoints === "number" ? body.nearPoints : undefined;
  const nearInput: unknown[] = Array.isArray(body.nearCorrect) ? body.nearCorrect : [];
  const nearCorrect = [
    ...new Set(
      nearInput
        .filter((value: unknown): value is number => typeof value === "number" && Number.isFinite(value))
        .map((value) => Math.round(value))
        .filter((value) => value >= 0 && value < options.length)
        .filter((value) => value !== correctIndex)
    ),
  ];

  const bank = await readQuizBank();
  const question = {
    id: randomUUID(),
    text,
    options,
    correctIndex,
    nearCorrect: nearCorrect.length ? nearCorrect : undefined,
    explanation: explanation || undefined,
    points: Number.isFinite(points) ? Math.max(1, Math.round(points)) : 1,
    nearPoints:
      typeof nearPoints === "number" && Number.isFinite(nearPoints)
        ? Math.max(0, Math.round(nearPoints))
        : undefined,
    pillar,
    consequenceCorrect: consequenceCorrect || undefined,
    consequenceNear: consequenceNear || undefined,
    consequenceWrong: consequenceWrong || undefined,
    riskPenalty:
      typeof riskPenalty === "number" && Number.isFinite(riskPenalty)
        ? Math.round(riskPenalty)
        : undefined,
    timeLimitSec:
      typeof timeLimitSec === "number" && Number.isFinite(timeLimitSec)
        ? Math.max(5, Math.round(timeLimitSec))
        : undefined,
  };

  bank.rounds[roundKey].push(question);
  bank.updatedAt = new Date().toISOString();
  await writeQuizBank(bank);

  return NextResponse.json({ round: roundKey, question });
}
