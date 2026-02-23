# 🎒 CCHS Lost & Found Portal

A secure, moderated Lost & Found platform built for school environments.  
Designed to increase item return rates, reduce staff workload, and protect student privacy.

---

## 📌 What It Is

CCHS Lost & Found is a full-stack web application that modernizes how schools manage misplaced items.

It enables:

- Structured item reporting
- Advanced search & filtering
- Secure claim verification
- Admin moderation workflows
- Privacy-first communication

---

## ❗ Problem / Why

Schools process hundreds of misplaced items every semester.

Traditional systems rely on:

- Physical bins
- Paper logs
- Unsearchable spreadsheets
- Manual coordination

This leads to:

- Low return rates
- Poor visibility
- Privacy risks
- Staff inefficiency

This platform replaces that process with a secure, searchable, and moderated system.

---

## ✨ Features

### 👤 Public / Guests
- Search and filter items
- View detailed item pages
- Submit claim requests
- Report found items
- Report lost items

### 🎓 Authenticated Students & Staff
- Track personal submissions
- Receive status updates
- Faster claim handling

### 🛠 Admin Dashboard
- Moderation queue (approve / deny / edit)
- Status workflow:
  `Pending → Listed → Claimed → Returned → Archived`
- Redact sensitive information
- Merge duplicate items
- Analytics dashboard
- CSV export
- Role management
- Audit logging

---

## 🖼 Screenshots

> Replace these with real images in your repo.

### Homepage
![Homepage](docs/screenshots/home.png)

### Search Page
![Search Page](docs/screenshots/search.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin.png)

---

## 🧱 Tech Stack

**Frontend**
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Accessible HTML5 components

**Backend**
- Next.js API Routes
- PostgreSQL
- Role-Based Access Control (RBAC)

**Storage**
- Object storage for images
- Thumbnail generation
- EXIF stripping

**Authentication**
- Email OTP (upgradeable to School SSO)

---

## 🏗 Architecture Overview

The system follows a modern full-stack architecture using the Next.js App Router with server-side API routes.

### High-Level Flow

Client (Browser - Next.js Frontend)  
↓  
API Layer (Next.js Server Routes)  
↓  
Database (PostgreSQL via Supabase)  
↓  
Object Storage (Item Images)

---

### Core Components

**Frontend**
- App Router pages and layouts
- Server + Client Components
- Tailwind CSS UI
- Accessible form handling
- Role-based UI rendering

**Backend**
- REST-style API routes (`/api/...`)
- Server-side validation
- Authentication & authorization middleware
- Moderation workflow engine
- Claims processing logic

**Database**
- Users table (role-based access)
- Items (found/lost)
- Claims
- Images
- Audit logs
- Notifications

**Storage**
- Secure object storage bucket
- Randomized filenames
- Thumbnail generation
- EXIF metadata stripping

---

### Role-Based Access Control (RBAC)

- Guest → Search, report, claim (rate-limited)
- Authenticated User → Track submissions
- Admin → Moderate, edit, approve, export, manage users

All admin endpoints are protected via server-side role verification.

---

### Moderation Workflow

1. Item submitted → `pending`
2. Admin review → `approved` or `rejected`
3. Approved item → `listed`
4. Claim submitted → `under_review`
5. Admin verifies → `claimed`
6. Pickup confirmed → `returned`
