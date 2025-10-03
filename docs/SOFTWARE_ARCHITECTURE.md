CoLiv OS - Software Architecture Document
Version: 1.0
Last Updated: October 2025
Status: Active Development - MVP Phase
Project Repository: https://github.com/BrandonSosa3/CoLiv

Table of Contents

Executive Summary
High-Level System Architecture
Detailed Database Schema
Key User Flows
AI Matching Service Architecture
Technology Stack Details
Security Architecture
Deployment Architecture
Scalability Plan
Critical Metrics to Track
MVP vs Full Vision
Project File Structure
Key Architectural Decisions Summary


1. Executive Summary
What is CoLiv OS?
CoLiv OS is property management software specifically designed for co-living operators. Unlike traditional property management systems, CoLiv OS is built from the ground up to handle the unique challenges of shared housing operations.
The Core Problem
Traditional property management software treats housing as:

Financial asset (optimize for rent collection)
Annual transaction (lease once, collect rent 12 times)
Low-touch relationship (tenant = check writer)

Co-living requires a different approach where housing is:

Experience product (optimize for resident happiness)
Continuous operation (constant turnover and engagement)
High-touch relationship (resident = community member)

Key Differentiator: Room-Level Architecture
Traditional Property Management:
Property → Unit → Tenant
CoLiv OS:
Property → Unit → Room → Tenant
This seemingly simple addition of "Room" as a first-class entity enables:

Individual rent amounts per room in the same unit
Multiple tenants per unit with different lease dates
Staggered move-ins/move-outs (high turnover optimization)
AI roommate matching based on compatibility
Better occupancy tracking at granular level
Flexible lease management (1-12 month terms per room)

Secondary Differentiators

AI Roommate Matching: Compatibility algorithm that matches applicants to rooms based on lifestyle preferences
Community Features: Social feed, events, profiles - treating co-living as hospitality, not just real estate
High-Turnover Operations: Built for constant move-ins/move-outs, not annual renewals
Modern Tech Stack: Fast, mobile-first, beautiful UX (not 2010 enterprise software)

Target Market

Primary: Small co-living operators (1-10 properties, 10-50 tenants)
Secondary: Medium operators (10-50 properties)
Future: Large co-living networks, student housing, senior co-living

Business Model

Pricing: $99/month per property
Revenue Streams:

SaaS subscriptions (primary)
Transaction fees on rent processing (future)
Premium features (AI matching, analytics)




2. High-Level System Architecture
System Layers Overview
┌────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
├────────────────────────────────────────────────────────────────┤
│  [Property Operator]  [Resident/Tenant]  [System Admin]       │
│         │                    │                  │              │
│         └────────────────────┴──────────────────┘              │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────┐         │
│  │  OPERATOR DASHBOARD │      │   RESIDENT PORTAL   │         │
│  │      (React)        │      │      (React)        │         │
│  ├─────────────────────┤      ├─────────────────────┤         │
│  │ • Properties Mgmt   │      │ • View Lease        │         │
│  │ • Units & Rooms     │◄─────┤ • Pay Rent          │         │
│  │ • Tenant Management │      │ • Maintenance Req   │         │
│  │ • Rent Tracking     │      │ • Community Feed    │         │
│  │ • Maintenance Queue │      │ • Events Calendar   │         │
│  │ • Analytics         │      │ • Roommate Profiles │         │
│  │ • AI Matching       │◄────►│ • Messages          │         │
│  │ • Community Mgmt    │      │ • Documents         │         │
│  └─────────────────────┘      └─────────────────────┘         │
│                                                                 │
│  Hosting: Vercel                                               │
│  Framework: React 18 + Vite + TypeScript                       │
│  Styling: Tailwind CSS + shadcn/ui                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API / JSON
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                │
├────────────────────────────────────────────────────────────────┤
│  • Request Routing                                             │
│  • Authentication Middleware (JWT validation)                  │
│  • Rate Limiting (100 req/min per user)                       │
│  • Request/Response Logging                                    │
│  • Error Handling & Standardization                           │
│  • CORS Configuration                                          │
│  • API Versioning (/api/v1/*)                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                           │
│                    (Python + FastAPI)                         │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │  AUTH SERVICE   │  │ PROPERTY SERVICE│  │TENANT SERVICE││
│  ├─────────────────┤  ├─────────────────┤  ├──────────────┤│
│  │• Sign up        │  │• CRUD Properties│  │• CRUD Tenants││
│  │• Login          │  │• CRUD Units     │  │• Leases      ││
│  │• JWT generation │  │• CRUD Rooms ◄───┼──┤• Applications││
│  │• Password reset │  │• Occupancy calc │  │• Profiles    ││
│  │• Role mgmt      │  │• Turnover view  │  │• Documents   ││
│  │• Permissions    │  │                 │  │• Onboarding  ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │ PAYMENT SERVICE │  │  MAINTENANCE    │  │  COMMUNITY   ││
│  ├─────────────────┤  │    SERVICE      │  │   SERVICE    ││
│  │• Process rent   │  │• CRUD Tickets   │  │• Social Feed ││
│  │• Stripe API     │  │• Assignments    │  │• Events CRUD ││
│  │• Auto-reminders │  │• Status tracking│  │• RSVPs       ││
│  │• Late fees      │  │• Photo uploads  │  │• Messaging   ││
│  │• Split payments │  │• Resolution log │  │• Profiles    ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         AI MATCHING SERVICE                            │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ • Compatibility Algorithm                             │ │
│  │ • Score Calculation (rule-based → ML later)          │ │
│  │ • Recommendation Engine                               │ │
│  │ • Conflict Pattern Learning                          │ │
│  │ • Churn Prediction (Phase 2)                         │ │
│  │ Tech: Python module (Phase 2: separate microservice) │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Hosting: Railway / Render / Fly.io                          │
│  Runtime: Python 3.11+                                       │
│  Framework: FastAPI                                          │
│  Validation: Pydantic                                        │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       DATA LAYER                              │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐                 │
│  │       POSTGRESQL DATABASE              │                 │
│  ├────────────────────────────────────────┤                 │
│  │ Core Tables:                           │                 │
│  │ • users, operators, properties         │                 │
│  │ • units                                │                 │
│  │ • rooms ◄──────────────────── KEY DIFF │                 │
│  │ • tenants, applications, leases        │                 │
│  │ • payments, maintenance_requests       │                 │
│  │ • documents                            │                 │
│  │                                        │                 │
│  │ Community Tables:                      │                 │
│  │ • announcements, community_posts       │                 │
│  │ • events, event_rsvps, messages        │                 │
│  │                                        │                 │
│  │ AI Tables:                             │                 │
│  │ • compatibility_profiles               │                 │
│  │ • matching_scores, conflict_reports    │                 │
│  │                                        │                 │
│  │ Hosting: Railway PostgreSQL / Supabase│                 │
│  └────────────────────────────────────────┘                 │
│                                                               │
│  ┌────────────────────────────────────────┐                 │
│  │       REDIS (Cache + Queue)            │                 │
│  ├────────────────────────────────────────┤                 │
│  │ • Session storage (Phase 2)            │                 │
│  │ • API response caching                 │                 │
│  │ • Background job queue                 │                 │
│  │ • Rate limiting counters               │                 │
│  │ Hosting: Upstash / Railway             │                 │
│  └────────────────────────────────────────┘                 │
│                                                               │
│  ┌────────────────────────────────────────┐                 │
│  │       AWS S3 / Cloudflare R2           │                 │
│  ├────────────────────────────────────────┤                 │
│  │ • Lease documents (PDF)                │                 │
│  │ • Tenant ID uploads                    │                 │
│  │ • Maintenance photos                   │                 │
│  │ • Profile pictures, Receipts           │                 │
│  └────────────────────────────────────────┘                 │
└───────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                            │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   STRIPE    │  │  SENDGRID   │  │   TWILIO    │         │
│  │ Payments    │  │  Email      │  │  SMS        │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  DOCUSIGN   │  │   CHECKR    │  │   SENTRY    │         │
│  │E-signatures │  │Background   │  │Error Track  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└───────────────────────────────────────────────────────────────┘

3. Detailed Database Schema
3.1 Entity Relationship Diagram
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (UUID, PK)   │───┐
│ email (unique)  │   │
│ password_hash   │   │
│ role (enum)     │   │  operator | tenant | admin
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
          ┌───────────┴───────────┐
          │                       │
          │ 1:1                   │ 1:1
          ▼                       ▼
┌─────────────────┐      ┌─────────────────┐
│   operators     │      │    tenants      │
├─────────────────┤      ├─────────────────┤
│ id (PK)         │      │ id (PK)         │
│ user_id (FK)    │      │ user_id (FK)    │
│ company_name    │      │ room_id (FK)    │─┐
│ phone           │      │ lease_start     │ │
│ subscription    │      │ lease_end       │ │
│ stripe_cust_id  │      │ rent_amount     │ │
└────────┬────────┘      │ deposit_paid    │ │
         │               │ status (enum)   │ │
         │               │ move_in_date    │ │
         │ 1:Many        └─────────────────┘ │
         │                                   │
         ▼                                   │
┌─────────────────┐                         │
│   properties    │                         │
├─────────────────┤                         │
│ id (PK)         │                         │
│ operator_id (FK)│──┐                      │
│ name            │  │                      │
│ address         │  │                      │
│ city, state, zip│  │                      │
│ total_units     │  │                      │
│ amenities (jsonb)│  │                     │
│ house_rules     │  │                      │
│ created_at      │  │                      │
└─────────────────┘  │                      │
                     │ 1:Many               │
                     ▼                      │
              ┌─────────────────┐          │
              │     units       │          │
              ├─────────────────┤          │
              │ id (PK)         │          │
              │ property_id (FK)│          │
              │ unit_number     │          │
              │ floor           │          │
              │ bedrooms        │          │
              │ bathrooms       │          │
              │ square_feet     │          │
              │ furnished (bool)│          │
              └────────┬────────┘          │
                       │ 1:Many            │
                       ▼                   │
              ┌─────────────────┐          │
              │     rooms       │ ◄─ KEY!  │
              ├─────────────────┤          │
              │ id (PK)         │          │
              │ unit_id (FK)    │          │
              │ room_number     │  "A", "B"│
              │ room_type (enum)│  private │
              │ size_sqft       │          │
              │ has_private_bath│          │
              │ rent_amount     │ ◄─ Each  │
              │ available_date  │   room   │
              │ status (enum)   │   price  │
              │ current_tenant  │          │
              └────────┬────────┘          │
                       │ 1:1               │
                       └───────────────────┘
3.2 Core Tables Specification
users
Primary authentication table for all user types.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYemailVARCHAR(255)UNIQUE, NOT NULLpassword_hashVARCHAR(255)NOT NULLbcrypt hashedroleENUMNOT NULLoperator, tenant, admincreated_atTIMESTAMPDEFAULT NOW()updated_atTIMESTAMPDEFAULT NOW()
operators
Business accounts that manage properties.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYuser_idUUIDFOREIGN KEY (users.id), UNIQUEcompany_nameVARCHAR(255)phoneVARCHAR(20)subscription_statusVARCHAR(50)active, trial, canceledstripe_customer_idVARCHAR(100)
properties
Physical buildings/locations managed by operators.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYoperator_idUUIDFOREIGN KEY (operators.id)nameVARCHAR(255)NOT NULLaddressTEXTNOT NULLcityVARCHAR(100)NOT NULLstateVARCHAR(50)NOT NULLzipVARCHAR(20)NOT NULLtotal_unitsINTAuto-calculatedamenitiesJSONB{gym, rooftop, coworking, etc}house_rulesTEXTcreated_atTIMESTAMPDEFAULT NOW()
units
Individual apartments within properties.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYproperty_idUUIDFOREIGN KEY (properties.id) CASCADEunit_numberVARCHAR(20)NOT NULL"3B", "401"floorINTbedroomsINTNOT NULLbathroomsDECIMAL(3,1)2.5 for 2.5 bathssquare_feetINTfurnishedBOOLEANDEFAULT FALSE
rooms ◄─ KEY DIFFERENTIATOR
Individual bedrooms within units - this is what makes CoLiv OS unique.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYunit_idUUIDFOREIGN KEY (units.id) CASCADEroom_numberVARCHAR(10)NOT NULL"A", "B", "C", "Master"room_typeENUMprivate, sharedsize_sqftINThas_private_bathBOOLEANDEFAULT FALSErent_amountDECIMAL(10,2)NOT NULLEach room's individual rentavailable_dateDATENext availabilitystatusENUMNOT NULLvacant, occupied, maintenancecurrent_tenant_idUUIDFOREIGN KEY (tenants.id)Nullable
Why rooms table is critical:

Enables different rent prices per room in same unit
Tracks occupancy at granular level
Supports flexible lease terms per room
Foundation for AI roommate matching

tenants
Residents assigned to specific rooms.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYuser_idUUIDFOREIGN KEY (users.id), UNIQUEroom_idUUIDFOREIGN KEY (rooms.id)Assigned to ROOM, not unitlease_startDATENOT NULLlease_endDATENOT NULLrent_amountDECIMAL(10,2)NOT NULLCopied from roomdeposit_paidDECIMAL(10,2)statusENUMNOT NULLactive, pending, moved_outmove_in_dateDATEActual move-in
applications (Phase 2)
Prospective tenant applications with compatibility profiles.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYproperty_idUUIDFOREIGN KEY (properties.id)room_idUUIDFOREIGN KEY (rooms.id)Target roomapplicant_nameVARCHAR(255)NOT NULLemailVARCHAR(255)NOT NULLphoneVARCHAR(20)move_in_dateDATEDesired datelease_lengthINTMonthsstatusENUMpending, approved, rejectedcompatibility_profileJSONBSee AI Matching sectioncreated_atTIMESTAMPDEFAULT NOW()
compatibility_profile JSONB structure:
json{
  "sleep_schedule": "night_owl",
  "cleanliness": 4,
  "noise_tolerance": "moderate",
  "social_preference": "sometimes_social",
  "work_from_home": true,
  "has_pets": false,
  "pet_allergies": true,
  "smoking": false,
  "age": 28,
  "occupation": "Software Engineer",
  "interests": ["hiking", "cooking", "gaming"]
}
payments
Rent payment tracking.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYtenant_idUUIDFOREIGN KEY (tenants.id)room_idUUIDFOREIGN KEY (rooms.id)amountDECIMAL(10,2)NOT NULLdue_dateDATENOT NULLpaid_dateDATENull if unpaidstatusENUMNOT NULLpending, paid, overdue, failedpayment_methodVARCHAR(50)card, ach, manualstripe_payment_idVARCHAR(100)late_feeDECIMAL(10,2)DEFAULT 0created_atTIMESTAMPDEFAULT NOW()
maintenance_requests
Issue tracking with room-level granularity.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYproperty_idUUIDFOREIGN KEY (properties.id)unit_idUUIDFOREIGN KEY (units.id)room_idUUIDFOREIGN KEY (rooms.id)Nullable (common areas)tenant_idUUIDFOREIGN KEY (tenants.id)Who reportedtitleVARCHAR(255)NOT NULLdescriptionTEXTpriorityENUMNOT NULLlow, medium, high, urgentstatusENUMNOT NULLopen, in_progress, resolved, closedphotosTEXT[]Array of S3 URLsassigned_toUUIDFOREIGN KEY (users.id)Staff/vendorcreated_atTIMESTAMPDEFAULT NOW()resolved_atTIMESTAMP
3.3 Community Tables (Phase 2)
announcements
Operator broadcasts to tenants.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYproperty_idUUIDFOREIGN KEY (properties.id)created_byUUIDFOREIGN KEY (users.id)OperatortitleVARCHAR(255)messageTEXTNOT NULLpriorityENUMDEFAULT normalnormal, important, urgentcreated_atTIMESTAMPDEFAULT NOW()
community_posts
Tenant-generated social feed content.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYproperty_idUUIDFOREIGN KEY (properties.id)author_idUUIDFOREIGN KEY (tenants.id)contentTEXTNOT NULLphoto_urlTEXTS3 URLlikes_countINTDEFAULT 0created_atTIMESTAMPDEFAULT NOW()
events
Community events (yoga, movie nights, etc.).
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYproperty_idUUIDFOREIGN KEY (properties.id)created_byUUIDFOREIGN KEY (users.id)Operator or tenanttitleVARCHAR(255)NOT NULLdescriptionTEXTdate_timeTIMESTAMPNOT NULLlocationVARCHAR(255)"Rooftop", "Lobby"max_attendeesINTNull = unlimitedphoto_urlTEXTcreated_atTIMESTAMPDEFAULT NOW()
event_rsvps
Event attendance tracking.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYevent_idUUIDFOREIGN KEY (events.id) CASCADEtenant_idUUIDFOREIGN KEY (tenants.id)statusENUMNOT NULLgoing, maybe, not_goingcreated_atTIMESTAMPDEFAULT NOW()
3.4 AI Tables (Phase 2)
matching_scores
AI-generated compatibility scores for applicants.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYapplication_idUUIDFOREIGN KEY (applications.id)room_idUUIDFOREIGN KEY (rooms.id)scoreINTNOT NULL0-100breakdownJSONBDetailed scoring per criteriarecommendationTEXTWhy good/bad matchcreated_atTIMESTAMPDEFAULT NOW()
breakdown JSONB structure:
json{
  "sleep_schedule": 85,
  "cleanliness": 95,
  "social_compatibility": 80,
  "noise_tolerance": 90,
  "dealbreakers": "pass",
  "individual_scores": {
    "vs_mike": 91,
    "vs_jessica": 88,
    "vs_tom": 92
  },
  "group_dynamics_bonus": 2
}
conflict_reports
Learning data for AI improvement.
ColumnTypeConstraintsNotesidUUIDPRIMARY KEYroom_idUUIDFOREIGN KEY (rooms.id)tenant_idsUUID[]Array of involved tenantsconflict_typeENUMNOT NULLnoise, cleanliness, guests, etcdescriptionTEXTresolvedBOOLEANDEFAULT FALSEcreated_atTIMESTAMPDEFAULT NOW()

4. Key User Flows
4.1 Flow: Operator Adds Property → Units → Rooms
This flow demonstrates the room-level architecture in action.
START
  │
  ▼
┌─────────────────────────────────────┐
│ Operator Dashboard                  │
│ Clicks "Add Property"               │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Property Form:                      │
│ • Name: "Downtown Loft"             │
│ • Address: "123 Main St"            │
│ • City, State, ZIP                  │
│ • Amenities: gym, rooftop, coworking│
│ • House Rules: no smoking, etc      │
│                                     │
│ [Save & Add Units]                  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ BACKEND:                            │
│ INSERT INTO properties (...)        │
│ RETURNING id                        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Add Units Form:                     │
│                                     │
│ Unit 3A:                            │
│ • Bedrooms: 3                       │
│ • Bathrooms: 2                      │
│ • Square feet: 1200                 │
│                                     │
│ Unit 3B:                            │
│ • Bedrooms: 4                       │
│ • Bathrooms: 2                      │
│ • Square feet: 1500                 │
│                                     │
│ [Save & Add Rooms]                  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Add Rooms to Unit 3B:               │ ◄─ KEY STEP
│                                     │
│ Room A:                             │
│ • Rent: $900/mo                     │
│ • Size: 150 sqft                    │
│ • Private bath: Yes                 │
│                                     │
│ Room B:                             │
│ • Rent: $750/mo                     │
│ • Size: 120 sqft                    │
│ • Private bath: No                  │
│                                     │
│ Room C:                             │
│ • Rent: $800/mo                     │
│ • Size: 130 sqft                    │
│ • Private bath: No                  │
│                                     │
│ Room D:                             │
│ • Rent: $800/mo                     │
│ • Size: 130 sqft                    │RetryBContinueEdit│ • Private bath: No                  │
│                                     │
│ [Save All Rooms]                    │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ BACKEND:                            │
│ INSERT INTO units (...)             │
│ INSERT INTO rooms (4 records)       │
│ SET status = 'vacant'               │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Dashboard Updates:                  │
│                                     │
│ Property: Downtown Loft             │
│ └─ Unit 3A: 3 rooms, 0 occupied     │
│ └─ Unit 3B: 4 rooms, 0 occupied     │
│                                     │
│ Revenue Potential:                  │
│ Unit 3B: $3,250/mo (4 rooms)        │
│                                     │
│ Occupancy: 0% (0/7 rooms filled)    │
└─────────────────────────────────────┘
│
▼
END

**Key Takeaway:** This flow shows how room-level tracking enables per-room pricing and granular occupancy tracking—impossible with traditional unit-level systems.

---

### **4.2 Flow: Applicant Applies → AI Matching → Placement**

This demonstrates the AI roommate matching feature.
START
│
▼
┌─────────────────────────────────────┐
│ Applicant Application Form:         │
│                                     │
│ Basic Info:                         │
│ • Name: Sarah Thompson              │
│ • Email: sarah@email.com            │
│ • Phone: 555-0123                   │
│ • Move-in: Dec 1, 2025              │
│ • Lease length: 6 months            │
│                                     │
│ Compatibility Questions:            │
│ • Sleep schedule: Night owl         │
│ • Cleanliness (1-5): 4              │
│ • Noise tolerance: Moderate         │
│ • Social: Sometimes social          │
│ • Work from home: Yes               │
│ • Pets: No                          │
│ • Allergies: Yes (cats)             │
│                                     │
│ [Submit Application]                │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ BACKEND:                            │
│ INSERT INTO applications            │
│ compatibility_profile = {           │
│   sleep_schedule: "night_owl",      │
│   cleanliness: 4,                   │
│   noise_tolerance: "moderate",      │
│   ... (full profile)                │
│ }                                   │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ AI MATCHING SERVICE TRIGGERED       │ ◄─ DIFFERENTIATOR
│                                     │
│ Step 1: Find Available Rooms       │
│ SELECT * FROM rooms                 │
│ WHERE status = 'vacant'             │
│ AND property_id = X                 │
│                                     │
│ Results: 3 vacant rooms             │
│ • Unit 3B, Room A                   │
│ • Unit 5C, Room D                   │
│ • Unit 2A, Room B                   │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Step 2: Get Current Roommates      │
│                                     │
│ Unit 3B (Room A vacant):            │
│ • Room B: Mike (clean, quiet, WFH)  │
│ • Room C: Jessica (social, early)   │
│ • Room D: Tom (moderate, friendly)  │
│                                     │
│ Unit 5C (Room D vacant):            │
│ • Room A: Brad (messy, loud, late)  │
│ • Room B: Empty                     │
│ • Room C: Empty                     │
│                                     │
│ Unit 2A (Room B vacant):            │
│ • Room A: Lisa (has 2 cats)         │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Step 3: Calculate Compatibility     │
│                                     │
│ FOR Unit 3B, Room A:                │
│                                     │
│ vs Mike:                            │
│ • Sleep: 90% (both flexible)        │
│ • Clean: 100% (both 4/5)            │
│ • Social: 85% (compatible)          │
│ • Noise: 90% (both moderate)        │
│ • Dealbreakers: PASS                │
│ Individual score: 91%               │
│                                     │
│ vs Jessica:                         │
│ • Sleep: 70% (diff schedules)       │
│ • Clean: 95% (both clean)           │
│ • Social: 95% (both social)         │
│ • Noise: 90% (compatible)           │
│ • Dealbreakers: PASS                │
│ Individual score: 88%               │
│                                     │
│ vs Tom:                             │
│ • Sleep: 85% (flexible)             │
│ • Clean: 80% (he's 3/5)             │
│ • Social: 100% (perfect)            │
│ • Noise: 95% (compatible)           │
│ • Dealbreakers: PASS                │
│ Individual score: 92%               │
│                                     │
│ AGGREGATE: Avg(91, 88, 92) = 90%    │
│ Group bonus: +2% (all clean)        │
│ FINAL SCORE: 92%                    │
│                                     │
│ FOR Unit 5C, Room D:                │
│ vs Brad only (2 rooms empty)        │
│ • Sleep: 80%                        │
│ • Clean: 40% (he's messy)           │
│ • Social: 70%                       │
│ • Noise: 50% (he's loud)            │
│ Individual score: 60%               │
│ Penalty: -5% (only 1 roommate)      │
│ FINAL SCORE: 55%                    │
│                                     │
│ FOR Unit 2A, Room B:                │
│ vs Lisa:                            │
│ • Dealbreaker: Sarah allergic to    │
│   cats, Lisa has 2 cats             │
│ FINAL SCORE: 0% (FAIL)              │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Step 4: Store Results               │
│ INSERT INTO matching_scores         │
│ (application_id, room_id, score,    │
│  breakdown, recommendation)         │
│                                     │
│ 3 records created                   │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Operator Dashboard:                 │
│                                     │
│ New Application: Sarah Thompson     │
│                                     │
│ ✅ RECOMMENDED: Unit 3B, Room A     │
│    Match Score: 92%                 │
│                                     │
│    Current Roommates:               │
│    • Mike (quiet, WFH, clean)       │
│    • Jessica (social, early bird)   │
│    • Tom (moderate, friendly)       │
│                                     │
│    Why This Match:                  │
│    ✓ Similar cleanliness standards  │
│    ✓ Compatible work schedules      │
│    ✓ Balanced social dynamics       │
│    ⚠ Jessica is early bird vs       │
│      Sarah night owl (manageable)   │
│                                     │
│ ⚠️ ALTERNATIVE: Unit 5C, Room D     │
│    Match Score: 55%                 │
│                                     │
│    Current Roommates:               │
│    • Brad (loud, messy, parties)    │
│    • 2 empty rooms                  │
│                                     │
│    Why Lower Score:                 │
│    ⚠ Lifestyle mismatch with Brad   │
│    ⚠ Cleanliness conflict likely    │
│    ⚠ High vacancy (less community)  │
│                                     │
│ ❌ NOT RECOMMENDED: Unit 2A, Room B │
│    Match Score: 0%                  │
│    Reason: Pet allergy conflict     │
│                                     │
│ Actions:                            │
│ [Approve for Unit 3B Room A]        │
│ [Approve for Different Room]        │
│ [Request More Info]                 │
│ [Reject Application]                │
└────────────────┬────────────────────┘
│
▼ (Operator approves)
┌─────────────────────────────────────┐
│ BACKEND:                            │
│ BEGIN TRANSACTION                   │
│                                     │
│ UPDATE applications                 │
│ SET status = 'approved',            │
│     approved_room_id = room_a_id    │
│                                     │
│ INSERT INTO tenants                 │
│ (user_id, room_id, lease_start,     │
│  lease_end, rent_amount)            │
│                                     │
│ UPDATE rooms                        │
│ SET status = 'occupied',            │
│     current_tenant_id = tenant_id   │
│ WHERE id = room_a_id                │
│                                     │
│ COMMIT                              │
│                                     │
│ TRIGGER: Send welcome email         │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Email to Sarah:                     │
│                                     │
│ "Welcome to Downtown Loft!"         │
│                                     │
│ You've been approved for:           │
│ Unit 3B, Room A                     │
│ Move-in: Dec 1, 2025                │
│ Rent: $900/month                    │
│                                     │
│ Your roommates:                     │
│ • Mike, Jessica, Tom                │
│                                     │
│ Next Steps:                         │
│ [Complete Your Profile]             │
│ [Sign Lease]                        │
│ [Set Up Payment]                    │
└─────────────────────────────────────┘
│
▼
END

**Key Takeaway:** AI matching increases tenant satisfaction, reduces conflicts, and improves lease renewals—a feature impossible without room-level tracking and compatibility profiles.

---

### **4.3 Flow: Resident Pays Rent**
START (7 days before due date)
│
▼
┌─────────────────────────────────────┐
│ AUTOMATED REMINDER SYSTEM:          │
│                                     │
│ Cron job runs daily                 │
│ SELECT * FROM payments              │
│ WHERE due_date = CURRENT_DATE + 7   │
│ AND status = 'pending'              │
│                                     │
│ For each: Send reminder             │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Sarah receives:                     │
│ 📧 Email: "Rent due in 7 days"      │
│ 📱 SMS: "$900 rent due Dec 1"       │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Sarah logs into Resident Portal     │
│                                     │
│ Banner shows: "Rent Due: $900"      │
│ [Pay Now]                           │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Payment Page:                       │
│                                     │
│ Amount: $900.00                     │
│ Due Date: December 1, 2025          │
│                                     │
│ Payment Method:                     │
│ [•] Card ending 4242                │
│ [ ] Add new payment method          │
│                                     │
│ [Pay $900.00]                       │
└────────────────┬────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ BACKEND: Process Payment            │
│                                     │
│ 1. Call Stripe API                  │
│    stripe.PaymentIntent.create({    │
│      amount: 90000,                 │
│      currency: 'usd',               │
│      customer: stripe_cust_id       │
│    })                               │
│                                     │
│ 2. Wait for response...             │
└────────────────┬────────────────────┘
│
┌──────┴──────┐
│             │
Success       Failure
│             │
▼             ▼
┌─────────────────┐ ┌─────────────────┐
│ UPDATE payments │ │ UPDATE payments │
│ SET:            │ │ SET:            │
│ status='paid'   │ │ status='failed' │
│ paid_date=NOW() │ │                 │
│ stripe_id='...' │ │ Log error       │
│                 │ │ Send notification│
└────────┬────────┘ └────────┬────────┘
│                   │
▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│ Generate receipt│ │ Error page:     │
│ Store in S3     │ │ "Payment failed"│
│ Email to Sarah  │ │ [Retry Payment] │
└────────┬────────┘ └─────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Success Page:                       │
│                                     │
│ ✅ Payment Received!                │
│                                     │
│ Receipt: [Download PDF]             │
│ Amount Paid: $900.00                │
│ Payment Date: Nov 24, 2025          │
│ Next Payment: January 1, 2026       │
└─────────────────────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Operator Dashboard Auto-Updates:    │
│                                     │
│ Downtown Loft                       │
│ └─ Unit 3B                          │
│    └─ Room A: Sarah ✅ PAID         │
│    └─ Room B: Mike ✅ PAID          │
│    └─ Room C: Jessica ✅ PAID       │
│    └─ Room D: Tom ⏳ PENDING        │
│                                     │
│ Unit 3B Status:                     │
│ Collected: $2,700 / $3,250 (83%)    │
│ Outstanding: $800 (Tom)             │
└─────────────────────────────────────┘
│
▼
END

---

## **5. AI Matching Service Architecture**

### **5.1 Matching Algorithm Overview**

The AI Matching Service calculates compatibility scores between applicants and available rooms based on current roommates' profiles.

**Algorithm Phases:**
- **Phase 1 (MVP):** Rule-based scoring
- **Phase 2:** Machine learning model trained on historical data
- **Phase 3:** Churn prediction and proactive recommendations

### **5.2 Compatibility Scoring Logic (Phase 1)**

**Weighted Scoring Formula:**
Compatibility Score =
(0.30 × sleep_schedule_match) +
(0.25 × cleanliness_match) +
(0.20 × social_compatibility) +
(0.15 × noise_tolerance_match) +
(0.10 × dealbreaker_check)

**Individual Criteria Scoring:**

**Sleep Schedule Match:**
```python
def score_sleep_schedule(applicant, roommate):
    schedules = {
        'early_bird': 0,
        'flexible': 50,
        'night_owl': 100
    }
    
    diff = abs(schedules[applicant] - schedules[roommate])
    
    if diff == 0:
        return 100  # Perfect match
    elif diff <= 50:
        return 70   # Compatible
    else:
        return 40   # Poor match but manageable
Cleanliness Match:
pythondef score_cleanliness(applicant, roommate):
    # Both rated 1-5
    diff = abs(applicant.cleanliness - roommate.cleanliness)
    
    if diff == 0:
        return 100
    elif diff == 1:
        return 85
    elif diff == 2:
        return 60
    else:
        return 30  # 3+ difference = likely conflict
Social Compatibility:
pythondef score_social(applicant, roommate):
    matrix = {
        ('private', 'private'): 100,
        ('private', 'sometimes'): 80,
        ('private', 'very_social'): 40,
        ('sometimes', 'sometimes'): 100,
        ('sometimes', 'very_social'): 85,
        ('very_social', 'very_social'): 100
    }
    
    return matrix.get((applicant.social, roommate.social), 70)
Dealbreakers:
pythondef check_dealbreakers(applicant, roommates):
    # Automatic disqualification
    
    # Pet allergies
    if applicant.pet_allergies:
        if any(r.has_pets for r in roommates):
            return 0  # FAIL
    
    # Smoking
    if applicant.smoking and not applicant.smoking_ok:
        if any(r.smoking for r in roommates):
            return 0  # FAIL
    
    return 100  # PASS
5.3 Group Dynamics Adjustments
After individual scores are calculated, apply bonuses/penalties:
pythondef calculate_group_dynamics(individual_scores, roommates):
    avg_score = sum(individual_scores) / len(individual_scores)
    
    # Bonus: All roommates are very clean
    if all(r.cleanliness >= 4 for r in roommates):
        avg_score += 2
    
    # Bonus: Diverse but compatible social preferences
    social_types = [r.social_preference for r in roommates]
    if len(set(social_types)) >= 2 and avg_score > 70:
        avg_score += 3  # Good mix
    
    # Penalty: High vacancy (less community)
    if len(roommates) < 2:
        avg_score -= 5
    
    return min(100, avg_score)  # Cap at 100
5.4 Recommendation Generation
pythondef generate_recommendation(score, breakdown, roommates):
    if score >= 85:
        return f"Excellent match! {reason_for_high_score(breakdown)}"
    elif score >= 70:
        return f"Good match with minor considerations: {potential_issues(breakdown)}"
    elif score >= 50:
        return f"Moderate compatibility. Concerns: {main_concerns(breakdown)}"
    else:
        return f"Not recommended. {why_poor_match(breakdown)}"
5.5 Complete Matching Process
INPUT: New Application
  │
  ▼
┌─────────────────────────────────────┐
│ Step 1: Fetch Available Rooms       │
│ WHERE status = 'vacant'              │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Step 2: For Each Room               │
│ Get current roommates in same unit  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Step 3: Calculate Individual Scores │
│ For each roommate:                  │
│ • Sleep schedule                    │
│ • Cleanliness                       │
│ • Social compatibility              │
│ • Noise tolerance                   │
│ • Dealbreakers                      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Step 4: Aggregate & Adjust          │
│ • Average individual scores         │
│ • Apply group dynamics bonuses      │
│ • Apply penalties                   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Step 5: Sort & Rank Rooms           │
│ Highest to lowest score             │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Step 6: Generate Recommendations    │
│ • Top choice (85%+)                 │
│ • Alternatives (70-84%)             │
│ • Not recommended (<70%)            │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Step 7: Store Results               │
│ INSERT INTO matching_scores         │
└─────────────────────────────────────┘
                 │
                 ▼
OUTPUT: Ranked recommendations
5.6 Future ML Enhancements (Phase 2)
Data Collection:

Track which recommendations operators accept/reject
Monitor lease renewal rates (AI-matched vs manual)
Log conflict reports
Measure tenant satisfaction scores

ML Model:
python# Feature engineering
features = [
    'sleep_schedule_diff',
    'cleanliness_diff',
    'social_compatibility',
    'noise_tolerance_match',
    'age_diff',
    'wfh_match',
    'shared_interests_count',
    'previous_conflict_rate',
    # ... more features
]

# Target variable
target = 'lease_renewed'  # Boolean

# Model
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier()
model.fit(X_train, y_train)

# Predict renewal probability
renewal_prob = model.predict_proba(applicant_features)[0][1]
Churn Prediction:
Monitor engagement signals to predict non-renewals:

Login frequency drops
Maintenance complaints increase
Community engagement decreases
Payment delays
Conflict reports

Alert operators 60-90 days before lease end with retention strategies.

6. Technology Stack Details
6.1 Frontend Stack
LayerTechnologyPurposeFrameworkReact 18UI libraryLanguageTypeScriptType safetyBuild ToolViteFast dev server & bundlingStylingTailwind CSSUtility-first CSSComponentsshadcn/uiPre-built accessible componentsState - ServerReact Query (TanStack Query)Server state management, cachingState - ClientZustandLightweight client stateRoutingReact Router v6Client-side routingFormsReact Hook Form + ZodForm handling & validationChartsRechartsData visualizationDatesdate-fnsDate manipulationHTTPAxiosAPI requestsHostingVercelEdge network, auto-deploy
Project Structure:
frontend/src/
├── components/
│   ├── operator/  (Property management UI)
│   ├── resident/  (Tenant portal UI)
│   ├── shared/    (Common components)
│   └── ui/        (shadcn components)
├── pages/         (Route components)
├── hooks/         (Custom React hooks)
├── lib/           (Utils, API client)
├── store/         (Zustand stores)
└── types/         (TypeScript types)

6.2 Backend Stack (Python)
LayerTechnologyPurposeLanguagePython 3.11+Primary languageFrameworkFastAPIWeb frameworkORMSQLAlchemy 2.0Database ORMMigrationsAlembicSchema migrationsValidationPydanticData validationAuthpython-joseJWT tokensPasswordPasslib + BcryptPassword hashingFile Uploadpython-multipartForm data handlingTestingpytest + httpxTesting frameworkServerUvicornASGI serverEnvironmentpython-dotenvEnv variablesHostingRailwayCloud platform
Key Dependencies:
txtfastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
pytest==7.4.3
httpx==0.25.2
Project Structure:
backend/app/
├── main.py          (FastAPI app)
├── database.py      (SQLAlchemy setup)
├── config.py        (Settings)
├── models/          (Database models)
├── schemas/         (Pydantic schemas)
├── routers/         (API endpoints)
├── services/        (Business logic)
└── utils/           (Helpers)

6.3 Database Stack
ComponentTechnologyPurposePrimary DBPostgreSQL 15Main data storeLocal DevDocker containerPort 5433ProductionRailway PostgreSQLManaged databaseMigrationsAlembicSchema versioningBackupsAutomated dailyVia Railway
Connection String:
Local:  postgresql://colivos_user:colivos_pass@localhost:5433/colivos_db
Prod:   postgresql://[provided by Railway]
Phase 2 Additions:
ComponentTechnologyPurposeCache/QueueRedis 7Session storage, caching, jobsLocal DevDocker containerPort 6379ProductionUpstashServerless RedisFile StorageAWS S3 / Cloudflare R2Documents, photosCDNCloudFront / CloudflareStatic asset delivery

6.4 External Services
Phase 1 (MVP):

Sentry: Error tracking and monitoring

Phase 2:

Stripe: Payment processing, subscriptions
SendGrid/Resend: Transactional emails
Twilio: SMS notifications (optional)
PostHog/Mixpanel: Product analytics

Phase 3:

DocuSign: E-signatures for leases
Checkr: Background checks
AWS S3: File storage


6.5 DevOps & Monitoring
ComponentTechnologyPurposeVersion ControlGitHubCode repositoryLocal DevDocker + Docker ComposePostgreSQL, Redis (later)CI/CD - FrontendVercelAuto-deploy on pushCI/CD - BackendRailwayAuto-deploy on pushUptime MonitoringUptimeRobotFree uptime checksError TrackingSentryBug monitoringLogsRailway logsCentralized loggingTestingpytestBackend testsAPI DocsFastAPI auto-generatedSwagger/ReDoc UI

7. Security Architecture
7.1 Security Layers
Layer 1: Network Security

HTTPS everywhere (TLS 1.3)
CORS properly configured
Rate limiting (100 requests/min per user)
DDoS protection (via Cloudflare)

Layer 2: Authentication

JWT tokens (15min access, 7d refresh)
Password hashing: bcrypt (12 rounds)
Password requirements: 8+ characters, mixed case, numbers
Account lockout: 5 failed login attempts
Session management via Redis (Phase 2)
2FA via Twilio (Phase 3)

Layer 3: Authorization (RBAC)

Admin: Full system access
Operator: Own properties only
Tenant: Own data only

Middleware checks on every request:
python@router.get("/properties")
async def get_properties(current_user: User = Depends(get_current_user)):
    if current_user.role != "operator":
        raise HTTPException(403, "Forbidden")
    
    # Only return properties belonging to this operator
    return db.query(Property).filter(
        Property.operator_id == current_user.operator_id
    ).all()
Layer 4: Data Protection

Database encryption at rest
Sensitive fields encrypted (SSN, etc.)
PCI compliance via Stripe (no card data stored locally)
GDPR-ready:

Data export API
Right to deletion
Audit logs



Layer 5: Input Validation

Pydantic schemas on all endpoints
SQL injection prevention (SQLAlchemy ORM)
XSS prevention (React escapes by default)
CSRF tokens for state-changing operations

Layer 6: Monitoring & Response

All auth events logged
Failed login alerts (5+ attempts)
Suspicious activity detection
Regular security audits
Dependency scanning (Dependabot)


8. Deployment Architecture
8.1 Production Setup
USER'S BROWSER
      │ HTTPS
      ▼
CLOUDFLARE (CDN + WAF)
- DDoS protection
- Rate limiting
- Static asset caching
      │
      ├─────────────────┬─────────────────┐
      │                 │                 │
      ▼                 ▼                 ▼
   VERCEL            RAILWAY         EXTERNAL
  (Frontend)        (Backend)        SERVICES
      │                 │                 │
      │                 ├─────────────────┤
      │                 │                 │
      │                 ▼                 ▼
      │          POSTGRESQL           STRIPE
      │          REDIS (Phase 2)RetryBContinueEdit│      SENDGRID
│                 AWS S3 (Phase 2)    TWILIO

### **8.2 Environment Configuration**

**Local Development:**
```bash
# Frontend
http://localhost:5173

# Backend
http://localhost:8000

# Database
postgresql://colivos_user:colivos_pass@localhost:5433/colivos_db

# Features
- Hot reload enabled
- Debug mode on
- Mock external services
Staging (Pre-production):
bash# Frontend
https://staging.colivos.com

# Backend
https://api-staging.colivos.com

# Database
Separate staging database

# Features
- Stripe test mode
- Real external services (test keys)
- Used for QA/testing
Production:
bash# Frontend
https://app.colivos.com

# Backend
https://api.colivos.com

# Database
Production PostgreSQL (Railway)

# Features
- Stripe live mode
- All monitoring enabled
- Automated daily backups
8.3 CI/CD Pipeline
Developer pushes to GitHub
         │
         ▼
GitHub Actions triggered
- Run linter (Ruff/Black)
- Run type check (mypy)
- Run unit tests (pytest)
- Build check
         │
         ▼
    Tests pass?
    │         │
   Yes       No → Fail build, notify
    │
    ▼
Deploy to Staging
- Vercel: Deploy frontend
- Railway: Deploy backend
- Run Alembic migrations
         │
         ▼
Run E2E tests on staging
- Critical user flows
- Payment flow (test mode)
         │
         ▼
Manual approval for production
(Merge to main branch)
         │
         ▼
Deploy to Production
- Zero-downtime deployment
- Health checks
- Rollback ready
         │
         ▼
Post-deploy monitoring
- Check error rates (Sentry)
- Check response times
- Monitor logs
- Alert if issues detected

9. Scalability Plan
Phase 1: MVP (0-100 operators)
Infrastructure:

Single backend instance
PostgreSQL: Small instance (1GB RAM)
No caching (direct DB queries)

Costs: ~$50/month
Capacity:

Handles 10,000 requests/day
100 concurrent users
<200ms response time

Bottlenecks: None expected

Phase 2: Growth (100-500 operators)
Infrastructure:

Add Redis caching
Cache frequent queries (properties, units)
Cache AI matching results
Upgrade PostgreSQL to 4GB RAM
Add read replica for reporting

Costs: ~$200/month
Capacity:

100,000 requests/day
500 concurrent users

Bottlenecks:

AI matching gets slow (>2s)
Dashboard queries slow down
Need to optimize database indexes


Phase 3: Scale (500-2,000 operators)
Infrastructure:

Horizontal scaling: 3-5 backend instances
Load balancer
Separate AI service (Python microservice)
Background job workers
CDN for static assets
Database:

Primary (writes)
2x Read replicas
Connection pooling (PgBouncer)



Costs: ~$1,000/month
Optimizations:

Database indexes tuned
GraphQL instead of REST (fewer queries)
Batch operations for bulk updates


Phase 4: Enterprise (2,000+ operators)
Infrastructure:

Kubernetes cluster (auto-scaling)
Database sharding (by operator_id)
Microservices architecture:

Auth service
Property service
Payment service
AI service
Notification service


Message queue (RabbitMQ/Kafka)

Costs: ~$5,000+/month

10. Critical Metrics to Track
10.1 System Health Metrics
Performance:

API Response Time: <200ms (p95)
Page Load Time: <2s (p95)
Database Query Time: <50ms (p95)
AI Matching Time: <3s per applicant

Reliability:

Uptime: 99.9% (43 min downtime/month)
Error Rate: <0.1% of requests
Payment Success Rate: >99%

Usage:

Daily Active Operators: X%
Daily Active Tenants: X%
Average session duration
Feature adoption rates


10.2 Business Metrics
Revenue:

MRR (Monthly Recurring Revenue)
ARR (Annual Recurring Revenue)
ARPU (Average Revenue Per User)
Payment processing volume

Growth:

New operators per month
Properties added per month
Tenants added per month
Month-over-month growth %

Retention:

Monthly churn rate: Target <5%
Customer lifetime (months)
Net Dollar Retention
Expansion revenue (upgrades)

Acquisition:

CAC (Customer Acquisition Cost)
LTV (Lifetime Value)
LTV:CAC ratio (target >3:1)
Payback period (target <12 months)


10.3 Product Metrics
AI Matching Effectiveness:

% operators who follow AI recommendation: Target >70%
Tenant satisfaction (AI-matched vs manual): +15% higher
Lease renewal rate (AI-matched): +20% higher
Conflict reports (AI-matched): -30% lower

Operator Efficiency:

Time saved per week: 10+ hours
Rent collection rate: >95%
Occupancy rate: >90%
Avg days to fill vacant room: <15

Tenant Engagement:

Community post frequency
Event attendance rate: >40%
NPS (Net Promoter Score): >50
Support ticket volume (lower is better)


11. MVP vs Full Vision
11.1 MVP (Weeks 1-10)
Features:

✅ Add properties, units, ROOMS
✅ Add tenants, assign to rooms
✅ Manual rent tracking (checkboxes)
✅ Maintenance request form
✅ Basic announcements
✅ Simple dashboard (occupancy, revenue)
❌ No Stripe payments (manual tracking)
❌ No AI matching
❌ No community features

Tech:

Python + FastAPI
PostgreSQL
React (basic)
Deploy on Vercel + Railway
~5,000 lines of code

Goal: Replace operator's spreadsheets

11.2 Full Vision (Year 1+)
Features:

✅ Everything from MVP +
✅ Stripe payment integration
✅ AI ROOMMATE MATCHING ◄─ KEY DIFFERENTIATOR
✅ Community feed, events, profiles
✅ Churn prediction
✅ Dynamic pricing recommendations
✅ Document management + e-signatures
✅ Analytics & reporting
✅ Mobile app (React Native)
✅ API for integrations
✅ White-label option
✅ Background checks integration
✅ Listing syndication

Tech:

Python + FastAPI + Python AI service
PostgreSQL + Redis
React + React Native
Microservices architecture
~50,000 lines of code

Goal: Industry-standard co-living operating system

12. Project File Structure
colivos/
├── docs/
│   ├── README.md
│   ├── SOFTWARE_ARCHITECTURE.md  (this document)
│   └── API_DOCUMENTATION.md
│
├── frontend/  (Phase 2)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── types/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── config.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── property.py
│   │   │   ├── unit.py
│   │   │   ├── room.py  ◄─ KEY
│   │   │   └── tenant.py
│   │   ├── schemas/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── properties.py
│   │   │   ├── units.py
│   │   │   ├── rooms.py  ◄─ KEY
│   │   │   └── tenants.py
│   │   ├── services/
│   │   └── utils/
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── .env
│
├── ai-service/  (Phase 2)
│   └── matching/
│       └── algorithm.py
│
├── docker-compose.yml
├── .gitignore
└── README.md

13. Key Architectural Decisions Summary
What Makes CoLiv OS Different
1. Room-Level Architecture
Traditional: Property → Unit → Tenant
CoLiv OS:    Property → Unit → Room → Tenant
Enables individual pricing, flexible leases, granular tracking.
2. AI Matching Service
Compatibility algorithm for roommate placement.
Traditional PM: First-come-first-served, no matching.
3. Community-First Data Model
Events, posts, profiles, engagement tracking.
Traditional PM: Just rent + maintenance.
4. Hospitality Operations
High turnover, dynamic pricing, experience metrics.
Traditional PM: Annual leases, fixed pricing.
5. Modern Tech Stack
Python, FastAPI, React, TypeScript, Tailwind.
Traditional PM: Legacy PHP/Java, slow, outdated UI.

Appendix: Reference Information
Current Status:

Phase: MVP Week 1, Day 1 Complete
GitHub: https://github.com/BrandonSosa3/CoLiv
PostgreSQL Port: 5433 (due to local conflict)

Key Contacts:

Project Lead: Brandon Sosa
Repository: github.com/BrandonSosa3/CoLiv

Version History:

v1.0 (October 2025): Initial architecture document