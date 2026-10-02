# Single-Vendor E-Commerce Application — 11-Part Master Roadmap & Prompts

> **Target Platform:** Google Antigravity IDE  
> **Model:** Gemini 3.8 Flash (High)  
> **Backend:** Laravel 13, PHP 8.4, PostgreSQL, Redis, Queues, Scheduler  
> **Frontend:** Next.js (App Router), TanStack Query, shadcn/ui, Tailwind CSS  
> **Deployment:** Frontend on [Vercel](https://vercel.com/), Backend on Cloud PaaS (Railway / Render / Fly.io / VPS)  
> **Deliverables Included:** 11 Execution Prompts (`prompts/`), Comprehensive Evaluation & Architecture Defense Q&A (`EVALUATION_QA.md`), Git update instructions per part.

---

## Project Structure Overview

```
single-vendor-ecommerce/
├── EVALUATION_QA.md                   # Complete answers to all evaluation criteria from the PDF
├── README.md                          # This master roadmap and workflow guide
└── prompts/
    ├── 01_PART1_FOUNDATION_SETUP.md               # Part 1: Architecture, Monorepo, Docker, Health Check
    ├── 02_PART2_AUTHENTICATION_AUTHORIZATION.md   # Part 2: Sanctum API Auth, Roles & Admin Login UI
    ├── 03_PART3_PRODUCTS_STOREFRONT_CATALOG.md    # Part 3: Products CRUD, Non-Negative Stock & Storefront
    ├── 04_PART4_CART_SYSTEM.md                    # Part 4: Persistent Cart, Backend Stock Validation & Drawer
    ├── 05_PART5_CHECKOUT_ATOMIC_ORDERS_INVENTORY.md# Part 5: Checkout Form, Row-Locking & Concurrency Safety
    ├── 06_PART6_PAYMENT_GATEWAY_INTEGRATION.md    # Part 6: bKash/SSLCommerz, Idempotency & Admin Toggle
    ├── 07_PART7_CARRYBEE_DELIVERY_QUEUES.md       # Part 7: CarryBee Courier API, Async Queues & Retries
    ├── 08_PART8_REDIS_PERFORMANCE_SCHEDULER.md    # Part 8: Redis Caching, N+1 Elimination & Scheduler
    ├── 09_PART9_ADMIN_BUSINESS_DASHBOARD.md       # Part 9: Business Dashboard, KPIs, Sales Charts & Audit
    ├── 10_PART10_SEEDERS_AUTOMATED_TESTS.md       # Part 10: 100 Consistent Orders Seeder & Test Suite
    └── 11_PART11_VERCEL_DEPLOYMENT_DOCS.md        # Part 11: Vercel Hosting, README, NOTES & Submission
```

---

## How to Execute with Google Antigravity IDE (Gemini 3.8 Flash)

Follow this step-by-step workflow:

### Step 1: Open Your Workspace
1. In Google Antigravity IDE, open the project folder `C:\Users\lette\.gemini\antigravity\scratch\single-vendor-ecommerce` as your active workspace.
2. Ensure your Antigravity model setting is set to **Gemini 3.8 Flash (High)**.

### Step 2: Iterative 11-Part Execution Cycle
For each of the 11 parts:
1. Open the corresponding `.md` file inside the `prompts/` folder (e.g. `prompts/01_PART1_FOUNDATION_SETUP.md`).
2. Copy the prompt block and submit it to Google Antigravity IDE.
3. Allow Gemini 3.8 Flash to generate code, run migrations, install dependencies, and build components.
4. Run the verification steps specified in the prompt to ensure the feature is fully functional.
5. **Git Push:** Execute the Git terminal commands provided at the bottom of that prompt file to commit and update your GitHub repository.

---

## 11-Part Roadmap Summary

| Part | Milestone | Key Features | Git Commit Scope |
| :---: | :--- | :--- | :--- |
| **01** | Foundation & Monorepo | Laravel 13 + Next.js + PostgreSQL + Redis Docker + Tailwind + shadcn/ui | `feat(setup)` |
| **02** | Authentication & Roles | Sanctum API tokens, Admin role middleware, Next.js Login & Route Guard | `feat(auth)` |
| **03** | Products & Storefront | Product CRUD, unique SKU, `CHECK (stock >= 0)`, TanStack Query catalog | `feat(products)` |
| **04** | Cart System | Client cart, stock boundary checks, backend validation API, slide-out drawer | `feat(cart)` |
| **05** | Checkout & Concurrency | Customer form, `SELECT ... FOR UPDATE` row locking, atomic order creation | `feat(checkout)` |
| **06** | Payment Integration | bKash & SSLCommerz, webhook idempotency, admin payment toggle | `feat(payments)` |
| **07** | CarryBee Delivery API | `OrderPaid` event, async Redis queue job, non-blocking courier dispatch, retries | `feat(delivery)` |
| **08** | Performance & Scheduler | Redis catalog cache tags, N+1 query elimination, scheduled stale order cleanup | `perf(architecture)` |
| **09** | Business Admin Dashboard | Revenue/AOV KPI cards, sales trend chart, low-stock alerts, inventory logs | `feat(dashboard)` |
| **10** | Seeders & Automated Tests | 100 historical orders with consistent stock math, Pest/PHPUnit test suite | `test(suite)` |
| **11** | Vercel Deployment & Docs | Vercel frontend hosting setup, production README.md, comprehensive NOTES.md | `docs(release)` |

---

## Hosting on Vercel (`https://vercel.com/`)

Because this project utilizes a **Next.js frontend** and a **Laravel 13 backend**:

1. **Deploy Frontend to Vercel:**
   - Link your GitHub repository in your [Vercel Dashboard](https://vercel.com/new).
   - Set **Root Directory** to `frontend`.
   - Vercel automatically detects Next.js.
   - Configure Environment Variables in Vercel:
     - `NEXT_PUBLIC_API_URL`: URL of your deployed Laravel API (e.g. `https://api.yourdomain.com/api/v1`).
     - `NEXT_PUBLIC_APP_URL`: Your Vercel frontend URL (e.g. `https://your-store.vercel.app`).
   - Click **Deploy**.

2. **Deploy Backend to Cloud:**
   - Deploy `backend/` to a cloud service supporting PHP 8.4, PostgreSQL, and Redis (such as [Railway](https://railway.app/), [Render](https://render.com/), [Fly.io](https://fly.io/), or a VPS).
   - In your backend `.env`, set:
     ```env
     FRONTEND_URL=https://your-store.vercel.app
     ```
   - Laravel’s `config/cors.php` will automatically authorize your Vercel frontend with credential support.

---

## Evaluation Reference

Before presenting or submitting the project, carefully review [EVALUATION_QA.md](file:///C:/Users/lette/.gemini/antigravity/scratch/single-vendor-ecommerce/EVALUATION_QA.md). It contains comprehensive technical answers covering every evaluation item listed on page 6 of the assessment specification:
- Technical knowledge (PHP 8.4, Laravel 13, Next.js, PostgreSQL)
- Database and architecture decisions
- Requirement understanding
- Problem-solving and edge cases (race conditions, duplicate callbacks, API failures)
- Inventory consistency guarantees
- Performance & scalability thinking
- Payment and CarryBee API integration
- Code quality, maintainability, and clean architecture
- Automated testing strategy
- Business/product thinking behind the admin dashboard
