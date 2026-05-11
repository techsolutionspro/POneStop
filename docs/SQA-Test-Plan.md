# Pharmacy One Stop — SQA Test Plan & Review Guide

**Version:** 1.0
**Date:** 29 April 2026
**Prepared By:** TSP Development Team
**Platform URL:** http://63.181.137.168
**Status:** Ready for QA Review

---

## 1. Platform Overview

Pharmacy One Stop is a UK B2B multi-tenant SaaS platform that enables community pharmacies to launch, run, and scale private clinical services with their own branded digital storefront, booking engine, payments, online ordering, and home delivery.

### Tech Stack
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **Auth:** JWT + refresh tokens, bcrypt, RBAC (10 roles)
- **Payments:** Stripe Connect (stub mode)
- **Hosting:** AWS EC2 (Amazon Linux 2023), Nginx reverse proxy, PM2

### Key Stats
- 130+ source files, 20,000+ lines of code
- 53 frontend pages, 14 API route modules, 12 backend services
- 5 middleware layers (auth, RBAC, tier enforcement, sanitisation, logging)
- 61 automated test cases

---

## 2. Test Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| Super Admin | admin@pharmacyonestop.co.uk | SuperAdmin1! | Full platform control |
| Support Agent | support@pharmacyonestop.co.uk | Support1! | Tenant support, impersonation |
| Pharmacy Owner (Basic) | owner@wellnesspharmacy.co.uk | Owner123! | Starter tier, bookings only |
| Pharmacy Owner (OTC+P) | owner@medicarepharmacy.co.uk | Owner123! | Professional, OTC + P meds |
| Pharmacy Owner (POM) | owner@quickscript.co.uk | Owner123! | Professional + DSP, prescribing |
| Prescriber (POM) | prescriber@quickscript.co.uk | Pharma123! | Prescriber queue, order review |
| Pharmacy Owner (PGD) | amir@highstreetpharmacy.co.uk | Owner123! | Enterprise, full PGD clinical |
| Prescriber (PGD) | sarah.chen@highstreetpharmacy.co.uk | Pharma123! | Clinical dashboard, eConsultation |
| Patient | james.davies@email.com | Patient123! | Patient account, bookings, orders |

---

## 3. Test Scenarios

### 3.1 Authentication & Authorization

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| A01 | Valid login | Enter valid email/password, click Sign In | Redirect to role-appropriate dashboard | Critical |
| A02 | Invalid login | Enter wrong password | Error: "Invalid credentials" | Critical |
| A03 | Empty fields | Submit login with empty fields | Form validation errors shown | High |
| A04 | Password strength | Try weak password on signup | Strength indicator shows "Weak", validation error | High |
| A05 | Self-service signup | Complete signup form, select plan | Tenant created, auto-login, redirect to onboarding | Critical |
| A06 | Duplicate email signup | Signup with existing email | Error: "Email already registered" | High |
| A07 | Logout | Click Sign Out | Redirect to login, token cleared | High |
| A08 | Session expiry | Wait 15+ minutes without activity | Token refreshes automatically via refresh token | Medium |
| A09 | Forgot password | Click Forgot Password, enter email | Success message (doesn't reveal if email exists) | High |
| A10 | RBAC - Patient blocked | Login as patient, try /admin URL | Redirect to login or forbidden | Critical |
| A11 | RBAC - Cross-tenant | Login as Pharmacy 1 owner, try Pharmacy 2 data | 403 Forbidden | Critical |
| A12 | RBAC - Super admin access | Login as super admin, access all tenants | Full access granted | Critical |

### 3.2 Pharmacy Owner — Onboarding Flow

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| B01 | Complete onboarding | Signup → Branding → Branch → Services → Fulfilment → Payments → Team → Go Live | Tenant status: ACTIVE, redirect to admin dashboard | Critical |
| B02 | Skip steps | Click Skip on optional steps | Can proceed, Go Live shows incomplete items | Medium |
| B03 | Add branch | Fill branch form, save | Branch created, visible in branches list | High |
| B04 | Activate service | Select PGD, set price, activate | Service visible on storefront | High |
| B05 | Invite staff | Fill invite form with email + role | Staff user created, shown in team list | High |
| B06 | Go Live | Click Go Live on final step | Status changes to ACTIVE, full admin available | Critical |

### 3.3 Admin Dashboard

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| C01 | Dashboard loads | Login as owner | Stats cards, bookings, orders, activity feed visible | Critical |
| C02 | Stats accuracy | Compare dashboard stats with actual data | Numbers match | High |
| C03 | Quick actions | Click each quick action card | Navigates to correct page | Medium |
| C04 | Getting started | Login as new pharmacy (< 5 bookings) | Getting started checklist shown | Medium |

### 3.4 Services Management

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| D01 | List services | Navigate to /admin/services | All active services displayed | High |
| D02 | Add service | Click Add Service, fill form, save | Service created, visible in list | High |
| D03 | Deactivate service | Click Deactivate on a service | Service hidden from storefront | High |
| D04 | Service categories | Check service cards | Category label shown (OTC, P, POM, PGD, Basic) | Medium |
| D05 | Tier limit | On Starter plan, try to add 21st service | Error: "Your Starter plan allows up to 20 services" | High |

### 3.5 Bookings

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| E01 | List bookings | Navigate to /admin/bookings | Bookings for selected date shown | High |
| E02 | Date filter | Change date | Bookings update for selected date | High |
| E03 | Status filter | Filter by status | Only matching bookings shown | Medium |
| E04 | Check in | Click Check In on confirmed booking | Status changes to CHECKED_IN | High |
| E05 | Complete booking | Progress: Check In → Start → Complete | Status changes through each stage | High |
| E06 | Cancel booking | Click Cancel on pending booking | Status: CANCELLED | High |
| E07 | Export CSV | Click Export CSV | CSV file downloaded with correct data | Medium |

### 3.6 Online Orders

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| F01 | List orders | Navigate to /admin/orders | All orders with status badges | High |
| F02 | Status filter tabs | Click each status tab | Orders filtered correctly | Medium |
| F03 | Order detail | Click View on an order | Full order detail with questionnaire, IDV, consent | High |
| F04 | Export CSV | Click Export CSV | CSV downloaded | Medium |
| F05 | SLA indicator | Check orders approaching deadline | Yellow/red SLA timer shown | Medium |

### 3.7 Prescriber Queue

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| G01 | Queue loads | Login as prescriber, navigate to queue | Awaiting review orders listed | Critical |
| G02 | Select order | Click an order in queue | Detail panel shows patient info, questionnaire, IDV, consent | Critical |
| G03 | Approve order | Click Approve & Generate Rx | Status: APPROVED, order removed from queue | Critical |
| G04 | Reject order | Enter clinical reason, click Reject | Status: REJECTED, auto-refund note | Critical |
| G05 | Query patient | Click Query Patient | Status: QUERIED, message prompt shown | High |
| G06 | Escalate | Click Escalate | Notes updated with escalation | Medium |
| G07 | SLA timer | Check timer on each order | Correct time remaining shown, red if breaching | High |

### 3.8 Patient Storefront

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| H01 | Homepage loads | Visit /pharmacy/high-street-pharmacy | Pharmacy name, services, trust bar visible | Critical |
| H02 | Service categories | Check service cards | Correct category labels (OTC, P Med, Clinical, Prescription) | High |
| H03 | Search services | Type in search box | Services filtered by name | Medium |
| H04 | Category filter | Select a category dropdown | Only matching services shown | Medium |
| H05 | Fulfilment filter | Filter by Online Delivery | Only online-available services shown | Medium |
| H06 | CTA buttons | Check each service card | Correct CTA: "Book Appointment", "Buy Now", "Order & Deliver" | High |
| H07 | Trust bar | Check top of page | GPhC, encryption, pharmacist badges visible | Medium |
| H08 | Mobile layout | Resize to mobile width | Responsive layout, floating CTA bar visible | High |
| H09 | Guest checkout | Click Book without login | Guest/Login/Register options shown | Medium |

### 3.9 Booking Flow (Patient)

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| I01 | 5-step flow | Complete all 5 steps | Booking confirmed with reference number | Critical |
| I02 | Step progress | Check progress bar each step | Correct step highlighted | Medium |
| I03 | Date selection | Pick a date | Available time slots shown | High |
| I04 | Time slot selection | Pick a time | Slot highlighted, Continue enabled | High |
| I05 | Questionnaire | Answer all questions | Answers saved, Continue enabled | High |
| I06 | Consent | Check required consent boxes | Payment button enabled only when all required consents checked | Critical |
| I07 | Back navigation | Click Back on each step | Previous step shown with data preserved | Medium |

### 3.10 Online Order Flow (Patient)

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| J01 | 5-step flow | Complete: Indication → Questionnaire → IDV → Consent & Pay → Tracking | Order placed with reference | Critical |
| J02 | BMI calculation | Enter height + weight | BMI auto-calculated | Medium |
| J03 | ID verification | Upload placeholder | IDV step completed | High |
| J04 | No-return warning | Check consent step | Warning about POM non-return clearly displayed | Critical |
| J05 | Order tracking | Visit /track/[reference] | Timeline with status shown | High |

### 3.11 Patient Account

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| K01 | Account overview | Login as patient, visit /account | Welcome banner, quick actions, health summary | High |
| K02 | View bookings | Navigate to /account/bookings | Booking history shown | High |
| K03 | View orders | Navigate to /account/orders | Order history with track links | High |
| K04 | Subscriptions | Navigate to /account/subscriptions | Active subscriptions with pause/cancel | Medium |
| K05 | Edit profile | Navigate to /account/profile, edit fields | Profile updated | High |
| K06 | GDPR export | Click Export My Data | JSON data downloaded | High |
| K07 | GDPR delete | Click Delete My Account, type DELETE | Account anonymised | High |

### 3.12 Super Admin

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| L01 | Platform dashboard | Login as super admin | Stats, tenant list, system health, activity | Critical |
| L02 | Tenant list | Navigate to /super-admin/tenants | All tenants with tier, status, DSP | High |
| L03 | Tenant filters | Filter by status/tier/search | Correct results | Medium |
| L04 | Onboard tenant | Click Onboard Tenant, fill form | Tenant + owner created | High |
| L05 | PGD library | Navigate to /super-admin/pgds | All PGDs with status, workflow | High |
| L06 | Publish PGD | Create draft → Approve → Publish | PGD status: PUBLISHED | High |
| L07 | DSP register | Navigate to /super-admin/dsp-register | Verified/pending DSP tenants | High |
| L08 | Verify DSP | Click Verify on pending tenant | DSP status: VERIFIED | High |
| L09 | Audit logs | Navigate to /super-admin/audit | Logs with user, action, resource, timestamp | High |
| L10 | Create support agent | Navigate to /super-admin/team, create user | New platform user with SUPPORT_AGENT role | Medium |
| L11 | System monitoring | Navigate to /super-admin/monitoring | Service health, SLAs, incidents | Medium |
| L12 | Tier management | Navigate to /super-admin/tiers | Feature comparison table, usage charges | Medium |

### 3.13 Website Builder

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| M01 | Builder loads | Navigate to /admin/website | Block-based editor with preview | Medium |
| M02 | Add block | Click Add Block, select type | Block added to canvas | Medium |
| M03 | Edit block | Click Edit on a block | Editor modal with content fields | Medium |
| M04 | Reorder blocks | Click up/down arrows | Block order changes | Medium |
| M05 | Delete block | Click trash icon on block | Block removed | Medium |
| M06 | Template | Select a template | Blocks replaced with template | Medium |
| M07 | Preview toggle | Click Preview/Edit | Toggle between preview and edit mode | Low |

### 3.14 Legal Pages

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| N01 | Privacy policy | Visit /privacy | Full policy renders, all sections present | High |
| N02 | Terms of service | Visit /terms | Full terms render | High |
| N03 | Cookie policy | Visit /cookies | Cookie tables render correctly | High |
| N04 | Complaints | Visit /complaints | Procedure renders with escalation paths | Medium |
| N05 | GDPR rights | Visit /gdpr | 8 rights cards + processing table | High |
| N06 | Cookie banner | First visit (clear localStorage) | Banner appears after 1.5s | High |
| N07 | Accept cookies | Click Accept All | Banner dismissed, cookie_consent=all in localStorage | High |
| N08 | Essential only | Click Essential Only | Banner dismissed, cookie_consent=essential | High |

### 3.15 Security

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| S01 | XSS prevention | Enter `<script>alert(1)</script>` in text fields | Tags stripped, no script execution | Critical |
| S02 | Rate limiting | Send 25 login requests rapidly | "Too many requests" after 20 | High |
| S03 | JWT expiry | Use expired token | 401 Unauthorized, auto-refresh attempted | High |
| S04 | Password hashing | Check DB directly | Passwords stored as bcrypt hashes, never plain text | Critical |
| S05 | SQL injection | Enter `'; DROP TABLE users;--` in search | No error, input sanitised | Critical |
| S06 | CORS | Request API from different origin | Blocked by CORS policy | High |
| S07 | Helmet headers | Check response headers | X-Frame-Options, X-Content-Type-Options present | Medium |
| S08 | MFA setup | Setup MFA from profile | QR code/secret generated | Medium |
| S09 | Audit logging | Perform actions, check audit logs | All actions logged with user, timestamp, resource | High |

### 3.16 Responsive Design

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| R01 | Mobile landing page | View / on 375px width | All sections stack, readable, CTAs accessible | High |
| R02 | Mobile login | View /login on mobile | Form centered, usable | High |
| R03 | Mobile admin | View /admin on mobile | Hamburger menu, sidebar as overlay | High |
| R04 | Mobile storefront | View storefront on mobile | Services stack, floating CTA bar | High |
| R05 | Tablet | View on 768px width | Two-column layouts where appropriate | Medium |
| R06 | Large desktop | View on 1920px width | Content centered, max-width respected | Low |

### 3.17 API Endpoints

| # | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| P01 | Health check | GET /api/health | 200 OK, {"success": true} | Critical |
| P02 | Unauthenticated access | GET /api/services (no token) | 401 Unauthorized | Critical |
| P03 | Packages endpoint | GET /api/packages | Public, returns active packages | High |
| P04 | Storefront endpoint | GET /api/services/storefront/[slug] | Public, returns pharmacy + services | High |
| P05 | Order tracking | GET /api/orders/track/[ref] | Public, returns order status | High |
| P06 | Pagination | GET /api/tenants?page=1&limit=5 | Paginated response with meta | Medium |
| P07 | Search | GET /api/tenants?search=Quick | Filtered results | Medium |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load: < 3 seconds on 4G connection
- API response: < 500ms for 95th percentile
- Concurrent users: Should handle 100+ without degradation

### 4.2 Accessibility (WCAG 2.1 AA)
- Keyboard navigation on all interactive elements
- Focus rings visible on all focusable elements
- Color contrast: minimum 4.5:1 for body text
- Alt text on images
- Aria labels on custom components
- Screen reader compatible navigation

### 4.3 Browser Compatibility
- Chrome 90+ ✓
- Firefox 90+ ✓
- Safari 15+ ✓
- Edge 90+ ✓
- Mobile Safari (iOS 15+) ✓
- Chrome Mobile (Android 10+) ✓

### 4.4 Data Integrity
- Multi-tenant isolation: no data leakage between tenants
- Immutable audit trail: no records can be modified or deleted
- Clinical records: append-only, versioned
- Consistent pagination and filtering

---

## 5. Known Limitations (Current Release)

1. **Stripe payments:** Running in stub mode — payment buttons work but no real charges
2. **Email/SMS:** Logged to console in development — production requires Postmark/Twilio config
3. **File uploads:** Local filesystem in dev — production requires S3
4. **ID verification:** Placeholder UI — production requires Onfido/Yoti integration
5. **Video consultations:** UI built but Twilio Video not connected
6. **Domain reselling:** UI built but registrar API not connected
7. **Charts:** Reports page uses mock data — needs real analytics queries

---

## 6. Environment Information

| Item | Value |
|---|---|
| Production URL | http://63.181.137.168 |
| API Health | http://63.181.137.168/api/health |
| Node.js | v20.x |
| PostgreSQL | 16 |
| OS | Amazon Linux 2023 |
| Process Manager | PM2 |
| Reverse Proxy | Nginx 1.28 |
| Repository | github.com/techsolutionspro/POneStop |

---

## 7. Defect Reporting

Report issues to the development team with:
- **URL** where the issue occurred
- **Steps to reproduce** (numbered)
- **Expected result** vs **Actual result**
- **Screenshot** or screen recording
- **Browser** and device info
- **Test account used**
- **Severity:** Critical / High / Medium / Low

---

*Document prepared by TSP Development Team. For questions, contact the project lead.*
