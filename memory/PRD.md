# CompassX Sales Engagement CRM - Product Requirements Document

## Original Problem Statement
Build a clean, modern, pipeline-driven CRM application modeled after Pipedrive, purpose-built for Tech, Data, and AI Consulting & Advisory firms. Manages client conversations, opportunities, advisory engagements, and AI/Data/Platform sales cycles pre-SOW.

## User Management
**Access restricted to 7 authorized CompassX team members:**

| Name | Role | Email |
|------|------|-------|
| Arman Bozorgmanesh | Sales Lead | arman.bozorgmanesh@compassx.com |
| Brian Clements | Admin | brian.clements@compassx.com |
| Jamie Eigner | Admin | jamiee@compassx.com |
| Kyle Heppenstall | Admin | kyleh@compassx.com |
| Randy Chiu | Admin | randyc@compassx.com |
| Ray Khacharoutian | Sales Lead | reynoldk@compassx.com |
| Seth Cushing | Admin | seth.cushing@compassx.com |

**Default Password:** `CompassX2026!` (Users should change on first login)

## User Personas
1. **Sales Lead** - Manages opportunities, owns client relationships, drives deal progression
2. **Admin** - Full access including team member management + all Sales Lead capabilities

## Core Requirements
- Pipeline-first (deals, not contacts)
- Activity-driven (no idle opportunities)
- Consulting-aware (buyers, exec sponsors, initiatives, value hypotheses)
- Exec-clean UI (CompassX-level polish)
- Fast adoption (minimal CRM fatigue)

## What's Been Implemented

### Authentication & User Management
- ✅ JWT-based authentication (replaced Google OAuth)
- ✅ Whitelist-only access (7 authorized users)
- ✅ Password change functionality
- ✅ Settings page with team member list (Admin view)
- ✅ Role-based access control (Admin, Sales Lead)

### Owner Selection Feature (Feb 13, 2026)
- ✅ Organizations: Owner dropdown in create/edit forms
- ✅ Contacts: Owner dropdown in create/edit forms
- ✅ Opportunities: Owner dropdown in create/edit forms
- ✅ Owner displayed on all entity cards and lists
- ✅ My Pipeline: Filtered by logged-in user's owned opportunities
- ✅ Main Pipeline: Shows all opportunities with owner names

### AI Sales Copilot (Feb 13, 2026)
- ✅ **Summarize**: Executive summary of opportunity status
- ✅ **Suggest Activity**: AI-recommended next action with rationale
- ✅ **Draft Email**: Professional follow-up email generation
- ✅ **Value Hypothesis**: Structured value proposition creation
- ✅ Powered by OpenAI GPT-5.2 via Emergent LLM Key

### Reports & Analytics (Feb 13, 2026)
- ✅ Summary metrics: Total Pipeline, Weighted Forecast, Win Rate, At Risk
- ✅ Pipeline by Stage chart
- ✅ Pipeline by Owner chart
- ✅ Deals by Engagement Type pie chart
- ✅ Activity Summary (Total, Completed, Overdue)
- ✅ Performance by Sales Owner table
- ✅ Performance by Engagement Type table

### Backend (FastAPI + MongoDB)
- ✅ Organizations CRUD with strategic tiers + owner_id
- ✅ Contacts CRUD with buying roles + owner_id
- ✅ Opportunities CRUD with stage management + owner_id
- ✅ Activities CRUD with status tracking
- ✅ Pipeline & Stages management
- ✅ Main Dashboard API (shows ALL data)
- ✅ My Pipeline API (shows only user's owned opportunities)
- ✅ Executive Dashboard API
- ✅ Analytics API (pipeline by stage, engagement types, by owner, summary)
- ✅ AI Sales Copilot endpoints
- ✅ Stage automation (auto-create activities on stage change)
- ✅ Delete functionality for all entities

### Frontend (React + Tailwind)
- ✅ Login page with email/password
- ✅ Sales Owner Dashboard (shows ALL opportunities with owner names)
- ✅ My Pipeline view (user's owned engagements only)
- ✅ Executive Dashboard with charts
- ✅ Pipeline Kanban board with drag-and-drop
- ✅ Organizations list & detail views
- ✅ Contacts list & detail views
- ✅ Opportunity detail with AI Copilot
- ✅ Activities management with tabs
- ✅ Reports & Analytics page (enhanced)
- ✅ Settings page with password change
- ✅ Responsive sidebar navigation

### Design System
- Executive Coast theme (Ocean blues, sand backgrounds)
- Outfit + Public Sans fonts
- Rounded corners, soft shadows
- Activity status color indicators

## Prioritized Backlog

### P1 (Important)
- [ ] At-risk detection automation (7-day no activity flag)
- [ ] Contact communication history
- [ ] Bulk import (Organizations, Contacts)
- [ ] Activity notifications/reminders

### P2 (Nice to Have)
- [ ] Email integration
- [ ] Calendar sync
- [ ] Document attachments
- [ ] Automation Rules

## Technical Architecture

### Backend
- FastAPI with async MongoDB (Motor)
- JWT authentication
- Pydantic models for validation
- Emergent LLM integration

### Frontend
- React 18
- Tailwind CSS
- Shadcn/UI components
- Recharts for analytics
- @dnd-kit for drag-and-drop
- Framer Motion for animations

### Database (MongoDB)
- users: {user_id, name, email, password_hash, role}
- organizations: {org_id, name, industry, ..., owner_id}
- contacts: {contact_id, name, title, ..., org_id, owner_id}
- opportunities: {opp_id, name, value, stage, ..., owner_id}
- activities: {activity_id, type, due_date, status, ..., opp_id}
- pipelines: {pipeline_id, name, is_default}
- stages: {stage_id, pipeline_id, name, order, win_probability}

## API Endpoints

### Auth
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/auth/users
- POST /api/auth/change-password

### CRUD
- GET/POST /api/organizations, /api/organizations/{id}
- GET/POST /api/contacts, /api/contacts/{id}
- GET/POST /api/opportunities, /api/opportunities/{id}
- GET/POST /api/activities, /api/activities/{id}
- GET /api/pipelines, /api/pipelines/{id}/stages

### Dashboard
- GET /api/dashboard/sales (all data)
- GET /api/dashboard/my-pipeline (user's data)
- GET /api/dashboard/executive

### Analytics
- GET /api/analytics/pipeline
- GET /api/analytics/engagement-types
- GET /api/analytics/by-owner
- GET /api/analytics/summary

### AI
- POST /api/ai/copilot
