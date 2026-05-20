import { prisma } from "@cofri/db";
import { z } from "zod";

export const reminderFiltersSchema = z.object({
  scope: z.enum(["upcoming", "past", "all"]).optional(),
});

export type ReminderFilters = z.infer<typeof reminderFiltersSchema>;

export const reminderUpdateSchema = z
  .object({
    text: z.string().trim().min(1).max(500).optional(),
    dueAt: z.string().datetime().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "no fields to update",
  });

export type ReminderUpdate = z.infer<typeof reminderUpdateSchema>;

export type SerializedReminder = {
  id: string;
  text: string;
  dueAt: string;
  notifiedAt: string | null;
  createdAt: string;
};

const DEFAULT_LIMIT = 200;

export async function listReminders(
  userId: string,
  filters: ReminderFilters,
): Promise<SerializedReminder[]> {
  const scope = filters.scope ?? "upcoming";
  const now = new Date();

  const where = {
    userId,
    ...(scope === "upcoming" ? { dueAt: { gte: now } } : {}),
    ...(scope === "past" ? { dueAt: { lt: now } } : {}),
  };

  const rows = await prisma.reminder.findMany({
    where,
    orderBy: { dueAt: scope === "past" ? "desc" : "asc" },
    take: DEFAULT_LIMIT,
  });

  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    dueAt: r.dueAt.toISOString(),
    notifiedAt: r.notifiedAt ? r.notifiedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}
