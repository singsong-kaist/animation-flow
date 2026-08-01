import { NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import type { GenerateCutImageRequestBody, GenerateCutImageResponse } from "@/lib/types";

export const runtime = "nodejs";

const IMAGE_MODEL = "google/gemini-2.5-flash-image";

function buildPrompt(body: GenerateCutImageRequestBody): string {
  return `다음 장면의 첫 프레임(첫 컷)을 그려줘. 스토리보드 스타일의 사실적인 일러스트로:
- 장면: ${body.sceneDescription}
- 등장인물: ${body.characters.length > 0 ? body.characters.join(", ") : "없음"}
- 배경/시간대: ${body.setting}
- 카메라 샷: ${body.shotType}
- 분위기/톤: ${body.mood}
대사나 텍스트, 자막은 이미지에 넣지 마.`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json<GenerateCutImageResponse>({ imageUrl: null, error: "OPENROUTER_API_KEY is not set" });
  }

  const body = (await request.json().catch(() => null)) as GenerateCutImageRequestBody | null;
  if (!body || typeof body.sceneDescription !== "string") {
    return NextResponse.json<GenerateCutImageResponse>({ imageUrl: null, error: "잘못된 요청입니다." });
  }

  try {
    const data = await callOpenRouter(apiKey, {
      model: IMAGE_MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: buildPrompt(body) }],
    });

    const images = data.choices?.[0]?.message?.images;
    const imageUrl = images?.[0]?.image_url?.url;
    return NextResponse.json<GenerateCutImageResponse>({
      imageUrl: typeof imageUrl === "string" ? imageUrl : null,
    });
  } catch (err) {
    console.error("generate-cut-image failed:", err);
    return NextResponse.json<GenerateCutImageResponse>({ imageUrl: null, error: "이미지 생성에 실패했습니다." });
  }
}
