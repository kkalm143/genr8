import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { ProgressEntryType } from "@prisma/client";

const VALID_TYPES: ProgressEntryType[] = [
  "note",
  "workout_completed",
  "body_metric",
  "measurement",
  "progress_photo",
];

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const entries = await prisma.progressEntry.findMany({
    where: { userId: session.user.id },
    include: {
      programAssignment: {
        include: { program: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    const { content, programAssignmentId, type, value, loggedAt } = body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return apiError("Content is required.", 400);
    }
    if (programAssignmentId != null) {
      if (typeof programAssignmentId !== "string") {
        return apiError("Invalid programAssignmentId.", 400);
      }
      const assignment = await prisma.programAssignment.findFirst({
        where: { id: programAssignmentId, userId: session.user.id },
      });
      if (!assignment) {
        return apiError("Assignment not found.", 404);
      }
    }
    const entryType =
      type && VALID_TYPES.includes(type) ? type : "note";
    const entry = await prisma.progressEntry.create({
      data: {
        userId: session.user.id,
        content: content.trim(),
        type: entryType,
        programAssignmentId:
          typeof programAssignmentId === "string" && programAssignmentId
            ? programAssignmentId
            : null,
        value: typeof value === "number" && !Number.isNaN(value) ? value : null,
        loggedAt: loggedAt ? new Date(loggedAt) : null,
      },
      include: {
        programAssignment: {
          include: { program: { select: { id: true, name: true } } },
        },
      },
    });
    return NextResponse.json(entry);
  } catch (e) {
    return apiError("Failed to save progress.", 500, e);
  }
}
