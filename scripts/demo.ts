import { InfraiClient } from "../src/infrai.js";
import { sendDeadlineReminder } from "../src/course_delivery.js";

const key = process.env.INFRAI_API_KEY;
const to = process.env.DEMO_EMAIL_TO;
if (!key || !to) throw new Error("INFRAI_API_KEY and DEMO_EMAIL_TO are required");

const receipt = await sendDeadlineReminder(new InfraiClient(key), {
  learnerEmail: to,
  learnerName: "Mina",
  courseTitle: "Biology 101",
  deadline: "2026-11-02T17:00:00.000Z"
});
console.log("deadline reminder sent", receipt);
