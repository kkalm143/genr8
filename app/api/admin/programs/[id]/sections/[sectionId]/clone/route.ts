import { NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id: programId, sectionId } = await params;
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) return apiError("Program not found.", 404);
  const section = await prisma.workoutSection.findFirst({
    where: { id: sectionId, programId },
    include: {
      sets: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!section) return apiError("Section not found.", 404);
  try {
    const maxOrder = await prisma.workoutSection.findFirst({
      where: { programId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const newSection = await prisma.workoutSection.create({
      data: {
        programId,
        type: section.type,
        name: section.name,
        displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
        durationSeconds: section.durationSeconds,
        metadata: section.metadata == null ? Prisma.JsonNull : (section.metadata as Prisma.InputJsonValue),
      },
    });
    for (let i = 0; i < section.sets.length; i++) {
      const s = section.sets[i];
      await prisma.workoutSet.create({
        data: {
          sectionId: newSection.id,
          exerciseId: s.exerciseId,
          customLabel: s.customLabel,
          reps: s.reps,
          repRange: s.repRange,
          weight: s.weight,
          durationSeconds: s.durationSeconds,
          notes: s.notes,
          setType: s.setType,
          displayOrder: i,
        },
      });
    }
    const created = await prisma.workoutSection.findUnique({
      where: { id: newSection.id },
      include: {
        sets: {
          orderBy: { displayOrder: "asc" },
          include: { exercise: { select: { id: true, name: true } } },
        },
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error("Clone section error:", e);
    return apiError("Failed to clone section.", 500);
  }
}
