/*
  # IntelliService Test Data Seed Script

  ## Purpose
  Generates realistic test data for comprehensive testing of all reports and features.
  Uses real Mississippi addresses with pre-populated coordinates for map functionality.

  ## Data Generated
  - 25 Customers across Mississippi with locations
  - Equipment at customer locations
  - 150+ Tickets over 9 months (varied statuses)
  - Time logs linked to tickets
  - Invoices and payments
  - 5 Projects with phases and tasks
  - Parts inventory
  - Vendors and purchase orders
  - Service contracts

  ## Usage
  Run this script in Supabase SQL Editor after initial setup.
  Script is idempotent - safe to run multiple times.

  ## Important
  This script requires at least one user in the profiles table.
  It will use existing technicians for assignments.
*/

-- ============================================================================
-- STEP 0: Get existing profile IDs to use for assignments
-- ============================================================================

DO $$
DECLARE
  v_admin_id uuid;
  v_tech_ids uuid[];
  v_tech_count integer;
BEGIN
  -- Get admin user
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  -- Get all technician IDs
  SELECT array_agg(id) INTO v_tech_ids FROM profiles WHERE role IN ('technician', 'admin', 'dispatcher') AND is_active = true;
  v_tech_count := array_length(v_tech_ids, 1);

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found. Please create at least one admin user first.';
  END IF;

  IF v_tech_count IS NULL OR v_tech_count = 0 THEN
    RAISE EXCEPTION 'No active users found. Please create users first.';
  END IF;

  RAISE NOTICE 'Found % active users for seed data', v_tech_count;
END $$;

-- ============================================================================
-- STEP 1: Create Mississippi Customers with Real Addresses
-- ============================================================================

-- Clear existing seed data (in correct order due to foreign key constraints)
-- Temporarily disable invoice deletion trigger
ALTER TABLE invoices DISABLE TRIGGER prevent_invoice_deletion_trigger;

-- First delete projects (which will cascade to phases and tasks)
DELETE FROM projects WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%');
-- Delete service contracts
DELETE FROM service_contracts WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%');
-- Delete payments
DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%'));
-- Delete invoice line items
DELETE FROM invoice_line_items WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%'));
-- Delete invoices
DELETE FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%');
-- Delete time logs for seed tickets
DELETE FROM time_logs WHERE ticket_id IN (SELECT id FROM tickets WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%'));
-- Delete tickets
DELETE FROM tickets WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%');
-- Delete equipment
DELETE FROM equipment WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%');
-- Delete customer locations
DELETE FROM customer_locations WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%');
-- Finally delete customers
DELETE FROM customers WHERE name LIKE 'SEED:%';
-- Clean up seed vendors, parts, and contract plans
DELETE FROM vendors WHERE name LIKE 'SEED:%';
DELETE FROM parts WHERE part_number LIKE 'SEED-%';
DELETE FROM contract_plans WHERE name LIKE 'SEED:%';

-- Re-enable invoice deletion trigger
ALTER TABLE invoices ENABLE TRIGGER prevent_invoice_deletion_trigger;

-- Insert customers with real Mississippi addresses and coordinates
INSERT INTO customers (id, name, email, phone, address, city, state, zip_code, latitude, longitude, notes, created_at)
VALUES
  -- Jackson Metro Area
  (gen_random_uuid(), 'SEED: Jackson Medical Center', 'facilities@jacksonmedical.com', '601-555-0101', '1850 Chadwick Dr', 'Jackson', 'MS', '39204', 32.2988, -90.1848, 'Large commercial account - 24/7 access required', now() - interval '14 months'),
  (gen_random_uuid(), 'SEED: Capitol City Office Complex', 'property@capitolcity.com', '601-555-0102', '200 E Capitol St', 'Jackson', 'MS', '39201', 32.3043, -90.1826, 'Multiple HVAC units - scheduled maintenance', now() - interval '12 months'),
  (gen_random_uuid(), 'SEED: Ridgeland Town Center', 'maintenance@ridgelandtc.com', '601-555-0103', '1000 Highland Colony Pkwy', 'Ridgeland', 'MS', '39157', 32.4285, -90.1323, 'Retail complex - after hours service preferred', now() - interval '11 months'),
  (gen_random_uuid(), 'SEED: Madison County Schools', 'facilities@madisoncounty.k12.ms.us', '601-555-0104', '476 Highland Colony Pkwy', 'Madison', 'MS', '39110', 32.4618, -90.1154, 'School district - summer maintenance window', now() - interval '10 months'),
  (gen_random_uuid(), 'SEED: Brandon Family Dentistry', 'office@brandondental.com', '601-555-0105', '1040 W Government St', 'Brandon', 'MS', '39042', 32.2732, -89.9859, 'Medical office - critical temperature control', now() - interval '9 months'),
  (gen_random_uuid(), 'SEED: Pearl River Resort', 'engineering@pearlriverresort.com', '601-555-0106', '13541 MS-16', 'Pearl', 'MS', '39208', 32.2746, -90.1321, 'Hotel - VIP service contract', now() - interval '8 months'),
  (gen_random_uuid(), 'SEED: Clinton Community Church', 'admin@clintoncc.org', '601-555-0107', '400 Clinton Blvd', 'Clinton', 'MS', '39056', 32.3415, -90.3218, 'Non-profit - weekend service available', now() - interval '13 months'),

  -- North Mississippi
  (gen_random_uuid(), 'SEED: Tupelo Furniture Market', 'facilities@tupelofurniture.com', '662-555-0201', '1879 N Gloster St', 'Tupelo', 'MS', '38804', 34.2576, -88.7034, 'Large showroom - humidity control critical', now() - interval '11 months'),
  (gen_random_uuid(), 'SEED: Oxford Square Shops', 'manager@oxfordsquare.com', '662-555-0202', '100 Courthouse Square', 'Oxford', 'MS', '38655', 34.3665, -89.5192, 'Historic downtown - discrete equipment placement', now() - interval '10 months'),
  (gen_random_uuid(), 'SEED: Starkville Veterinary Clinic', 'admin@starkvillevet.com', '662-555-0203', '1200 Louisville St', 'Starkville', 'MS', '39759', 33.4504, -88.8184, 'Animal hospital - 24/7 emergency contact', now() - interval '9 months'),
  (gen_random_uuid(), 'SEED: Columbus Air Force Base Housing', 'housing@columbus.af.mil', '662-555-0204', '555 Independence Dr', 'Columbus', 'MS', '39701', 33.4957, -88.4273, 'Government contract - security clearance required', now() - interval '8 months'),
  (gen_random_uuid(), 'SEED: Southaven Distribution Center', 'ops@southavendist.com', '662-555-0205', '7500 Airways Blvd', 'Southaven', 'MS', '38671', 34.9889, -90.0126, 'Warehouse - temperature sensitive goods', now() - interval '7 months'),

  -- Coastal Mississippi
  (gen_random_uuid(), 'SEED: Biloxi Beach Resort', 'maintenance@biloxibeach.com', '228-555-0301', '2046 Beach Blvd', 'Biloxi', 'MS', '39531', 30.3960, -88.8853, 'Beachfront hotel - salt air corrosion issues', now() - interval '12 months'),
  (gen_random_uuid(), 'SEED: Gulfport Harbor Seafood', 'facilities@gulfportharbor.com', '228-555-0302', '1200 30th Ave', 'Gulfport', 'MS', '39501', 30.3674, -89.0928, 'Cold storage facility - refrigeration specialist needed', now() - interval '11 months'),
  (gen_random_uuid(), 'SEED: Ocean Springs Art Gallery', 'curator@osartgallery.com', '228-555-0303', '1000 Washington Ave', 'Ocean Springs', 'MS', '39564', 30.4113, -88.8278, 'Museum - precise climate control for artwork', now() - interval '10 months'),

  -- Central/East Mississippi
  (gen_random_uuid(), 'SEED: Meridian Regional Hospital', 'facilities@meridianregional.com', '601-555-0401', '1400 Constitution Dr', 'Meridian', 'MS', '39301', 32.3643, -88.7037, 'Hospital - critical systems, backup required', now() - interval '13 months'),
  (gen_random_uuid(), 'SEED: Vicksburg National Military Park', 'maintenance@nps.gov', '601-555-0402', '3201 Clay St', 'Vicksburg', 'MS', '39183', 32.3526, -90.8779, 'Federal facility - historic preservation requirements', now() - interval '12 months'),
  (gen_random_uuid(), 'SEED: Hattiesburg Convention Center', 'events@hattiesburgcc.com', '601-555-0403', '1 Convention Center Plaza', 'Hattiesburg', 'MS', '39401', 31.3271, -89.2903, 'Event venue - flexible scheduling needed', now() - interval '11 months'),

  -- Delta Region
  (gen_random_uuid(), 'SEED: Greenville Cotton Exchange', 'admin@gvcotton.com', '662-555-0501', '340 Main St', 'Greenville', 'MS', '38701', 33.4101, -91.0618, 'Historic building - preservation guidelines', now() - interval '10 months'),
  (gen_random_uuid(), 'SEED: Clarksdale Blues Museum', 'director@deltamuseum.org', '662-555-0502', '1 Blues Alley', 'Clarksdale', 'MS', '38614', 34.2001, -90.5709, 'Museum - artifact preservation climate', now() - interval '9 months'),

  -- Residential Customers
  (gen_random_uuid(), 'SEED: Johnson Residence', 'mike.johnson@email.com', '601-555-0601', '2847 Lakeland Dr', 'Jackson', 'MS', '39232', 32.3521, -90.1423, 'Residential - weekend appointments preferred', now() - interval '6 months'),
  (gen_random_uuid(), 'SEED: Williams Family Home', 'sarah.williams@email.com', '662-555-0602', '1523 W Main St', 'Tupelo', 'MS', '38801', 34.2612, -88.7156, 'Residential - elderly occupant, call before arrival', now() - interval '5 months'),
  (gen_random_uuid(), 'SEED: Garcia Property', 'carlos.garcia@email.com', '228-555-0603', '892 Pass Rd', 'Gulfport', 'MS', '39507', 30.3841, -89.0573, 'Residential - vacation home, coordinate access', now() - interval '4 months'),
  (gen_random_uuid(), 'SEED: Thompson Estate', 'linda.thompson@email.com', '601-555-0604', '4521 Northside Dr', 'Clinton', 'MS', '39056', 32.3587, -90.3156, 'Large residential - multiple units', now() - interval '3 months'),
  (gen_random_uuid(), 'SEED: Davis Home', 'robert.davis@email.com', '662-555-0605', '789 University Ave', 'Oxford', 'MS', '38655', 34.3598, -89.5234, 'Residential - professor, flexible schedule', now() - interval '2 months')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 2: Create Customer Locations
-- ============================================================================

-- Create primary locations for each customer
INSERT INTO customer_locations (id, customer_id, location_name, address, city, state, zip_code, is_primary, is_active)
SELECT
  gen_random_uuid(),
  c.id,
  'Main Location',
  c.address,
  c.city,
  c.state,
  c.zip_code,
  true,
  true
FROM customers c
WHERE c.name LIKE 'SEED:%'
AND NOT EXISTS (
  SELECT 1 FROM customer_locations cl WHERE cl.customer_id = c.id
);

-- Add secondary locations for larger customers
INSERT INTO customer_locations (customer_id, location_name, address, city, state, zip_code, is_primary, is_active)
SELECT
  c.id,
  'Secondary Building',
  CASE
    WHEN c.city = 'Jackson' THEN '2500 N State St'
    WHEN c.city = 'Biloxi' THEN '1500 Beach Blvd'
    ELSE '100 Industrial Park Dr'
  END,
  c.city,
  'MS',
  c.zip_code,
  false,
  true
FROM customers c
WHERE c.name LIKE 'SEED:%'
AND (c.name LIKE '%Medical%' OR c.name LIKE '%Hospital%' OR c.name LIKE '%Resort%' OR c.name LIKE '%Center%')
AND NOT EXISTS (
  SELECT 1 FROM customer_locations cl WHERE cl.customer_id = c.id AND cl.location_name = 'Secondary Building'
);

-- ============================================================================
-- STEP 3: Create Equipment at Customer Locations
-- ============================================================================

-- Insert HVAC equipment for customers using LATERAL join
INSERT INTO equipment (id, customer_id, location_id, serial_number, model_number, manufacturer, equipment_type, installation_date, warranty_expiration, warranty_status, is_active, notes)
SELECT
  gen_random_uuid(),
  c.id,
  cl.id,
  'SEED-' || UPPER(SUBSTRING(md5(random()::text), 1, 8)) || '-' || row_number() OVER (),
  (ARRAY['XC25-036', 'TCD42B100', 'XR15-048', 'S9V2B080', 'GAF2A0C60M31', 'XP21-060'])[1 + (random() * 5)::int],
  (ARRAY['Trane', 'Carrier', 'Lennox', 'Rheem', 'Goodman', 'York'])[1 + (random() * 5)::int],
  (ARRAY['Split System AC', 'Heat Pump', 'Package Unit', 'Furnace', 'Mini Split'])[1 + (random() * 4)::int],
  (now() - (random() * interval '5 years'))::date,
  (now() + (random() * interval '3 years'))::date,
  CASE WHEN random() > 0.3 THEN 'Active' ELSE 'Expired' END,
  true,
  'Seed data equipment'
FROM customers c
JOIN customer_locations cl ON cl.customer_id = c.id AND cl.is_primary = true
CROSS JOIN LATERAL generate_series(1,
  CASE
    WHEN c.name LIKE '%Hospital%' OR c.name LIKE '%Medical%' THEN 8
    WHEN c.name LIKE '%Resort%' OR c.name LIKE '%Center%' OR c.name LIKE '%Complex%' THEN 6
    WHEN c.name LIKE '%School%' OR c.name LIKE '%Base%' THEN 5
    ELSE 2
  END
) AS s(n)
WHERE c.name LIKE 'SEED:%'
AND NOT EXISTS (
  SELECT 1 FROM equipment e WHERE e.serial_number LIKE 'SEED-%' AND e.customer_id = c.id
);

-- ============================================================================
-- STEP 4: Create Parts Inventory
-- ============================================================================

INSERT INTO parts (id, part_number, name, description, manufacturer, category, quantity_on_hand, unit_price, reorder_level, created_at)
VALUES
  (gen_random_uuid(), 'SEED-CPR-001', 'Capacitor 45/5 MFD', '45/5 MFD 440V Dual Run Capacitor', 'Generic', 'Electrical', 25, 18.50, 10, now()),
  (gen_random_uuid(), 'SEED-CPR-002', 'Capacitor 55/5 MFD', '55/5 MFD 440V Dual Run Capacitor', 'Generic', 'Electrical', 20, 22.00, 8, now()),
  (gen_random_uuid(), 'SEED-MOT-001', 'Condenser Fan Motor 1/4HP', '1/4 HP 1075 RPM Condenser Fan Motor', 'US Motors', 'Motors', 8, 145.00, 3, now()),
  (gen_random_uuid(), 'SEED-MOT-002', 'Blower Motor 1/2HP', '1/2 HP Multi-Speed Blower Motor', 'US Motors', 'Motors', 6, 225.00, 2, now()),
  (gen_random_uuid(), 'SEED-CMP-001', 'Compressor 3 Ton', '3 Ton Scroll Compressor R-410A', 'Copeland', 'Compressors', 3, 850.00, 1, now()),
  (gen_random_uuid(), 'SEED-CMP-002', 'Compressor 5 Ton', '5 Ton Scroll Compressor R-410A', 'Copeland', 'Compressors', 2, 1250.00, 1, now()),
  (gen_random_uuid(), 'SEED-FLT-001', 'Filter 16x25x1', '16x25x1 Pleated Air Filter MERV 8', 'Filtrete', 'Filters', 100, 8.50, 25, now()),
  (gen_random_uuid(), 'SEED-FLT-002', 'Filter 20x20x1', '20x20x1 Pleated Air Filter MERV 8', 'Filtrete', 'Filters', 80, 8.50, 20, now()),
  (gen_random_uuid(), 'SEED-FLT-003', 'Filter 20x25x4', '20x25x4 Media Filter MERV 11', 'Honeywell', 'Filters', 30, 35.00, 10, now()),
  (gen_random_uuid(), 'SEED-REF-001', 'R-410A Refrigerant 25lb', '25 lb Cylinder R-410A', 'Chemours', 'Refrigerant', 12, 185.00, 4, now()),
  (gen_random_uuid(), 'SEED-REF-002', 'R-22 Refrigerant 30lb', '30 lb Cylinder R-22', 'Generic', 'Refrigerant', 5, 450.00, 2, now()),
  (gen_random_uuid(), 'SEED-CTL-001', 'Thermostat Honeywell T6', 'T6 Pro Programmable Thermostat', 'Honeywell', 'Controls', 15, 89.00, 5, now()),
  (gen_random_uuid(), 'SEED-CTL-002', 'Contactor 40A', '40 Amp 1 Pole Contactor 24V', 'Generic', 'Electrical', 20, 28.00, 8, now()),
  (gen_random_uuid(), 'SEED-CTL-003', 'Transformer 40VA', '40VA 120V to 24V Transformer', 'Generic', 'Electrical', 18, 22.00, 6, now()),
  (gen_random_uuid(), 'SEED-COI-001', 'Evaporator Coil 3 Ton', '3 Ton Cased A-Coil', 'Goodman', 'Coils', 4, 425.00, 1, now()),
  (gen_random_uuid(), 'SEED-DRN-001', 'Condensate Pump', 'Mini Condensate Pump', 'Little Giant', 'Drainage', 10, 65.00, 3, now()),
  (gen_random_uuid(), 'SEED-DRN-002', 'Float Switch', 'Safety Float Switch', 'Rectorseal', 'Drainage', 25, 18.00, 10, now()),
  (gen_random_uuid(), 'SEED-IGN-001', 'Ignitor Hot Surface', 'Universal Hot Surface Ignitor', 'White Rodgers', 'Ignition', 12, 45.00, 4, now()),
  (gen_random_uuid(), 'SEED-IGN-002', 'Flame Sensor', 'Universal Flame Sensor', 'Generic', 'Ignition', 15, 15.00, 5, now()),
  (gen_random_uuid(), 'SEED-VLV-001', 'TXV Valve 3 Ton', '3 Ton TXV Expansion Valve R-410A', 'Sporlan', 'Valves', 6, 125.00, 2, now())
ON CONFLICT (part_number) DO NOTHING;

-- ============================================================================
-- STEP 5: Create Vendors
-- ============================================================================

INSERT INTO vendors (id, name, vendor_code, email, phone, address, city, state, zip_code, is_active, created_at)
VALUES
  (gen_random_uuid(), 'SEED: Mississippi HVAC Supply', 'SEED-V001', 'orders@mshvacsupply.com', '601-555-1001', '500 Industrial Dr', 'Jackson', 'MS', '39209', true, now()),
  (gen_random_uuid(), 'SEED: Gulf Coast Equipment Co', 'SEED-V002', 'sales@gulfcoastequip.com', '228-555-1002', '2100 Pass Rd', 'Gulfport', 'MS', '39501', true, now()),
  (gen_random_uuid(), 'SEED: Delta Refrigeration Parts', 'SEED-V003', 'parts@deltarefrig.com', '662-555-1003', '850 Main St', 'Greenville', 'MS', '38701', true, now()),
  (gen_random_uuid(), 'SEED: Southern Comfort HVAC Dist', 'SEED-V004', 'orders@southerncomfort.com', '601-555-1004', '1200 Hwy 49 S', 'Hattiesburg', 'MS', '39401', true, now()),
  (gen_random_uuid(), 'SEED: Magnolia State Parts', 'SEED-V005', 'sales@magnoliaparts.com', '662-555-1005', '300 S Green St', 'Tupelo', 'MS', '38804', true, now()),
  (gen_random_uuid(), 'SEED: Capital City Wholesale', 'SEED-V006', 'orders@capitalwholesale.com', '601-555-1006', '750 N State St', 'Jackson', 'MS', '39202', true, now()),
  (gen_random_uuid(), 'SEED: Coastal Equipment Rentals', 'SEED-V007', 'rental@coastalequip.com', '228-555-1007', '1500 Debuys Rd', 'Biloxi', 'MS', '39532', true, now()),
  (gen_random_uuid(), 'SEED: Northeast MS HVAC Supply', 'SEED-V008', 'service@nemshvac.com', '662-555-1008', '2200 Hwy 45 N', 'Columbus', 'MS', '39701', true, now())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: Create Service Contracts
-- ============================================================================

-- First ensure we have contract plans
INSERT INTO contract_plans (id, name, description, default_base_fee, labor_discount_percent, parts_discount_percent, trip_charge_discount_percent, included_visits_per_year, priority_level, response_time_sla_hours, is_active)
VALUES
  (gen_random_uuid(), 'SEED: Basic Maintenance', 'Annual inspection and filter changes', 299.00, 0, 5, 0, 2, 'normal', 48, true),
  (gen_random_uuid(), 'SEED: Premium Care', 'Bi-annual service with priority response', 599.00, 10, 10, 50, 4, 'priority', 24, true),
  (gen_random_uuid(), 'SEED: VIP Complete', 'Comprehensive coverage with 24/7 emergency', 1199.00, 20, 15, 100, 6, 'vip', 4, true)
ON CONFLICT DO NOTHING;

-- Create service contracts for commercial customers
INSERT INTO service_contracts (id, name, customer_id, contract_plan_id, base_fee, status, start_date, end_date, auto_renew, created_at)
SELECT
  gen_random_uuid(),
  'SEED-SC-' || LPAD(row_number() OVER ()::text, 4, '0'),
  c.id,
  (SELECT id FROM contract_plans WHERE name LIKE 'SEED:%' ORDER BY random() LIMIT 1),
  (SELECT default_base_fee FROM contract_plans WHERE name LIKE 'SEED:%' ORDER BY random() LIMIT 1),
  CASE
    WHEN random() > 0.2 THEN 'active'
    ELSE 'draft'
  END::service_contract_status,
  (now() - interval '6 months' + (random() * interval '3 months'))::date,
  (now() + interval '6 months' + (random() * interval '6 months'))::date,
  random() > 0.3,
  now()
FROM customers c
WHERE c.name LIKE 'SEED:%'
AND (c.name LIKE '%Hospital%' OR c.name LIKE '%Medical%' OR c.name LIKE '%Resort%'
     OR c.name LIKE '%Center%' OR c.name LIKE '%School%' OR c.name LIKE '%Complex%')
AND NOT EXISTS (
  SELECT 1 FROM service_contracts sc WHERE sc.name LIKE 'SEED-%' AND sc.customer_id = c.id
)
LIMIT 12;

-- ============================================================================
-- STEP 7: Create Tickets (spread over 9 months)
-- ============================================================================

DO $$
DECLARE
  v_admin_id uuid;
  v_tech_ids uuid[];
  v_customer record;
  v_equipment record;
  v_ticket_id uuid;
  v_service_types text[] := ARRAY['Repair', 'Maintenance', 'Installation', 'Diagnostic', 'Emergency', 'Warranty'];
  v_titles text[] := ARRAY[
    'AC Not Cooling', 'Furnace Not Heating', 'Strange Noise from Unit',
    'Thermostat Issue', 'Annual Maintenance', 'Filter Replacement',
    'Refrigerant Leak', 'Compressor Failure', 'Blower Motor Issue',
    'Ductwork Inspection', 'New System Installation', 'Emergency No Heat',
    'Coil Cleaning', 'Capacitor Replacement', 'Condenser Fan Issue'
  ];
  v_random_date timestamp;
  v_status text;
  v_scheduled_date timestamp;
  v_completed_date timestamp;
  i integer;
  v_year_month text;
  v_day text;
  v_seq integer;
  v_ticket_num text;
  v_max_seq integer;
BEGIN
  -- Get admin user
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  -- Get all technician IDs
  SELECT array_agg(id) INTO v_tech_ids FROM profiles WHERE role IN ('technician', 'admin', 'dispatcher') AND is_active = true;

  -- Create tickets for each seed customer
  FOR v_customer IN
    SELECT c.id as customer_id, c.name
    FROM customers c
    WHERE c.name LIKE 'SEED:%'
  LOOP
    -- Determine number of tickets based on customer type
    FOR i IN 1..CASE
      WHEN v_customer.name LIKE '%Hospital%' OR v_customer.name LIKE '%Medical%' THEN 12
      WHEN v_customer.name LIKE '%Resort%' OR v_customer.name LIKE '%Center%' THEN 10
      WHEN v_customer.name LIKE '%School%' OR v_customer.name LIKE '%Complex%' THEN 8
      ELSE 4
    END
    LOOP
      -- Random date within last 9 months
      v_random_date := now() - (random() * interval '270 days');

      -- Generate ticket number in correct format: SVC-YYMM-DD-N
      v_year_month := to_char(v_random_date, 'YYMM');
      v_day := to_char(v_random_date, 'DD');

      -- Get max existing sequence from tickets table for this date pattern
      SELECT COALESCE(MAX(SUBSTRING(ticket_number FROM 'SVC-' || v_year_month || '-' || v_day || '-(\d+)')::integer), 0)
      INTO v_max_seq
      FROM tickets
      WHERE ticket_number LIKE 'SVC-' || v_year_month || '-' || v_day || '-%';

      v_seq := v_max_seq + 1;
      v_ticket_num := 'SVC-' || v_year_month || '-' || v_day || '-' || v_seq;

      -- Determine status based on date
      IF v_random_date < now() - interval '7 days' THEN
        -- Older tickets should be mostly completed
        v_status := CASE (random() * 10)::int
          WHEN 0 THEN 'cancelled'
          WHEN 1 THEN 'open'
          ELSE 'completed'
        END;
      ELSIF v_random_date < now() - interval '1 day' THEN
        v_status := CASE (random() * 5)::int
          WHEN 0 THEN 'open'
          WHEN 1 THEN 'scheduled'
          WHEN 2 THEN 'in_progress'
          ELSE 'completed'
        END;
      ELSE
        v_status := CASE (random() * 3)::int
          WHEN 0 THEN 'open'
          WHEN 1 THEN 'scheduled'
          ELSE 'in_progress'
        END;
      END IF;

      -- Set scheduled and completed dates based on status
      v_scheduled_date := CASE
        WHEN v_status IN ('scheduled', 'in_progress', 'completed')
        THEN v_random_date + (random() * interval '3 days')
        ELSE NULL
      END;

      v_completed_date := CASE
        WHEN v_status = 'completed'
        THEN v_scheduled_date + (random() * interval '4 hours')
        ELSE NULL
      END;

      -- Get random equipment for this customer
      SELECT e.id INTO v_equipment
      FROM equipment e
      WHERE e.customer_id = v_customer.customer_id
      ORDER BY random()
      LIMIT 1;

      -- Insert ticket with correct format and ticket_type
      INSERT INTO tickets (
        id, ticket_number, ticket_type, customer_id, equipment_id, assigned_to,
        status, priority, title, description, service_type,
        scheduled_date, completed_date, created_by, created_at
      ) VALUES (
        gen_random_uuid(),
        v_ticket_num,
        'SVC'::ticket_type,
        v_customer.customer_id,
        v_equipment.id,
        v_tech_ids[1 + (random() * (array_length(v_tech_ids, 1) - 1))::int],
        v_status::ticket_status,
        (ARRAY['low', 'normal', 'normal', 'normal', 'high', 'urgent'])[1 + (random() * 5)::int]::ticket_priority,
        v_titles[1 + (random() * (array_length(v_titles, 1) - 1))::int],
        'Customer reported issue. Seed test data.',
        v_service_types[1 + (random() * (array_length(v_service_types, 1) - 1))::int],
        v_scheduled_date,
        v_completed_date,
        v_admin_id,
        v_random_date
      )
      RETURNING id INTO v_ticket_id;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Tickets created';
END $$;

-- ============================================================================
-- STEP 8: Create Time Logs for Completed Tickets
-- ============================================================================

INSERT INTO time_logs (id, user_id, ticket_id, clock_in_time, clock_out_time, total_hours, time_type, status, notes)
SELECT
  gen_random_uuid(),
  t.assigned_to,
  t.id,
  t.scheduled_date,
  t.scheduled_date + ((1 + random() * 3) * interval '1 hour'),
  1 + (random() * 3),
  'on_site'::time_log_type,
  'completed'::time_log_status,
  'Service completed - seed data'
FROM tickets t
WHERE t.status = 'completed'
AND t.assigned_to IS NOT NULL
AND t.ticket_number LIKE 'SVC-%'
AND t.customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%')
AND NOT EXISTS (
  SELECT 1 FROM time_logs tl WHERE tl.ticket_id = t.id
)
LIMIT 150;

-- ============================================================================
-- STEP 9: Create Invoices from Completed Tickets
-- ============================================================================

DO $$
DECLARE
  v_admin_id uuid;
  v_ticket record;
  v_invoice_id uuid;
  v_invoice_num text;
  v_next_inv_num integer;
  v_subtotal decimal;
  v_tax decimal;
  v_total decimal;
  v_issue_date date;
  v_status text;
  v_paid_date date;
  v_amount_paid decimal;
BEGIN
  -- Get admin user
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  -- Get next invoice number
  SELECT COALESCE(MAX(SUBSTRING(invoice_number FROM 'INV-(\d+)')::integer), 0) + 1
  INTO v_next_inv_num FROM invoices;

  -- Create invoices for completed tickets
  FOR v_ticket IN
    SELECT t.id, t.customer_id, t.completed_date, t.ticket_number,
           (SELECT total_hours FROM time_logs WHERE ticket_id = t.id LIMIT 1) as hours
    FROM tickets t
    WHERE t.status = 'completed'
    AND t.completed_date IS NOT NULL
    AND t.customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%')
    AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.ticket_id = t.id)
    ORDER BY t.completed_date
    LIMIT 100
  LOOP
    -- Calculate amounts
    v_subtotal := (COALESCE(v_ticket.hours, 2) * 95) + (random() * 200); -- Labor + parts
    v_tax := v_subtotal * 0.07; -- 7% MS sales tax
    v_total := v_subtotal + v_tax;

    -- Set dates and status
    v_issue_date := v_ticket.completed_date::date;

    -- Determine invoice status based on age
    IF v_issue_date < now() - interval '60 days' THEN
      v_status := CASE (random() * 10)::int
        WHEN 0 THEN 'overdue'
        ELSE 'paid'
      END;
    ELSIF v_issue_date < now() - interval '30 days' THEN
      v_status := CASE (random() * 5)::int
        WHEN 0 THEN 'overdue'
        WHEN 1 THEN 'sent'
        ELSE 'paid'
      END;
    ELSE
      v_status := CASE (random() * 3)::int
        WHEN 0 THEN 'draft'
        WHEN 1 THEN 'sent'
        ELSE 'paid'
      END;
    END IF;

    v_paid_date := CASE WHEN v_status = 'paid' THEN v_issue_date + (random() * 25)::int ELSE NULL END;
    v_amount_paid := CASE WHEN v_status = 'paid' THEN v_total ELSE 0 END;

    -- Generate invoice number
    v_invoice_num := 'INV-' || LPAD(v_next_inv_num::text, 6, '0');
    v_next_inv_num := v_next_inv_num + 1;

    -- Insert invoice
    INSERT INTO invoices (
      id, invoice_number, customer_id, ticket_id, status,
      issue_date, due_date, paid_date,
      subtotal, tax_rate, tax_amount, discount_amount,
      total_amount, amount_paid, balance_due,
      payment_terms, created_by, created_at
    ) VALUES (
      gen_random_uuid(),
      v_invoice_num,
      v_ticket.customer_id,
      v_ticket.id,
      v_status::invoice_status,
      v_issue_date,
      v_issue_date + interval '30 days',
      v_paid_date,
      v_subtotal,
      7.00,
      v_tax,
      0,
      v_total,
      v_amount_paid,
      v_total - v_amount_paid,
      'Net 30',
      v_admin_id,
      v_issue_date::timestamp
    )
    RETURNING id INTO v_invoice_id;

    -- Create line items
    INSERT INTO invoice_line_items (invoice_id, item_type, description, quantity, unit_price, line_total, taxable, sort_order)
    VALUES
      (v_invoice_id, 'labor'::invoice_line_item_type, 'Service Labor', COALESCE(v_ticket.hours, 2), 95.00, COALESCE(v_ticket.hours, 2) * 95, true, 1),
      (v_invoice_id, 'travel'::invoice_line_item_type, 'Service Call / Trip Charge', 1, 75.00, 75.00, true, 2);

    -- Add parts line item randomly
    IF random() > 0.5 THEN
      INSERT INTO invoice_line_items (invoice_id, item_type, description, quantity, unit_price, line_total, taxable, sort_order)
      VALUES (v_invoice_id, 'part'::invoice_line_item_type, 'Replacement Parts', 1, (random() * 150)::decimal(10,2), (random() * 150)::decimal(10,2), true, 3);
    END IF;

  END LOOP;

  RAISE NOTICE 'Invoices created';
END $$;

-- ============================================================================
-- STEP 10: Create Payments for Paid Invoices
-- ============================================================================

INSERT INTO payments (id, invoice_id, payment_date, amount, payment_method, reference_number, recorded_by, created_at)
SELECT
  gen_random_uuid(),
  i.id,
  i.paid_date,
  i.amount_paid,
  (ARRAY['check', 'credit_card', 'ach', 'cash'])[1 + (random() * 3)::int],
  CASE (random() * 3)::int
    WHEN 0 THEN 'CHK-' || LPAD((random() * 99999)::int::text, 5, '0')
    WHEN 1 THEN 'CC-' || LPAD((random() * 9999)::int::text, 4, '0')
    ELSE 'REF-' || LPAD((random() * 99999)::int::text, 5, '0')
  END,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  i.paid_date::timestamp
FROM invoices i
WHERE i.status = 'paid'
AND i.paid_date IS NOT NULL
AND i.customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%')
AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.invoice_id = i.id);

-- ============================================================================
-- STEP 11: Create Projects with Phases and Tasks
-- ============================================================================

DO $$
DECLARE
  v_admin_id uuid;
  v_tech_ids uuid[];
  v_customer record;
  v_project_id uuid;
  v_project_num text;
  v_phase_id uuid;
  v_next_proj_num integer;
  i integer;
BEGIN
  -- Get admin user
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  -- Get all technician IDs
  SELECT array_agg(id) INTO v_tech_ids FROM profiles WHERE role IN ('technician', 'admin', 'dispatcher') AND is_active = true;

  -- Get next project number
  SELECT COALESCE(MAX(SUBSTRING(project_number FROM 'P-(\d+)')::integer), 0) + 1 INTO v_next_proj_num FROM projects;

  -- Create projects for commercial customers
  FOR v_customer IN
    SELECT c.id as customer_id, c.name
    FROM customers c
    WHERE c.name LIKE 'SEED:%'
    AND (c.name LIKE '%Hospital%' OR c.name LIKE '%Resort%' OR c.name LIKE '%Center%'
         OR c.name LIKE '%School%' OR c.name LIKE '%Distribution%')
    LIMIT 5
  LOOP
    v_project_num := 'P-' || LPAD(v_next_proj_num::text, 5, '0');
    v_next_proj_num := v_next_proj_num + 1;

    -- Insert project with budget and actual_cost for margin calculations
    INSERT INTO projects (
      id, project_number, name, description, customer_id,
      status, priority, project_type, start_date, end_date,
      budget, actual_cost, estimated_hours, manager_id, created_by, created_at
    )
    SELECT
      gen_random_uuid(),
      v_project_num,
      CASE (random() * 3)::int
        WHEN 0 THEN 'HVAC System Replacement'
        WHEN 1 THEN 'Building Retrofit Project'
        WHEN 2 THEN 'Energy Efficiency Upgrade'
        ELSE 'Preventive Maintenance Program'
      END || ' - ' || SUBSTRING(v_customer.name FROM 'SEED: (.*)'),
      'Comprehensive HVAC project for commercial facility. Seed test data.',
      v_customer.customer_id,
      (ARRAY['planning', 'in_progress', 'in_progress', 'completed'])[1 + (random() * 3)::int]::project_status,
      'normal'::ticket_priority,
      'Installation',
      (now() - interval '3 months' + (random() * interval '2 months'))::date,
      (now() + interval '2 months' + (random() * interval '3 months'))::date,
      b.budget,
      b.budget * (0.60 + (random() * 0.35)), -- actual_cost is 60-95% of budget
      80 + (random() * 120),
      v_admin_id,
      v_admin_id,
      now() - interval '3 months'
    FROM (SELECT 15000 + (random() * 50000) as budget) b
    RETURNING id INTO v_project_id;

    -- Create phases for project
    FOR i IN 1..4 LOOP
      INSERT INTO project_phases (
        id, project_id, name, description, phase_order,
        start_date, end_date, budget_amount, status, percent_complete
      ) VALUES (
        gen_random_uuid(),
        v_project_id,
        (ARRAY['Planning & Design', 'Equipment Procurement', 'Installation', 'Testing & Commissioning'])[i],
        'Phase ' || i || ' of project - seed data',
        i,
        (now() - interval '3 months' + ((i-1) * interval '3 weeks'))::date,
        (now() - interval '3 months' + (i * interval '3 weeks'))::date,
        5000 + (random() * 10000),
        CASE
          WHEN i = 1 THEN 'completed'
          WHEN i = 2 THEN 'completed'
          WHEN i = 3 THEN 'in_progress'
          ELSE 'pending'
        END::milestone_status,
        CASE
          WHEN i <= 2 THEN 100
          WHEN i = 3 THEN 50 + (random() * 40)::int
          ELSE 0
        END
      )
      RETURNING id INTO v_phase_id;

      -- Create tasks for each phase
      INSERT INTO project_tasks (project_id, phase_id, name, assigned_to, start_date, end_date, estimated_hours, status, percent_complete)
      SELECT
        v_project_id,
        v_phase_id,
        task_name,
        v_tech_ids[1 + (random() * (array_length(v_tech_ids, 1) - 1))::int],
        (now() - interval '3 months' + ((i-1) * interval '3 weeks') + (s * interval '2 days'))::date,
        (now() - interval '3 months' + ((i-1) * interval '3 weeks') + ((s+1) * interval '2 days'))::date,
        4 + (random() * 12),
        CASE
          WHEN i <= 2 THEN 'completed'
          WHEN i = 3 AND s <= 2 THEN 'completed'
          WHEN i = 3 AND s = 3 THEN 'in_progress'
          ELSE 'not_started'
        END::task_status,
        CASE
          WHEN i <= 2 THEN 100
          WHEN i = 3 AND s <= 2 THEN 100
          WHEN i = 3 AND s = 3 THEN 50
          ELSE 0
        END
      FROM (
        VALUES
          (1, 'Site survey and assessment'),
          (2, 'Equipment selection'),
          (3, 'Material ordering'),
          (4, 'Installation work'),
          (5, 'Quality check')
      ) AS tasks(s, task_name)
      WHERE s <= 3;

    END LOOP;

  END LOOP;

  RAISE NOTICE 'Projects created';
END $$;

-- ============================================================================
-- STEP 12: Summary Statistics
-- ============================================================================

DO $$
DECLARE
  v_customer_count integer;
  v_equipment_count integer;
  v_ticket_count integer;
  v_invoice_count integer;
  v_project_count integer;
BEGIN
  SELECT COUNT(*) INTO v_customer_count FROM customers WHERE name LIKE 'SEED:%';
  SELECT COUNT(*) INTO v_equipment_count FROM equipment WHERE serial_number LIKE 'SEED-%';
  SELECT COUNT(*) INTO v_ticket_count FROM tickets WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%');
  SELECT COUNT(*) INTO v_invoice_count FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'SEED:%');
  SELECT COUNT(*) INTO v_project_count FROM projects WHERE name LIKE '%SEED:%' OR project_number LIKE 'P-%';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED DATA SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customers: %', v_customer_count;
  RAISE NOTICE 'Equipment: %', v_equipment_count;
  RAISE NOTICE 'Tickets: %', v_ticket_count;
  RAISE NOTICE 'Invoices: %', v_invoice_count;
  RAISE NOTICE 'Projects: %', v_project_count;
  RAISE NOTICE '========================================';
END $$;
