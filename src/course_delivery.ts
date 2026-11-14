import { z } from "zod";
import { InfraiClient } from "./infrai.js";

export const deadlineReminder = z.object({
  learnerEmail: z.string().email(),
  learnerName: z.string().min(1),
  courseTitle: z.string().min(1),
  deadline: z.string().datetime()
});
export type DeadlineReminder = z.infer<typeof deadlineReminder>;

export type DeliveryReceipt = { messageId: string; learnerEmail: string; deadline: string };

export async function sendDeadlineReminder(client: InfraiClient, input: unknown): Promise<DeliveryReceipt> {
  const reminder = deadlineReminder.parse(input);
  const result = await client.send({
    to: reminder.learnerEmail,
    subject: `${reminder.courseTitle} deadline: ${reminder.deadline}`,
    html: `<p>Hi ${reminder.learnerName},</p><p>Your ${reminder.courseTitle} work is due ${reminder.deadline}.</p>`
  }, `deadline-${reminder.learnerEmail}-${reminder.deadline}`);
  return { messageId: result.message_id, learnerEmail: reminder.learnerEmail, deadline: reminder.deadline };
}

export async function reportDelivery(client: InfraiClient, messageId: string) {
  const events = await client.events(messageId);
  const names = events.events.map((event) => typeof event === "object" && event !== null && "type" in event ? String(event.type) : "");
  return { messageId, opens: names.filter((name) => name === "open").length, bounces: names.filter((name) => name === "bounce").length };
}
