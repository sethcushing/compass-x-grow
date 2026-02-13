# CompassX Sales Engagement CRM - Product Requirements Document

## Original Problem Statement
Build a clean, modern, pipeline-driven CRM for Tech, Data, and AI Consulting firms.

## User Management
**7 authorized CompassX team members** - Access via Google OAuth or password login

**Admin:** Seth Cushing (seth.cushing@compassx.com)
**Sales Leads:** Arman, Brian, Jamie, Kyle, Randy, Ray

Default password for password login: `CompassX2026!`

## What's Been Implemented

### Google OAuth Authentication (Feb 13, 2026)
- ✅ **Google OAuth** via Emergent-managed Auth
- ✅ **Email Whitelisting** - Only 7 authorized CompassX emails can login
- ✅ **Both auth methods** - Password login + Google OAuth on same page
- ✅ **Role sync** - Admin/Sales Lead roles synced from authorized list
- ✅ **Seth Cushing** is the only admin

### Client Page Enhancements (Feb 13, 2026)
- ✅ **Notes field** - Add notes when creating/editing clients
- ✅ **Google Drive Link** - Store and display link to client's Drive folder
- ✅ Notes and Drive link visible on client cards in list view
- ✅ "Open Google Drive Folder" link on client detail page

### UI Improvements (Feb 13, 2026)
- ✅ Changed "Mine" to "My" on Pipeline and Reports page toggles

### Activity Deletion & Expanded Types (Feb 13, 2026)
- ✅ **Delete Activities** - DELETE /api/activities/{activity_id} endpoint
- ✅ Delete buttons on Activities page (Timeline & By Client views)
- ✅ Delete buttons on Client/Organization detail page
- ✅ Delete confirmation dialog
- ✅ **Expanded Activity Types**: Call, Email, Meeting, Demo, Workshop, Discovery Session, Follow-up, Exec Readout, Other

### Naming & Terminology Changes (Feb 13, 2026)
- ✅ "Organizations" → "Clients" throughout the app
- ✅ "Strategic Tier" → "Client Status" with values: **Current, Future, Return**
- ✅ Sidebar updated to show "Clients" instead of "Organizations"

### At-Risk Detection (Feb 13, 2026)
- ✅ Clients marked "At Risk" if no activity in 7 days
- ✅ At-Risk badge displays on client cards and detail pages
- ✅ Automatic calculation based on activities (direct + via opportunities)

### Client Page Enhancements (Feb 13, 2026)
- ✅ **Create Contact** directly from client detail page
- ✅ **Create Activity** directly from client detail page (linked to org_id)
- ✅ **Create Opportunity** from client detail page
- ✅ Activities section shows all client activities (direct + via opportunities)

### Activities Page Enhancements (Feb 13, 2026)
- ✅ **Timeline / By Client** toggle view
- ✅ Timeline: Activities sorted by date with tabs (Upcoming, Overdue, Completed)
- ✅ By Client: Activities grouped by client organization
- ✅ **Create Activity** with client selection
- ✅ Activities can be linked directly to org_id (not just opportunities)
- ✅ Search functionality across activities

### Pipeline & Reports
- ✅ All/Mine toggle on Pipeline page
- ✅ All/Mine toggle on Reports page with filtered analytics
- ✅ Owner selection on all entities

### AI Sales Copilot
- ✅ Summarize, Suggest Activity, Draft Email, Value Hypothesis
- ✅ Powered by GPT-5.2 via Emergent LLM Key

## Database Schema Updates

### Activities Collection
```
{
  activity_id,
  activity_type: "Call" | "Email" | "Meeting" | "Demo" | "Workshop" | "Discovery Session" | "Follow-up" | "Exec Readout" | "Other",
  opp_id (optional),
  org_id (optional),
  due_date,
  owner_id,
  status,
  notes
}
```

### Organizations Collection
```
{
  org_id,
  name,
  industry,
  strategic_tier (Current/Future/Return),
  owner_id,
  is_at_risk (calculated)
}
```

## API Endpoints

### Activities
- GET /api/activities?org_id=xxx - Filter by client
- POST /api/activities - Now supports org_id without opp_id
- DELETE /api/activities/{activity_id} - Delete an activity

### Organizations
- GET /api/organizations - Returns is_at_risk flag
- GET /api/organizations/{id} - Returns is_at_risk flag

## Prioritized Backlog

### P1 (Important)
- [ ] Advanced Reporting: Sales cycle duration and win/loss analysis charts
- [ ] Activity notifications/reminders
- [ ] Bulk import for Clients/Contacts
- [ ] Contact communication history

### P2 (Nice to Have)
- [ ] Automation Rules: Auto-create follow-up activities on stage change
- [ ] Advanced At-Risk Logic: Flag individual Opportunities without scheduled activities
- [ ] Email integration
- [ ] Calendar sync
- [ ] Document attachments
