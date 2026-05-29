<div align="center">
  <h1>🩺 MedBoutique OS</h1>
  <p><strong>An all-in-one patient conversion, booking & clinic operations suite for high-end solo practitioner clinics.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Framer_Motion-11-FF0055?logo=framer&logoColor=white" alt="Framer Motion" />
    <img src="https://img.shields.io/badge/shadcn%2Fui-latest-000000" alt="shadcn/ui" />
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#project-structure">Structure</a> •
    <a href="#roadmap">Roadmap</a>
  </p>
</div>

---

## ✨ Overview

**MedBoutique OS** solves a major structural gap in the medical market: most doctors are forced to use clunky EHR software that fails to convert modern digital patients, or marketing landing pages that don't integrate with clinical scheduling.

This platform unifies **patient conversion**, **real-time booking**, **clinical documentation**, and **billing** into a single, beautifully designed SaaS product — built specifically for high-end solo practitioners: dermatologists, plastic surgeons, boutique dentists, and IVF specialists.

> **Brand Philosophy:** *"Clinical Excellence through Luxury"*

---

## 🚀 Features

### 🌐 Public Marketing Website
- **High-conversion treatment detail pages** — hero, step-by-step process, clinical info, patient reviews, sticky booking CTA
- **Physician profile pages** — credentials, philosophy, affiliations, featured treatments, media strip
- **5-step Diagnostic Quiz** — guided clinical self-assessment with animated processing and AI-assisted results screen

### 📅 Booking Engine (`/book`)
- Interactive dual-column calendar with real-time slot selection
- Multi-step flow: Service Selection → Calendar → Patient Details & Consent → Payment
- Mobile-optimized intake Drawer powered by **Vaul**

### 💊 Patient Portal (`/portal`)
- **Dashboard** — appointment overview, skin wellness score
- **My Appointments** — vertical timeline with reschedule/cancel actions
- **My Care Plan** — animated daily routine tracker with streak counter and progress ring
- **My Records** — 3-tab view: Visit History timeline, Prescriptions, interactive **Before/After image slider**
- **Payments & Invoices** — outstanding balance card with Pay Now CTA, full invoice history table

### 🏥 Clinical Admin Console (`/admin`)
- **Dashboard** — daily KPIs (revenue, patients, pending charts), real-time agenda
- **Weekly Calendar Planner** — 7-column time-axis grid with color-coded appointment blocks and hover tooltips
- **EMR Clinical Notes** — SOAP-format charting workspace with multimedia attachment support
- **Billing Module** — filterable datatable with status badges and CSV export
- **Clinic Settings** — 4-tab configuration: Clinic Profile, Scheduling Rules, Integrations (Razorpay, Google Cal, WATI, Twilio), Notification templates

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 (`@theme inline` tokens) |
| **UI Primitives** | shadcn/ui (Radix UI) |
| **Animations** | Framer Motion (portal interactions) · GSAP (scroll reveals) |
| **Drawer / Sheets** | Vaul |
| **Icons** | Lucide React |
| **Date Utilities** | date-fns |
| **Fonts** | Playfair Display (display) · Inter (body) via Google Fonts |

---

## 🗂 Project Structure

```
src/
├── app/
│   ├── (public)/                    # Marketing & Conversion (ISR)
│   │   ├── page.tsx                 # Conversion homepage
│   │   ├── treatments/[slug]/       # Treatment detail pages
│   │   ├── physicians/[slug]/       # Physician profile pages
│   │   ├── quiz/                    # 5-Step Diagnostic Quiz
│   │   └── book/                    # Booking engine
│   ├── portal/                      # Patient Portal (authenticated)
│   │   ├── layout.tsx               # Patient sidebar nav (5 links)
│   │   ├── dashboard/               # Overview & upcoming appointment
│   │   ├── appointments/            # Appointment timeline
│   │   ├── care-plan/               # Routine tracker & instructions
│   │   ├── records/                 # Visit history, prescriptions, gallery
│   │   └── invoices/                # Payments & invoice ledger
│   └── admin/                       # Clinician Admin Console (dark theme)
│       ├── layout.tsx               # Dark slate sidebar nav
│       ├── page.tsx                 # Admin dashboard
│       ├── calendar/                # Weekly calendar planner
│       ├── patients/                # Patient directory & EMR notes
│       ├── billing/                 # Revenue datatable
│       └── settings/                # Clinic configuration
├── components/
│   ├── booking/
│   │   └── BookingEngine.tsx        # Multi-step booking widget
│   └── quiz/
│       └── DiagnosticQuiz.tsx       # 5-step animated quiz component
└── app/globals.css                  # Design system tokens (CSS variables)
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/FadnisW/medboutique-os.git
cd medboutique-os

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values (see .env.example for required keys)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase / Neon) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth.js JWT signing |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `RAZORPAY_KEY_ID` | Razorpay public API key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret |
| `WATI_API_TOKEN` | WhatsApp Business (WATI) API token |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (Calendar sync) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `UPSTASH_REDIS_URL` | Redis URL for caching (optional) |

---

## 🗺 Roadmap

### ✅ Phase 1 — Frontend UI (Complete)
- [x] Full design system (Medical Beige, Premium Pink, Clinical Teal)
- [x] Marketing website (Treatments, Physicians, Quiz, Booking)
- [x] Patient Portal (Dashboard, Appointments, Care Plan, Records, Invoices)
- [x] Admin Console (Dashboard, Calendar, EMR Notes, Billing, Settings)

### 🔜 Phase 2 — Backend & Auth (Next)
- [ ] Prisma schema + PostgreSQL database
- [ ] NextAuth.js RBAC authentication (Doctor / Patient / Receptionist roles)
- [ ] Server Actions for bookings, records, billing
- [ ] Razorpay payment integration + webhook handler
- [ ] WhatsApp notification triggers (WATI)

### 🔜 Phase 3 — Advanced Features
- [ ] Google Calendar two-way sync
- [ ] AI-assisted clinical note suggestions
- [ ] Automated PDF invoice generation
- [ ] Multi-clinic / multi-doctor SaaS tenant support

---

## 🎨 Design System

The design system is defined entirely in `src/app/globals.css` using CSS custom properties:

| Token | Value | Usage |
|---|---|---|
| `--background` | `#faf9f5` | Medical Beige — main background |
| `--teal` | `#009485` | Clinical Teal — primary accent |
| `--teal-dark` | `#00201c` | Teal dark backgrounds |
| `--pink` | `#a43073` | Premium Pink — AI/secondary accent |
| `--primary` | `#1b1c1a` | High-contrast text & buttons |
| `--error` | `#ba1a1a` | Error states |

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built with ❤️ for the future of boutique clinical care.</p>
</div>
