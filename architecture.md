# DraftLex Architecture

DraftLex follows **Clean Architecture** with CQRS using MediatR. The goal is to keep business logic independent from frameworks, databases, and UI.

---

# High-Level Architecture

```text
                 React + TypeScript
                       │
                 Axios (JWT)
                       │
          ASP.NET Core Web API
                       │
                  Controllers
                       │
                    MediatR
        ┌──────────────┼──────────────┐
        │              │              │
     Commands       Queries       Services
        │              │              │
        └──────────────┼──────────────┘
                       │
                  Domain Entities
                       │
            Repository Interfaces
                       │
        Entity Framework Core
                       │
                 PostgreSQL
```

---

# Layer Responsibilities

## Frontend

Technology:

- React
- TypeScript
- Vite
- Tailwind CSS

Responsibilities:

- UI
- Routing
- JWT storage
- API calls
- Global Search
- Dashboard

---

## API Layer

Responsibilities:

- Authentication
- Authorization
- Request validation
- HTTP endpoints

Examples:

- ClientsController
- MattersController
- HearingsController
- DocumentsController

Controllers remain thin and delegate work to MediatR.

---

## Application Layer

Contains business use cases.

Examples:

- CreateMatterCommand
- GetMatterByIdQuery
- CreateHearingCommand

Benefits:

- Testable
- Independent
- Reusable

---

## Domain Layer

Contains pure business entities.

Examples:

- Client
- Matter
- Hearing
- TimelineEvent
- LegalDocument

The Domain layer contains no database or framework dependencies.

---

## Infrastructure Layer

Responsibilities:

- Entity Framework
- PostgreSQL
- JWT
- AI integrations
- File storage

Examples:

- DraftLexDbContext
- Repositories
- JwtTokenService

---

# CQRS Flow

Example: Create Matter

Client

↓

POST /api/Matters

↓

CreateMatterCommand

↓

CreateMatterHandler

↓

Repository

↓

PostgreSQL

↓

TimelineEvent Created

---

# Security

Implemented:

- JWT Authentication
- Ownership filtering
- HSTS
- CSP
- HTTPS
- Security headers

Ownership example:

```csharp
.Where(m => m.AdvocateId == _currentUser.UserId)
```

This prevents cross-user access.

---

# TimelineEvents

TimelineEvents power multiple features.

One event can appear in:

- Matter Timeline
- Dashboard Activity
- Notification Center

This avoids duplicate business logic.

---

# AI Integration

DraftLex integrates Ollama through an application service.

Flow:

Editor

↓

AI Draft Request

↓

Application Service

↓

Ollama

↓

Generated Draft

The UI remains independent from the AI provider.

---

# Performance Optimizations

Implemented:

- React.lazy
- Suspense
- Promise.all
- Debounced Search

Future:

- Pagination
- Virtualized Lists
- Response Caching

---

# Why Clean Architecture?

Benefits:

- Low coupling
- High testability
- Easier maintenance
- Independent business logic
- Scalable feature development