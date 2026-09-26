# ⚖️ DraftLex

> AI-powered Legal Practice Management System built with **.NET 10**, **React**, **TypeScript**, and **PostgreSQL** using **Clean Architecture**.

DraftLex helps advocates manage clients, matters, hearings, evidence, and AI-assisted legal drafting from a single dashboard.

## ✨ Features

### Case Management

- Client Management
- Matter Workspace
- Hearing Calendar
- Cause List
- Persistent Hearing Completion

### Document Management

- Evidence Upload
- Preview
- Download
- PDF Export
- AI Legal Draft Editor

### Productivity

- Dashboard Analytics
- Recent Activity Feed
- Notification Center
- Ctrl + K Global Search
- Hindi + English UI

### Security

- JWT Authentication
- Advocate-level authorization
- Security headers
- CSP
- HSTS

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | .NET 10 Web API |
| Database | PostgreSQL |
| ORM | Entity Framework Core |
| Architecture | Clean Architecture + MediatR |
| AI | Ollama |
| Authentication | JWT |
| Styling | Tailwind CSS |

---

## Architecture

Frontend → API → Application → Domain → Infrastructure → PostgreSQL

The backend follows Clean Architecture with MediatR for CQRS-style request handling and repository abstractions for persistence.

---

## Core Modules

- Dashboard
- Clients
- Matters
- Hearings
- Documents
- AI Drafts
- Notifications
- Global Search

---

## Security

- JWT Authentication
- Role-based ownership checks
- Security headers
- HTTPS
- Content Security Policy

---

## Local Setup

### Backend

```bash
cd backend/DraftLex.Api
dotnet restore
dotnet run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Roadmap

- Docker
- Azure Deployment
- Automated Testing
- Production Monitoring

---

## Version

**DraftLex v1.0.0-rc1**