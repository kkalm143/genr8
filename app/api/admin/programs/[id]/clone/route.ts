import { NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      workoutSections: {
        orderBy: { displayOrder: "asc" },
        include: {
          sets: { orderBy: { displayOrder: "asc" } },
        },
      },
    },
  });
  if (!program) return apiError("Program not found.", 404);
  try {
    const newProgram = await prisma.program.create({
      data: {
        name: `${program.name} (Copy)`,
        description: program.description,
        content: program.content,
        isActive: program.isActive,
        displayOrder: program.displayOrder,
      },
    });
    for (const sec of program.workoutSections) {
      const newSection = await prisma.workoutSection.create({
        data: {
          programId: newProgram.id,
          type: sec.type,
          name: sec.name,
          displayOrder: sec.displayOrder,
          durationSeconds: sec.durationSeconds,
          metadata: sec.metadata == null ? Prisma.JsonNull : (sec.metadata as Prisma.InputJsonValue),
        },
      });
      for (let i = 0; i < sec.sets.length; i++) {
        const s = sec.sets[i];
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
    }
    const created = await prisma.program.findUnique({
      where: { id: newProgram.id },
      include: {
        workoutSections: {
          orderBy: { displayOrder: "asc" },
          include: {
            sets: { orderBy: { displayOrder: "asc" }, include: { exercise: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error("Clone program error:", e);
    return apiError("Failed to clone program.", 500);
  }
}
