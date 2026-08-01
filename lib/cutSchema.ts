import { z } from "zod";

export const cutZodSchema = z.object({
  cutNumber: z.number().int().positive(),
  sceneDescription: z.string().min(1),
  characters: z.array(z.string()),
  dialogue: z.string().nullable(),
  shotType: z.string().min(1),
  setting: z.string().min(1),
  mood: z.string().min(1),
  estimatedDurationSeconds: z.number().positive(),
});

export const emitCutsZodSchema = z.object({
  cuts: z.array(cutZodSchema).min(1),
});

// Hand-written JSON schema for the OpenRouter tool-calling request, mirroring
// emitCutsZodSchema. Kept separate (not zod-to-json-schema) since the shape is
// small and stable.
export const emitCutsToolInputSchema = {
  type: "object",
  properties: {
    cuts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          cutNumber: { type: "integer", description: "1부터 시작하는 컷 순번" },
          sceneDescription: { type: "string", description: "장면 설명" },
          characters: {
            type: "array",
            items: { type: "string" },
            description: "이 컷에 등장하는 인물 이름 목록",
          },
          dialogue: {
            type: ["string", "null"],
            description: "이 컷의 대사. 대사가 없으면 null",
          },
          shotType: {
            type: "string",
            description: "카메라 샷 종류/앵글 (예: 클로즈업, 미디엄 샷, 롱 샷, 오버 더 숄더, 로우 앵글 등)",
          },
          setting: { type: "string", description: "배경/시간대" },
          mood: { type: "string", description: "분위기/톤" },
          estimatedDurationSeconds: {
            type: "number",
            description: "예상 컷 길이(초). 대사 분량과 장면 복잡도를 고려해 추정",
          },
        },
        required: [
          "cutNumber",
          "sceneDescription",
          "characters",
          "dialogue",
          "shotType",
          "setting",
          "mood",
          "estimatedDurationSeconds",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["cuts"],
  additionalProperties: false,
} as const;

export const EMIT_CUTS_TOOL_NAME = "emit_cuts";

export const emitCutsTool = {
  type: "function",
  function: {
    name: EMIT_CUTS_TOOL_NAME,
    description: "이야기를 순서대로 나눈 컷(cut) 목록을 제출합니다.",
    parameters: emitCutsToolInputSchema,
  },
};
