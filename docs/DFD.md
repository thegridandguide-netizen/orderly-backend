# Data Flow Diagrams (DFD)
## Event & Venue Booking Platform

---

## Level 0 — Context Diagram

```text
                 +--------------------+
   Customer ---> |                    | <--- Admin
                 |  Booking Platform  |
   Vendor   ---> |   (TanStack App)   | ---> Supabase DB
                 |                    |
                 +--------------------+
                          |
                          v
                  Email / Auth (Supabase)
```

**External entities:** Customer, Vendor, Admin, Supabase Auth, Supabase Postgres.

---

## Level 1 — Major Processes

```text
   +----------+     credentials     +---------------+
   | Customer | ------------------> | 1.0 Auth      |
   +----------+                     +---------------+
        |                                  |
        | browse / search                  | session
        v                                  v
   +---------------+   queries     +-----------------+
   | 2.0 Catalogue | <-----------> |  D1: venues     |
   |    Browse     |               |  D2: listings   |
   +---------------+               |  D3: categories |
        |                          +-----------------+
        | add to cart
        v
   +---------------+               +-----------------+
   | 3.0 Cart      | <-----------> | D4: cart_items  |
   +---------------+               +-----------------+
        | checkout
        v
   +---------------+   compute     +-----------------+
   | 4.0 Pricing   | <-----------> | D5: pricing_rules
   |    Engine     |               +-----------------+
   +---------------+
        |
        v
   +---------------+               +-----------------+
   | 5.0 Booking   | ------------> | D6: bookings    |
   |    Create     |               | D7: booking_items
   +---------------+               +-----------------+
        |
        | submit payment proof
        v
   +---------------+               +-----------------+
   | 6.0 Payment   | ------------> | D8: payment_    |
   |  Verification |               |     proofs      |
   +---------------+               | D9: transactions|
        ^                          +-----------------+
        | approve / reject
        |
   +----------+
   |  Admin   |
   +----------+
```

---

## Level 2 — Process 6.0 (Payment Verification)

```text
                  +-------------------------+
   Customer ----> | 6.1 Submit Payment Proof |
                  |  - reference             |
                  |  - screenshot_url        |
                  |  - amount                |
                  +-------------------------+
                              |
                              v
                  +-------------------------+
                  |  D8: payment_proofs     |  status='pending'
                  +-------------------------+
                              |
                              v
                  +-------------------------+
   Admin ------>  | 6.2 Review Proof        |
                  +-------------------------+
                       |             |
                 approve             reject
                       |             |
                       v             v
              +----------------+  +-----------------+
              | 6.3 Insert     |  | 6.4 Mark proof  |
              | transaction +  |  | rejected        |
              | update booking |  +-----------------+
              +----------------+
                       |
                       v
              +----------------------+
              | D6: bookings         |
              | amount_paid += amt   |
              | status = confirmed   |
              |       or completed   |
              +----------------------+
```

---

## Level 2 — Process 4.0 (Pricing Engine)

```text
   cart items ---> [ subtotal ] ---+
                                   |
   pricing_rules (active) -------> | apply rules in order
                                   |   - *_percent: value % of subtotal
                                   |   - *_flat:    fixed value
                                   v
                          +-------------------+
                          | breakdown[]       |
                          | tax_total         |
                          | fee_total         |
                          | discount_total    |
                          | total_amount      |
                          +-------------------+
```

---

## Data Stores Summary

| ID | Store | Owner / RLS |
|----|-------|-------------|
| D1 | venues | public read, admin write |
| D2 | vendor_listings | public read (active), admin write |
| D3 | event_categories | public read, admin write |
| D4 | cart_items | self-only |
| D5 | pricing_rules | public read (active), admin write |
| D6 | bookings | self + admin + vendor-of-item |
| D7 | booking_items | inherits from D6 |
| D8 | payment_proofs | self + admin |
| D9 | transactions | self + admin |
