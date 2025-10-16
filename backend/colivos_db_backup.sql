--
-- PostgreSQL database dump
--

\restrict 9hUQ93uVlgNpFsoaM9WYhgNSEFXU0Hy6XJwvZji0bfwsTjOSmBlCxPU3zoH0qlg

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: announcementpriority; Type: TYPE; Schema: public; Owner: colivos_user
--

CREATE TYPE public.announcementpriority AS ENUM (
    'NORMAL',
    'IMPORTANT',
    'URGENT'
);


ALTER TYPE public.announcementpriority OWNER TO colivos_user;

--
-- Name: maintenancepriority; Type: TYPE; Schema: public; Owner: colivos_user
--

CREATE TYPE public.maintenancepriority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT',
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.maintenancepriority OWNER TO colivos_user;

--
-- Name: maintenancestatus; Type: TYPE; Schema: public; Owner: colivos_user
--

CREATE TYPE public.maintenancestatus AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.maintenancestatus OWNER TO colivos_user;

--
-- Name: paymentstatus; Type: TYPE; Schema: public; Owner: colivos_user
--

CREATE TYPE public.paymentstatus AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'FAILED'
);


ALTER TYPE public.paymentstatus OWNER TO colivos_user;

--
-- Name: roomstatus; Type: TYPE; Schema: public; Owner: colivos_user
--

CREATE TYPE public.roomstatus AS ENUM (
    'available',
    'occupied',
    'maintenance'
);


ALTER TYPE public.roomstatus OWNER TO colivos_user;

--
-- Name: roomtype; Type: TYPE; Schema: public; Owner: colivos_user
--

CREATE TYPE public.roomtype AS ENUM (
    'PRIVATE',
    'SHARED'
);


ALTER TYPE public.roomtype OWNER TO colivos_user;

--
-- Name: tenantstatus; Type: TYPE; Schema: public; Owner: colivos_user
--

CREATE TYPE public.tenantstatus AS ENUM (
    'ACTIVE',
    'PENDING',
    'MOVED_OUT'
);


ALTER TYPE public.tenantstatus OWNER TO colivos_user;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: colivos_user
--

CREATE TYPE public.userrole AS ENUM (
    'OPERATOR',
    'TENANT',
    'ADMIN'
);


ALTER TYPE public.userrole OWNER TO colivos_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO colivos_user;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.announcements (
    property_id uuid NOT NULL,
    created_by uuid NOT NULL,
    title character varying(255),
    message text NOT NULL,
    priority public.announcementpriority,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.announcements OWNER TO colivos_user;

--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.maintenance_requests (
    property_id uuid NOT NULL,
    room_id uuid,
    tenant_id uuid,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    priority public.maintenancepriority DEFAULT 'medium'::public.maintenancepriority,
    status public.maintenancestatus
);


ALTER TABLE public.maintenance_requests OWNER TO colivos_user;

--
-- Name: operators; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.operators (
    user_id uuid NOT NULL,
    company_name character varying(255),
    phone character varying(20),
    subscription_status character varying(50),
    stripe_customer_id character varying(100),
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.operators OWNER TO colivos_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.payments (
    tenant_id uuid NOT NULL,
    room_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    paid_date date,
    status public.paymentstatus,
    payment_method character varying(50),
    late_fee numeric(10,2),
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.payments OWNER TO colivos_user;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.properties (
    operator_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    zip character varying(20) NOT NULL,
    total_units integer,
    amenities jsonb,
    house_rules text,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.properties OWNER TO colivos_user;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.rooms (
    unit_id uuid NOT NULL,
    room_number character varying(50) NOT NULL,
    size_sqft integer,
    rent_amount numeric(10,2) NOT NULL,
    status public.roomstatus DEFAULT 'available'::public.roomstatus,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    private_bathroom boolean DEFAULT false NOT NULL,
    furnished boolean DEFAULT false NOT NULL
);


ALTER TABLE public.rooms OWNER TO colivos_user;

--
-- Name: tenant_preferences; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.tenant_preferences (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    cleanliness_importance integer,
    noise_tolerance integer,
    guest_frequency integer,
    sleep_schedule character varying(50),
    work_schedule character varying(50),
    social_preference integer,
    smoking boolean,
    pets boolean,
    overnight_guests boolean,
    interests text,
    notes text
);


ALTER TABLE public.tenant_preferences OWNER TO colivos_user;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.tenants (
    user_id uuid NOT NULL,
    room_id uuid NOT NULL,
    lease_start date NOT NULL,
    lease_end date NOT NULL,
    rent_amount numeric(10,2) NOT NULL,
    deposit_paid numeric(10,2),
    status public.tenantstatus,
    move_in_date date,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.tenants OWNER TO colivos_user;

--
-- Name: units; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.units (
    property_id uuid NOT NULL,
    unit_number character varying(20) NOT NULL,
    floor integer,
    bedrooms integer NOT NULL,
    bathrooms integer NOT NULL,
    square_feet integer,
    furnished boolean,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.units OWNER TO colivos_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: colivos_user
--

CREATE TABLE public.users (
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.userrole NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO colivos_user;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.alembic_version (version_num) FROM stdin;
f1eeb533cb4f
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.announcements (property_id, created_by, title, message, priority, id, created_at, updated_at) FROM stdin;
f4fc4ff6-0d5d-4555-b3c1-636c8c17bbbe	b791e69c-ddb7-4fb0-a1ae-832b87714b73	poop	poop	NORMAL	835530a4-2c00-44ab-999c-4eae759a3cfd	2025-10-15 04:06:33.705068+00	\N
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.maintenance_requests (property_id, room_id, tenant_id, title, description, id, created_at, updated_at, priority, status) FROM stdin;
\.


--
-- Data for Name: operators; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.operators (user_id, company_name, phone, subscription_status, stripe_customer_id, id, created_at, updated_at) FROM stdin;
b791e69c-ddb7-4fb0-a1ae-832b87714b73	\N	\N	trial	\N	3e754a3a-933d-4465-a538-0a3f28fe692c	2025-10-14 19:25:40.100079+00	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.payments (tenant_id, room_id, amount, due_date, paid_date, status, payment_method, late_fee, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.properties (operator_id, name, address, city, state, zip, total_units, amenities, house_rules, id, created_at, updated_at) FROM stdin;
3e754a3a-933d-4465-a538-0a3f28fe692c	Dungeon	5147 Ewing Street	San Diego	California	92115	0	null		f4fc4ff6-0d5d-4555-b3c1-636c8c17bbbe	2025-10-14 19:25:58.090939+00	\N
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.rooms (unit_id, room_number, size_sqft, rent_amount, status, id, created_at, updated_at, private_bathroom, furnished) FROM stdin;
\.


--
-- Data for Name: tenant_preferences; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.tenant_preferences (id, tenant_id, cleanliness_importance, noise_tolerance, guest_frequency, sleep_schedule, work_schedule, social_preference, smoking, pets, overnight_guests, interests, notes) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.tenants (user_id, room_id, lease_start, lease_end, rent_amount, deposit_paid, status, move_in_date, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.units (property_id, unit_number, floor, bedrooms, bathrooms, square_feet, furnished, id, created_at, updated_at) FROM stdin;
f4fc4ff6-0d5d-4555-b3c1-636c8c17bbbe	3A	2	1	1	1	t	df4e5687-7f0d-4616-a2b9-855137a980d3	2025-10-15 23:17:39.305896+00	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: colivos_user
--

COPY public.users (email, password_hash, role, id, created_at, updated_at) FROM stdin;
brandonsosa10101@gmail.com	$2b$12$0FWgCYRDpilW3cBTqtmG4uGQr6.gchkcyEhINY2Ne77LvttyyiQMS	OPERATOR	b791e69c-ddb7-4fb0-a1ae-832b87714b73	2025-10-14 19:25:40.100079+00	\N
barneyfluff@gmail.com	$2b$12$KP3lkKUstO8h4OqXyBrKGOmAPoFyrAgQexYxMbGr3pJTD56hTopei	TENANT	29c14b40-1ed0-4b18-952c-029072d84998	2025-10-14 19:26:56.280807+00	\N
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (id);


--
-- Name: operators operators_user_id_key; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_user_id_key UNIQUE (user_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: tenant_preferences tenant_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.tenant_preferences
    ADD CONSTRAINT tenant_preferences_pkey PRIMARY KEY (id);


--
-- Name: tenant_preferences tenant_preferences_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.tenant_preferences
    ADD CONSTRAINT tenant_preferences_tenant_id_key UNIQUE (tenant_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: colivos_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: announcements announcements_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: operators operators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payments payments_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: payments payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: properties properties_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id);


--
-- Name: rooms rooms_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: tenant_preferences tenant_preferences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.tenant_preferences
    ADD CONSTRAINT tenant_preferences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: units units_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: colivos_user
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9hUQ93uVlgNpFsoaM9WYhgNSEFXU0Hy6XJwvZji0bfwsTjOSmBlCxPU3zoH0qlg

