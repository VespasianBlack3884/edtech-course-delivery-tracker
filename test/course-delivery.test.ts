import assert from "node:assert/strict";
import { test } from "node:test";
import { deadlineReminder } from "../src/course_delivery.js";

test("a learner deadline requires a real email and an ISO deadline", () => {
  const parsed = deadlineReminder.safeParse({
    learnerEmail: "learner@example.edu",
    learnerName: "Mina",
    courseTitle: "Biology 101",
    deadline: "2026-11-02T17:00:00.000Z"
  });
  assert.equal(parsed.success, true);
  assert.equal(deadlineReminder.safeParse({ learnerEmail: "bad", learnerName: "Mina", courseTitle: "Biology 101", deadline: "tomorrow" }).success, false);
});
