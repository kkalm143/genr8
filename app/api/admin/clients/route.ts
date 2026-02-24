import { NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { hash } from "bcrypt";
import { Prisma, Role } from "@prisma/client";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const archived = searchParams.get("archived");
  const search = searchParams.get("search")?.trim();
  const groupId = searchParams.get("groupId")?.trim() || undefined;

  const where: Prisma.UserWhereInput = {
    role: Role.client,
    archivedAt: archived === "true" ? { not: null } : null,
  };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ];
  }
  if (groupId) {
    where.clientGroups = { some: { groupId } };
  }

  const clients = await prisma.user.findMany({
    where,
    include: { clientProfile: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    const { email, name, password, phone, dateOfBirth, timezone } = body;
    if (!email || typeof email !== "string") {
      return apiError("Email is required.", 400);
    }
    const pass = typeof password === "string" && password.length >= 8 ? password : undefined;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("A user with this email already exists.", 409);
    }
    const passwordHash = pass
      ? await hash(pass, 10)
      : await hash("changeme123", 10); // default temp password
    const user = await prisma.user.create({
      data: {
        email,
        name: typeof name === "string" ? name : null,
        passwordHash,
        role: Role.client,
        clientProfile: {
          create: {
            phone: typeof phone === "string" ? phone : null,
            timezone: typeof timezone === "string" ? timezone : null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            clientSettings: {
              create: {
                workoutComments: true,
                workoutVisibility: true,
                allowRearrange: false,
                replaceExercise: false,
                allowCreateWorkouts: false,
              },
            },
          },
        },
      },
      include: { clientProfile: { include: { clientSettings: true } } },
    });
    return NextResponse.json(user);
  } catch (e) {
    console.error("Create client error:", e);
    return apiError("Failed to create client.", 500);
  }
}
