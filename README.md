# MidBridge 2.0 — Cross-Border Digital Mobility Platform

> **"One journey. Every border. Connected."**  
> An independent, full-stack cross-border digital mobility, document readiness, verification, and journey intelligence infrastructure.

---

## Overview

MidBridge 2.0 replaces fragmented websites, opaque consular guidelines, and expensive consultants with a single unified cross-border mobility operating system. Users define their origin, destination, and purpose of travel (Study, Work, Immigration, Research, Exchange, Travel, or Family Relocation), and MidBridge 2.0 automatically constructs a customized 12-stage preparation roadmap, cryptographic document vault, dynamic readiness score, and selective disclosure verification system.

---

## Visual Design Systems

1. **Cinematic Hero & Glassmorphism (System 1)**:
   - Full-screen initial hero (`h-screen w-full overflow-hidden`) with native background video (`hf_20260803_...mp4`).
   - Glassmorphic navigation cluster (`rounded-full bg-white/10 backdrop-blur-lg border border-white/10`).
   - Mobile animated drawer with cubic-bezier easing and background scroll lock.
   - Geist font typography paired selectively with Silkscreen for numeric counters and percentages.

2. **Interactive 3D Cylindrical Carousel (System 2)**:
   - Repurposed 3D spatial cylindrical carousel with 1350px CSS perspective and `transform-style: preserve-3d`.
   - Continuous circular motion with `requestAnimationFrame` at 60fps and smooth inertia (`current += (target - current) * 0.08`).
   - Cursor-responsive tilt, volumetric thickness, and smoothstep edge disappearance.
   - Dual-face country cards (destination visual, tags, and quick status on front; visa pathways, processing times, and requirements on back).
   - 3D spatial module selector for post-login dashboard navigation.

---

## Core Features Implemented

* **Public Country Library**: 20 destination countries (US, UK, Germany, France, Canada, Australia, NZ, Japan, South Korea, Singapore, Netherlands, Switzerland, Ireland, Italy, Spain, Sweden, Finland, China, UAE, India) with 12 structured intelligence sections and verified official source metadata.
* **Authentication & RBAC**: Real JWT session tokens, bcrypt password hashing, and role-based access control supporting 5 roles: `USER`, `ADMIN`, `AUTHORITY`, `UNIVERSITY`, and `VERIFIER`.
* **MidBridge 2.0 Journey Engine**: Dynamic requirement formulation based on `Nationality + Destination + Purpose` matrix.
* **12-Stage Mobility Timeline**: Interactive timeline tracking: Researching, Preparing, Applying, Admitted/Approved, Documentation, Verification, Visa/Immigration, Medical, Financial preparation, Travel, Arrival, and Settling in.
* **Smart Checklist**: Real-time status transitions (`NOT_UPLOADED` default, `IN_PROGRESS`, `UPLOADED`, `AI_ANALYZED`, `VERIFICATION_PENDING`, `VERIFIED`).
* **Cryptographic Document Vault**: Multi-category storage (Identity, Academic, Immigration, Financial, Health, Employment) computing genuine **SHA-256** hashes for tamper-proof file integrity.
* **Document Analysis Pipeline**: Extracts metadata (classification, bearer name, document ID, dates, QR presence, digital signatures) while clearly separating `AI ANALYZED` from `OFFICIALLY VERIFIED`.
* **Deterministic Readiness Score**: Deterministic mathematical score weighting documents (30%), verification (20%), visa (20%), financial proof (15%), health (10%), and travel readiness (5%), with penalty diagnostics.
* **Scholarship Discovery**: Curated opportunities (DAAD, Chevening, Fulbright, MEXT, Eiffel, Australia Awards, etc.) with real official sources and cycle deadlines.
* **MidBridge 2.0 Assistant**: Context-aware companion understanding the user's active route, missing mandatory documents, approaching deadlines, and country criteria (with built-in intelligence and external Gemini/OpenAI pluggability).
* **AI Multi-Mode Translator**: Text, Speech-to-Speech (Web Speech API), Camera OCR document capture with live stream snapshot and image upload fallback, and audio pronunciation.
* **Travel Preparation & Arrival Mode**: Pre-departure hand-luggage checklists, airport customs rules, and post-landing protocols (Anmeldung address registration, blocked account unfreezing, SIM cards, Deutschlandticket).
* **Selective Disclosure Packages**: Zero-knowledge credential sharing allowing users to select specific documents for universities or embassies with time-limited expiration and instant revocation.
* **Public Verifier Portal (`/verify`)**: Authoritative inspection portal for validating disclosed documents, verification stamps, and cryptographic SHA-256 hashes via QR codes.
* **Emergency Mode**: Time-limited medical and consular emergency profile generating offline QR tokens for first responders.
* **Institutional Portals**:
  - `MidBridge 2.0 Control` (`/admin`): System analytics, user directory, country policy rule manager, and security audit logs.
  - `Authority Console` (`/authority`): Inbound document queue for consular adjudications, digital signature certification stamps, and rejection workflows.
  - `Admissions Desk` (`/institution`): University applicant review of selective disclosure packages.

---

## Technology Stack

* **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide React, QRCode SVG
* **Backend**: Node.js, Express, TypeScript, tsx, Multer, bcryptjs, jsonwebtoken, crypto
* **Database**: PostgreSQL with normalized relational schema.
  - *Dual Engine Capability*: Natively connects to external PostgreSQL via `DATABASE_URL`. When run locally without a running Postgres service, it automatically initializes an embedded, zero-config PostgreSQL 16 engine (via `@electric-sql/pglite`) in `backend/data/pglite`.

---

## Quick Start Guide

### Prerequisites
* Node.js v18+ (tested on Node v24)
* npm

### 1. Installation

From project root:
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 2. Database Migration & Seeding

```bash
cd backend
npm run seed
```
*Seeds all 20 countries, structured country content, scholarships, requirement matrix, and 5 pre-configured demo role accounts.*

### 3. Start Development Servers

**Backend (Port 5000):**
```bash
cd backend
npm run dev
```

**Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

The application is accessible at: **http://localhost:5173**  
API Health Check: **http://localhost:5000/api/health**

---

## Demo Accounts

You can test any role instantly using the **1-Click Demo Profile Switcher** on the `/login` page or with these credentials:

| Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **USER** | `user@midbridge.io` | `Password123!` | `/dashboard` (India → Germany Study Journey) |
| **ADMIN** | `admin@midbridge.io` | `Password123!` | `/admin` (MidBridge 2.0 Control) |
| **AUTHORITY** | `authority@midbridge.io` | `Password123!` | `/authority` (Adjudication & Verification Queue) |
| **UNIVERSITY** | `university@midbridge.io` | `Password123!` | `/institution` (Admissions Desk) |
| **VERIFIER** | `verifier@midbridge.io` | `Password123!` | `/verify` (Credential Inspector) |

---

## Production Build

```bash
# Backend build
cd backend
npm run build

# Frontend build
cd ../frontend
npm run build
```

---

## Environment Variables (`.env`)

See `.env.example` at project root:
```env
SERVER_PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/midbridge
JWT_SECRET=midbridge_jwt_super_secret_production_key_2026_9831a
JWT_EXPIRES_IN=7d
AI_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
TRANSLATION_API_KEY=
```
*Note: If AI or Translation API keys are omitted, MidBridge 2.0 runs its built-in contextual intelligence and linguistic dictionary engines without degradation.*
