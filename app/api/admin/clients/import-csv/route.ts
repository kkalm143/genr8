import { NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { hash } from "bcrypt";
import { Role } from "@prisma/client";

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);
  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  try {
    const text = await request.text();
    if (!text?.trim()) {
      return apiError("CSV body is required.", 400);
    }
    const { headers, rows } = parseCSV(text);
    const emailIndex = headers.findIndex((h) => h.toLowerCase() === "email");
    if (emailIndex === -1) {
      return apiError("CSV must contain an 'email' column.", 400);
    }
    const nameIndex = headers.findIndex((h) => h.toLowerCase() === "name");
    const phoneIndex = headers.findIndex((h) => h.toLowerCase() === "phone");
    const timezoneIndex = headers.findIndex((h) => h.toLowerCase() === "timezone");
    const dateOfBirthIndex = headers.findIndex((h) => h.toLowerCase() === "dateofbirth" || h.toLowerCase().replace(/_/g, "") === "dateofbirth");

    const created: Array<{ id: string; email: string; name: string | null }> = [];
    const errors: Array<{ row: number; email?: string; error: string }> = [];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const email = (row[emailIndex] ?? "").trim();
      if (!email) {
        errors.push({ row: r + 2, error: "Email is required." });
        continue;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: r + 2, email, error: "Invalid email format." });
        continue;
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        errors.push({ row: r + 2, email, error: "A user with this email already exists." });
        continue;
      }
      const name = nameIndex >= 0 && row[nameIndex] ? row[nameIndex].trim() || null : null;
      const phone = phoneIndex >= 0 && row[phoneIndex] ? row[phoneIndex].trim() || null : null;
      const timezone = timezoneIndex >= 0 && row[timezoneIndex] ? row[timezoneIndex].trim() || null : null;
      let dateOfBirth: Date | null = null;
      if (dateOfBirthIndex >= 0 && row[dateOfBirthIndex]) {
        const d = new Date(row[dateOfBirthIndex].trim());
        if (!isNaN(d.getTime())) dateOfBirth = d;
      }
      const passwordHash = await hash("changeme123", 10);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: Role.client,
          clientProfile: {
            create: {
              phone,
              timezone,
              dateOfBirth,
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
        select: { id: true, email: true, name: true },
      });
      created.push(user);
    }
    return NextResponse.json({ created, errors });
  } catch (e) {
    return apiError("Failed to import CSV.", 500, e);
  }
}
