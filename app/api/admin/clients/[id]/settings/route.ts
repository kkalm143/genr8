import { NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { Prisma, Role } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id: userId } = await params;
  const client = await prisma.user.findFirst({
    where: { id: userId, role: Role.client },
    include: { clientProfile: true },
  });
  if (!client?.clientProfile) return apiError("Client not found.", 404);
  const settings = await prisma.clientSettings.findFirst({
    where: { clientProfileId: client.clientProfile.id },
  });
  const defaults = {
    workoutComments: true,
    workoutVisibility: true,
    allowRearrange: false,
    replaceExercise: false,
    allowCreateWorkouts: false,
  };
  if (!settings) {
    const created = await prisma.clientSettings.create({
      data: {
        clientProfileId: client.clientProfile.id,
        ...defaults,
      },
    });
    return NextResponse.json(created);
  }
  return NextResponse.json(settings);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id: userId } = await params;
  const client = await prisma.user.findFirst({
    where: { id: userId, role: Role.client },
    include: { clientProfile: true },
  });
  if (!client?.clientProfile) return apiError("Client not found.", 404);
  try {
    const body = await request.json();
    const {
      workoutComments,
      workoutVisibility,
      allowRearrange,
      replaceExercise,
      allowCreateWorkouts,
      pinnedMetrics,
    } = body;
    const data: {
      workoutComments?: boolean;
      workoutVisibility?: boolean;
      allowRearrange?: boolean;
      replaceExercise?: boolean;
      allowCreateWorkouts?: boolean;
      pinnedMetrics?: string[] | typeof Prisma.JsonNull;
    } = {};
    if (typeof workoutComments === "boolean") data.workoutComments = workoutComments;
    if (typeof workoutVisibility === "boolean") data.workoutVisibility = workoutVisibility;
    if (typeof allowRearrange === "boolean") data.allowRearrange = allowRearrange;
    if (typeof replaceExercise === "boolean") data.replaceExercise = replaceExercise;
    if (typeof allowCreateWorkouts === "boolean") data.allowCreateWorkouts = allowCreateWorkouts;
    if (pinnedMetrics !== undefined) data.pinnedMetrics = Array.isArray(pinnedMetrics) ? pinnedMetrics : Prisma.JsonNull;
    const settings = await prisma.clientSettings.upsert({
      where: { clientProfileId: client.clientProfile.id },
      create: {
        clientProfileId: client.clientProfile.id,
        workoutComments: true,
        workoutVisibility: true,
        allowRearrange: false,
        replaceExercise: false,
        allowCreateWorkouts: false,
        ...data,
      },
      update: data,
    });
    return NextResponse.json(settings);
  } catch (e) {
    console.error("Update client settings error:", e);
    return apiError("Failed to update settings.", 500);
  }
}
