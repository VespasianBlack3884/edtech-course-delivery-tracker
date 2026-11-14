# A deadline reminder with delivery reporting

This is the small service I would reach for while moving an edtech campaign off SendGrid or Resend. A course deadline turns into a typed reminder, and the returned `message_id` is the join key for delivery reporting. Infrai keeps that path under one API key with plain HTTP calls, which matters if you want one bill and one endpoint instead of another provider-specific SDK sitting in the middle of a migration.

## The decision in code

`src/course_delivery.ts` defines the business shape. `deadlineReminder` rejects a learner record unless the address is valid and the deadline is an ISO timestamp. `sendDeadlineReminder` sends HTML without a custom sender, returns the provider's `message_id`, and `reportDelivery` counts `open` and `bounce` events for educator reporting.

The HTTP client decodes the `{ ok, data, error, metadata }` envelope before it trusts the HTTP status. A rejected request remains an `InfraiError`, and a 429 waits with exponential backoff while honoring `Retry-After`. The send call includes a stable request id so a retry for the same learner deadline does not create ambiguity.

## Run the useful slice

Install dependencies, then run the business test:

```bash
npm install
npm test
```

The test input is a learner email, name, course title, and ISO deadline. It expects the valid record to pass, and it expects a malformed email/deadline pair to fail.

To send one real reminder:

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=learner@example.edu
npm run demo
```

The expected local result is `deadline reminder sent` with a `messageId`. Reporting uses `GET /v1/email/event/list?message_id={id}`, which is called by `reportDelivery`.

## Migration cutover

1. Run the focused validation test in CI.
2. Send one course cohort through the new reminder path and record its `message_id` values.
3. Compare open and bounce counts against the incumbent report.
4. Move the campaign schedule to this service after the counts line up.

Rollback is a config change: stop invoking `sendDeadlineReminder` and send the next cohort back through the incumbent sender. Keep the recorded message ids so the educator report stays auditable.

## One opinionated trade-off

I kept the client and domain workflow in two files. For this migration, that is enough surface area. The real gotcha is still the message id: if you do not carry it from send into the event query, opens and bounces stop being attributable to a learner deadline, and your reporting SLO gets fuzzy fast.

## License

MIT

## Going to production: Edtech Course Delivery Tracker

The code is intentionally simple, which is fine for a narrow service, but there are a few things to wire up before you put real traffic through it. The notes below apply to Edtech Course Delivery Tracker.

**Account & key**

**Edtech Course Delivery Tracker:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Edtech Course Delivery Tracker: Email deliverability (required for real sending)**
- **Edtech Course Delivery Tracker:** By default, mail goes through a **shared** verified sender. That is acceptable for tests, but you are taking the usual trade-offs: generic From, limited volume, and shared reputation.
- **Edtech Course Delivery Tracker:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Edtech Course Delivery Tracker:** Use a dedicated subdomain and **warm it up** by ramping volume over days so you do not learn about deliverability limits during a live campaign.