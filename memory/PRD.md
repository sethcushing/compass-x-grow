# CompassX Sales Engagement CRM - Product Requirements Document

## Original Problem Statement
Build a clean, modern, pipeline-driven CRM application modeled after Pipedrive, purpose-built for Tech, Data, and AI Consulting & Advisory firms. Manages client conversations, opportunities, advisory engagements, and AI/Data/Platform sales cycles pre-SOW.

## User Management (Updated Feb 11, 2026)
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

## What's Been Implemented (Feb 11, 2026)

### Authentication & User Management
- ✅ JWT-based authentication (replaced Google OAuth)
- ✅ Whitelist-only access (7 authorized users)
- ✅ Password change functionality
- ✅ Settings page with team member list (Admin view)
- ✅ Role-based access control (Admin, Sales Lead)

### Backend (FastAPI + MongoDB)
- ✅ Organizations CRUD with strategic tiers + owner_id
- ✅ Contacts CRUD with buying roles + owner_id
- ✅ Opportunities CRUD with stage management + owner_id
- ✅ Activities CRUD with status tracking + owner_id
- ✅ Pipeline & Stages management
- ✅ Main Dashboard API (shows ALL data, not filtered by user)
- ✅ My Pipeline API (shows only user's owned opportunities)
- ✅ Executive Dashboard API (all pipeline data, forecasts)
- ✅ Analytics API (pipeline by stage, engagement types)
- ✅ AI Sales Copilot (summarize, suggest activity, draft email, value hypothesis)
- ✅ Stage automation (auto-create activities on stage change)
- ✅ Delete functionality for organizations, contacts, opportunities

### Frontend (React + Tailwind)
- ✅ Login page with email/password
- ✅ Sales Owner Dashboard (shows ALL opportunities with owner names)
- ✅ My Pipeline view (user's owned engagements only)
- ✅ Executive Dashboard with charts
- ✅ Pipeline Kanban board with drag-and-drop
- ✅ Organizations list & detail views with delete
- ✅ Contacts list & detail views with delete
- ✅ Opportunity detail with AI Copilot and delete
- ✅ Activities management with tabs
- ✅ Reports & Analytics page
- ✅ Settings page with password change
- ✅ Responsive sidebar navigation

### Design System
- Executive Coast theme (Ocean blues, sand backgrounds)
- Outfit + Public Sans fonts
- Rounded corners, soft shadows
- Activity status color indicators

## Prioritized Backlog

### P0 (Next Priority)
- [ ] Activity notifications/reminders
- [ ] Drag-and-drop stage updates in Kanban

### P1 (Important)
- [ ] At-risk detection automation (7-day no activity flag)
- [ ] Contact communication history
- [ ] Bulk import (Organizations, Contacts)

### P2 (Nice to Have)
- [ ] Email integration
- [ ] Calendar sync
- [ ] Document attachments

## Next Tasks
1. Add real-time at-risk flagging automation
2. Implement activity reminders/notifications
3. Add search & filtering to all list views
