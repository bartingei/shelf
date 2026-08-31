# Deploying Shelf to an Ubuntu EC2 instance

Deploys Shelf as a systemd service behind nginx:

```
internet ──▶ nginx :80 ──▶ next start :3000 (loopback only, systemd "shelf")
                                  │
                                  ├──▶ Postgres      (Neon or RDS — external)
                                  └──▶ Supabase      (PDF + cover storage — external)
```

Nothing is stored on the instance itself: PDFs live in Supabase Storage and all
data lives in Postgres. The box only runs the Node process, so it stays
disposable and you can rebuild it from these scripts at any time.

## Before you start

You need these ready — the app won't work without the first two:

| Service | Why | Notes |
|---|---|---|
| **Postgres** | All app data | [Neon](https://neon.tech) gives you the pooled + direct URLs Prisma wants. RDS or a local Postgres works too. |
| **Supabase project** | PDF and cover storage | Create two buckets: `books` (private) and `covers` (public). |
| **Resend API key** | Email verification | Effectively required — see [Email verification](#email-verification-is-mandatory) below. |
| **Google OAuth client** | "Continue with Google" | Optional. Redirect URI: `http://<your-host>/api/auth/callback/google` |
| **OpenAI API key** | Genre sorting, AI reader tools | Optional. Without it books stay "Uncategorized" and the AI panels show an error; everything else works. |

**Open port 80 in the EC2 security group** (inbound TCP 80 from `0.0.0.0/0`).
This is the single most common reason a correct deployment still looks dead
from a browser — the app is fine, the packets never arrive.

## Deploy

SSH in, then:

```bash
# 1. Get the code
git clone https://github.com/bartingei/shelf.git ~/shelf

# 2. Provision the box: Node 22, nginx, swap, systemd unit  (one time, as root)
sudo bash ~/shelf/deploy/setup-ec2.sh

# 3. Fill in your secrets
nano ~/shelf/pdf-platform/.env

# 4. Build, migrate, start  (as ubuntu — never as root)
bash ~/shelf/deploy/deploy.sh
```

Then open `http://<your-public-ip>` in a browser.

### What goes in `.env`

Start from `pdf-platform/.env.example`. The three URL values must point at how
users actually reach the app — your public IP for now, your domain later:

```ini
NEXT_PUBLIC_SITE_URL="http://56.228.12.50"
BETTER_AUTH_URL="http://56.228.12.50"
NEXT_PUBLIC_BETTER_AUTH_URL="http://56.228.12.50"

BETTER_AUTH_SECRET="<openssl rand -base64 32>"

DATABASE_URL="postgresql://...-pooler.../db?sslmode=require"
DIRECT_URL="postgresql://.../db?sslmode=require"

NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

RESEND_API_KEY="re_..."
OPENAI_API_KEY="sk-..."          # optional
GOOGLE_CLIENT_ID=""              # optional
GOOGLE_CLIENT_SECRET=""          # optional
```

> **`NEXT_PUBLIC_*` values are compiled into the browser bundle at build time,
> not read at runtime.** Editing them means re-running `deploy.sh` — restarting
> the service alone changes nothing. If you skip this, sign-in silently
> redirects your users to `localhost:3000`.

An EC2 public IP also changes on stop/start unless you attach an Elastic IP.
When it changes, update these three values and redeploy.

## Day-to-day

```bash
bash ~/shelf/deploy/deploy.sh --pull   # pull, rebuild, restart
sudo systemctl restart shelf           # restart without rebuilding
sudo systemctl status shelf            # is it running?
sudo journalctl -u shelf -f            # live logs
```

## Adding HTTPS

Worth doing as soon as you have a domain — Google OAuth is happier with it,
and Better Auth switches session cookies to the hardened `__Secure-` prefix
under HTTPS.

```bash
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d yourdomain.com
```

Certbot rewrites the nginx config in place and sets up renewal. Afterwards,
change the three URL values in `.env` to `https://yourdomain.com` and re-run
`deploy.sh` — otherwise the bundle still points at the old address.

## Notes and gotchas

### Email verification is mandatory

`requireEmailVerification` is on, so an email/password account can't sign in
until the verification link is clicked. Email failures are logged rather than
thrown, so with no `RESEND_API_KEY` sign-up *appears* to succeed, no email
arrives, and sign-in then rejects the account with no obvious cause.

Resend's default sandbox sender (`onboarding@resend.dev`, set in
`src/lib/resend.ts`) only delivers to the email address that owns the Resend
account — fine for testing, but verify a domain in Resend before other people
sign up. Google sign-in skips this path entirely.

### Uploads

Shelf accepts PDFs up to 100MB. The nginx config raises
`client_max_body_size` to 110M and proxy timeouts to 300s to match — stock
nginx caps bodies at 1MB and would reject every real upload with a 413.

### The build needs memory

`next build` peaks above 1GB. On a 1GB instance (t2/t3.micro) it gets
OOM-killed, showing only `Killed` with no explanation. `setup-ec2.sh` adds a
2GB swapfile when it finds under 2GB of RAM and no swap, and `deploy.sh` caps
the heap at 1536MB. The build is slow on a micro but completes.

### Troubleshooting

| Symptom | Cause |
|---|---|
| Browser hangs / can't connect | Port 80 not open in the security group |
| `502 Bad Gateway` | Node process down — `sudo journalctl -u shelf -n 50` |
| Sign-in bounces to `localhost:3000` | `NEXT_PUBLIC_*` URLs wrong at build time; fix `.env` and re-run `deploy.sh` |
| `413` on upload | nginx config not installed — re-run `setup-ec2.sh` |
| Build dies with `Killed` | Out of memory; confirm swap is on with `swapon --show` |
| Prisma can't reach the database | Check `DATABASE_URL`, and that the DB allows connections from the instance's IP |
