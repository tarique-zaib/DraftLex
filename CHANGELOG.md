# Changelog

All notable changes to DraftLex are documented in this file.

The format follows **Keep a Changelog**, and this project uses Semantic Versioning.

---

# [1.0.0-rc1] - 2026-09-27

## 🎉 Release Candidate

DraftLex reaches Release Candidate (RC1) with a complete legal practice management workflow built using .NET 10, React, PostgreSQL, and Clean Architecture.

---

## Added

### Authentication & Security

- JWT authentication
- Protected routes
- Advocate-level authorization
- Security headers (CSP, HSTS, X-Frame-Options, Referrer Policy)
- HTTPS enforcement

### Client Management

- Client registration
- Client details page
- Search and filtering

### Matter Management

- Matter creation
- Matter Workspace
- Matter timeline
- Matter-wise document organization

### Hearings

- Monthly calendar
- Cause List
- Tomorrow panel
- Reschedule hearing
- Persistent "Mark Attended"

### Documents

- Evidence upload
- Preview
- Download
- Delete
- PDF export

### AI Drafting

- TipTap legal editor
- Auto-save
- Hindi & English support

### Dashboard

- KPI cards
- Today's Priority
- Weekly Hearing Analytics
- Recent Activity Feed
- Quick Actions

### Productivity

- Ctrl + K Global Search
- Notification Center
- Unread notifications

---

## Improved

- Lazy loading with React Suspense
- Dashboard loading performance
- Hindi localization
- Hearing calendar UI
- Recent Activity translations
- Notification UX

---

## Fixed

### Backend

- PostgreSQL DateTime UTC issues
- Swagger file upload error
- Ownership validation
- Evidence upload API

### Frontend

- Upload Evidence blank screen
- Edit Matter blank page
- Calendar duplicate React keys
- Document preview rendering
- Hearing completion persistence
- Dashboard activity loading
- Hindi translation inconsistencies

---

## Technical Highlights

- .NET 10
- React + TypeScript + Vite
- PostgreSQL
- Entity Framework Core
- MediatR
- Clean Architecture
- Tailwind CSS
- JWT Authentication

---

## RC1 Status

| Area | Status |
|------|--------|
| Core Features | ✅ 100% |
| Security | ✅ 98% |
| Performance | ✅ 95% |
| UX | ✅ 95% |

DraftLex is now feature-complete and has entered the Production Hardening phase.