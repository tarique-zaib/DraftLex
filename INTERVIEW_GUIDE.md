# DraftLex Interview Guide

A quick revision guide for explaining DraftLex during technical interviews.

---

# Elevator Pitch (30 seconds)

DraftLex is an AI-powered Legal Practice Management System built using .NET 10, React, TypeScript, and PostgreSQL following Clean Architecture.

It helps advocates manage clients, matters, hearings, evidence, and AI-assisted legal drafting while maintaining secure advocate-level data isolation through JWT authentication and ownership checks.

---

# Architecture

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

Backend

- .NET 10 Web API
- Clean Architecture
- MediatR
- Entity Framework Core

Database

- PostgreSQL

Authentication

- JWT

AI

- Ollama

---

# Why Clean Architecture?

Clean Architecture separates business logic from infrastructure.

Layers:

- API
- Application
- Domain
- Infrastructure

Benefits:

- Easier testing
- Better maintainability
- Low coupling
- Independent business rules

---

# Why MediatR?

MediatR implements the mediator pattern.

Instead of controllers calling repositories directly:

Controller

↓

Command/Query

↓

Handler

↓

Repository

Benefits:

- Single responsibility
- Easier testing
- Cleaner controllers

---

# Authentication Flow

1. User logs in.
2. JWT is generated.
3. Token is stored.
4. Axios sends the token.
5. ProtectedRoute secures frontend pages.
6. Backend validates the JWT.

---

# Authorization

Every resource belongs to an Advocate.

Examples:

Clients

```csharp
.Where(c => c.AdvocateId == _currentUser.UserId)
```

Matters

```csharp
.Where(m => m.AdvocateId == _currentUser.UserId)
```

This prevents users from accessing another advocate's data.

---

# Hearing Calendar

Features:

- Monthly view
- Date filtering
- Cause List
- Tomorrow panel
- Reschedule
- Persistent "Mark Attended"

Persistence was implemented without changing the database schema by using the existing `Remarks` field as a completion marker.

---

# Evidence Management

Workflow:

Upload

↓

Store file

↓

Create database record

↓

Create TimelineEvent

↓

Preview / Download / Delete

Supported features:

- PDF
- DOCX
- Images

---

# AI Draft Editor

Built with TipTap.

Features:

- Auto-save
- Rich formatting
- Hindi
- English

---

# Dashboard

Dashboard includes:

- KPI cards
- Today's Priority
- Weekly Hearing Analytics
- Recent Activity
- Notification Center

Recent Activity is powered by TimelineEvents.

---

# Ctrl + K Search

Global search searches across:

- Clients
- Matters
- Hearings
- Documents

Implementation:

- React modal
- Keyboard shortcut
- Debounced API calls
- Arrow navigation

---

# Performance Optimizations

Implemented:

- React.lazy
- Suspense
- Promise.all
- Debounced search

Future:

- Pagination
- Virtualization
- Caching

---

# Security

Implemented:

- JWT
- CSP
- HSTS
- HTTPS
- Security headers
- Ownership validation

Future:

- Rate limiting
- File signature validation

---

# Biggest Challenge

The biggest technical issue was PostgreSQL DateTime handling with Npgsql.

Problem:

UTC vs Local vs Unspecified DateTime caused save failures.

Solution:

Standardized timestamps and ensured values matched PostgreSQL expectations.

---

# Favorite Feature

Notification Center combined with TimelineEvents because one event source powers:

- Dashboard
- Notifications
- Matter history

without duplicating business logic.

---

# Interview Closing

DraftLex demonstrates:

- Clean Architecture
- CQRS with MediatR
- Secure multi-user authorization
- React performance optimization
- AI integration
- Real-world legal workflows