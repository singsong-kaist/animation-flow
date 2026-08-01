"use client";

import { useState } from "react";
import type { Cut, SegmentErrorResponse, SegmentResponse } from "@/lib/types";

const MAX_STORY_LENGTH = 10000;

type InputMode = "paste" | "file";

export default function StoryInputForm({
  onSegmented,
}: {
  onSegmented: (cuts: Cut[]) => void;
}) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeText = mode === "paste" ? pastedText : fileText;
  const overLimit = (activeText?.length ?? 0) > MAX_STORY_LENGTH;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    setSelectedFile(null);
    setFileText(null);
    if (!file) return;

    const name = file.name.toLowerCase();
    if (name.endsWith(".doc") && !name.endsWith(".docx")) {
      setError("'.doc' 형식은 지원하지 않습니다. '.docx'로 저장 후 업로드해주세요.");
      return;
    }
    if (!name.endsWith(".txt") && !name.endsWith(".docx")) {
      setError("지원하지 않는 파일 형식입니다. .txt 또는 .docx 파일만 업로드해주세요.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기가 너무 큽니다. 5MB 이하 파일을 업로드해주세요.");
      return;
    }

    setSelectedFile(file);
    if (name.endsWith(".txt")) {
      setFileText(await file.text());
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (overLimit) {
      setError(`스토리가 너무 깁니다 (최대 ${MAX_STORY_LENGTH.toLocaleString()}자). 일부만 분석하거나 줄여서 시도해주세요.`);
      return;
    }

    const formData = new FormData();
    if (mode === "paste") {
      if (!pastedText.trim()) {
        setError("스토리 텍스트를 입력해주세요.");
        return;
      }
      formData.append("text", pastedText);
    } else if (selectedFile && selectedFile.name.toLowerCase().endsWith(".docx")) {
      formData.append("file", selectedFile);
    } else if (fileText) {
      formData.append("text", fileText);
    } else {
      setError("파일을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/segment", { method: "POST", body: formData });
      const data = (await res.json()) as SegmentResponse | SegmentErrorResponse;
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "컷 분석에 실패했습니다.");
        return;
      }
      onSegmented(data.cuts);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("paste")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            mode === "paste"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          텍스트 붙여넣기
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            mode === "file"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          파일 업로드 (.txt / .docx)
        </button>
      </div>

      {mode === "paste" ? (
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="여기에 스토리를 붙여넣으세요..."
          rows={10}
          className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept=".txt,.docx"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:file:bg-zinc-100 dark:file:text-zinc-900"
          />
          {selectedFile && <p className="text-xs text-zinc-500 dark:text-zinc-400">선택됨: {selectedFile.name}</p>}
        </div>
      )}

      {activeText && (
        <p className={`text-xs ${overLimit ? "text-red-500" : "text-zinc-400"}`}>
          {activeText.length.toLocaleString()} / {MAX_STORY_LENGTH.toLocaleString()}자
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {submitting ? "컷으로 나누는 중..." : "컷 분석하기"}
      </button>
    </form>
  );
}
