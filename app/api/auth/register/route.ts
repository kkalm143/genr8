import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logger.info("Register failed: email already exists", { event: "register_failed", email, reason: "email_exists" });
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    const passwordHash = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: typeof name === "string" ? name : null,
        passwordHash,
        role: Role.client,
      },
    });
    logger.info("Register success", { event: "register_success", userId: user.id, email: user.email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("Register error", { event: "register_error", err: e });
    return NextResponse.json(
      { error: "Registration failed." },
      { status: 500 }
    );
  }
}
