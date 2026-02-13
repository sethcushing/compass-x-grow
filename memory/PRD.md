# Compass X Grow Sales Engagement CRM - Product Requirements Document

## Original Problem Statement
Build a clean, modern, pipeline-driven CRM for Tech, Data, and AI Consulting firms.

## User Management
**7 authorized CompassX team members** - Access via Google OAuth or password login

**Admin:** Seth Cushing (seth.cushing@compassx.com)
**Sales Leads:** Arman, Brian, Jamie, Kyle, Randy, Ray

Default password for password login: `CompassX2026!`

## What's Been Implemented

### Deal Builder & Opportunity Financials (Feb 13, 2026)
- ✅ **Deal Builder Card** - New "Opportunity Financials" section on Opportunity Detail page
- ✅ **Inputs**: Start Date, End Date, Number of Consultants, Blended Hourly Rate
- ✅ **Live Calculation**: Working Days × 8 hrs × Consultants × Hourly Rate (excludes weekends)
- ✅ **Dual Display**: Manual Estimate (slate) and Calculated Value (green) shown side by side
- ✅ **Persistence**: All deal builder fields saved to database
- ✅ **Edit Mode**: Toggle to enter/update deal financial details

### Client Won/Lost Totals (Feb 13, 2026)
- ✅ **Won Column**: Green box showing total won value and deal count
- ✅ **Lost Column**: Rose box showing total lost value and deal count
- ✅ **6-Column Summary Grid**: Buyer, Deals, Total Value, Avg Confidence, Won, Lost
- ✅ **Calculated from Stage**: Won/Lost based on stage_id containing "won" or "lost"

### At-Risk Deals Feature (Feb 13, 2026)
- ✅ **Mark Opportunities as At-Risk** - Manual toggle with reason (PUT /api/opportunities/{opp_id}/at-risk)
- ✅ **At-Risk Reason Field** - Store and display why a deal is at risk
- ✅ **Dashboard At-Risk Deals Count** - Fourth metric card shows at-risk opportunities count
- ✅ **Pipeline At-Risk UI** - Dropdown menu on cards to mark/clear at-risk status
- ✅ **At-Risk Dialog** - Enter reason when marking as at-risk
- ✅ **Visual Indicators** - Amber border and reason text on at-risk cards
- ✅ **OpportunityDetail Banner** - Prominent at-risk banner with reason and edit button
- ✅ **Toggle Buttons** - "Mark At-Risk" (amber) / "Clear At-Risk" (green) on detail page
- ✅ **Executive View Removed** - Sidebar link and route removed per user request

### Dashboard Enhancements (Feb 13, 2026)
- ✅ **Top Opportunities by Client** - Grouped view showing clients with total value and individual deals
- ✅ **At-Risk Clients Badge** - Shows count of at-risk clients in At-Risk Deals metric card
- ✅ **Color-coded Activities** - Activities in dashboard use type-specific colors and icons

### Activities Enhancements (Feb 13, 2026)
- ✅ **Title Field** - Activities now have title as main content (type shown as badge)
- ✅ **Color-coded Cards** - Each activity type has unique color border:
  - Call: Blue, Email: Purple, Meeting: Emerald, Demo: Orange
  - Workshop: Pink, Discovery Session: Cyan, Follow-up: Amber
  - Exec Readout: Indigo, Other: Slate
- ✅ **Type-specific Icons** - Phone, Mail, Video, Presentation, Users, MessageSquare, Clock, FileText

### Client Page Redesign (Feb 13, 2026)
- ✅ **Buyer Section** - Shows identified buyer (Decision Maker/Champion) or "No buyer identified"
- ✅ **Opportunity Totals** - Shows deal count, total value, avg confidence on client cards
- ✅ **Google Drive Link** - Prominent clickable button on cards and card-style link on detail page
- ✅ **Notes Running Tally** - Add notes with input field, displayed with author & timestamp
- ✅ Activity deletion now working correctly

### App Rebranding (Feb 13, 2026)
- ✅ Changed app name from "CompassX" to "**Compass X Grow**"
- ✅ Updated login page, sidebar, and settings

### Google OAuth Authentication (Feb 13, 2026)
- ✅ **Google OAuth** via Emergent-managed Auth
- ✅ **Email Whitelisting** - Only 7 authorized CompassX emails can login
- ✅ **Both auth methods** - Password login + Google OAuth on same page
- ✅ **Role sync** - Admin/Sales Lead roles synced from authorized list
- ✅ **Seth Cushing** is the only admin

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
- ✅ All/My toggle on Pipeline page
- ✅ All/My toggle on Reports page with filtered analytics
- ✅ Owner selection on all entities

### AI Sales Copilot
- ✅ Summarize, Suggest Activity, Draft Email, Value Hypothesis
- ✅ Powered by GPT-5.2 via Emergent LLM Key

## Database Schema Updates

### Opportunities Collection
```
{
  opp_id,
  name,
  org_id,
  primary_contact_id,
  engagement_type,
  estimated_value,
  confidence_level,
  owner_id,
  pipeline_id,
  stage_id,
  target_close_date,
  source,
  notes,
  value_hypothesis,
  is_at_risk: boolean,
  at_risk_reason: string,
  // Deal Builder fields
  deal_start_date: datetime,
  deal_end_date: datetime,
  num_consultants: int,
  blended_hourly_rate: float,
  calculated_value: float,
  created_at,
  updated_at,
  stage_entered_at
}
```

### Activities Collection
```
{
  activity_id,
  activity_type: "Call" | "Email" | "Meeting" | "Demo" | "Workshop" | "Discovery Session" | "Follow-up" | "Exec Readout" | "Other",
  title,
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

### Opportunities
- PUT /api/opportunities/{opp_id}/at-risk - Toggle at-risk status with reason
- PUT /api/opportunities/{opp_id} - Update opportunity including deal builder fields
  - Deal Builder fields: `deal_start_date`, `deal_end_date`, `num_consultants`, `blended_hourly_rate`, `calculated_value`

### Organizations
- GET /api/organizations/{org_id}/summary - Returns buyer, opportunity totals, won/lost values
  - Response includes: `won_count`, `won_value`, `lost_count`, `lost_value`

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
- [ ] Advanced At-Risk Logic: Auto-flag Opportunities without scheduled future activities
- [ ] Email integration
- [ ] Calendar sync
- [ ] Document attachments
