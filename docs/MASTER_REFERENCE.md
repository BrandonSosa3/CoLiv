# CoLiv OS - Master Reference Document
**Last Updated:** October 10, 2025  
**Status:** MVP Complete - Frontend & Backend 100% Functional

---

## EXECUTIVE SUMMARY

**What:** Co-living operations software with room-level management  
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
- Local Frontend: http://localhost:5173
- Database: PostgreSQL on port 5433

**Backend Status:** ✅ 100% COMPLETE  
**Frontend Status:** ✅ 100% MVP COMPLETE

---

## TECH STACK

### Frontend ✅ COMPLETE
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (custom dark theme)
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router v6
- **Forms:** React Hook Form
- **Notifications:** Sonner (toast)
- **Icons:** Lucide React
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

### Why This Matters:
- Each room has individual rent amount
- Multiple tenants per unit with different lease dates
- Automatic payment generation per tenant
- Better occupancy tracking
- Supports flexible, staggered leases

---

## DATABASE SCHEMA

**Hierarchy:**
operators (1:Many) → properties (1:Many) → units (1:Many) → rooms (1:1) → tenants
↓
payments

**Core Tables (All Implemented):**
- users (operators & tenants)
- operators
- properties
- units
- **rooms** ◄── KEY DIFFERENTIATOR
- tenants
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

### October 8-10, 2025 (Days 8-10): ◄── CURRENT
✅ **Complete Frontend MVP Implementation**

**Authentication:**
- Login page with validation
- Signup page for operators
- Protected routes with JWT
- Auto-redirect on auth

**Dashboard:**
- Real-time metrics (properties, rooms, revenue, occupancy)
- Property cards with navigation
- Quick action buttons
- Loading states

**Properties Management:**
- Properties list with search
- Create property modal
- Edit property (name, address, house rules)
- Delete property with confirmation
- Property detail page with full hierarchy

**Units Management:**
- Create unit modal
- Edit unit (bedrooms, bathrooms, amenities)
- Unit cards showing room breakdown
- Revenue tracking per unit

**Rooms Management (CORE FEATURE):**
- Create room with individual rent pricing
- Edit room (rent, amenities, status)
- Room cards showing occupancy status
- Visual hierarchy: Property → Unit → Room
- Assign tenant to room workflow

**Tenants Management:**
- Tenants list across all properties
- Search by email, property, unit, or room
- Filter by status (active/pending/moved_out)
- Assign tenant to room (creates user account + tenant record)
- Remove tenant from room
- Auto-update room status on assignment/removal

**Payments Tracking:**
- Payments list across all properties
- Auto-generate payment on tenant assignment
- Search and filter payments
- Mark payments as paid
- Revenue statistics
- Payment status tracking (pending/paid/overdue/failed)

**Polish & UX:**
- Loading spinners on all API calls
- Success/error toast notifications
- Delete confirmation dialogs
- Form validation with error messages
- Search functionality across pages
- Filter dropdowns
- Empty states
- Responsive dark theme UI

**Developer Tools:**
- Database cleanup script (`clean_tenants.py`)
- Complete TypeScript types
- Reusable UI components
- API client organization

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

### Phase 3: Authentication ✅
- JWT auth system
- User registration
- Password hashing
- Protected routes (frontend & backend)

### Phase 4: Property Management ✅
- Property CRUD (create, read, update, delete)
- Unit CRUD with metadata
- **Room CRUD with individual pricing** ◄── CORE FEATURE
- Tenant CRUD with auto-assignment

### Phase 5: Operations ✅
- Payment auto-generation on tenant assignment
- Dashboard real-time metrics
- Maintenance endpoints
- Announcements endpoints

### Phase 6: Frontend ✅
- Complete React + TypeScript UI
- All CRUD operations with modals
- Search & filters
- Real-time data with React Query
- Toast notifications
- Loading states
- Delete confirmations
- Dark theme design

---

## CURRENT API ENDPOINTS (37 Total)

### Authentication (2)
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`

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
- `POST /api/v1/tenants/` (auto-creates first payment)
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

---

## WORKING EXAMPLE
Property: Downtown Loft (San Diego, CA)
└── Unit 3B (4 bedrooms, 2 bath, 1500 sq ft)
├── Room A: $900/mo → tenant1@test.com (occupied) ✅ Payment: $900 pending
├── Room B: $750/mo → tenant2@test.com (occupied) ✅ Payment: $750 pending
├── Room C: $800/mo → tenant3@test.com (occupied) ✅ Payment: $800 pending
└── Room D: $800/mo → tenant4@test.com (occupied) ✅ Payment: $800 pending
Total monthly revenue: $3,250
Dashboard shows: 4/4 rooms (100% occupancy), $3,250/mo revenue
Payments page: 4 pending payments totaling $3,250

**This hierarchy with individual room pricing is impossible with traditional property management software.**

---

## PROJECT STRUCTURE
colivos/
├── backend/                           ✅ COMPLETE
│   ├── app/
│   │   ├── models/                   ✅ 10 models
│   │   ├── schemas/                  ✅ 9 schemas
│   │   ├── routers/                  ✅ 9 routers
│   │   │   ├── auth.py
│   │   │   ├── properties.py
│   │   │   ├── units.py
│   │   │   ├── rooms.py
│   │   │   ├── tenants.py           ✅ Auto-payment generation
│   │   │   ├── payments.py
│   │   │   ├── dashboard.py
│   │   │   ├── maintenance.py
│   │   │   └── announcements.py
│   │   ├── utils/                    ✅ auth helpers
│   │   ├── main.py
│   │   ├── database.py
│   │   └── config.py
│   ├── alembic/                      ✅ migrations
│   ├── test_complete_workflow.py    ✅ automated tests
│   ├── clean_tenants.py              ✅ dev cleanup script
│   ├── clean_all.py                  ✅ complete cleanup
│   ├── venv/
│   ├── requirements.txt
│   └── .env
├── frontend/                          ✅ COMPLETE
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                 ✅ ProtectedRoute
│   │   │   ├── dashboard/            ✅ Layout, Sidebar
│   │   │   ├── properties/           ✅ Create, Edit, Delete modals
│   │   │   ├── units/                ✅ Create, Edit, UnitCard
│   │   │   ├── rooms/                ✅ Create, Edit, RoomCard, AssignTenant
│   │   │   ├── tenants/              ✅ RemoveTenantDialog
│   │   │   └── ui/                   ✅ Button, Card, Input, Spinner, Search, Filter
│   │   ├── lib/
│   │   │   ├── api/                  ✅ All API clients
│   │   │   │   ├── client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── properties.ts
│   │   │   │   ├── units.ts
│   │   │   │   ├── rooms.ts
│   │   │   │   ├── tenants.ts
│   │   │   │   └── payments.ts
│   │   │   └── utils.ts              ✅ formatCurrency, formatDate
│   │   ├── pages/                    ✅ All pages complete
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PropertiesPage.tsx
│   │   │   ├── PropertyDetailPage.tsx
│   │   │   ├── TenantsPage.tsx
│   │   │   └── PaymentsPage.tsx
│   │   ├── types/                    ✅ TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   └── SOFTWARE_ARCHITECTURE.md
├── docker-compose.yml
├── MASTER_REFERENCE.md               ✅ This file
└── README.md

---

## FRONTEND FEATURES COMPLETE

### Pages (7)
1. **Login** - JWT authentication
2. **Signup** - Operator registration
3. **Dashboard** - Real-time metrics & overview
4. **Properties** - List, search, create, edit, delete
5. **Property Detail** - Units/rooms hierarchy, full CRUD
6. **Tenants** - List, search, filter, assign, remove
7. **Payments** - List, search, filter, mark as paid

### Components (20+)
- **Auth:** ProtectedRoute
- **Layout:** DashboardLayout, Sidebar with navigation
- **Properties:** CreatePropertyModal, EditPropertyModal, DeletePropertyDialog
- **Units:** CreateUnitModal, EditUnitModal, UnitCard
- **Rooms:** CreateRoomModal, EditRoomModal, RoomCard, AssignTenantModal
- **Tenants:** RemoveTenantDialog
- **UI:** Button, Card, Input, Spinner, LoadingScreen, SearchInput, FilterDropdown
- **Notifications:** Toast system (Sonner)

### Key Features
✅ JWT authentication with localStorage  
✅ Real-time dashboard metrics  
✅ Full CRUD for properties, units, rooms  
✅ Tenant assignment with auto-payment generation  
✅ Remove tenant (marks room vacant, deletes payments)  
✅ Search across properties, tenants, payments  
✅ Filter by status, property  
✅ Loading states on all API calls  
✅ Success/error toast notifications  
✅ Delete confirmation dialogs  
✅ Form validation with error messages  
✅ Responsive dark theme  
✅ Empty states with helpful CTAs  

---

## ENVIRONMENT CONFIGURATION

### Backend (.env)
```bash
DATABASE_URL=postgresql://colivos_user:colivos_pass@localhost:5433/colivos_db
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
ENVIRONMENT=development
Frontend (src/lib/api/client.ts)
typescriptconst API_BASE_URL = 'http://localhost:8000/api/v1'

DEVELOPMENT WORKFLOW
Start Backend:
bashcd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Start Frontend:
bashcd frontend
npm run dev
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
Frontend Manual Test Flow:

Signup → Create operator account
Login → Authenticate
Create Property → "Downtown Loft" in San Diego
Add Unit → Unit 3B (4 bed, 2 bath)
Add Rooms → 4 rooms with different rents ($900, $750, $800, $800)
Assign Tenants → Assign 4 tenants to rooms (auto-creates payments)
View Dashboard → See 100% occupancy, $3,250 revenue
View Tenants → See all 4 tenants with property/unit/room info
View Payments → See 4 pending payments, mark some as paid
Search/Filter → Test search and filters across pages
Edit → Edit property, unit, or room details
Remove Tenant → Remove tenant, room becomes vacant, payments deleted

All tests passing ✅

PROJECT METRICS

Lines of Code: ~10,000+ (Backend: ~4,000 | Frontend: ~6,000)
Commits: ~30+
Days Active: 10
Backend Features: 100% Complete
Frontend Features: 100% MVP Complete
API Endpoints: 37
Database Tables: 10
Frontend Pages: 7
Frontend Components: 20+
Test Coverage: Automated backend workflow + manual frontend testing


KEY FEATURES IMPLEMENTED
🎯 Core Differentiator (Room-Level Management)
✅ Individual room pricing within units
✅ Room-by-room occupancy tracking
✅ Room status management (vacant/occupied/maintenance)
✅ Assign/remove tenants at room level
✅ Auto-generate payments per tenant/room
🏢 Property Management
✅ Multi-property support
✅ Property CRUD with search
✅ House rules management
✅ Property-level metrics
🏠 Unit Management
✅ Units with bedrooms/bathrooms/amenities
✅ Furnished/unfurnished tracking
✅ Unit-level revenue tracking
👥 Tenant Management
✅ Tenant user account creation
✅ Lease date tracking
✅ Tenant status (active/pending/moved_out)
✅ Search and filter tenants
✅ Remove tenant workflow
💰 Payment Tracking
✅ Auto-generate payment on tenant assignment
✅ Payment status tracking
✅ Mark payments as paid
✅ Revenue statistics
✅ Search and filter payments
📊 Dashboard & Analytics
✅ Real-time occupancy rates
✅ Revenue tracking
✅ Property/unit/room counts
✅ Quick actions
🎨 User Experience
✅ Beautiful dark theme UI
✅ Loading states everywhere
✅ Toast notifications
✅ Confirmation dialogs
✅ Search across all pages
✅ Filter dropdowns
✅ Empty states with CTAs
✅ Responsive design

NEXT STEPS
Phase 7: Maintenance & Announcements UI (Optional)

Maintenance request UI
Announcements UI
Status tracking

Phase 8: Advanced Features (Future)

Bulk payment import
Payment reminders
Lease renewal workflows
Document uploads
Tenant portal (separate app)
AI roommate matching

Phase 9: Deployment

Deploy backend to Railway
Deploy frontend to Vercel
Set up production database
Configure environment variables
Set up monitoring

Phase 10: Post-MVP Enhancements

Email notifications
PDF lease generation
Advanced analytics/charts
Mobile app
Stripe integration for online payments


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

STATUS: MVP Complete - Fully functional property management system with room-level tracking and individual pricing. Ready for testing, refinement, or deployment.
🎉 ALL MVP FEATURES IMPLEMENTED AND WORKING! 🎉
