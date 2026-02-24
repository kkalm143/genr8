"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteExerciseButton({
  exerciseId,
  exerciseName,
}: {
  exerciseId: string;
  exerciseName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete exercise "${exerciseName}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exercises/${exerciseId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete exercise.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-sm font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 disabled:opacity-50"
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}
