"use client";

import { useState } from "react";
import type { Cut } from "@/lib/types";
import StoryInputForm from "./StoryInputForm";
import CutResultsGrid from "./CutResultsGrid";

export default function Home() {
  const [cuts, setCuts] = useState<Cut[] | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center gap-10 bg-zinc-50 px-4 py-12 font-sans dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">컷 스토리 🎬</h1>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          스토리를 붙여넣거나 업로드하면 자동으로 컷을 나누고 각 컷의 첫 프레임 이미지를 생성해드려요.
        </p>
      </div>

      {cuts ? (
        <CutResultsGrid cuts={cuts} onReset={() => setCuts(null)} />
      ) : (
        <StoryInputForm onSegmented={setCuts} />
      )}
    </div>
  );
}
