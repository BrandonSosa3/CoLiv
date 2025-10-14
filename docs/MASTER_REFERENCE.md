# CoLiv OS - Master Reference Document
**Last Updated:** October 13, 2025  
**Status:** MVP Complete + Tenant Portal - Frontend & Backend 100% Functional

---

## EXECUTIVE SUMMARY

**What:** Co-living operations software with room-level management + Tenant Portal  
**Key Differentiator:** Room-level tracking with individual pricing (Property → Unit → Room → Tenant)  
**Target:** Small co-living operators (1-10 properties)  
**Pricing:** $99/mo per property

---

## CURRENT STATUS

**GitHub:** https://github.com/BrandonSosa3/CoLiv  
**Architecture Doc:** https://raw.githubusercontent.com/BrandonSosa3/CoLiv/main/docs/SOFTWARE_ARCHITECTURE.md

**Development Environment:**
- Local Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Operator Frontend: http://localhost:5173
- Tenant Portal: http://localhost:5174
- Database: PostgreSQL on port 5433

**Backend Status:** ✅ 100% COMPLETE  
**Operator Frontend Status:** ✅ 100% COMPLETE  
**Tenant Portal Status:** ✅ 80% COMPLETE (Dashboard, Login, Payments View)

---

## TECH STACK

### Operator Frontend ✅ COMPLETE
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (custom dark theme)
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router v6
- **Forms:** React Hook Form
- **Notifications:** Sonner (toast)
- **Icons:** Lucide React
- **Port:** 5173
- **Deployment:** Vercel (pending)

### Tenant Portal ✅ 80% COMPLETE
- **Framework:** React 18 + TypeScript (separate app)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (same dark theme)
- **State Management:** React Query
- **Routing:** React Router v6
- **Forms:** React Hook Form
- **Notifications:** Sonner (toast)
- **Icons:** Lucide React
- **Port:** 5174
- **Deployment:** Vercel (pending)

### Backend ✅ COMPLETE
- Python 3.11+
- FastAPI (web framework)
- SQLAlchemy 2.0 (ORM)
- Alembic (migrations)
- PostgreSQL 15
- JWT authentication (python-jose + passlib + bcrypt)
- python-dateutil (date calculations)
- email-validator (Pydantic EmailStr)
- Dual-role authentication (operators & tenants)
- Production Deployment: Railway (pending)

### Database ✅ COMPLETE
- PostgreSQL 15
- Local: Docker container (port 5433)
- Production: Railway (when deployed)
- Connection: `postgresql://colivos_user:colivos_pass@localhost:5433/colivos_db`
- GUI Tools: pgAdmin, DBeaver, TablePlus

---

## KEY ARCHITECTURE

### Core Differentiator:
**Room-level tracking** (not just unit-level)

**Traditional PM Software:**  
Property → Unit → Tenant

**CoLiv OS:**  
Property → Unit → **Room** → Tenant

### Dual Portal System:
**Operator Portal (Port 5173):**
- Full property/unit/room management
- Tenant assignment and management
- Payments tracking and marking paid
- Maintenance request management
- Announcements creation

**Tenant Portal (Port 5174):**
- View lease information
- View payment history
- Submit maintenance requests
- View property announcements
- Separate authentication system

### Why This Matters:
- Each room has individual rent amount
- Multiple tenants per unit with different lease dates
- Automatic payment generation per tenant
- Better occupancy tracking
- Supports flexible, staggered leases
- Tenants have their own portal for self-service

---

## DATABASE SCHEMA

**Hierarchy:**
operators (1:Many) → properties (1:Many) → units (1:Many) → rooms (1:1) → tenants
↓
payments
maintenance_requests
announcements

**Core Tables (All Implemented):**
- users (operators & tenants with roles)
- operators
- properties
- units
- **rooms** ◄── KEY DIFFERENTIATOR
- tenants (linked to users)
- payments (auto-generated on tenant assignment)
- maintenance_requests
- announcements

---

## PROGRESS LOG

### October 2, 2025 (Day 1):
✅ Project setup, FastAPI, PostgreSQL Docker

### October 3, 2025 (Day 2):
✅ All SQLAlchemy models, Alembic migrations

### October 4, 2025 (Day 3):
✅ Authentication (JWT), Property CRUD

### October 5, 2025 (Day 4):
✅ Unit CRUD, Room CRUD (core feature)

### October 5, 2025 (Day 5):
✅ Tenant CRUD, room assignment logic

### October 6, 2025 (Day 6):
✅ Payment CRUD endpoints  
✅ Dashboard metrics (property & operator level)  
✅ Complete payment tracking  
✅ Automated test script

### October 7, 2025 (Day 7):
✅ Maintenance request endpoints (full CRUD)  
✅ Announcements endpoints (full CRUD)  
✅ Backend MVP 100% Complete

### October 8-10, 2025 (Days 8-10):
✅ **Complete Operator Frontend MVP Implementation**
- Authentication (Login/Signup)
- Dashboard with real-time metrics
- Properties management (CRUD + search)
- Units management (CRUD + edit)
- Rooms management (CRUD + edit + individual pricing)
- Tenants management (assign/remove + search/filter)
- Payments tracking (auto-generate + mark paid + search/filter)
- Complete edit functionality
- Search & filters across all pages
- Toast notifications, loading states, confirmations
- Dark theme UI

### October 13, 2025 (Day 11): ◄── CURRENT
✅ **High Priority Features Complete**

**Maintenance Requests UI:**
- Create maintenance request with property/unit/room selection
- Priority levels (low/medium/high/urgent)
- Status tracking (open/in_progress/resolved/closed)
- Update status and assign to contractor
- Search and filter by status/priority/property
- Statistics dashboard
- Delete requests
- Backend enum fixes for status values

**Announcements UI:**
- Create announcement with property selection
- Priority levels (normal/important/urgent)
- Edit announcements
- Delete announcements
- Search by title/message/property
- Filter by priority and property
- Statistics dashboard
- Backend schema fixes (message vs content field)

**Tenant Portal - Separate Application:**
- ✅ Separate React app on port 5174
- ✅ Tenant authentication (separate from operator)
- ✅ Dashboard with lease information
- ✅ View room details (property/unit/room)
- ✅ View lease dates and rent amount
- ✅ Payment history view
- ✅ Payment statistics
- ✅ Backend tenant-specific endpoints (/api/v1/tenants/me/*)
- ✅ Dual-role JWT authentication
- ✅ Tenant user creation on assignment
- ⏳ Submit maintenance requests (UI pending)
- ⏳ View announcements (UI pending)

**Technical Improvements:**
- Fixed JWT token to use user.id instead of email
- Updated auth utils to support both operator and tenant roles
- Created tenant-specific API router
- Fixed tenant creation schema to accept email + password
- Auto-generate tenant user accounts on assignment
- Default password: "TempPassword123!"
- Better error handling for validation errors
- Fixed room status tracking (vacant/occupied)
- Updated CORS to support dual frontends

**Developer Tools:**
- Database cleanup scripts updated
- Better error logging in backend
- Validation error handling in frontend
- Console logging for debugging tenant creation

---

## MVP FEATURES STATUS - 100% COMPLETE ✅

### Phase 1: Foundation ✅
- Project setup
- FastAPI backend
- PostgreSQL Docker
- GitHub repository

### Phase 2: Database ✅
- SQLAlchemy models (10 tables)
- Alembic migrations
- Room-level tracking
- User roles (operator/tenant)

### Phase 3: Authentication ✅
- JWT auth system
- Dual-role authentication (operators + tenants)
- User registration
- Password hashing
- Protected routes (frontend & backend)

### Phase 4: Property Management ✅
- Property CRUD (create, read, update, delete)
- Unit CRUD with metadata
- **Room CRUD with individual pricing** ◄── CORE FEATURE
- Tenant CRUD with auto-assignment
- Tenant user account creation

### Phase 5: Operations ✅
- Payment auto-generation on tenant assignment
- Dashboard real-time metrics
- Maintenance requests (full CRUD)
- Announcements (full CRUD)
- Mark payments as paid

### Phase 6: Operator Frontend ✅
- Complete React + TypeScript UI
- All CRUD operations with modals
- Search & filters across pages
- Real-time data with React Query
- Toast notifications
- Loading states
- Delete confirmations
- Edit modals for all entities
- Dark theme design

### Phase 7: Tenant Portal ✅ (80% Complete)
- Separate tenant application
- Tenant login/authentication
- Dashboard with lease info
- Payment history view
- Payment statistics
- Room details display
- ⏳ Maintenance request submission (pending)
- ⏳ Announcements view (pending)

---

## CURRENT API ENDPOINTS (45+ Total)

### Authentication (3)
- `POST /api/v1/auth/signup` (operator only)
- `POST /api/v1/auth/login` (operator + tenant)
- `GET /api/v1/auth/me`

### Properties (5)
- `POST /api/v1/properties/`
- `GET /api/v1/properties/`
- `GET /api/v1/properties/{id}`
- `PUT /api/v1/properties/{id}`
- `DELETE /api/v1/properties/{id}`

### Units (5)
- `POST /api/v1/units/`
- `GET /api/v1/units/property/{property_id}`
- `GET /api/v1/units/{id}`
- `PUT /api/v1/units/{id}`
- `DELETE /api/v1/units/{id}`

### Rooms (5) ◄── CORE DIFFERENTIATOR
- `POST /api/v1/rooms/`
- `GET /api/v1/rooms/unit/{unit_id}`
- `GET /api/v1/rooms/{id}`
- `PUT /api/v1/rooms/{id}`
- `DELETE /api/v1/rooms/{id}`

### Tenants (6)
- `POST /api/v1/tenants/` (creates user + tenant, auto-generates payment)
- `GET /api/v1/tenants/property/{property_id}`
- `GET /api/v1/tenants/room/{room_id}`
- `GET /api/v1/tenants/{id}`
- `PUT /api/v1/tenants/{id}`
- `DELETE /api/v1/tenants/{id}` (cascades to payments)

### Payments (3)
- `POST /api/v1/payments/`
- `GET /api/v1/payments/property/{property_id}`
- `PUT /api/v1/payments/{id}`

### Dashboard (2)
- `GET /api/v1/dashboard/property/{property_id}`
- `GET /api/v1/dashboard/operator`

### Maintenance (5)
- `POST /api/v1/maintenance/`
- `GET /api/v1/maintenance/property/{property_id}`
- `GET /api/v1/maintenance/{id}`
- `PUT /api/v1/maintenance/{id}`
- `DELETE /api/v1/maintenance/{id}`

### Announcements (3)
- `POST /api/v1/announcements/`
- `GET /api/v1/announcements/property/{property_id}`
- `PUT /api/v1/announcements/{id}`
- `DELETE /api/v1/announcements/{id}`

### Tenant Portal (6) ◄── NEW
- `GET /api/v1/tenants/me/` (profile)
- `GET /api/v1/tenants/me/lease` (lease info)
- `GET /api/v1/tenants/me/payments` (payment history)
- `GET /api/v1/tenants/me/maintenance` (maintenance requests)
- `POST /api/v1/tenants/me/maintenance` (submit request)
- `GET /api/v1/tenants/me/announcements` (property announcements)

---

## WORKING EXAMPLE
Property: Downtown Loft (San Diego, CA)
└── Unit 3B (4 bedrooms, 2 bath, 1500 sq ft)
├── Room A: $900/mo → tenant1@test.com (occupied) ✅ Payment: $900 pending
├── Room B: $750/mo → tenant2@test.com (occupied) ✅ Payment: $750 pending
├── Room C: $800/mo → tenant3@test.com (occupied) ✅ Payment: $800 pending
└── Room D: $800/mo → tenant4@test.com (occupied) ✅ Payment: $800 pending
Operator Portal (5173):

See all 4 rooms with occupancy status
Mark payments as paid
Create maintenance requests
Post announcements
Total monthly revenue: $3,250

Tenant Portal (5174):

tenant1@test.com logs in → sees Room A, Unit 3B
Views lease dates and $900/mo rent
Sees payment history
Can submit maintenance requests
Views property announcements


**This dual-portal system with room-level pricing is impossible with traditional property management software.**

---

## PROJECT STRUCTURE
CoLiv/
├── backend/                           ✅ COMPLETE
│   ├── app/
│   │   ├── models/                   ✅ 10 models
│   │   ├── schemas/                  ✅ 10 schemas (updated for tenant creation)
│   │   ├── routers/                  ✅ 10 routers
│   │   │   ├── auth.py              ✅ Dual-role authentication
│   │   │   ├── properties.py
│   │   │   ├── units.py
│   │   │   ├── rooms.py
│   │   │   ├── tenants.py           ✅ Creates user + tenant, auto-payment
│   │   │   ├── payments.py
│   │   │   ├── dashboard.py
│   │   │   ├── maintenance.py       ✅ Fixed enum values
│   │   │   ├── announcements.py     ✅ Fixed schema (message field)
│   │   │   └── tenant_portal.py     ✅ NEW - Tenant-specific endpoints
│   │   ├── utils/                    ✅ Auth helpers (operator + tenant)
│   │   ├── main.py                   ✅ Updated CORS for dual frontends
│   │   ├── database.py
│   │   └── config.py
│   ├── alembic/                      ✅ Migrations
│   ├── test_complete_workflow.py    ✅ Automated tests
│   ├── clean_tenants.py              ✅ Dev cleanup script
│   ├── clean_all.py                  ✅ Complete cleanup
│   ├── venv/
│   ├── requirements.txt
│   └── .env
├── frontend/                          ✅ OPERATOR PORTAL COMPLETE
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                 ✅ ProtectedRoute
│   │   │   ├── dashboard/            ✅ Layout, Sidebar
│   │   │   ├── properties/           ✅ Create, Edit, Delete modals
│   │   │   ├── units/                ✅ Create, Edit, UnitCard
│   │   │   ├── rooms/                ✅ Create, Edit, RoomCard, AssignTenant
│   │   │   ├── tenants/              ✅ RemoveTenantDialog
│   │   │   ├── maintenance/          ✅ Create, UpdateStatus modals
│   │   │   ├── announcements/        ✅ Create, Edit modals
│   │   │   └── ui/                   ✅ Reusable components
│   │   ├── lib/
│   │   │   ├── api/                  ✅ All API clients
│   │   │   └── utils.ts
│   │   ├── pages/                    ✅ 9 pages complete
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PropertiesPage.tsx
│   │   │   ├── PropertyDetailPage.tsx
│   │   │   ├── TenantsPage.tsx
│   │   │   ├── PaymentsPage.tsx
│   │   │   ├── MaintenancePage.tsx   ✅ NEW
│   │   │   └── AnnouncementsPage.tsx ✅ NEW
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── tenant-portal/                     ✅ 80% COMPLETE
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/                   ✅ Button, Card, Spinner
│   │   ├── lib/
│   │   │   └── api.ts                ✅ Tenant API client
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx         ✅ Tenant login
│   │   │   └── DashboardPage.tsx     ✅ Lease info + payments
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts                ✅ Port 5174
├── docs/
│   └── SOFTWARE_ARCHITECTURE.md
├── docker-compose.yml
├── MASTER_REFERENCE.md               ✅ This file
└── README.md

---

## OPERATOR FRONTEND FEATURES COMPLETE

### Pages (9)
1. **Login** - JWT authentication
2. **Signup** - Operator registration
3. **Dashboard** - Real-time metrics & overview
4. **Properties** - List, search, create, edit, delete
5. **Property Detail** - Units/rooms hierarchy, full CRUD
6. **Tenants** - List, search, filter, assign, remove
7. **Payments** - List, search, filter, mark as paid
8. **Maintenance** - Create, update status, search, filter ✅ NEW
9. **Announcements** - Create, edit, delete, search, filter ✅ NEW

### Key Features
✅ JWT authentication with localStorage  
✅ Real-time dashboard metrics  
✅ Full CRUD for properties, units, rooms  
✅ Tenant assignment with user account creation  
✅ Auto-generate payment on tenant assignment  
✅ Remove tenant (marks room vacant, deletes payments)  
✅ Search across properties, tenants, payments  
✅ Filter by status, priority, property  
✅ Mark payments as paid  
✅ Maintenance request management ✅ NEW  
✅ Announcements management ✅ NEW  
✅ Loading states on all API calls  
✅ Success/error toast notifications  
✅ Delete confirmation dialogs  
✅ Form validation with error messages  
✅ Responsive dark theme  
✅ Empty states with helpful CTAs  

---

## TENANT PORTAL FEATURES

### Implemented (✅)
- Tenant login with email/password
- Dashboard with lease information
- View room details (property/unit/room)
- View lease start/end dates
- View monthly rent amount
- Payment history (all payments)
- Payment statistics (total/paid/pending)

### Pending (⏳)
- Submit maintenance requests
- View maintenance request history
- View property announcements
- Profile management
- Password change

---

## ENVIRONMENT CONFIGURATION

### Backend (.env)
```bash
DATABASE_URL=postgresql://colivos_user:colivos_pass@localhost:5433/colivos_db
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
ENVIRONMENT=development
Operator Frontend (src/lib/api/client.ts)
typescriptconst API_BASE_URL = 'http://localhost:8000/api/v1'
Tenant Portal (src/lib/api.ts)
typescriptconst API_BASE_URL = 'http://localhost:8000/api/v1'
const TOKEN_KEY = 'tenant_token'  // Separate from operator token

DEVELOPMENT WORKFLOW
Start Database:
bash# Start Docker Desktop first
docker-compose up -d
docker ps  # Verify postgres is running
Start Backend:
bashcd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Start Operator Frontend:
bashcd frontend
npm run dev
# Runs on http://localhost:5173
Start Tenant Portal:
bashcd tenant-portal
npm run dev
# Runs on http://localhost:5174
Clean Database (Dev Only):
bashcd backend
python clean_tenants.py  # Removes tenants, payments, marks rooms vacant
# or
python clean_all.py      # Complete cleanup including tenant users
View Database:

pgAdmin: localhost:5433, db: colivos_db, user: colivos_user
DBeaver: Same credentials
psql CLI: docker exec -it colivos-postgres psql -U colivos_user -d colivos_db


TESTING
Backend Test:
bashcd backend
python test_complete_workflow.py
Operator Frontend Manual Test Flow:

Signup → Create operator account
Login → Authenticate
Create Property → "Downtown Loft" in San Diego
Add Unit → Unit 3B (4 bed, 2 bath)
Add Rooms → 4 rooms with different rents ($900, $750, $800, $800)
Assign Tenants → Assign 4 tenants with email + password (auto-creates user accounts + payments)
View Dashboard → See 100% occupancy, $3,250 revenue
View Tenants → See all 4 tenants with property/unit/room info
View Payments → See 4 pending payments, mark some as paid
Create Maintenance Request → Submit request for specific room
Create Announcement → Post announcement to property
Search/Filter → Test search and filters across all pages
Edit → Edit property, unit, room, maintenance, or announcement
Remove Tenant → Remove tenant, room becomes vacant, payments deleted

Tenant Portal Test Flow:

Operator: Assign tenant with email "tenant@test.com" and password "Test123!"
Tenant Portal: Login at http://localhost:5174/login
Dashboard: View lease info, room details, rent amount
Payments: View payment history and statistics
⏳ Maintenance: Submit maintenance request (pending)
⏳ Announcements: View property announcements (pending)

All core tests passing ✅

PROJECT METRICS

Lines of Code: ~15,000+ (Backend: ~4,500 | Operator Frontend: ~8,000 | Tenant Portal: ~2,500)
Commits: ~40+
Days Active: 11
Backend Features: 100% Complete
Operator Frontend Features: 100% MVP Complete
Tenant Portal Features: 80% Complete
API Endpoints: 45+
Database Tables: 10
Operator Frontend Pages: 9
Tenant Portal Pages: 2 (Login, Dashboard)
Frontend Components: 30+
Test Coverage: Automated backend workflow + manual frontend testing


KEY FEATURES IMPLEMENTED
🎯 Core Differentiator (Room-Level Management)
✅ Individual room pricing within units
✅ Room-by-room occupancy tracking
✅ Room status management (vacant/occupied/maintenance)
✅ Assign/remove tenants at room level
✅ Auto-generate payments per tenant/room
✅ Dual portal system (operator + tenant)
🏢 Property Management
✅ Multi-property support
✅ Property CRUD with search
✅ House rules management
✅ Property-level metrics
✅ Edit properties
🏠 Unit Management
✅ Units with bedrooms/bathrooms/amenities
✅ Furnished/unfurnished tracking
✅ Unit-level revenue tracking
✅ Edit units
🚪 Room Management (CORE FEATURE)
✅ Individual room rent pricing
✅ Room amenities (private bath, size)
✅ Room status tracking
✅ Edit rooms
✅ Assign/remove tenants
👥 Tenant Management
✅ Tenant user account auto-creation
✅ Email + password assignment
✅ Lease date tracking
✅ Tenant status (active/pending/moved_out)
✅ Search and filter tenants
✅ Remove tenant workflow
✅ Default password: "TempPassword123!"
💰 Payment Tracking
✅ Auto-generate payment on tenant assignment
✅ Payment status tracking
✅ Mark payments as paid
✅ Revenue statistics
✅ Search and filter payments
✅ Payment history for tenants
🔧 Maintenance Requests ✅ NEW
✅ Create requests with priority levels
✅ Status tracking (open/in_progress/resolved/closed)
✅ Assign to contractors
✅ Search and filter by status/priority
✅ Statistics dashboard
✅ Delete requests
✅ Tenants can submit requests (backend ready)
📢 Announcements ✅ NEW
✅ Create announcements by property
✅ Priority levels (normal/important/urgent)
✅ Edit and delete announcements
✅ Search and filter
✅ Statistics dashboard
✅ Tenants can view announcements (backend ready)
🏠 Tenant Portal ✅ NEW
✅ Separate application for tenants
✅ Tenant authentication
✅ View lease information
✅ View room details
✅ Payment history
✅ Payment statistics
⏳ Submit maintenance requests (UI pending)
⏳ View announcements (UI pending)
📊 Dashboard & Analytics
✅ Real-time occupancy rates
✅ Revenue tracking
✅ Property/unit/room counts
✅ Quick actions
✅ Maintenance statistics
✅ Announcement statistics
🎨 User Experience
✅ Beautiful dark theme UI (both portals)
✅ Loading states everywhere
✅ Toast notifications
✅ Confirmation dialogs
✅ Search across all pages
✅ Filter dropdowns
✅ Empty states with CTAs
✅ Responsive design
✅ Proper error handling
✅ Validation error display

NEXT STEPS
## REMAINING PHASES

### Phase 9: Complete Tenant Portal (1-2 hours) ⏳ NEXT
**Priority:** High - Complete existing feature
**Status:** 80% complete, missing profile features

#### 9.1 Profile Management
- View tenant profile information
- Edit profile details
- Update contact information

#### 9.2 Password Management
- Change password functionality
- Password strength validation
- Confirmation dialog

**User Stories:**
- Tenant can view and edit their profile
- Tenant can change their password
- Tenant receives confirmation after updates

---

### Phase 10: Advanced Analytics & Reports (3-4 hours)
**Priority:** High - Data-driven insights for operators
**Status:** Not started

#### 10.1 Revenue Analytics
- Revenue trend charts (line chart - monthly/quarterly/yearly)
- Revenue by property comparison (bar chart)
- Revenue forecasting
- Average revenue per unit/room

#### 10.2 Occupancy Analytics
- Occupancy rate trends over time
- Occupancy by property visualization
- Vacancy duration tracking
- Average days to fill vacancy

#### 10.3 Payment Collection Metrics
- Payment collection rate tracking
- Late payment analytics
- Payment method breakdown (pie chart)
- Outstanding balance tracking

#### 10.4 Export & Reporting
- Export data to CSV (payments, tenants, revenue)
- Printable PDF reports
- Custom date range filtering
- Summary reports by property

**User Stories:**
- Operator can see revenue trends over 6/12 months
- Operator can export payment data for accounting
- Operator can see which rooms stay vacant longest
- Operator can generate monthly reports for stakeholders

---

### Phase 11: AI Roommate Matching (10+ hours) 🎯 CORE DIFFERENTIATOR
**Priority:** HIGH - This is the killer feature
**Status:** Backend ~30% complete (models exist), Frontend 0%

#### 11.1 Tenant Preference System
- Extended tenant profile with lifestyle preferences
- Preference questionnaire UI (tenant-side)
- Preference questionnaire UI (operator-side for existing tenants)
- Preference categories:
  - Cleanliness importance (1-5 scale)
  - Noise tolerance (1-5 scale)
  - Guest frequency (1-5 scale)
  - Sleep schedule (early bird/night owl/flexible)
  - Work schedule (remote/office/hybrid/student)
  - Social preference (1-5 introvert to extrovert)
  - Dealbreakers (smoking, pets, overnight guests)
  - Interests and hobbies (tags)

#### 11.2 Compatibility Scoring Algorithm
- Python matching algorithm with weighted scoring:
  - Cleanliness compatibility (25% weight)
  - Sleep schedule compatibility (15% weight)
  - Noise tolerance (15% weight)
  - Social preferences (10% weight)
  - Guest frequency (10% weight)
  - Work schedules (10% weight)
  - Dealbreakers (10% weight - can be automatic disqualifiers)
  - Common interests (5% bonus)
- Generate compatibility percentage (0-100%)
- Detailed breakdown by category

#### 11.3 Operator Matching UI
- View unassigned tenants with preferences
- AI-suggested matches for vacant rooms
- Compatibility scores with visual indicators (colors)
- Detailed breakdown of why match is good/bad
- Override AI suggestions (manual assignment)
- Match history tracking

#### 11.4 Tenant Matching UI (Optional)
- View potential roommates (with privacy controls)
- See compatibility scores
- Express interest in specific rooms/units
- Privacy settings (what info to share)

**User Stories:**
- Operator sees AI suggestion: "Tenant A is 87% compatible with Unit 3B roommates"
- Tenant fills out preferences and sees compatibility with current tenants
- System prevents obvious mismatches (e.g., early bird with night owl in same room)
- Operator can filter tenants by compatibility score for a specific room

**Technical Requirements:**
- Matching algorithm using scikit-learn or custom scoring
- Preference weighting system
- Privacy controls for tenant data
- Real-time compatibility calculations

---

### Phase 12: Advanced Payment Features (3-4 hours)
**Priority:** Medium - Revenue optimization
**Status:** Not started

#### 12.1 Automated Payment Reminders
- Email reminders 7 days before due date
- Email reminder on due date
- Email reminder 3 days after due date (overdue)
- SMS reminders (optional via Twilio)
- Customizable reminder templates

#### 12.2 Late Fee Management
- Auto-calculate late fees after grace period
- Configurable grace period (per property)
- Configurable late fee amounts/percentages
- Add late fees to payment records
- Track late fee collection

#### 12.3 Payment Plans
- Split payments into multiple installments
- Track partial payments
- Payment plan status tracking
- Automatic payment plan generation

#### 12.4 Recurring Payments
- Auto-generate next month's payment on schedule
- Scheduled payment generation (1st of month)
- Track payment cycles
- Handle lease renewals automatically

#### 12.5 Stripe Integration (Optional but High Value)
- Connect Stripe account
- Online payment processing for tenants
- Payment confirmation emails
- Refund processing
- Payment method storage (cards on file)

**User Stories:**
- Tenant receives email reminder 7 days before rent is due
- Late fees automatically added 5 days after grace period
- Tenant can pay rent online via credit card (Stripe)
- Operator receives notification when payment is received

---

### Phase 13: Document Management (2-3 hours)
**Priority:** Medium - Operational efficiency
**Status:** Not started

#### 13.1 Lease Documents
- Upload signed lease PDF per tenant
- Download lease documents
- Lease expiration tracking
- Lease renewal reminders (30/60/90 days)
- Document versioning (amendments)

#### 13.2 Property Documents
- Upload property photos (multiple per property)
- Store certificates (occupancy, insurance)
- Store inspection reports
- Document categories and tagging

#### 13.3 File Storage Integration
- AWS S3 or Cloudflare R2 integration
- Secure file uploads with progress bars
- Access control (only relevant users can view)
- File size limits and validation
- Thumbnail generation for images

**User Stories:**
- Operator uploads signed lease for tenant
- Tenant can download their lease from portal
- Operator stores property inspection reports
- System reminds operator 60 days before lease expires

---

### Phase 14: Bulk Operations (2 hours)
**Priority:** Low - Convenience feature
**Status:** Not started

#### 14.1 Bulk Data Import
- Bulk payment import via CSV upload
- CSV template download
- Data validation before import
- Import error handling and reporting

#### 14.2 Bulk Actions
- Bulk create rooms for a unit (e.g., create 10 rooms at once)
- Bulk send announcements to multiple properties
- Bulk update room statuses
- Bulk lease renewal processing

**User Stories:**
- Operator imports 50 payment records from Excel
- Operator creates 10 identical rooms for a large unit
- Operator sends announcement to all 5 properties at once

---

### Phase 15: Communication System (4-5 hours)
**Priority:** Medium - Tenant engagement
**Status:** Messages model exists, no UI

#### 15.1 Messaging Backend
- Real-time messaging (WebSocket or polling)
- Message threads
- Unread message tracking
- Message notifications

#### 15.2 Operator Messaging UI
- Inbox with all conversations
- Send message to specific tenant
- Group messages to all tenants in property
- Mark messages as read/unread
- Message search and filtering

#### 15.3 Tenant Messaging UI
- Tenant inbox
- Reply to operator messages
- View message history
- Notifications for new messages

**User Stories:**
- Operator sends message to tenant about lease renewal
- Tenant replies with questions
- Operator sends group message: "Water will be shut off tomorrow 9-11am"

---

### Phase 16: Deployment & Production (2-3 hours)
**Priority:** HIGH - Make it live
**Status:** Not started

#### 16.1 Backend Deployment
- Deploy to Railway or Render
- Set up production PostgreSQL
- Configure environment variables
- SSL certificates
- Custom domain setup

#### 16.2 Frontend Deployment
- Deploy operator frontend to Vercel
- Deploy tenant portal to Vercel
- Environment variable configuration
- Custom domain setup
- Analytics integration (optional)

#### 16.3 Monitoring & Logging
- Error tracking (Sentry)
- Performance monitoring
- Automated database backups
- Uptime monitoring (UptimeRobot)
- Log aggregation

#### 16.4 CI/CD Pipeline
- GitHub Actions for automated testing
- Automatic deployments on merge to main
- Database migration automation
- Rollback procedures

**User Stories:**
- Users can access the app at coliv.app
- Errors are automatically reported to developers
- Database is backed up daily
- Deployments happen automatically on code push

---

## PRIORITY RANKING

**Must-Do (Next 2-3 weeks):**
1. ✅ Phase 9: Complete Tenant Portal (1-2 hours)
2. ✅ Phase 10: Advanced Analytics (3-4 hours)
3. 🎯 Phase 11: AI Roommate Matching (10+ hours) - CORE DIFFERENTIATOR
4. ✅ Phase 16: Deployment (2-3 hours)

**Should-Do (After launch):**
5. Phase 12: Advanced Payment Features (3-4 hours)
6. Phase 13: Document Management (2-3 hours)
7. Phase 15: Communication System (4-5 hours)

**Nice-to-Have (Future):**
8. Phase 14: Bulk Operations (2 hours)

**Total Estimated Time to Launch:** ~20-25 hours


KEY DOCUMENTS

GitHub: https://github.com/BrandonSosa3/CoLiv
Architecture (Raw): https://raw.githubusercontent.com/BrandonSosa3/CoLiv/main/docs/SOFTWARE_ARCHITECTURE.md
This Document: MASTER_REFERENCE.md


DATABASE TOOLS
Recommended: pgAdmin

Install: brew install --cask pgadmin4
Connect: localhost:5433, db: colivos_db, user: colivos_user, pass: colivos_pass
Browse tables, view data, run queries

Alternative: DBeaver

Install: brew install --cask dbeaver-community
Same connection details

CLI Access:
bashdocker exec -it colivos-postgres psql -U colivos_user -d colivos_db

IMPORTANT NOTES
Tenant Account Creation:

When assigning a tenant in the operator portal, a user account is automatically created
Default password: "TempPassword123!" (can be customized in the form)
Tenant uses email + password to login to tenant portal (port 5174)
First payment is auto-generated on assignment

Authentication:

Operators and tenants use the same login endpoint but different portals
JWT token contains user.id (not email)
Operators have separate token storage from tenants
Protected routes verify user role

Database Cleanup:

clean_tenants.py - Removes tenants, payments, marks rooms vacant
clean_all.py - Also removes tenant user accounts
Useful for dev testing and resetting data

Known Issues:

None currently! All features working as expected.


STATUS: High Priority MVP Features Complete! Operator portal 100% functional with maintenance & announcements. Tenant portal 80% complete with dashboard and payment viewing. Ready for completing tenant portal UI or moving to advanced features like AI roommate matching.
🎉 MAJOR MILESTONE: Dual-portal system fully operational with 45+ API endpoints! 🎉

