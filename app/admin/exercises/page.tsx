import Link from "next/link";
import { prisma } from "@/lib/db";
import { DeleteExerciseButton } from "./delete-exercise-button";

export default async function AdminExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Exercise library
        </h1>
        <Link
          href="/admin/exercises/new"
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] dark:bg-[var(--brand)] dark:text-white dark:hover:bg-[var(--brand-hover)]"
        >
          Add exercise
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Add exercises here to use them in program workout sections (sets, reps, weight).
      </p>
      {exercises.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          No exercises yet. Add one to use in workout sets.
        </p>
      ) : (
        <ul className="space-y-2">
          {exercises.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{e.name}</span>
              {e.description && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-xs">{e.description}</span>
              )}
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/exercises/${e.id}/edit`}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Edit
                </Link>
                <DeleteExerciseButton exerciseId={e.id} exerciseName={e.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
