# Contributing to MedBoutique OS

Thank you for your interest in contributing! Please follow the guidelines below.

## Development Setup

```bash
git clone https://github.com/FadnisW/medboutique-os.git
cd medboutique-os
npm install
cp .env.example .env.local
npm run dev
```

## Branch Naming Convention

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/razorpay-webhook` |
| Bug Fix | `fix/short-description` | `fix/booking-slot-lock` |
| Refactor | `refactor/short-description` | `refactor/quiz-state-machine` |
| Chore | `chore/short-description` | `chore/update-deps` |

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

**Example:**
```
feat(booking): add slot lock timer with 5-minute expiry

Implements row-level locking via Prisma $transaction to prevent
double-booking. Slot is automatically released if payment is not
completed within 5 minutes via a background cron job.

Closes #12
```

## Pull Request Process

1. Branch from `develop`, not `main`.
2. Ensure `npm run build` and `npm run lint` pass with no errors.
3. Write a clear PR description referencing the relevant issue.
4. Request a review from a maintainer.

## Code Style

- **TypeScript**: Strict mode enabled. No `any` types without justification.
- **Components**: Server Components by default; use `"use client"` only at leaf nodes.
- **CSS**: Use design system CSS variables (`var(--teal)`, `var(--primary)`) — never hardcoded hex values.
- **File Naming**: `kebab-case` for directories, `PascalCase` for component files.

## Security

- Never commit secrets, API keys, or `.env.local` files.
- All patient data mutations must verify the user session role via `auth()`.
- Medical record access is restricted to the `DOCTOR` role exclusively.
