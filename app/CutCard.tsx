"use client";

import { useEffect, useState } from "react";
import type { Cut, GenerateCutImageResponse } from "@/lib/types";

type ImageState = "loading" | "success" | "failed";

export default function CutCard({ cut }: { cut: Cut }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageState, setImageState] = useState<ImageState>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/generate-cut-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneDescription: cut.sceneDescription,
        characters: cut.characters,
        setting: cut.setting,
        shotType: cut.shotType,
        mood: cut.mood,
      }),
    })
      .then((res) => res.json())
      .then((data: GenerateCutImageResponse) => {
        if (cancelled) return;
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setImageState("success");
        } else {
          setImageState("failed");
        }
      })
      .catch(() => {
        if (!cancelled) setImageState("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [cut, attempt]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative flex aspect-video items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        {imageState === "loading" && (
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
            <span className="text-xs">이미지 생성 중...</span>
          </div>
        )}
        {imageState === "success" && imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={cut.sceneDescription} className="h-full w-full object-cover" />
        )}
        {imageState === "failed" && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-zinc-400">이미지 생성 실패</span>
            <button
              type="button"
              onClick={() => {
                setImageState("loading");
                setAttempt((n) => n + 1);
              }}
              className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              다시 생성
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">컷 {cut.cutNumber}</span>
          <div className="flex gap-1.5">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {cut.shotType}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {cut.estimatedDurationSeconds}초
            </span>
          </div>
        </div>

        <p className="text-sm text-zinc-800 dark:text-zinc-200">{cut.sceneDescription}</p>

        {cut.characters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cut.characters.map((c) => (
              <span
                key={c}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {cut.dialogue && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm italic text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
            &ldquo;{cut.dialogue}&rdquo;
          </p>
        )}

        <div className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span>배경/시간대: {cut.setting}</span>
          <span>분위기/톤: {cut.mood}</span>
        </div>
      </div>
    </div>
  );
}
