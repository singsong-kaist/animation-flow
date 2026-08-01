import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { callOpenRouter } from "@/lib/openrouter";
import { emitCutsTool, emitCutsZodSchema, EMIT_CUTS_TOOL_NAME } from "@/lib/cutSchema";
import type { SegmentResponse } from "@/lib/types";

export const runtime = "nodejs";

const MAX_STORY_LENGTH = 10000;
const SEGMENT_MODEL = process.env.openrouter_model || "anthropic/claude-sonnet-4.5";

const SYSTEM_PROMPT = `당신은 영상 스토리보드 전문가입니다. 주어진 이야기를 순서대로 컷(cut)으로 나누고, 각 컷에 대해 정확한 정보를 추출해 ${EMIT_CUTS_TOOL_NAME} 도구를 호출하세요.

컷은 이야기의 자연스러운 장면 전환, 카메라 앵글 변화, 대사 전환 지점을 기준으로 나눕니다.
- cutNumber는 1부터 순서대로 매깁니다.
- characters는 해당 컷에 실제로 등장/언급되는 인물만 포함합니다.
- 대사가 없는 컷은 dialogue를 null로 설정하세요.
- shotType은 카메라 샷 종류와 앵글을 함께 표현하세요 (예: "클로즈업", "미디엄 샷, 로우 앵글").
- estimatedDurationSeconds는 대사 분량과 장면 복잡도를 고려해 초 단위 숫자로 추정하세요.
- 반드시 ${EMIT_CUTS_TOOL_NAME} 도구 호출로만 응답하세요. 다른 설명 텍스트는 출력하지 마세요.`;

async function extractStoryText(formData: FormData): Promise<{ text: string } | { error: string; status: number }> {
  const file = formData.get("file");
  const rawText = formData.get("text");

  if (file instanceof File) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".doc") && !name.endsWith(".docx")) {
      return { error: "'.doc' 형식은 지원하지 않습니다. '.docx'로 저장 후 업로드해주세요.", status: 400 };
    }
    if (!name.endsWith(".docx")) {
      return { error: "지원하지 않는 파일 형식입니다. .txt 또는 .docx 파일만 업로드해주세요.", status: 400 };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: "파일 크기가 너무 큽니다. 5MB 이하 파일을 업로드해주세요.", status: 400 };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value } = await mammoth.extractRawText({ buffer });
    if (!value.trim()) {
      return { error: "문서에서 텍스트를 찾을 수 없습니다. 이미지나 표만 있는 문서는 지원하지 않습니다.", status: 400 };
    }
    return { text: value };
  }

  if (typeof rawText === "string" && rawText.trim()) {
    return { text: rawText };
  }

  return { error: "스토리 텍스트나 파일이 제공되지 않았습니다.", status: 400 };
}

async function requestCutsFromModel(apiKey: string, storyText: string, repair?: string) {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: storyText },
  ];
  if (repair) {
    messages.push({ role: "user", content: repair });
  }

  const data = await callOpenRouter(apiKey, {
    model: SEGMENT_MODEL,
    messages,
    tools: [emitCutsTool],
    tool_choice: { type: "function", function: { name: EMIT_CUTS_TOOL_NAME } },
  });

  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  const rawArgs = toolCall?.function?.arguments;
  if (typeof rawArgs !== "string") {
    throw new Error("No tool call arguments returned from model");
  }

  const parsed = JSON.parse(rawArgs);
  return emitCutsZodSchema.parse(parsed);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is not set" }, { status: 500 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const extracted = await extractStoryText(formData);
  if ("error" in extracted) {
    return NextResponse.json({ error: extracted.error }, { status: extracted.status });
  }

  const storyText = extracted.text.trim();
  if (storyText.length > MAX_STORY_LENGTH) {
    return NextResponse.json(
      { error: `스토리가 너무 깁니다 (최대 ${MAX_STORY_LENGTH.toLocaleString()}자). 일부만 분석하거나 줄여서 시도해주세요.` },
      { status: 400 },
    );
  }

  try {
    let result;
    try {
      result = await requestCutsFromModel(apiKey, storyText);
    } catch (firstError) {
      result = await requestCutsFromModel(
        apiKey,
        storyText,
        `이전 응답이 스키마에 맞지 않았습니다 (${String(firstError)}). ${EMIT_CUTS_TOOL_NAME} 도구를 스키마에 정확히 맞춰 다시 호출해주세요.`,
      );
    }

    const response: SegmentResponse = { cuts: result.cuts };
    return NextResponse.json(response);
  } catch (err) {
    console.error("segment failed:", err);
    return NextResponse.json({ error: "컷 분석에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
