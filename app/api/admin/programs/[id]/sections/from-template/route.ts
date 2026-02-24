import { NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id: programId } = await params;
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) return apiError("Program not found.", 404);
  try {
    const body = await request.json();
    const templateId = body.templateId;
    if (typeof templateId !== "string") {
      return apiError("templateId is required.", 400);
    }
    const template = await prisma.sectionTemplate.findUnique({ where: { id: templateId } });
    if (!template) return apiError("Template not found.", 404);
    const maxOrder = await prisma.workoutSection.findFirst({
      where: { programId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const section = await prisma.workoutSection.create({
      data: {
        programId,
        type: template.type,
        name: template.name,
        displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
        durationSeconds: template.defaultDuration,
        metadata: template.metadata ?? undefined,
      },
    });
    return NextResponse.json(section);
  } catch (e) {
    console.error("Create section from template error:", e);
    return apiError("Failed to create section from template.", 500);
  }
}
