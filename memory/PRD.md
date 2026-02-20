# Compass X Grow Sales Engagement CRM - Product Requirements Document

## Original Problem Statement
Build a clean, modern, pipeline-driven CRM for Tech, Data, and AI Consulting firms.

## User Management & Authentication
**Admin:** Seth Cushing (seth.cushing@compassx.com) - Password: `CompassX2026!`

**Authentication:** Password-based JWT login only (Google OAuth removed)

**Admin Capabilities:**
- Add new users (name, email, password, role)
- Edit existing users (name, email, role)
- Reset user passwords
- Delete users (cannot delete self)

**User Roles:**
- `admin` - Full access including user management
- `sales_lead` - Standard CRM access

## Deployment
**Dockerfile:** `/app/Dockerfile` - Multi-stage build for Koyeb deployment
- Frontend: React build served via nginx on port 8000
- Backend: FastAPI on port 8001 (internal)
- Nginx: Proxies `/api/*` to backend, serves static files

**Environment Variables (set at runtime):**
- `MONGO_URL` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens

**Health Check:** `GET /api/health` - Returns database connection status

**Production Setup Steps:**
1. Deploy to Koyeb with Dockerfile
2. Visit `/api/auth/setup-admin` to create admin user
3. Visit `/api/seed` to load sample data
4. Login with seth.cushing@compassx.com / CompassX2026!

## What's Been Implemented

### Dark/Light Mode Toggle & Glassmorphic UI (Feb 20, 2026)
- ✅ **Theme Toggle** - Added Dark/Light mode toggle in sidebar
- ✅ **Theme Context** - Created `/context/ThemeContext.jsx` to manage theme state
- ✅ **LocalStorage Persistence** - Theme preference is saved and persists across sessions
- ✅ **Glassmorphic Reports Page** - Beautiful charts with glass effect cards, responsive to theme
- ✅ **Glassmorphic Client Detail Page** - Colorful metric boxes with glass effect
- ✅ **Dashboard Theme Support** - All metric cards support both light and dark modes
- ✅ **CSS Variables** - Separate color palettes for light and dark modes
- ✅ **Gradient Mesh Background** - Subtle gradient mesh in dark mode

### Light Mode UI Conversion (Feb 20, 2026)
- ✅ **Full Light Mode Conversion** - Converted entire application from dark glassmorphic theme to clean light mode
- ✅ **Login Page** - Light background with subtle gradients, clean card design
- ✅ **Sidebar** - White background with subtle shadows, consistent hover states
- ✅ **Dashboard** - Light slate-50 background, clean metric cards
- ✅ **Pipeline** - Light Kanban board with white cards
- ✅ **Settings** - Clean light forms and user management interface
- ✅ **All Pages** - Consistent button colors (ocean-600), light backgrounds throughout
- ✅ **CSS Variables** - Updated to lighter color palette

### Backend Error Handling (Feb 20, 2026)
- ✅ **Global Exception Handler** - Added to ensure all errors return JSON instead of HTML

### User Management (Feb 19, 2026)
- ✅ **Admin User Management** - Settings page shows User Management section for admins
- ✅ **Add User** - Create new users with name, email, password, role
- ✅ **Edit User** - Update user name, email, role
- ✅ **Reset Password** - Admin can reset any user's password
- ✅ **Delete User** - Admin can delete users (with confirmation)
- ✅ **Self-Protection** - Admin cannot delete their own account
- ✅ **Role-Based Access** - Non-admins get 403 on user management endpoints
- ✅ **Google OAuth Removed** - Login page only shows email/password form

### Deal Builder & Opportunity Financials (Feb 13, 2026)
- ✅ **Deal Builder Card** - Primary way to calculate opportunity value on Opportunity Detail page
- ✅ **Inputs**: Start Date, End Date, Number of Roles, Blended Hourly Rate
- ✅ **Live Calculation**: Working Days × 8 hrs (40-hr work week) × Roles × Hourly Rate
- ✅ **Opportunity Total** - Single primary display (removed dual Manual/Calculated)
- ✅ **Removed Estimated Value** - No longer manual entry, calculated from Deal Builder
- ✅ **Sync Values** - Save updates both calculated_value and estimated_value
- ✅ **Pipeline Cards** - Display calculated_value as primary opportunity value

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
- ✅ **Won vs Lost Metrics** - Dashboard shows Won (Closed) and Lost (Closed) totals with counts
- ✅ **Active Opportunities Card** - Shows Closed Won opportunities count and value
- ✅ **Pipeline Opportunities Card** - Shows Open opportunities count and value
- ✅ **Avg Confidence** - Dashboard shows average confidence score (replaced Weighted Forecast)
- ✅ **8 Metric Cards** - Two rows: Top row (Total Pipeline, Avg Confidence, Overdue Activities, At-Risk Deals), Bottom row (Won, Lost, Active, Pipeline)

### UI Improvements (Feb 13, 2026)
- ✅ Changed "Mine" to "My" on Pipeline and Reports page toggles
- ✅ Currency values formatted as $1.25M for millions

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

### Authentication
- POST /api/auth/login - Password-based login
- GET/POST /api/auth/setup-admin - Initialize admin user (production setup)
- GET/POST /api/seed - Load sample data

### Opportunities
- PUT /api/opportunities/{opp_id}/at-risk - Toggle at-risk status with reason
- PUT /api/opportunities/{opp_id} - Update opportunity including deal builder fields

### Organizations
- GET /api/organizations/{org_id}/summary - Returns buyer, opportunity totals, won/lost values

### Reports
- GET /api/reports/summary - Dashboard metrics endpoint

### Activities
- GET /api/activities?org_id=xxx - Filter by client
- POST /api/activities - Now supports org_id without opp_id
- DELETE /api/activities/{activity_id} - Delete an activity

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
