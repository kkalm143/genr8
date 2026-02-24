"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UnassignButton({
  clientId,
  assignmentId,
  programName,
}: {
  clientId: string;
  assignmentId: string;
  programName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnassign() {
    if (!confirm(`Remove "${programName}" from this client?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to remove assignment.");
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
      onClick={handleUnassign}
      disabled={loading}
      className="text-sm font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
    >
      {loading ? "…" : "Remove from program"}
    </button>
  );
}
