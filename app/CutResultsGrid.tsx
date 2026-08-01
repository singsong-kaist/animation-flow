"use client";

import type { Cut } from "@/lib/types";
import CutCard from "./CutCard";

export default function CutResultsGrid({ cuts, onReset }: { cuts: Cut[]; onReset: () => void }) {
  return (
    <div className="flex w-full max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">총 {cuts.length}개 컷</h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          새로 시작
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cuts.map((cut) => (
          <CutCard key={cut.cutNumber} cut={cut} />
        ))}
      </div>
    </div>
  );
}
