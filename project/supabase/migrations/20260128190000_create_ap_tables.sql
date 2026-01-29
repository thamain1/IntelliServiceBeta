-- Accounts Payable Tables Migration
-- Creates bills, bill_line_items, vendor_payments, and vendor_payment_allocations tables

-- Bills (vendor invoices)
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text NOT NULL UNIQUE,
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  bill_date date NOT NULL,
  due_date date NOT NULL,
  received_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'received', 'approved', 'partial', 'paid', 'void')),
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  balance_due numeric(12,2) NOT NULL DEFAULT 0,
  payment_terms text,
  reference_number text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bill line items
CREATE TABLE IF NOT EXISTS bill_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12,4) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  amount numeric(12,2) NOT NULL,
  gl_account_id uuid REFERENCES chart_of_accounts(id),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Vendor payments
CREATE TABLE IF NOT EXISTS vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number text NOT NULL UNIQUE,
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  payment_date date NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('check', 'ach', 'wire', 'credit_card', 'cash', 'other')),
  reference_number text,
  check_number text,
  bank_account_id uuid REFERENCES chart_of_accounts(id),
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Payment allocations (which bills a payment covers)
CREATE TABLE IF NOT EXISTS vendor_payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES vendor_payments(id) ON DELETE CASCADE,
  bill_id uuid NOT NULL REFERENCES bills(id),
  amount numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(payment_id, bill_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bill_line_items_bill_id ON bill_line_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_payment_date ON vendor_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_vendor_payment_allocations_payment_id ON vendor_payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payment_allocations_bill_id ON vendor_payment_allocations(bill_id);

-- AP aging view
CREATE OR REPLACE VIEW vw_ap_aging AS
SELECT
  v.id as vendor_id,
  v.name as vendor_name,
  v.vendor_code,
  COUNT(DISTINCT b.id) as bill_count,
  SUM(CASE WHEN b.due_date >= CURRENT_DATE THEN b.balance_due ELSE 0 END) as current_amount,
  SUM(CASE WHEN b.due_date < CURRENT_DATE AND b.due_date >= CURRENT_DATE - 30 THEN b.balance_due ELSE 0 END) as days_1_30,
  SUM(CASE WHEN b.due_date < CURRENT_DATE - 30 AND b.due_date >= CURRENT_DATE - 60 THEN b.balance_due ELSE 0 END) as days_31_60,
  SUM(CASE WHEN b.due_date < CURRENT_DATE - 60 AND b.due_date >= CURRENT_DATE - 90 THEN b.balance_due ELSE 0 END) as days_61_90,
  SUM(CASE WHEN b.due_date < CURRENT_DATE - 90 THEN b.balance_due ELSE 0 END) as days_over_90,
  SUM(b.balance_due) as total_balance
FROM vendors v
LEFT JOIN bills b ON b.vendor_id = v.id AND b.status NOT IN ('draft', 'void', 'paid')
GROUP BY v.id, v.name, v.vendor_code
HAVING SUM(b.balance_due) > 0 OR COUNT(b.id) > 0;

-- Function to generate next bill number
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  year_prefix text;
BEGIN
  year_prefix := to_char(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(
    CASE
      WHEN bill_number ~ ('^BILL-' || year_prefix || '-[0-9]+$')
      THEN CAST(SUBSTRING(bill_number FROM 'BILL-' || year_prefix || '-([0-9]+)$') AS integer)
      ELSE 0
    END
  ), 0) + 1 INTO next_num
  FROM bills;

  RETURN 'BILL-' || year_prefix || '-' || LPAD(next_num::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate next payment number
CREATE OR REPLACE FUNCTION generate_vendor_payment_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  year_prefix text;
BEGIN
  year_prefix := to_char(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(
    CASE
      WHEN payment_number ~ ('^VPMT-' || year_prefix || '-[0-9]+$')
      THEN CAST(SUBSTRING(payment_number FROM 'VPMT-' || year_prefix || '-([0-9]+)$') AS integer)
      ELSE 0
    END
  ), 0) + 1 INTO next_num
  FROM vendor_payments;

  RETURN 'VPMT-' || year_prefix || '-' || LPAD(next_num::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update bill balance when payment allocations change
CREATE OR REPLACE FUNCTION update_bill_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE bills
    SET
      amount_paid = COALESCE((
        SELECT SUM(amount) FROM vendor_payment_allocations WHERE bill_id = NEW.bill_id
      ), 0),
      balance_due = total_amount - COALESCE((
        SELECT SUM(amount) FROM vendor_payment_allocations WHERE bill_id = NEW.bill_id
      ), 0),
      status = CASE
        WHEN total_amount <= COALESCE((
          SELECT SUM(amount) FROM vendor_payment_allocations WHERE bill_id = NEW.bill_id
        ), 0) THEN 'paid'
        WHEN COALESCE((
          SELECT SUM(amount) FROM vendor_payment_allocations WHERE bill_id = NEW.bill_id
        ), 0) > 0 THEN 'partial'
        ELSE status
      END,
      updated_at = now()
    WHERE id = NEW.bill_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE bills
    SET
      amount_paid = COALESCE((
        SELECT SUM(amount) FROM vendor_payment_allocations WHERE bill_id = OLD.bill_id
      ), 0),
      balance_due = total_amount - COALESCE((
        SELECT SUM(amount) FROM vendor_payment_allocations WHERE bill_id = OLD.bill_id
      ), 0),
      status = CASE
        WHEN COALESCE((
          SELECT SUM(amount) FROM vendor_payment_allocations WHERE bill_id = OLD.bill_id
        ), 0) = 0 THEN 'approved'
        WHEN total_amount > COALESCE((
          SELECT SUM(amount) FROM vendor_payment_allocations WHERE bill_id = OLD.bill_id
        ), 0) THEN 'partial'
        ELSE 'paid'
      END,
      updated_at = now()
    WHERE id = OLD.bill_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_bill_balance ON vendor_payment_allocations;
CREATE TRIGGER trg_update_bill_balance
AFTER INSERT OR UPDATE OR DELETE ON vendor_payment_allocations
FOR EACH ROW EXECUTE FUNCTION update_bill_balance();

-- Trigger to recalculate bill totals when line items change
CREATE OR REPLACE FUNCTION recalculate_bill_totals()
RETURNS TRIGGER AS $$
DECLARE
  bill_uuid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    bill_uuid := OLD.bill_id;
  ELSE
    bill_uuid := NEW.bill_id;
  END IF;

  UPDATE bills
  SET
    subtotal = COALESCE((
      SELECT SUM(amount) FROM bill_line_items WHERE bill_id = bill_uuid
    ), 0),
    total_amount = COALESCE((
      SELECT SUM(amount) FROM bill_line_items WHERE bill_id = bill_uuid
    ), 0) + COALESCE(tax_amount, 0),
    balance_due = COALESCE((
      SELECT SUM(amount) FROM bill_line_items WHERE bill_id = bill_uuid
    ), 0) + COALESCE(tax_amount, 0) - COALESCE(amount_paid, 0),
    updated_at = now()
  WHERE id = bill_uuid;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_bill_totals ON bill_line_items;
CREATE TRIGGER trg_recalculate_bill_totals
AFTER INSERT OR UPDATE OR DELETE ON bill_line_items
FOR EACH ROW EXECUTE FUNCTION recalculate_bill_totals();

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payment_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies for bills
CREATE POLICY "Users can view bills" ON bills
  FOR SELECT USING (true);

CREATE POLICY "Users can insert bills" ON bills
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update bills" ON bills
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete draft bills" ON bills
  FOR DELETE USING (status = 'draft');

-- RLS policies for bill_line_items
CREATE POLICY "Users can view bill_line_items" ON bill_line_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert bill_line_items" ON bill_line_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update bill_line_items" ON bill_line_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete bill_line_items" ON bill_line_items
  FOR DELETE USING (true);

-- RLS policies for vendor_payments
CREATE POLICY "Users can view vendor_payments" ON vendor_payments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vendor_payments" ON vendor_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update vendor_payments" ON vendor_payments
  FOR UPDATE USING (true);

-- RLS policies for vendor_payment_allocations
CREATE POLICY "Users can view vendor_payment_allocations" ON vendor_payment_allocations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vendor_payment_allocations" ON vendor_payment_allocations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete vendor_payment_allocations" ON vendor_payment_allocations
  FOR DELETE USING (true);
