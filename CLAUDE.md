# IntelliService - Project Context for Claude

## Overview
IntelliService is an ERP-style field service management platform for any field service industry. It handles dispatching, ticketing, inventory management, invoicing, and business intelligence reporting. The first vertical is HVAC, but the platform is designed to support any field service offering.

## Related Repositories

### IntelliServiceBeta (This Repo) - Field Service Management
- **Repository**: https://github.com/thamain1/IntelliServiceBeta
- **Deployment**: Cloudflare Pages → https://intelliservice.pages.dev
- **Purpose**: Field service operations - dispatching, ticketing, inventory, invoicing, BI reporting
- **Supabase Project ID**: uuarbdrzfakvlhlrnwgc

### IntelliService-MES - Manufacturing Execution System
- **Repository**: https://github.com/thamain1/IntelliService-MES
- **Purpose**: Manufacturing operations - production scheduling, work orders, shop floor, quality control
- **Note**: Completely separate codebase and deployment from field service

### IntelliService - Pitch Deck & Demo
- **Repository**: Local at C:\dev\IntelliService
- **Purpose**: Marketing pitch deck, wireframes, and AI Agent dashboard demo
- **Not deployed** - used for presentations only

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: Cloudflare Pages
- **Repository**: https://github.com/thamain1/IntelliServiceBeta

## Project Structure
```
project/
├── src/
│   ├── components/          # React components by feature
│   │   ├── Accounting/      # GL, reconciliation, invoices
│   │   ├── BI/              # Business intelligence reports
│   │   ├── Parts/           # Inventory, vendors, POs, reorder alerts
│   │   ├── Scheduling/      # Dispatch board, calendar
│   │   ├── Tickets/         # Service tickets
│   │   └── ...
│   ├── services/            # Business logic services
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Supabase client, database types
│   └── types/               # TypeScript types
├── supabase/
│   └── migrations/          # SQL migrations (run manually in Supabase)
└── dist/                    # Build output (deployed to Cloudflare)
```

## Database Environments
There are 3 separate Supabase databases:

| Environment | URL | Project ID | Purpose |
|-------------|-----|------------|---------|
| Demo/Test | https://uuarbdrzfakvlhlrnwgc.supabase.co | uuarbdrzfakvlhlrnwgc | Online demo and testing |
| Production | https://trtqrdplgjgysyspwvam.supabase.co | trtqrdplgjgysyspwvam | Live production environment |
| MES | https://vijbnqrewokckwmtbbhi.supabase.co | vijbnqrewokckwmtbbhi | Manufacturing Execution System |

**IMPORTANT**: When applying migrations, they must be applied to ALL THREE databases.

## Database
- **109 tables** in Supabase PostgreSQL
- Types generated via: `npx supabase gen types typescript --project-id uuarbdrzfakvlhlrnwgc`
- Types file: `src/lib/database.types.ts`
- Migrations are in `supabase/migrations/` but must be run manually in Supabase SQL Editor

## Key Modules

### Parts & Inventory (JIT/Kanban)
- **Tables**: `parts`, `part_inventory`, `stock_locations`, `inventory_reorder_policies`, `vendor_part_mappings`
- **View**: `vw_reorder_alerts` - calculates reorder points, reserved qty, avg daily usage
- **Functions**: `fn_create_po_from_alert()`, `fn_generate_reorder_pos()`
- **Location Types**: `warehouse`, `truck`, `project_site`, `customer_site`, `vendor`
- **Truck Filtering**: Trucks only show parts with explicit reorder policy AND min_qty > 0

### Purchase Orders
- **Tables**: `purchase_orders`, `purchase_order_lines`
- **Statuses**: draft, submitted, approved, partial, received, cancelled

### Vendors
- **Tables**: `vendors`, `vendor_part_mappings`, `vendor_contacts`
- `vendor_part_mappings.is_preferred_vendor` determines which vendor appears in reorder alerts

### Tickets
- **Tables**: `tickets`, `ticket_parts_planned`, `ticket_parts_used`
- Reserved inventory calculated from `ticket_parts_planned` for active tickets

### Time Tracking
- **Table**: `time_logs`
- RLS policy allows admins to view all time logs (needed for BI reports)

### Invoicing
- **Table**: `invoices`
- **Statuses**: draft, sent, paid, overdue, cancelled, partially_paid, written_off (NOT 'void')

### BI Reports
- Located in `src/components/BI/`
- Use `useBIDateRange` hook for date filtering
- Reports: Financials, Technician Metrics, Project Margins, DSO, Labor Efficiency, Revenue Trends, Customer Value

## User Roles
- `admin` - Full access, can view all data
- `dispatcher` - Scheduling and dispatch
- `technician` - Field work, limited access

## Important Patterns

### RLS (Row Level Security)
- Most tables have RLS enabled
- Admins typically have full access
- Technicians often restricted to their own data
- Check RLS policies when data isn't appearing

### Views
- Complex reporting uses PostgreSQL views (e.g., `vw_reorder_alerts`, `vw_ap_aging`)
- Views must be recreated to modify (DROP VIEW + CREATE VIEW)

### Enums
- `stock_location_type`: warehouse, truck, project_site, customer_site, vendor
- `invoice_status`: draft, sent, paid, overdue, cancelled, partially_paid, written_off

## Deployment
1. Code pushed to GitHub `master` branch
2. Cloudflare Pages auto-deploys from GitHub
3. Database migrations run manually in Supabase SQL Editor

## Common Issues & Fixes

### "void" is not a valid invoice status
Use `cancelled` instead. Valid statuses in `invoice_status` enum don't include 'void'.

### BI reports showing limited data
Check RLS policies. Admins need policies that allow viewing all records.

### Trucks showing all parts in reorder alerts
The view was fixed to only show truck parts that have explicit `inventory_reorder_policies` with `min_qty > 0`.

### EXTRACT(DAY FROM date_diff) error
PostgreSQL date subtraction already returns integer days. Don't use EXTRACT on the result.

### Duplicate key violation when receiving parts
The `fn_process_received_parts_for_tickets` trigger must use `INSERT ON CONFLICT DO UPDATE` for upserting into `part_inventory`. Plain INSERT fails when a record already exists with a different `reserved_for_ticket_id`.

### Check constraint violation on tickets.hold_type
Valid values are: `'parts'`, `'issue'`, `'parts_ready'`, or `NULL`. The 'parts_ready' value was added in migration `20260223100000`.

### Check constraint violation on ticket_parts_requests.status
Valid values include: `'pending'`, `'approved'`, `'ordered'`, `'received'`, `'rejected'`. The 'ordered' and 'received' values were added in migration `20260223060000`.

## Recent Changes (Feb 2026)
1. Added collapsible sidebar with localStorage persistence
2. Dispatch calendar with day/week views and double-booking protection
3. Ticket detail modal with conflict checks
4. **Parts Request to PO Workflow** (Feb 23, 2026):
   - Fixed check constraint on `ticket_parts_requests.status` to allow 'ordered' and 'received'
   - Fixed navigation after PO creation to return to Parts Requests tab
   - Added "View Ticket" button to open ticket modal from parts request
   - Added "View PO" button to open PO receiving modal
   - Fixed duplicate key error when receiving parts (see below)
   - Added 'parts_ready' to `tickets.hold_type` check constraint

## Parts Receiving Workflow

### Key Tables & Triggers
- `purchase_order_lines` - Has `linked_ticket_id` and `linked_request_id` for ticket-linked parts
- `part_inventory` - Stores inventory with `reserved_for_ticket_id` for reservations
- `fn_process_received_parts_for_tickets()` - Trigger on `purchase_order_lines` that:
  - Stages ticket-linked parts to Job Staging location (`a0000000-0000-0000-0000-000000000001`)
  - Creates pick lists when all parts are received
  - Updates ticket holds and creates ticket updates
- `fn_upsert_part_inventory()` - RPC function for atomic inventory upsert

### How Receiving Works
1. **Ticket-linked parts**: The database trigger `fn_process_received_parts_for_tickets` handles staging automatically when `quantity_received` is updated on `purchase_order_lines`
2. **Non-ticket parts**: The frontend calls `fn_upsert_part_inventory` RPC to add to selected location
3. **Serialized parts**: Frontend inserts into `serialized_parts` table directly

### Important: Receiving Code Logic (ReceivingModal.tsx)
```typescript
// Only call RPC for non-ticket-linked parts - trigger handles ticket-linked ones
if (!part.is_serialized && receivingItem.quantity_received > 0 && !line.linked_ticket_id) {
  await supabase.rpc('fn_upsert_part_inventory', {...});
}
```

### Common Issues Fixed
- **Duplicate key violation on part_inventory**: The trigger was using plain INSERT instead of INSERT ON CONFLICT. Fixed in migration `20260223090000_fix_receiving_trigger_upsert.sql`
- **hold_type check constraint violation**: Trigger sets `hold_type='parts_ready'` but constraint only allowed 'parts' and 'issue'. Fixed in migration `20260223100000_add_parts_ready_to_hold_type_constraint.sql`

## Recent Changes (Jan 2026)
1. Fixed RLS policy for `time_logs` - admins can now view all staff time logs
2. Fixed JIT/Kanban inventory view with proper reserved qty, daily usage, reorder point calculations
3. Added `fn_create_po_from_alert()` and `fn_generate_reorder_pos()` functions
4. Added Edit Part functionality with preferred vendor assignment
5. Fixed truck filtering in `vw_reorder_alerts`
6. Added escalation support contact (Jesse Morgan) to Help Center
7. Technician workflow improvements:
   - Clock-in required before starting work on tickets (with popup alert)
   - "Get Directions" button opens native maps app for customer location
   - Ticket completion success modal with clear feedback
   - Completed tickets show "Ticket Completed" indicator instead of Quick Actions
8. Parts workflow improvements:
   - "Add Part" modal only shows parts from technician's truck inventory (no fallback to all parts)
   - "No Parts on Truck" message with link to request parts
   - New "Need Parts" modal with proper form (part selection from full catalog, quantity, urgency)
   - Ticket goes on hold when parts are requested

## Technician Ticket Workflow
- **Clock-in required**: Technicians must clock in via Time Clock before starting work
- **Add Part (used)**: Shows ONLY parts from truck inventory (`vw_technician_truck_inventory`)
- **Need Parts**: Opens modal to request parts from full catalog, puts ticket on hold
- **Mark Complete**: Stops timer, shows success modal, navigates back to ticket list
- **Get Directions**: Opens Google Maps with customer address

## Parts Management
- **Track by Serial Number**: Enable for parts requiring individual serial number tracking
- **Requires Registration**: Enable for parts requiring warranty registration with manufacturer
  - When checked, must provide Registration URL
  - Stored in `parts.requires_registration` and `parts.registration_url` columns

## Key Recent Migrations (Feb 23, 2026)
These migrations are critical for the parts receiving workflow:

| Migration | Purpose |
|-----------|---------|
| `20260223050000_auto_update_parts_request_on_po_line.sql` | Auto-update parts request status when PO line is created |
| `20260223060000_fix_parts_request_status_constraint.sql` | Add 'ordered' and 'received' to status constraint |
| `20260223070000_fix_inventory_movement_trigger_unit_cost.sql` | Remove invalid unit_cost reference |
| `20260223080000_create_upsert_part_inventory_function.sql` | Create `fn_upsert_part_inventory` RPC for atomic upserts |
| `20260223090000_fix_receiving_trigger_upsert.sql` | Fix trigger to use INSERT ON CONFLICT |
| `20260223100000_add_parts_ready_to_hold_type_constraint.sql` | Add 'parts_ready' to hold_type constraint |

## Applying Migrations
To apply migrations to all databases:
```bash
cd C:/dev/IntelliServiceBeta/project

# Demo/Test (default linked)
npx supabase db push

# Production
npx supabase link --project-ref trtqrdplgjgysyspwvam
npx supabase db push

# MES
npx supabase link --project-ref vijbnqrewokckwmtbbhi
npx supabase db push

# Link back to Demo/Test
npx supabase link --project-ref uuarbdrzfakvlhlrnwgc
```

If migrations fail due to orphaned remote migrations:
```bash
npx supabase migration repair --status reverted <migration_ids>
```
