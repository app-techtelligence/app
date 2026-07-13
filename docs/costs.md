# What the platform costs to run

A plain-language guide to what we pay for the TechTelligence platform today, and
what it will cost as we grow. No jargon. All prices are in **US dollars** (that's
how these services bill) — multiply by the current dollar rate (~R$5–6) for an
approximate value in reais.

_Last updated: 2026-07-13._

---

## The short answer

| How many students | Roughly per month | What's driving the cost |
|---|---|---|
| **10 (today)** | **~$5–6** | Just the Cloudflare plan |
| **100** | **~$100** | Mostly video + Supabase upgrade |
| **1,000** | **~$650** | Almost entirely video delivery |

**The one thing to remember:** almost everything is a small, flat cost. The only
bill that really grows with students is **video** — and even that is only about
**$0.60 per student per month**. So the platform stays cheap to run and scales
comfortably with the number of students paying for the course.

---

## What we pay for

Think of it as two buckets.

**1. Fixed costs — barely change no matter how many students.**

| Service | What it does | Cost |
|---|---|---|
| Cloudflare Workers | Runs the whole site and platform | **$5/month** |
| Domain (techtelligence.net) | The web address | **~$1/month** (~$11/year) |
| Supabase | Logins + the database | **$0 now** (free tier) → **$25/month** when we grow |
| Resend | Sends signup / password emails | **$0** (free up to 3,000 emails/month) |
| Cloudflare Turnstile | Blocks spam on the contact form | **$0** |

**2. Variable cost — grows with how much video students watch.**

| Service | What it does | Cost |
|---|---|---|
| Video storage (R2 today) | Stores the lesson videos | **~$0 today** (tiny) |
| Video delivery (future: Cloudflare Stream) | Streams video to students | **~$0.60 per student / month** |

Today video is essentially free because we have few students and video is served
straight from storage (Cloudflare R2, which doesn't charge for bandwidth). That
setup is cheap but doesn't scale smoothly — see
[`docs/video-delivery.md`](./video-delivery.md) for the technical plan to move to
**Cloudflare Stream** as we grow, which is where the "$0.60 per student" number
comes from.

---

## Today — 10 students

| Item | Cost |
|---|---|
| Cloudflare Workers | $5 |
| Domain | ~$1 |
| Supabase (free tier) | $0 |
| Resend (free tier) | $0 |
| Video (R2, tiny) | $0 |
| **Total** | **~$5–6 / month** |

At this size we're basically paying for one Cloudflare plan and the domain. Video
costs nothing meaningful yet.

> **One thing to plan for:** the free Supabase plan "pauses" a database after a
> week of no activity. With real students using the site daily that won't
> happen, but once the course is truly live it's worth the **$25/month Supabase
> Pro** plan for peace of mind (no pausing + automatic daily backups).

---

## Growing — 100 students

Here we'd move video to **Cloudflare Stream** (so it scales effortlessly) and
upgrade to **Supabase Pro**.

| Item | Cost |
|---|---|
| Cloudflare Workers | $5 |
| Domain | ~$1 |
| Supabase Pro | $25 |
| Resend (still free) | $0 |
| Video — storage (20h course) | ~$6 |
| Video — delivery (100 students) | ~$60 |
| **Total** | **~$100 / month** |

Video is now the biggest line, but $100/month for 100 students is about **$1 per
student per month** — trivial next to what a course seat sells for.

---

## Scaled — 1,000 students

| Item | Cost |
|---|---|
| Cloudflare Workers | $5 |
| Domain | ~$1 |
| Supabase Pro | $25 |
| Resend Pro | ~$20 |
| Video — storage (20h course) | ~$6 |
| Video — delivery (1,000 students) | ~$600 |
| **Total** | **~$650 / month** |

Everything except video is still under ~$60/month combined. Video delivery is
~$600 because it grows directly with how much students watch — about **$0.65 per
student per month**.

---

## How the video number works (so you can redo the math)

Cloudflare Stream charges two things:

- **Storage:** ~**$0.30 per hour of video we host, per month.** A 20-hour course
  library ≈ $6/month, no matter how many students there are.
- **Delivery:** ~**$0.06 per hour actually watched.** If a student watches ~10
  hours a month, that's ~**$0.60 per student per month**.

So a quick estimate for any size:

> **Monthly video cost ≈ $6 (storage) + (number of students × $0.60)**

These assume each student watches ~10 hours/month. If they watch more or less,
scale the delivery part up or down.

---

## The bottom line

- **Right now: about $5–6/month.** The platform is essentially free to run at 10
  students.
- **The costs that grow are predictable and small per student** (~$0.60–$1 each
  per month, almost all video).
- **Nothing here is a surprise bill.** The fixed costs stay near ~$30/month even
  at 1,000 students; the rest scales gently with actual usage, and always far
  below the price of a course seat.

---

### Pricing references (re-check these — prices change)

- Cloudflare Workers: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare R2 (free egress): https://developers.cloudflare.com/r2/pricing/
- Cloudflare Stream: https://developers.cloudflare.com/stream/pricing/
- Supabase: https://supabase.com/pricing
- Resend: https://resend.com/pricing
