# CompassX Sales Engagement CRM - Product Requirements Document

## Original Problem Statement
Build a clean, modern, pipeline-driven CRM for Tech, Data, and AI Consulting firms.

## User Management
**7 authorized CompassX team members** with password `CompassX2026!`

## What's Been Implemented

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
  activity_type,
  opp_id (optional),
  org_id (optional - NEW),
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

### Organizations
- GET /api/organizations - Returns is_at_risk flag
- GET /api/organizations/{id} - Returns is_at_risk flag

## Prioritized Backlog

### P1 (Important)
- [ ] Activity notifications/reminders
- [ ] Bulk import for Clients/Contacts
- [ ] Contact communication history

### P2 (Nice to Have)
- [ ] Email integration
- [ ] Calendar sync
- [ ] Document attachments
