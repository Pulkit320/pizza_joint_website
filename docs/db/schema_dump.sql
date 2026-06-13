--
-- PostgreSQL database dump
--

\restrict G9TkjUIjFJnx2QquInjVqs5fL0K4zuRPOhdvijgQDQfmIYBcrWMZO1yA7zcbxYU

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg13+1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: employee_rating_tag; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employee_rating_tag AS ENUM (
    'friendly',
    'fast',
    'professional',
    'went_above_and_beyond',
    'great_communicator'
);


ALTER TYPE public.employee_rating_tag OWNER TO postgres;

--
-- Name: loyalty_event_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loyalty_event_type AS ENUM (
    'order_earn',
    'bonus_earn',
    'referral_earn',
    'review_earn',
    'employee_rating_earn',
    'birthday_multiplier',
    'admin_grant',
    'redemption',
    'expiry'
);


ALTER TYPE public.loyalty_event_type OWNER TO postgres;

--
-- Name: loyalty_tier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loyalty_tier AS ENUM (
    'dough',
    'crust',
    'legend'
);


ALTER TYPE public.loyalty_tier OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    date_of_birth date,
    referred_by uuid
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: COLUMN customers.date_of_birth; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.customers.date_of_birth IS 'Customer date of birth, used for birthday reward multipliers';


--
-- Name: COLUMN customers.referred_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.customers.referred_by IS 'Reference to the customer who referred this customer';


--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    employee_id uuid,
    delivered_at timestamp with time zone,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT deliveries_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'out_for_delivery'::character varying, 'delivered'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.deliveries OWNER TO postgres;

--
-- Name: employee_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    service_score smallint NOT NULL,
    written_note character varying(200),
    tags public.employee_rating_tag[],
    is_excluded boolean DEFAULT false NOT NULL,
    excluded_reason text,
    excluded_by uuid,
    excluded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employee_ratings_service_score_check CHECK (((service_score >= 1) AND (service_score <= 5)))
);


ALTER TABLE public.employee_ratings OWNER TO postgres;

--
-- Name: TABLE employee_ratings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.employee_ratings IS 'Customer ratings for employees who served them on specific orders';


--
-- Name: COLUMN employee_ratings.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.id IS 'Primary key, unique identifier of the employee rating';


--
-- Name: COLUMN employee_ratings.employee_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.employee_id IS 'Foreign key referencing the employee who is being rated';


--
-- Name: COLUMN employee_ratings.order_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.order_id IS 'Foreign key referencing the associated order';


--
-- Name: COLUMN employee_ratings.customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.customer_id IS 'Foreign key referencing the customer who left the rating';


--
-- Name: COLUMN employee_ratings.service_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.service_score IS 'Customer rating of employee service, from 1 (poor) to 5 (excellent)';


--
-- Name: COLUMN employee_ratings.written_note; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.written_note IS 'Optional short note about the employee service, up to 200 characters';


--
-- Name: COLUMN employee_ratings.tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.tags IS 'Array of employee rating tags detailing specific feedback';


--
-- Name: COLUMN employee_ratings.is_excluded; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.is_excluded IS 'Flag indicating if this rating is excluded from aggregate metrics (e.g. for spam/moderation)';


--
-- Name: COLUMN employee_ratings.excluded_reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.excluded_reason IS 'The reason why this rating was excluded by administration';


--
-- Name: COLUMN employee_ratings.excluded_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.excluded_by IS 'Foreign key referencing the employee (admin) who excluded this rating';


--
-- Name: COLUMN employee_ratings.excluded_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.excluded_at IS 'Timestamp when this rating was marked as excluded';


--
-- Name: COLUMN employee_ratings.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_ratings.created_at IS 'Timestamp when the rating was submitted';


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employees_role_check CHECK (((role)::text = ANY ((ARRAY['cook'::character varying, 'driver'::character varying, 'manager'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: eotw_selections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eotw_selections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    score numeric(4,3) NOT NULL,
    avg_service_rating numeric(3,2) NOT NULL,
    orders_processed_ratio numeric(5,4) NOT NULL,
    punctuality_score numeric(3,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.eotw_selections OWNER TO postgres;

--
-- Name: TABLE eotw_selections; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.eotw_selections IS 'Stores Employee of the Week selections and their associated weighted scores';


--
-- Name: COLUMN eotw_selections.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.id IS 'Primary key, unique identifier of the selection';


--
-- Name: COLUMN eotw_selections.employee_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.employee_id IS 'Foreign key referencing the selected employee';


--
-- Name: COLUMN eotw_selections.week_start; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.week_start IS 'The start date (Monday) of the calendar week evaluated';


--
-- Name: COLUMN eotw_selections.week_end; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.week_end IS 'The end date (Sunday) of the calendar week evaluated';


--
-- Name: COLUMN eotw_selections.score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.score IS 'The final computed weighted score for the employee (range 0 to 5+)';


--
-- Name: COLUMN eotw_selections.avg_service_rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.avg_service_rating IS 'The average service rating of the employee during the week (or fallback)';


--
-- Name: COLUMN eotw_selections.orders_processed_ratio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.orders_processed_ratio IS 'The ratio of orders processed by the employee vs the store total';


--
-- Name: COLUMN eotw_selections.punctuality_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.punctuality_score IS 'The punctuality score ratio of the employee during the week';


--
-- Name: COLUMN eotw_selections.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eotw_selections.created_at IS 'Timestamp when the record was calculated and written';


--
-- Name: loyalty_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loyalty_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    current_balance integer DEFAULT 0 NOT NULL,
    lifetime_points_earned integer DEFAULT 0 NOT NULL,
    current_tier public.loyalty_tier DEFAULT 'dough'::public.loyalty_tier NOT NULL,
    tier_anniversary_date date NOT NULL,
    last_activity_at timestamp with time zone DEFAULT now() NOT NULL,
    expiry_warning_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loyalty_accounts_current_balance_check CHECK ((current_balance >= 0)),
    CONSTRAINT loyalty_accounts_lifetime_points_earned_check CHECK ((lifetime_points_earned >= 0))
);


ALTER TABLE public.loyalty_accounts OWNER TO postgres;

--
-- Name: TABLE loyalty_accounts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.loyalty_accounts IS 'Accounts tracking customer loyalty points, balances, tiers, and anniversaries';


--
-- Name: COLUMN loyalty_accounts.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.id IS 'Primary key, unique identifier of the loyalty account';


--
-- Name: COLUMN loyalty_accounts.customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.customer_id IS 'Foreign key referencing the customer; unique, indicating one loyalty account per customer';


--
-- Name: COLUMN loyalty_accounts.current_balance; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.current_balance IS 'The customer''s current redeemable loyalty points balance';


--
-- Name: COLUMN loyalty_accounts.lifetime_points_earned; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.lifetime_points_earned IS 'Cumulative loyalty points earned over the lifetime of the account';


--
-- Name: COLUMN loyalty_accounts.current_tier; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.current_tier IS 'The customer''s current loyalty tier: dough (basic), crust (intermediate), or legend (elite)';


--
-- Name: COLUMN loyalty_accounts.tier_anniversary_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.tier_anniversary_date IS 'Annual date when the customer''s tier status is re-evaluated based on past activity';


--
-- Name: COLUMN loyalty_accounts.last_activity_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.last_activity_at IS 'Timestamp of the last loyalty activity, used to calculate point expiration due to inactivity';


--
-- Name: COLUMN loyalty_accounts.expiry_warning_sent_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.expiry_warning_sent_at IS 'Timestamp indicating when an email or notification warning about upcoming point expiry was sent';


--
-- Name: COLUMN loyalty_accounts.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.created_at IS 'Timestamp when the loyalty account was created';


--
-- Name: COLUMN loyalty_accounts.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_accounts.updated_at IS 'Timestamp when the loyalty account record was last modified';


--
-- Name: loyalty_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loyalty_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    loyalty_account_id uuid NOT NULL,
    order_id uuid,
    event_type public.loyalty_event_type NOT NULL,
    points_delta integer NOT NULL,
    balance_after integer NOT NULL,
    note text,
    issued_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_admin_issued_by CHECK ((((event_type = 'admin_grant'::public.loyalty_event_type) AND (issued_by IS NOT NULL)) OR (event_type <> 'admin_grant'::public.loyalty_event_type))),
    CONSTRAINT chk_loyalty_ledger_note CHECK ((((event_type = ANY (ARRAY['admin_grant'::public.loyalty_event_type, 'expiry'::public.loyalty_event_type])) AND (note IS NOT NULL) AND (TRIM(BOTH FROM note) <> ''::text)) OR (event_type <> ALL (ARRAY['admin_grant'::public.loyalty_event_type, 'expiry'::public.loyalty_event_type])))),
    CONSTRAINT chk_points_delta_sign CHECK ((((event_type = ANY (ARRAY['redemption'::public.loyalty_event_type, 'expiry'::public.loyalty_event_type])) AND (points_delta < 0)) OR ((event_type = ANY (ARRAY['order_earn'::public.loyalty_event_type, 'bonus_earn'::public.loyalty_event_type, 'referral_earn'::public.loyalty_event_type, 'review_earn'::public.loyalty_event_type, 'employee_rating_earn'::public.loyalty_event_type, 'birthday_multiplier'::public.loyalty_event_type])) AND (points_delta > 0)) OR ((event_type = 'admin_grant'::public.loyalty_event_type) AND (points_delta <> 0)))),
    CONSTRAINT loyalty_ledger_balance_after_check CHECK ((balance_after >= 0))
);


ALTER TABLE public.loyalty_ledger OWNER TO postgres;

--
-- Name: TABLE loyalty_ledger; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.loyalty_ledger IS 'Immutable transaction log of all point earn and redemption events';


--
-- Name: COLUMN loyalty_ledger.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.id IS 'Primary key, unique identifier of this ledger transaction';


--
-- Name: COLUMN loyalty_ledger.customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.customer_id IS 'Foreign key referencing the customer receiving or spending points';


--
-- Name: COLUMN loyalty_ledger.loyalty_account_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.loyalty_account_id IS 'Foreign key referencing the associated loyalty account';


--
-- Name: COLUMN loyalty_ledger.order_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.order_id IS 'Foreign key referencing the order, null for admin grants and expirations';


--
-- Name: COLUMN loyalty_ledger.event_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.event_type IS 'The nature of the points event: earn, redemption, admin adjustment, or expiry';


--
-- Name: COLUMN loyalty_ledger.points_delta; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.points_delta IS 'Positive for earn events, negative for redemption or expiry';


--
-- Name: COLUMN loyalty_ledger.balance_after; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.balance_after IS 'Snapshot of the account balance immediately following this transaction';


--
-- Name: COLUMN loyalty_ledger.note; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.note IS 'Explanation of the change, mandatory for administrative adjustments and expirations';


--
-- Name: COLUMN loyalty_ledger.issued_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.issued_by IS 'Foreign key referencing the employee who authorized an administrative grant';


--
-- Name: COLUMN loyalty_ledger.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loyalty_ledger.created_at IS 'Timestamp when the ledger entry was written';


--
-- Name: order_item_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    product_id uuid NOT NULL,
    item_score smallint NOT NULL,
    CONSTRAINT order_item_ratings_item_score_check CHECK (((item_score >= 1) AND (item_score <= 5)))
);


ALTER TABLE public.order_item_ratings OWNER TO postgres;

--
-- Name: TABLE order_item_ratings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_item_ratings IS 'Granular ratings for specific items within a reviewed order';


--
-- Name: COLUMN order_item_ratings.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_item_ratings.id IS 'Primary key, unique identifier of the order item rating';


--
-- Name: COLUMN order_item_ratings.review_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_item_ratings.review_id IS 'Foreign key referencing the parent order review';


--
-- Name: COLUMN order_item_ratings.order_item_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_item_ratings.order_item_id IS 'Foreign key referencing the specific order item being rated';


--
-- Name: COLUMN order_item_ratings.product_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_item_ratings.product_id IS 'Foreign key referencing the product, cached here for query efficiency';


--
-- Name: COLUMN order_item_ratings.item_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_item_ratings.item_score IS 'Customer rating for the specific item, from 1 (poor) to 5 (excellent)';


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    quantity integer NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    overall_score smallint NOT NULL,
    food_quality_score smallint NOT NULL,
    speed_score smallint NOT NULL,
    written_comment character varying(500),
    would_order_again boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_reviews_food_quality_score_check CHECK (((food_quality_score >= 1) AND (food_quality_score <= 5))),
    CONSTRAINT order_reviews_overall_score_check CHECK (((overall_score >= 1) AND (overall_score <= 5))),
    CONSTRAINT order_reviews_speed_score_check CHECK (((speed_score >= 1) AND (speed_score <= 5)))
);


ALTER TABLE public.order_reviews OWNER TO postgres;

--
-- Name: TABLE order_reviews; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_reviews IS 'Customer reviews for completed orders, capturing overall experience and scores';


--
-- Name: COLUMN order_reviews.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.id IS 'Primary key, unique identifier of the review';


--
-- Name: COLUMN order_reviews.order_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.order_id IS 'Foreign key referencing the associated order';


--
-- Name: COLUMN order_reviews.customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.customer_id IS 'Foreign key referencing the customer who placed the order and wrote the review';


--
-- Name: COLUMN order_reviews.overall_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.overall_score IS 'Customer rating of overall experience, from 1 (poor) to 5 (excellent)';


--
-- Name: COLUMN order_reviews.food_quality_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.food_quality_score IS 'Customer rating of food quality, from 1 (poor) to 5 (excellent)';


--
-- Name: COLUMN order_reviews.speed_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.speed_score IS 'Customer rating of order speed/delivery, from 1 (poor) to 5 (excellent)';


--
-- Name: COLUMN order_reviews.written_comment; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.written_comment IS 'Optional free-text feedback from the customer, up to 500 characters';


--
-- Name: COLUMN order_reviews.would_order_again; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.would_order_again IS 'Boolean indicating if the customer would order from this establishment again';


--
-- Name: COLUMN order_reviews.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_reviews.created_at IS 'Timestamp when the review was created';


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    delivered_at timestamp with time zone,
    collected_at timestamp with time zone,
    server_employee_id uuid,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'delivered'::character varying, 'collected'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT orders_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: COLUMN orders.server_employee_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.server_employee_id IS 'Reference to the employee who served or processed the order';


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_price_check CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_customer_id uuid NOT NULL,
    referred_customer_id uuid NOT NULL,
    referral_bonus_paid boolean DEFAULT false NOT NULL,
    bonus_paid_at timestamp with time zone,
    bonus_order_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_no_self_referral CHECK ((referrer_customer_id <> referred_customer_id)),
    CONSTRAINT chk_referral_bonus_consistency CHECK ((((referral_bonus_paid = true) AND (bonus_paid_at IS NOT NULL)) OR ((referral_bonus_paid = false) AND (bonus_paid_at IS NULL) AND (bonus_order_id IS NULL))))
);


ALTER TABLE public.referrals OWNER TO postgres;

--
-- Name: TABLE referrals; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.referrals IS 'Tracks customer referrals and the resulting point bonuses earned upon first order';


--
-- Name: COLUMN referrals.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referrals.id IS 'Primary key, unique identifier of the referral';


--
-- Name: COLUMN referrals.referrer_customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referrals.referrer_customer_id IS 'Foreign key referencing the customer who initiated the referral';


--
-- Name: COLUMN referrals.referred_customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referrals.referred_customer_id IS 'Foreign key referencing the new customer who was referred; unique since a customer can only be referred once';


--
-- Name: COLUMN referrals.referral_bonus_paid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referrals.referral_bonus_paid IS 'Flag indicating if the referrer has received their referral bonus points';


--
-- Name: COLUMN referrals.bonus_paid_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referrals.bonus_paid_at IS 'Timestamp when the referral bonus was granted';


--
-- Name: COLUMN referrals.bonus_order_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referrals.bonus_order_id IS 'Foreign key referencing the referred customer''s first order that triggered the bonus payment';


--
-- Name: COLUMN referrals.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referrals.created_at IS 'Timestamp when the referral relation was registered';


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    version character varying(10) NOT NULL,
    filename character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schema_migrations_id_seq OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    shift_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_late boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: employee_ratings employee_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_ratings
    ADD CONSTRAINT employee_ratings_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: eotw_selections eotw_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eotw_selections
    ADD CONSTRAINT eotw_selections_pkey PRIMARY KEY (id);


--
-- Name: loyalty_accounts loyalty_accounts_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_customer_id_key UNIQUE (customer_id);


--
-- Name: loyalty_accounts loyalty_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_pkey PRIMARY KEY (id);


--
-- Name: loyalty_ledger loyalty_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledger
    ADD CONSTRAINT loyalty_ledger_pkey PRIMARY KEY (id);


--
-- Name: order_item_ratings order_item_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_ratings
    ADD CONSTRAINT order_item_ratings_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_reviews order_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT order_reviews_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_name_key UNIQUE (name);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referred_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_customer_id_key UNIQUE (referred_customer_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_version_key UNIQUE (version);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: employee_ratings uq_employee_order_rating; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_ratings
    ADD CONSTRAINT uq_employee_order_rating UNIQUE (employee_id, order_id, customer_id);


--
-- Name: eotw_selections uq_eotw_week; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eotw_selections
    ADD CONSTRAINT uq_eotw_week UNIQUE (week_start);


--
-- Name: order_reviews uq_order_review; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT uq_order_review UNIQUE (order_id, customer_id);


--
-- Name: idx_customers_referred_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_referred_by ON public.customers USING btree (referred_by);


--
-- Name: idx_employee_ratings_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_ratings_customer_id ON public.employee_ratings USING btree (customer_id);


--
-- Name: idx_employee_ratings_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_ratings_employee_id ON public.employee_ratings USING btree (employee_id);


--
-- Name: idx_employee_ratings_excluded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_ratings_excluded_by ON public.employee_ratings USING btree (excluded_by);


--
-- Name: idx_employee_ratings_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_ratings_order_id ON public.employee_ratings USING btree (order_id);


--
-- Name: idx_loyalty_ledger_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loyalty_ledger_customer_id ON public.loyalty_ledger USING btree (customer_id);


--
-- Name: idx_loyalty_ledger_issued_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loyalty_ledger_issued_by ON public.loyalty_ledger USING btree (issued_by);


--
-- Name: idx_loyalty_ledger_loyalty_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loyalty_ledger_loyalty_account_id ON public.loyalty_ledger USING btree (loyalty_account_id);


--
-- Name: idx_loyalty_ledger_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loyalty_ledger_order_id ON public.loyalty_ledger USING btree (order_id);


--
-- Name: idx_order_item_ratings_order_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_item_ratings_order_item_id ON public.order_item_ratings USING btree (order_item_id);


--
-- Name: idx_order_item_ratings_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_item_ratings_product_id ON public.order_item_ratings USING btree (product_id);


--
-- Name: idx_order_item_ratings_review_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_item_ratings_review_id ON public.order_item_ratings USING btree (review_id);


--
-- Name: idx_order_reviews_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_reviews_customer_id ON public.order_reviews USING btree (customer_id);


--
-- Name: idx_order_reviews_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_reviews_order_id ON public.order_reviews USING btree (order_id);


--
-- Name: idx_orders_server_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_server_employee_id ON public.orders USING btree (server_employee_id);


--
-- Name: idx_referrals_bonus_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referrals_bonus_order_id ON public.referrals USING btree (bonus_order_id);


--
-- Name: idx_referrals_referrer_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referrals_referrer_customer_id ON public.referrals USING btree (referrer_customer_id);


--
-- Name: customers customers_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: deliveries deliveries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: deliveries deliveries_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: employee_ratings employee_ratings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_ratings
    ADD CONSTRAINT employee_ratings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: employee_ratings employee_ratings_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_ratings
    ADD CONSTRAINT employee_ratings_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_ratings employee_ratings_excluded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_ratings
    ADD CONSTRAINT employee_ratings_excluded_by_fkey FOREIGN KEY (excluded_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: employee_ratings employee_ratings_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_ratings
    ADD CONSTRAINT employee_ratings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: eotw_selections eotw_selections_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eotw_selections
    ADD CONSTRAINT eotw_selections_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: loyalty_accounts loyalty_accounts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: loyalty_ledger loyalty_ledger_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledger
    ADD CONSTRAINT loyalty_ledger_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: loyalty_ledger loyalty_ledger_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledger
    ADD CONSTRAINT loyalty_ledger_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: loyalty_ledger loyalty_ledger_loyalty_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledger
    ADD CONSTRAINT loyalty_ledger_loyalty_account_id_fkey FOREIGN KEY (loyalty_account_id) REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE;


--
-- Name: loyalty_ledger loyalty_ledger_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledger
    ADD CONSTRAINT loyalty_ledger_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: order_item_ratings order_item_ratings_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_ratings
    ADD CONSTRAINT order_item_ratings_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: order_item_ratings order_item_ratings_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_ratings
    ADD CONSTRAINT order_item_ratings_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: order_item_ratings order_item_ratings_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_ratings
    ADD CONSTRAINT order_item_ratings_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.order_reviews(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: order_reviews order_reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT order_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: order_reviews order_reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT order_reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: orders orders_server_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_server_employee_id_fkey FOREIGN KEY (server_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: referrals referrals_bonus_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_bonus_order_id_fkey FOREIGN KEY (bonus_order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: referrals referrals_referred_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_customer_id_fkey FOREIGN KEY (referred_customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referrer_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_customer_id_fkey FOREIGN KEY (referrer_customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: shifts shifts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict G9TkjUIjFJnx2QquInjVqs5fL0K4zuRPOhdvijgQDQfmIYBcrWMZO1yA7zcbxYU

