import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { AddTaskForm } from "./add-task-form";
import { ArchiveButton } from "./archive-button";
import { AssignProgramForm } from "./assign-program-form";
import { ConsultationFileSection } from "./consultation-file-section";
import { DeleteDNAResultButton } from "./delete-dna-result-button";
import { SendMessageForm } from "./send-message-form";
import { UnassignButton } from "./unassign-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, programs] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: Role.client },
      include: {
        clientProfile: true,
        dnaResults: { orderBy: { createdAt: "desc" } },
        programAssignments: {
          include: { program: { select: { id: true, name: true } } },
          orderBy: { assignedAt: "desc" },
        },
        progressEntries: {
          include: {
            programAssignment: {
              include: { program: { select: { id: true, name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
    prisma.program.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!client) notFound();
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/clients"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Clients
        </Link>
      </div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {client.name ?? client.email}
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{client.email}</p>
          {client.clientProfile?.phone && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Phone: {client.clientProfile.phone}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {client.archivedAt && (
            <span className="rounded bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
              Archived
            </span>
          )}
          <ArchiveButton
            clientId={id}
            isArchived={!!client.archivedAt}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          />
          <Link
            href={`/admin/clients/${id}/settings`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Settings
          </Link>
          <Link
            href={`/admin/clients/${id}/edit`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edit profile
          </Link>
        </div>
      </div>

      <ConsultationFileSection clientId={id} consultationFileUrl={client.clientProfile?.consultationFileUrl ?? null} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            DNA results
          </h2>
          <Link
            href={`/admin/clients/${id}/dna/new`}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] dark:bg-[var(--brand)] dark:text-white dark:hover:bg-[var(--brand-hover)]"
          >
            Add DNA result
          </Link>
        </div>
        {client.dnaResults.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            No DNA results yet. Add one to record lab results and interpretation scores.
          </p>
        ) : (
          <ul className="space-y-2">
            {client.dnaResults.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <Link
                  href={`/admin/clients/${id}/dna/${r.id}/edit`}
                  className="min-w-0 flex-1 hover:opacity-90"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    Result
                  </span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  {r.summary && (
                    <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                      {r.summary}
                    </p>
                  )}
                </Link>
                <DeleteDNAResultButton
                  clientId={id}
                  resultId={r.id}
                  resultLabel={new Date(r.createdAt).toLocaleDateString()}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Program assignments
          </h2>
          <AssignProgramForm clientId={id} programs={programs} />
        </div>
        {client.programAssignments.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            No programs assigned. Assign a program above.
          </p>
        ) : (
          <ul className="space-y-2">
            {client.programAssignments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <Link
                  href={`/admin/programs/${a.program.id}`}
                  className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                >
                  {a.program.name}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {a.status.replace("_", " ")} · Assigned {new Date(a.assignedAt).toLocaleDateString()}
                    {a.startDate && ` · Start ${new Date(a.startDate).toLocaleDateString()}`}
                    {a.endDate && ` · End ${new Date(a.endDate).toLocaleDateString()}`}
                  </span>
                  <UnassignButton clientId={id} assignmentId={a.id} programName={a.program.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Progress (read-only)
        </h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Entries logged by the client. View only; clients manage progress in their app.
        </p>
        {client.progressEntries.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            No progress entries yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {client.progressEntries.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {e.type.replace("_", " ")}
                  {e.value != null && ` · ${e.value}`}
                </p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {e.content}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{(e.loggedAt ? new Date(e.loggedAt) : new Date(e.createdAt)).toLocaleString()}</span>
                  {e.programAssignment?.program && (
                    <>
                      <span>·</span>
                      <span>Program: {e.programAssignment.program.name}</span>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
