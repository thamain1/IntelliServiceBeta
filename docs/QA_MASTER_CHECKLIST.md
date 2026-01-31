# IntelliService - Master QA Testing Checklist

**Application:** IntelliService Field Service Management
**Version:** Beta
**Last Updated:** January 2026

---

## Table of Contents

1. [Pre-Test Setup](#pre-test-setup)
2. [Authentication & Authorization](#1-authentication--authorization)
3. [Dashboard](#2-dashboard)
4. [Customer Management](#3-customer-management)
5. [Equipment Management](#4-equipment-management)
6. [Ticket Management](#5-ticket-management)
7. [Dispatch & Scheduling](#6-dispatch--scheduling)
8. [Maps & Route Optimization](#7-maps--route-optimization)
9. [Time Clock & Time Tracking](#8-time-clock--time-tracking)
10. [Technician Mobile View](#9-technician-mobile-view)
11. [Estimates](#10-estimates)
12. [Invoicing](#11-invoicing)
13. [Projects](#12-projects)
14. [Parts & Inventory](#13-parts--inventory)
15. [Vendor Management](#14-vendor-management)
16. [Service Contracts](#15-service-contracts)
17. [Accounting](#16-accounting)
18. [Reports & BI Analytics](#17-reports--bi-analytics)
19. [Data Import](#18-data-import)
20. [Settings & Administration](#19-settings--administration)
21. [Notifications & Alerts](#20-notifications--alerts)
22. [Cross-Browser & Responsive Testing](#21-cross-browser--responsive-testing)
23. [Performance Testing](#22-performance-testing)
24. [Security Testing](#23-security-testing)

---

## Pre-Test Setup

### Test Accounts Required

| Role | Username | Purpose |
|------|----------|---------|
| Admin | admin@test.com | Full system access |
| Dispatcher | dispatcher@test.com | Dispatch and scheduling |
| Technician | tech1@test.com | Field technician view |
| Technician 2 | tech2@test.com | Multi-tech scenarios |
| Accounting | accounting@test.com | Financial modules |
| Read-Only | readonly@test.com | View-only access |

### Test Data Required

- [ ] Minimum 10 customer records with varied data
- [ ] Minimum 5 equipment records linked to customers
- [ ] Minimum 20 tickets in various statuses
- [ ] Minimum 3 active projects
- [ ] Minimum 50 parts/inventory items
- [ ] Minimum 5 vendor records
- [ ] Minimum 3 service contracts
- [ ] Chart of accounts populated
- [ ] Sample invoices in various statuses

### Environment Checklist

- [ ] Test environment URL confirmed
- [ ] Database backup taken before testing
- [ ] Supabase dashboard access available
- [ ] Browser developer tools accessible
- [ ] Mobile devices or emulators ready
- [ ] Test files prepared (CSV imports, images, etc.)

---

## 1. Authentication & Authorization

### 1.1 Login

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| AUTH-001 | Valid login | Enter valid credentials, click Login | User logged in, redirected to Dashboard | |
| AUTH-002 | Invalid password | Enter valid email, wrong password | Error message displayed | |
| AUTH-003 | Invalid email | Enter non-existent email | Error message displayed | |
| AUTH-004 | Empty fields | Click Login with empty fields | Validation error shown | |
| AUTH-005 | Password visibility toggle | Click eye icon in password field | Password shown/hidden | |
| AUTH-006 | Remember session | Login, close browser, reopen | User still logged in | |
| AUTH-007 | Session timeout | Leave idle for extended period | Session expires appropriately | |

### 1.2 Logout

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| AUTH-008 | Logout | Click user menu > Logout | Redirected to login page | |
| AUTH-009 | Post-logout access | After logout, try accessing protected URL | Redirected to login | |

### 1.3 Password Reset

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| AUTH-010 | Request reset | Click "Forgot Password", enter email | Reset email sent | |
| AUTH-011 | Reset with valid link | Click link in email, set new password | Password updated | |
| AUTH-012 | Reset with expired link | Use old reset link | Error message shown | |

### 1.4 Role-Based Access

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| AUTH-013 | Admin access | Login as admin | All menu items visible | |
| AUTH-014 | Dispatcher access | Login as dispatcher | Dispatch, tickets, customers visible | |
| AUTH-015 | Technician access | Login as technician | Limited to technician view | |
| AUTH-016 | Accounting access | Login as accounting | Financial modules accessible | |
| AUTH-017 | Unauthorized access | Tech tries to access /settings | Access denied or redirected | |

---

## 2. Dashboard

### 2.1 Dashboard Display

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| DASH-001 | Dashboard loads | Navigate to Dashboard | All widgets load without error | |
| DASH-002 | Ticket stats card | View ticket statistics | Shows correct open/pending/completed counts | |
| DASH-003 | Revenue card | View revenue widget | Shows current period revenue | |
| DASH-004 | Today's schedule | View today's appointments | Shows tickets scheduled for today | |
| DASH-005 | Recent activity | View activity feed | Shows recent system activity | |
| DASH-006 | Overdue tickets alert | Have overdue tickets | Alert/count displayed | |
| DASH-007 | Quick actions | Click quick action buttons | Navigate to correct pages | |

### 2.2 Dashboard Interactivity

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| DASH-008 | Click ticket stat | Click on ticket count | Navigates to filtered ticket list | |
| DASH-009 | Click scheduled item | Click appointment | Opens ticket details | |
| DASH-010 | Refresh dashboard | Click refresh or reload page | Data updates | |

---

## 3. Customer Management

### 3.1 Customer List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUST-001 | View customer list | Navigate to Customers | List displays with pagination | |
| CUST-002 | Search customers | Enter search term | Results filtered correctly | |
| CUST-003 | Filter by status | Select status filter | Only matching customers shown | |
| CUST-004 | Sort customers | Click column header | List sorted ascending/descending | |
| CUST-005 | Pagination | Click page numbers | Correct page displayed | |

### 3.2 Create Customer

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUST-006 | Open new customer form | Click "New Customer" | Modal/form opens | |
| CUST-007 | Create with required fields | Fill required fields, save | Customer created | |
| CUST-008 | Create with all fields | Fill all fields, save | Customer created with all data | |
| CUST-009 | Validation - missing required | Leave required fields empty | Validation errors shown | |
| CUST-010 | Validation - invalid email | Enter invalid email format | Email validation error | |
| CUST-011 | Validation - invalid phone | Enter invalid phone | Phone validation error | |
| CUST-012 | Duplicate check | Create customer with existing email | Warning or error shown | |

### 3.3 Edit Customer

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUST-013 | Open edit form | Click Edit on customer | Form opens with data | |
| CUST-014 | Edit and save | Modify fields, save | Changes saved correctly | |
| CUST-015 | Cancel edit | Modify fields, cancel | Changes discarded | |
| CUST-016 | Edit validation | Clear required field, save | Validation error shown | |

### 3.4 Customer Details

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUST-017 | View customer details | Click on customer | Detail view opens | |
| CUST-018 | View service history | Check service history tab | Past tickets displayed | |
| CUST-019 | View equipment | Check equipment tab | Customer's equipment shown | |
| CUST-020 | View invoices | Check invoices tab | Customer's invoices shown | |
| CUST-021 | View contracts | Check contracts tab | Active contracts displayed | |
| CUST-022 | Create ticket from customer | Click "New Ticket" | Ticket form with customer pre-filled | |
| CUST-023 | View on map | Click map/location link | Map shows customer location | |

### 3.5 Customer Communication

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUST-024 | Call customer | Click phone number | Phone dialer opens (mobile) | |
| CUST-025 | Email customer | Click email address | Email client opens | |
| CUST-026 | Add note | Add note to customer | Note saved and displayed | |

### 3.6 Delete Customer

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CUST-027 | Delete customer | Click delete, confirm | Customer removed | |
| CUST-028 | Delete with linked data | Delete customer with tickets | Appropriate warning/handling | |
| CUST-029 | Cancel delete | Click delete, cancel | Customer not deleted | |

---

## 4. Equipment Management

### 4.1 Equipment List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EQUIP-001 | View equipment list | Navigate to Equipment | List displays correctly | |
| EQUIP-002 | Search equipment | Enter search term | Results filtered | |
| EQUIP-003 | Filter by customer | Select customer filter | Only that customer's equipment | |
| EQUIP-004 | Filter by type | Select equipment type | Filtered by type | |
| EQUIP-005 | Filter by status | Select status | Filtered by status | |

### 4.2 Create Equipment

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EQUIP-006 | Open new equipment form | Click "New Equipment" | Form opens | |
| EQUIP-007 | Create with required fields | Fill required, save | Equipment created | |
| EQUIP-008 | Assign to customer | Select customer | Equipment linked to customer | |
| EQUIP-009 | Upload equipment photo | Add photo | Photo saved and displayed | |
| EQUIP-010 | Enter serial/model numbers | Add serial, model | Saved correctly | |
| EQUIP-011 | Set warranty info | Enter warranty dates | Warranty tracked | |

### 4.3 Equipment Details

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EQUIP-012 | View equipment details | Click equipment | Details displayed | |
| EQUIP-013 | View service history | Check history tab | Past services shown | |
| EQUIP-014 | View maintenance schedule | Check maintenance | Scheduled maintenance shown | |
| EQUIP-015 | Create ticket for equipment | Click "New Ticket" | Ticket form pre-filled | |
| EQUIP-016 | View linked customer | Click customer link | Customer details open | |

### 4.4 Equipment Maintenance

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EQUIP-017 | Schedule maintenance | Add maintenance schedule | Schedule saved | |
| EQUIP-018 | Maintenance reminder | Equipment due for maintenance | Alert/indicator shown | |
| EQUIP-019 | Log maintenance | Record maintenance performed | History updated | |

---

## 5. Ticket Management

### 5.1 Ticket List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TKT-001 | View ticket list | Navigate to Tickets | List displays correctly | |
| TKT-002 | Search tickets | Enter search term | Results filtered | |
| TKT-003 | Filter by status | Select status | Filtered correctly | |
| TKT-004 | Filter by priority | Select priority | Filtered correctly | |
| TKT-005 | Filter by technician | Select technician | Filtered correctly | |
| TKT-006 | Filter by date range | Select date range | Filtered correctly | |
| TKT-007 | Filter by customer | Select customer | Filtered correctly | |
| TKT-008 | Multiple filters | Apply multiple filters | Combined filtering works | |
| TKT-009 | Clear filters | Click clear filters | All tickets shown | |
| TKT-010 | Sort by column | Click column header | Sorted correctly | |

### 5.2 Create Ticket

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TKT-011 | Open new ticket form | Click "New Ticket" | Form opens | |
| TKT-012 | Create basic ticket | Fill required fields, save | Ticket created with number | |
| TKT-013 | Create with customer | Select customer | Customer linked | |
| TKT-014 | Create with equipment | Select equipment | Equipment linked | |
| TKT-015 | Set priority | Select priority level | Priority saved | |
| TKT-016 | Set scheduled date | Pick date/time | Schedule saved | |
| TKT-017 | Assign technician | Select technician | Technician assigned | |
| TKT-018 | Add description | Enter detailed description | Description saved | |
| TKT-019 | Estimate hours | Enter estimated hours | Hours saved | |
| TKT-020 | Validation errors | Leave required empty | Errors displayed | |

### 5.3 Ticket Details

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TKT-021 | View ticket details | Click ticket | Details modal opens | |
| TKT-022 | View customer info | Check customer section | Customer data shown | |
| TKT-023 | View equipment info | Check equipment section | Equipment data shown | |
| TKT-024 | View update history | Check updates tab | All updates shown | |
| TKT-025 | View time logs | Check time tab | Time entries shown | |
| TKT-026 | View parts used | Check parts tab | Parts listed | |
| TKT-027 | View photos | Check photos tab | Photos displayed | |

### 5.4 Ticket Updates

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TKT-028 | Add update | Enter update, save | Update added to history | |
| TKT-029 | Add update with photo | Upload photo with update | Photo saved | |
| TKT-030 | Update status | Change ticket status | Status updated | |
| TKT-031 | Update priority | Change priority | Priority updated | |
| TKT-032 | Reassign technician | Change assigned tech | Assignment updated | |
| TKT-033 | Reschedule | Change scheduled date | Schedule updated | |

### 5.5 Ticket Workflow

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TKT-034 | Status: New → Assigned | Assign technician | Status changes to assigned | |
| TKT-035 | Status: Assigned → In Progress | Tech starts work | Status changes | |
| TKT-036 | Status: In Progress → Completed | Tech completes work | Status changes | |
| TKT-037 | Status: Completed → Invoiced | Create invoice | Status changes | |
| TKT-038 | Put ticket on hold | Click hold, select reason | Hold status applied | |
| TKT-039 | Hold for parts | Select "Waiting for Parts" | Hold type saved | |
| TKT-040 | Resume from hold | Remove hold | Ticket resumes | |
| TKT-041 | Cancel ticket | Cancel ticket | Status = cancelled | |

### 5.6 Ticket Parts

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TKT-042 | Add part to ticket | Select part, quantity | Part added | |
| TKT-043 | Remove part | Remove part from ticket | Part removed | |
| TKT-044 | Part from inventory | Add inventory part | Inventory decremented | |
| TKT-045 | Part not in inventory | Add non-inventory part | Manual entry allowed | |

### 5.7 Ticket Time

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TKT-046 | Log time manually | Enter time entry | Time logged | |
| TKT-047 | Start timer | Click start timer | Timer begins | |
| TKT-048 | Stop timer | Click stop timer | Time entry created | |
| TKT-049 | Edit time entry | Modify time entry | Changes saved | |
| TKT-050 | Delete time entry | Remove time entry | Entry deleted | |

---

## 6. Dispatch & Scheduling

### 6.1 Dispatch Board

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| DISP-001 | View dispatch board | Navigate to Dispatch | Board displays | |
| DISP-002 | View by day | Select day view | Single day shown | |
| DISP-003 | View by week | Select week view | Week shown | |
| DISP-004 | Navigate dates | Click next/prev | Dates change | |
| DISP-005 | View unassigned tickets | Check unassigned section | Unassigned tickets listed | |
| DISP-006 | View technician schedules | Check tech columns | Each tech's schedule shown | |

### 6.2 Scheduling

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| DISP-007 | Drag ticket to tech | Drag unassigned to tech column | Ticket assigned | |
| DISP-008 | Drag to reschedule | Drag ticket to new time | Schedule updated | |
| DISP-009 | Drag to different day | Drag to different date | Date updated | |
| DISP-010 | Double-book warning | Schedule overlapping | Warning shown | |
| DISP-011 | Quick assign | Right-click, assign | Quick assignment works | |
| DISP-012 | View ticket from board | Click scheduled ticket | Ticket details open | |

### 6.3 Technician Management

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| DISP-013 | View tech availability | Check tech status | Available/busy shown | |
| DISP-014 | View tech workload | Check ticket count | Count displayed | |
| DISP-015 | Filter by tech | Select technician filter | Only that tech shown | |
| DISP-016 | View tech location | Check location indicator | Location shown if sharing | |

---

## 7. Maps & Route Optimization

### 7.1 Map View

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| MAP-001 | Load map view | Navigate to Map/Dispatch Map | Map loads | |
| MAP-002 | View customer locations | Enable customer layer | Customer pins shown | |
| MAP-003 | View technician locations | Enable tech layer | Tech pins shown (if sharing) | |
| MAP-004 | View ticket locations | Enable ticket layer | Ticket pins shown | |
| MAP-005 | Click location pin | Click on map pin | Details popup shown | |
| MAP-006 | Zoom in/out | Use zoom controls | Map zooms | |
| MAP-007 | Pan map | Drag map | Map pans | |
| MAP-008 | Search location | Enter address | Map centers on location | |

### 7.2 Route Optimization

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| MAP-009 | Generate route | Select tech, click optimize | Route calculated | |
| MAP-010 | View route order | Check route list | Stops listed in order | |
| MAP-011 | View route on map | Check map | Route line displayed | |
| MAP-012 | Get directions | Click directions | External maps opens | |
| MAP-013 | No tickets warning | Optimize with no tickets | Appropriate message | |
| MAP-014 | No location warning | Tickets without lat/long | Warning shown | |

### 7.3 Technician Location Tracking

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| MAP-015 | View tech on map | Tech sharing location | Pin shows on map | |
| MAP-016 | Location updates | Tech moves | Pin updates (15 min) | |
| MAP-017 | Locate on Map button | Click locate for tech | Map centers on tech | |
| MAP-018 | No location available | Tech not sharing | Appropriate indicator | |

---

## 8. Time Clock & Time Tracking

### 8.1 Clock In/Out

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TIME-001 | View time clock | Navigate to Time Clock | Clock interface shown | |
| TIME-002 | Clock in | Click Clock In | Timer starts, log created | |
| TIME-003 | Clock in duplicate | Try to clock in twice | Warning shown | |
| TIME-004 | View elapsed time | While clocked in | Timer counting up | |
| TIME-005 | Clock out | Click Clock Out | Timer stops, hours calculated | |
| TIME-006 | Clock out without clock in | Try to clock out | Appropriate handling | |

### 8.2 Location Sharing (Time Clock)

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TIME-007 | Location starts on clock in | Clock in | Location permission requested | |
| TIME-008 | Location status shown | While clocked in | Green status indicator | |
| TIME-009 | Location stops on clock out | Clock out | Location sharing stops | |
| TIME-010 | Auto-resume location | Refresh page while clocked in | Location resumes | |
| TIME-011 | Location error handling | Deny permission | Red error status shown | |
| TIME-012 | 15-minute updates | Wait 15 minutes | New location entry in DB | |

### 8.3 Time Log Management

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TIME-013 | View time logs | Check log list | Today's logs shown | |
| TIME-014 | Filter by date | Select different date | Logs for that date | |
| TIME-015 | View all users (admin) | Toggle show all users | All users' logs shown | |
| TIME-016 | Log details | View log entry | Clock in/out times shown | |
| TIME-017 | Daily total | Check total | Hours summed correctly | |

### 8.4 Time Approval (Admin/Dispatcher)

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TIME-018 | Approve time log | Click approve | Status = approved | |
| TIME-019 | Reject time log | Click reject | Status = rejected | |
| TIME-020 | Edit time log | Modify times | Changes saved | |

---

## 9. Technician Mobile View

### 9.1 My Tickets

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TECH-001 | View my tickets | Login as tech | Assigned tickets shown | |
| TECH-002 | Filter by date | Select date | Filtered by scheduled date | |
| TECH-003 | View ticket details | Tap ticket | Details expand | |
| TECH-004 | View customer info | Check customer section | Name, address, phone shown | |
| TECH-005 | Call customer | Tap phone number | Phone dialer opens | |
| TECH-006 | Navigate to customer | Tap navigation | Maps app opens | |

### 9.2 Accept/Start Work

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TECH-007 | Accept ticket | Tap Accept | Ticket status = accepted | |
| TECH-008 | Start work | Tap Start Work | Timer starts, status = in_progress | |
| TECH-009 | Location ping on start | Start work | Immediate location sent | |
| TECH-010 | View active timer | While working | Timer displayed at top | |
| TECH-011 | View ticket button | Tap View Ticket | Correct ticket opens | |

### 9.3 On-Site Work

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TECH-012 | Add update | Enter update text, save | Update posted | |
| TECH-013 | Add photo | Take/upload photo | Photo attached | |
| TECH-014 | Add part used | Select part, quantity | Part added to ticket | |
| TECH-015 | View parts used | Check parts section | All parts listed | |
| TECH-016 | Progress indicator | View progress bar | Correct percentage shown | |

### 9.4 Complete Work

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TECH-017 | End work | Tap End Work | Timer stops | |
| TECH-018 | Mark complete | Tap Complete Ticket | Status = completed | |
| TECH-019 | Get signature | Capture customer signature | Signature saved | |
| TECH-020 | View completed | Check completed tab | Ticket in completed list | |

### 9.5 Ticket Holds

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TECH-021 | Hold for parts | Tap Hold > Parts needed | Hold status applied | |
| TECH-022 | Report issue | Tap Report Issue | Issue form opens | |
| TECH-023 | View hold status | Check ticket | Hold indicator shown | |
| TECH-024 | Resume from hold | Remove hold | Normal status resumes | |

### 9.6 Truck Inventory

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| TECH-025 | View truck inventory | Check inventory section | Parts on truck shown | |
| TECH-026 | Use part from truck | Add part to ticket | Truck inventory decremented | |
| TECH-027 | Request restock | Request parts | Request submitted | |

---

## 10. Estimates

### 10.1 Estimate List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EST-001 | View estimate list | Navigate to Estimates | List displayed | |
| EST-002 | Search estimates | Enter search term | Results filtered | |
| EST-003 | Filter by status | Select status | Filtered correctly | |
| EST-004 | Filter by customer | Select customer | Filtered correctly | |

### 10.2 Create Estimate

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EST-005 | Open new estimate | Click New Estimate | Form opens | |
| EST-006 | Select customer | Choose customer | Customer linked | |
| EST-007 | Add line item | Enter description, amount | Item added | |
| EST-008 | Add multiple items | Add several items | All items shown | |
| EST-009 | Calculate totals | Add items | Subtotal, tax, total correct | |
| EST-010 | Add discount | Apply discount | Total adjusted | |
| EST-011 | Save as draft | Save without sending | Status = draft | |
| EST-012 | Add notes | Enter estimate notes | Notes saved | |

### 10.3 Estimate Actions

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EST-013 | Send estimate | Click Send | Estimate sent to customer | |
| EST-014 | View estimate PDF | Click preview | PDF generated | |
| EST-015 | Print estimate | Click print | Print dialog opens | |
| EST-016 | Duplicate estimate | Click duplicate | Copy created | |
| EST-017 | Convert to invoice | Click Convert | Invoice created from estimate | |
| EST-018 | Mark accepted | Update status | Status = accepted | |
| EST-019 | Mark declined | Update status | Status = declined | |

### 10.4 Edit Estimate

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| EST-020 | Edit draft | Open draft, modify | Changes saved | |
| EST-021 | Edit sent estimate | Open sent, modify | Creates revision or warning | |
| EST-022 | Delete line item | Remove item | Item removed, total updated | |

---

## 11. Invoicing

### 11.1 Invoice List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| INV-001 | View invoice list | Navigate to Invoices | List displayed | |
| INV-002 | Search invoices | Enter search term | Results filtered | |
| INV-003 | Filter by status | Select status | Filtered correctly | |
| INV-004 | Filter by customer | Select customer | Filtered correctly | |
| INV-005 | Filter by date range | Select dates | Filtered correctly | |
| INV-006 | View overdue | Filter overdue | Only overdue shown | |

### 11.2 Create Invoice

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| INV-007 | Open new invoice | Click New Invoice | Form opens | |
| INV-008 | Select customer | Choose customer | Customer linked | |
| INV-009 | Create from ticket | Select ticket | Ticket data populated | |
| INV-010 | Add line item | Enter item details | Item added | |
| INV-011 | Add labor | Add labor line | Labor calculated | |
| INV-012 | Add parts | Add parts used | Parts listed with prices | |
| INV-013 | Calculate tax | Enter tax rate | Tax calculated | |
| INV-014 | Add discount | Apply discount | Discount applied | |
| INV-015 | Set due date | Select due date | Due date saved | |
| INV-016 | Set payment terms | Select terms | Terms saved | |
| INV-017 | Add notes | Enter invoice notes | Notes saved | |
| INV-018 | Save as draft | Save without posting | Status = draft | |
| INV-019 | Post invoice | Post/finalize | Invoice number assigned | |

### 11.3 Invoice Actions

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| INV-020 | Send invoice | Click Send | Invoice emailed | |
| INV-021 | View PDF | Click preview | PDF generated correctly | |
| INV-022 | Print invoice | Click print | Print dialog opens | |
| INV-023 | Duplicate invoice | Click duplicate | Copy created | |
| INV-024 | Void invoice | Click void | Status = void, GL reversed | |

### 11.4 Payments

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| INV-025 | Record payment | Click Record Payment | Payment form opens | |
| INV-026 | Full payment | Enter full amount | Invoice status = paid | |
| INV-027 | Partial payment | Enter partial amount | Status = partial, balance updated | |
| INV-028 | Multiple payments | Add second payment | Running balance correct | |
| INV-029 | Overpayment | Enter more than balance | Warning or credit created | |
| INV-030 | Payment methods | Select different methods | All methods work | |
| INV-031 | Payment reference | Enter check/reference # | Reference saved | |
| INV-032 | View payment history | Check payments tab | All payments listed | |

### 11.5 Invoice Aging

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| INV-033 | View AR aging | Check aging report | Buckets calculated correctly | |
| INV-034 | Current bucket | Invoice not due | In "Current" column | |
| INV-035 | 1-30 days | 15 days overdue | In "1-30" column | |
| INV-036 | 31-60 days | 45 days overdue | In "31-60" column | |
| INV-037 | 90+ days | 100 days overdue | In "90+" column | |

---

## 12. Projects

### 12.1 Project List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PROJ-001 | View project list | Navigate to Projects | List displayed | |
| PROJ-002 | Search projects | Enter search term | Results filtered | |
| PROJ-003 | Filter by status | Select status | Filtered correctly | |
| PROJ-004 | Filter by customer | Select customer | Filtered correctly | |

### 12.2 Create Project

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PROJ-005 | Open new project | Click New Project | Form opens | |
| PROJ-006 | Enter project details | Fill all fields | Data saved | |
| PROJ-007 | Set budget | Enter budget amount | Budget saved | |
| PROJ-008 | Set dates | Enter start/end dates | Dates saved | |
| PROJ-009 | Assign customer | Select customer | Customer linked | |
| PROJ-010 | Add description | Enter description | Description saved | |

### 12.3 Project Management

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PROJ-011 | View project details | Click project | Details shown | |
| PROJ-012 | Add task | Create project task | Task added | |
| PROJ-013 | Assign task | Assign to technician | Assignment saved | |
| PROJ-014 | Complete task | Mark task complete | Status updated | |
| PROJ-015 | Track progress | View progress bar | Percentage correct | |
| PROJ-016 | Link tickets | Associate tickets | Tickets linked | |
| PROJ-017 | View project tickets | Check tickets tab | Linked tickets shown | |
| PROJ-018 | Track costs | View costs section | Actual costs displayed | |
| PROJ-019 | Budget vs actual | Compare budget to actual | Variance calculated | |
| PROJ-020 | Add project note | Enter note | Note saved | |

### 12.4 Project Reporting

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PROJ-021 | View project summary | Check summary | Key metrics shown | |
| PROJ-022 | Export project data | Click export | Data exported | |
| PROJ-023 | Project timeline | View timeline | Gantt or timeline displayed | |

---

## 13. Parts & Inventory

### 13.1 Parts List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PARTS-001 | View parts list | Navigate to Parts | List displayed | |
| PARTS-002 | Search parts | Enter search term | Results filtered | |
| PARTS-003 | Filter by category | Select category | Filtered correctly | |
| PARTS-004 | Filter by vendor | Select vendor | Filtered correctly | |
| PARTS-005 | Low stock filter | Filter low stock | Only low stock shown | |

### 13.2 Create Part

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PARTS-006 | Open new part form | Click New Part | Form opens | |
| PARTS-007 | Enter part details | Fill required fields | Part created | |
| PARTS-008 | Set SKU | Enter SKU | SKU saved | |
| PARTS-009 | Set pricing | Enter cost/sell price | Prices saved | |
| PARTS-010 | Set reorder point | Enter reorder level | Level saved | |
| PARTS-011 | Assign category | Select category | Category assigned | |
| PARTS-012 | Assign vendor | Select vendor | Vendor linked | |
| PARTS-013 | Add part image | Upload image | Image saved | |

### 13.3 Inventory Management

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PARTS-014 | View current stock | Check quantity | Correct quantity shown | |
| PARTS-015 | Adjust stock | Enter adjustment | Quantity updated | |
| PARTS-016 | Stock adjustment reason | Select reason | Reason logged | |
| PARTS-017 | View stock history | Check history | Adjustments shown | |
| PARTS-018 | Transfer between locations | Transfer stock | Both locations updated | |

### 13.4 Reorder Alerts

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PARTS-019 | Low stock alert | Stock below reorder | Alert shown | |
| PARTS-020 | View reorder list | Check reorder alerts | Parts needing reorder listed | |
| PARTS-021 | Create PO from alert | Generate order | PO created | |

### 13.5 Purchase Orders

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PARTS-022 | Create purchase order | Click New PO | Form opens | |
| PARTS-023 | Select vendor | Choose vendor | Vendor linked | |
| PARTS-024 | Add line items | Add parts to order | Items listed | |
| PARTS-025 | Submit PO | Send to vendor | Status = submitted | |
| PARTS-026 | Receive PO | Mark received | Inventory updated | |
| PARTS-027 | Partial receive | Receive partial | Partial status | |

### 13.6 Truck Inventory

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PARTS-028 | View truck inventory | Select truck/tech | Truck stock shown | |
| PARTS-029 | Assign to truck | Move parts to truck | Truck inventory updated | |
| PARTS-030 | Use from truck | Tech uses part | Truck decremented | |
| PARTS-031 | Restock truck | Replenish truck | Stock added | |

---

## 14. Vendor Management

### 14.1 Vendor List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| VEND-001 | View vendor list | Navigate to Vendors | List displayed | |
| VEND-002 | Search vendors | Enter search term | Results filtered | |
| VEND-003 | Filter by status | Select status | Filtered correctly | |

### 14.2 Create Vendor

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| VEND-004 | Open new vendor form | Click New Vendor | Form opens | |
| VEND-005 | Enter vendor details | Fill all fields | Vendor created | |
| VEND-006 | Set payment terms | Select terms | Terms saved | |
| VEND-007 | Add contact info | Enter contacts | Contacts saved | |
| VEND-008 | Add notes | Enter notes | Notes saved | |

### 14.3 Vendor Details

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| VEND-009 | View vendor details | Click vendor | Details shown | |
| VEND-010 | View linked parts | Check parts tab | Vendor's parts listed | |
| VEND-011 | View purchase history | Check orders tab | Past POs shown | |
| VEND-012 | View payment history | Check payments tab | Payments listed | |

### 14.4 Vendor Catalogs

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| VEND-013 | View vendor catalog | Open catalog | Parts listed | |
| VEND-014 | Search catalog | Enter search | Results filtered | |
| VEND-015 | Add from catalog | Add to inventory | Part created/linked | |

---

## 15. Service Contracts

### 15.1 Contract List

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CONT-001 | View contract list | Navigate to Contracts | List displayed | |
| CONT-002 | Search contracts | Enter search term | Results filtered | |
| CONT-003 | Filter by status | Select status | Filtered correctly | |
| CONT-004 | Filter by customer | Select customer | Filtered correctly | |
| CONT-005 | View expiring soon | Filter expiring | Expiring contracts shown | |

### 15.2 Create Contract

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CONT-006 | Open new contract | Click New Contract | Form opens | |
| CONT-007 | Select customer | Choose customer | Customer linked | |
| CONT-008 | Select contract type | Choose type/plan | Type selected | |
| CONT-009 | Set dates | Enter start/end | Dates saved | |
| CONT-010 | Set billing | Configure billing | Billing saved | |
| CONT-011 | Add covered equipment | Link equipment | Equipment covered | |
| CONT-012 | Set service limits | Enter limits | Limits saved | |
| CONT-013 | Add terms | Enter contract terms | Terms saved | |

### 15.3 Contract Management

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CONT-014 | View contract details | Click contract | Details shown | |
| CONT-015 | View service history | Check history tab | Services listed | |
| CONT-016 | Check coverage | Verify equipment covered | Coverage shown | |
| CONT-017 | Track usage | View usage metrics | Usage displayed | |
| CONT-018 | Renew contract | Click renew | Renewal created | |
| CONT-019 | Cancel contract | Click cancel | Status = cancelled | |

### 15.4 Contract Billing

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| CONT-020 | Generate invoice | Create contract invoice | Invoice created | |
| CONT-021 | Recurring billing | Auto-generate | Invoice auto-created | |
| CONT-022 | View billing history | Check invoices | All invoices shown | |

---

## 16. Accounting

### 16.1 Chart of Accounts

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| ACCT-001 | View chart of accounts | Navigate to Accounting | COA displayed | |
| ACCT-002 | Search accounts | Enter search term | Results filtered | |
| ACCT-003 | Filter by type | Select account type | Filtered correctly | |
| ACCT-004 | Create account | Add new account | Account created | |
| ACCT-005 | Edit account | Modify account | Changes saved | |
| ACCT-006 | View account balance | Check balance | Correct balance shown | |
| ACCT-007 | View account transactions | Click account | Transactions listed | |

### 16.2 General Ledger

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| ACCT-008 | View GL entries | Navigate to GL | Entries displayed | |
| ACCT-009 | Filter by date | Select date range | Filtered correctly | |
| ACCT-010 | Filter by account | Select account | Filtered correctly | |
| ACCT-011 | Create journal entry | Add manual entry | Entry created, balanced | |
| ACCT-012 | Unbalanced entry | Try unbalanced | Error shown | |
| ACCT-013 | View entry details | Click entry | Details shown | |

### 16.3 Accounts Receivable

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| ACCT-014 | View AR summary | Check AR section | Summary stats shown | |
| ACCT-015 | View AR aging | Check aging report | Buckets correct | |
| ACCT-016 | Invoice posts to AR | Create invoice | AR account increased | |
| ACCT-017 | Payment reduces AR | Record payment | AR account decreased | |

### 16.4 Bank Reconciliation

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| ACCT-018 | Start reconciliation | Click new reconciliation | Session created | |
| ACCT-019 | Set statement balance | Enter ending balance | Balance saved | |
| ACCT-020 | Mark cleared items | Check transactions | Items marked cleared | |
| ACCT-021 | View difference | Check reconciliation | Difference calculated | |
| ACCT-022 | Complete reconciliation | Balance matches, complete | Session completed | |
| ACCT-023 | Reconciliation with difference | Difference exists | Cannot complete or adjustment | |

### 16.5 Financial Reports

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| ACCT-024 | Balance sheet | Generate balance sheet | Report displays | |
| ACCT-025 | Income statement | Generate P&L | Report displays | |
| ACCT-026 | Trial balance | Generate trial balance | Report displays | |
| ACCT-027 | Export report | Export to PDF/Excel | File downloads | |

---

## 17. Reports & BI Analytics

### 17.1 Standard Reports

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| RPT-001 | Navigate to reports | Click Reports | Reports menu shown | |
| RPT-002 | Ticket report | Generate ticket report | Data displayed | |
| RPT-003 | Customer report | Generate customer report | Data displayed | |
| RPT-004 | Revenue report | Generate revenue report | Data displayed | |
| RPT-005 | Technician report | Generate tech report | Data displayed | |
| RPT-006 | Date range filter | Select date range | Data filtered | |
| RPT-007 | Export to PDF | Click PDF export | PDF downloads | |
| RPT-008 | Export to Excel | Click Excel export | Excel downloads | |
| RPT-009 | Export to CSV | Click CSV export | CSV downloads | |

### 17.2 BI Dashboards

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| RPT-010 | Financials dashboard | Navigate to BI > Financials | Dashboard loads | |
| RPT-011 | Revenue trends | Navigate to Revenue Trends | Charts display | |
| RPT-012 | DSO insight | Navigate to DSO | Aging data shown | |
| RPT-013 | Labor efficiency | Navigate to Labor | Metrics displayed | |
| RPT-014 | Technician metrics | Navigate to Tech Metrics | Performance shown | |
| RPT-015 | Project margins | Navigate to Margins | Margin data shown | |
| RPT-016 | Customer value | Navigate to Customer Value | Value metrics shown | |

### 17.3 BI Interactivity

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| RPT-017 | Change date range | Select different range | Data updates | |
| RPT-018 | Hover on chart | Mouse over data point | Tooltip shows | |
| RPT-019 | Click chart element | Click bar/slice | Drill-down or filter | |
| RPT-020 | Export BI report | Click export button | Report exports | |

---

## 18. Data Import

### 18.1 Import Wizard

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| IMP-001 | Navigate to import | Click Data Import | Wizard opens | |
| IMP-002 | Select import type | Choose Customers | Type selected | |
| IMP-003 | Upload CSV file | Upload file | File accepted | |
| IMP-004 | Invalid file format | Upload non-CSV | Error shown | |
| IMP-005 | Column mapping | Map columns | Mappings saved | |
| IMP-006 | Auto-detect columns | Similar column names | Auto-mapped | |

### 18.2 Validation

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| IMP-007 | Validate data | Click validate | Validation runs | |
| IMP-008 | Valid data | All rows valid | Green indicators | |
| IMP-009 | Invalid data | Some rows invalid | Errors shown | |
| IMP-010 | Fix validation errors | Correct errors | Errors cleared | |
| IMP-011 | Skip invalid rows | Choose to skip | Only valid imported | |

### 18.3 Import Execution

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| IMP-012 | Run import | Click Import | Import executes | |
| IMP-013 | Import progress | Watch progress | Progress shown | |
| IMP-014 | Import success | Complete import | Success message | |
| IMP-015 | Verify imported data | Check target module | Data present | |
| IMP-016 | Import rollback | If available, rollback | Data removed | |

### 18.4 Import Types

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| IMP-017 | Import customers | Import customer CSV | Customers created | |
| IMP-018 | Import open AR | Import AR CSV | Invoices created | |
| IMP-019 | Import vendors | Import vendor CSV | Vendors created | |
| IMP-020 | Import items | Import items CSV | Parts created | |

---

## 19. Settings & Administration

### 19.1 Company Settings

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SET-001 | View company settings | Navigate to Settings | Settings displayed | |
| SET-002 | Update company name | Change name, save | Name updated | |
| SET-003 | Update address | Change address, save | Address updated | |
| SET-004 | Upload logo | Upload company logo | Logo saved | |
| SET-005 | Set timezone | Select timezone | Timezone saved | |

### 19.2 User Management

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SET-006 | View users | Navigate to Users | User list shown | |
| SET-007 | Create user | Add new user | User created | |
| SET-008 | Set user role | Assign role | Role saved | |
| SET-009 | Deactivate user | Disable user | User cannot login | |
| SET-010 | Reset password | Admin reset | Reset email sent | |
| SET-011 | Edit user | Modify user details | Changes saved | |

### 19.3 System Configuration

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SET-012 | Tax settings | Configure tax rates | Rates saved | |
| SET-013 | Invoice settings | Configure invoice options | Options saved | |
| SET-014 | Email settings | Configure email templates | Templates saved | |
| SET-015 | Notification settings | Configure notifications | Settings saved | |

### 19.4 Theme & Display

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SET-016 | Toggle dark mode | Click dark mode | Theme changes | |
| SET-017 | Persist theme | Refresh page | Theme preserved | |

---

## 20. Notifications & Alerts

### 20.1 In-App Notifications

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| NOTIF-001 | View notifications | Click notification icon | List displayed | |
| NOTIF-002 | New notification | Trigger notification event | Badge count increases | |
| NOTIF-003 | Mark as read | Click notification | Marked as read | |
| NOTIF-004 | Mark all read | Click mark all | All cleared | |
| NOTIF-005 | Notification link | Click notification | Navigates to source | |

### 20.2 Email Notifications

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| NOTIF-006 | Ticket assignment email | Assign ticket | Email sent to tech | |
| NOTIF-007 | Invoice email | Send invoice | Email to customer | |
| NOTIF-008 | Estimate email | Send estimate | Email to customer | |

---

## 21. Cross-Browser & Responsive Testing

### 21.1 Browser Compatibility

| Browser | Version | Login | Dashboard | Tickets | Maps | Invoicing | Pass/Fail |
|---------|---------|-------|-----------|---------|------|-----------|-----------|
| Chrome | Latest | | | | | | |
| Firefox | Latest | | | | | | |
| Safari | Latest | | | | | | |
| Edge | Latest | | | | | | |

### 21.2 Responsive Design

| ID | Test Case | Screen Size | Steps | Expected Result | Pass/Fail |
|----|-----------|-------------|-------|-----------------|-----------|
| RESP-001 | Desktop large | 1920x1080 | Navigate app | Full layout | |
| RESP-002 | Desktop medium | 1366x768 | Navigate app | Adjusted layout | |
| RESP-003 | Tablet landscape | 1024x768 | Navigate app | Tablet layout | |
| RESP-004 | Tablet portrait | 768x1024 | Navigate app | Tablet layout | |
| RESP-005 | Mobile large | 414x896 | Navigate app | Mobile layout | |
| RESP-006 | Mobile small | 375x667 | Navigate app | Mobile layout | |

### 21.3 Mobile-Specific

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| RESP-007 | Touch interactions | Tap, swipe | All work correctly | |
| RESP-008 | Mobile navigation | Use hamburger menu | Menu functions | |
| RESP-009 | Form inputs | Fill forms on mobile | Keyboard works | |
| RESP-010 | Tables on mobile | View data tables | Scrollable/responsive | |

---

## 22. Performance Testing

### 22.1 Load Times

| ID | Test Case | Target | Actual | Pass/Fail |
|----|-----------|--------|--------|-----------|
| PERF-001 | Initial page load | < 3 seconds | | |
| PERF-002 | Dashboard load | < 2 seconds | | |
| PERF-003 | Ticket list (100 items) | < 2 seconds | | |
| PERF-004 | Customer list (500 items) | < 3 seconds | | |
| PERF-005 | Map view load | < 5 seconds | | |
| PERF-006 | Report generation | < 5 seconds | | |

### 22.2 Data Volume

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| PERF-007 | Large ticket list | 1000+ tickets | Pagination works | |
| PERF-008 | Large customer list | 5000+ customers | Search works | |
| PERF-009 | Large invoice list | 2000+ invoices | Filtering works | |
| PERF-010 | Complex report | Year of data | Report generates | |

---

## 23. Security Testing

### 23.1 Authentication Security

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SEC-001 | SQL injection login | Enter SQL in login | Sanitized, no injection | |
| SEC-002 | Brute force protection | Multiple failed logins | Account locked/delayed | |
| SEC-003 | Session fixation | Attempt session hijack | Session invalidated | |
| SEC-004 | Secure password storage | Check database | Passwords hashed | |

### 23.2 Authorization Security

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SEC-005 | Direct URL access | Access protected URL | Redirected to login | |
| SEC-006 | Role escalation | Tech tries admin action | Access denied | |
| SEC-007 | Cross-user data | Access other user's data | Access denied | |

### 23.3 Input Validation

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SEC-008 | XSS in text fields | Enter script tags | Sanitized | |
| SEC-009 | SQL injection forms | Enter SQL in forms | Sanitized | |
| SEC-010 | File upload validation | Upload malicious file | Rejected | |
| SEC-011 | Integer overflow | Enter large numbers | Handled gracefully | |

### 23.4 Data Protection

| ID | Test Case | Steps | Expected Result | Pass/Fail |
|----|-----------|-------|-----------------|-----------|
| SEC-012 | HTTPS enforcement | Access via HTTP | Redirected to HTTPS | |
| SEC-013 | Sensitive data exposure | Check network tab | No sensitive data exposed | |
| SEC-014 | API authentication | Call API without auth | 401 Unauthorized | |

---

## Test Execution Summary

### Module Completion Tracker

| Module | Total Tests | Passed | Failed | Blocked | Not Run |
|--------|-------------|--------|--------|---------|---------|
| Authentication | 17 | | | | |
| Dashboard | 10 | | | | |
| Customers | 29 | | | | |
| Equipment | 19 | | | | |
| Tickets | 50 | | | | |
| Dispatch | 16 | | | | |
| Maps | 18 | | | | |
| Time Clock | 20 | | | | |
| Technician Mobile | 31 | | | | |
| Estimates | 22 | | | | |
| Invoicing | 37 | | | | |
| Projects | 23 | | | | |
| Parts & Inventory | 31 | | | | |
| Vendors | 15 | | | | |
| Service Contracts | 22 | | | | |
| Accounting | 27 | | | | |
| Reports & BI | 20 | | | | |
| Data Import | 20 | | | | |
| Settings | 17 | | | | |
| Notifications | 8 | | | | |
| Cross-Browser | 10 | | | | |
| Performance | 10 | | | | |
| Security | 14 | | | | |
| **TOTAL** | **506** | | | | |

---

## Defect Log

| ID | Module | Test Case | Description | Severity | Status | Assigned To |
|----|--------|-----------|-------------|----------|--------|-------------|
| | | | | | | |
| | | | | | | |
| | | | | | | |

**Severity Levels:**
- **Critical** - System crash, data loss, security breach
- **High** - Major feature broken, no workaround
- **Medium** - Feature impaired, workaround exists
- **Low** - Minor issue, cosmetic

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| QA Tester 1 | | | |
| QA Tester 2 | | | |
| Dev Lead | | | |
| Product Owner | | | |
| Project Manager | | | |

---

## Appendix A: Test Data Specifications

### Sample Customer Data
```csv
name,email,phone,address,city,state,zip
Acme Corp,contact@acme.com,555-0100,123 Main St,Springfield,IL,62701
Beta Inc,info@beta.com,555-0200,456 Oak Ave,Chicago,IL,60601
...
```

### Sample Part Data
```csv
sku,name,category,cost,price,qty_on_hand,reorder_point
PT-001,Air Filter,Filters,12.50,25.00,50,10
PT-002,Belt Drive,Belts,8.00,18.00,30,5
...
```

---

## Appendix B: SQL Verification Queries

```sql
-- Verify customer count
SELECT COUNT(*) FROM customers;

-- Verify ticket statuses
SELECT status, COUNT(*) FROM tickets GROUP BY status;

-- Verify invoice aging
SELECT
  CASE
    WHEN due_date >= CURRENT_DATE THEN 'Current'
    WHEN due_date >= CURRENT_DATE - 30 THEN '1-30'
    WHEN due_date >= CURRENT_DATE - 60 THEN '31-60'
    ELSE '60+'
  END as aging_bucket,
  COUNT(*),
  SUM(balance_due)
FROM invoices
WHERE status NOT IN ('paid', 'void')
GROUP BY 1;

-- Verify GL balance
SELECT
  SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
  SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
FROM gl_entries;
```

---

## Appendix C: Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | | Developer testing |
| Staging | | QA testing |
| Production | | Live system |

---

*Document Version: 1.0*
*Last Updated: January 2026*
