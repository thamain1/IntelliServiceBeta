/*
  # Accounting Compliance - Phase 3

  This migration creates ERP-grade accounting infrastructure:
  - Accounting periods (month closing)
  - GL audit log (forensic trail)
  - Void logic for GL entries
  - Tax jurisdictions and ledger
  - Vendor 1099 tracking
  - Trial balance and compliance views
*/

-- 1. ACCOUNTING PERIODS (Month Closing)
CREATE TYPE period_status AS ENUM ('open', 'closing', 'closed');

CREATE TABLE IF NOT EXISTS accounting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    status period_status DEFAULT 'open',
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES profiles(id),
    locked_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fiscal_year, fiscal_period)
);

CREATE INDEX IF NOT EXISTS idx_accounting_periods_dates ON accounting_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_status ON accounting_periods(status);

-- 2. GL AUDIT LOG (Forensic Trail)
CREATE TYPE audit_action AS ENUM ('insert', 'update', 'void', 'delete_attempt');

CREATE TABLE IF NOT EXISTS gl_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gl_entry_id UUID,
    entry_number TEXT,
    action audit_action NOT NULL,
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    performed_by UUID REFERENCES profiles(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gl_audit_entry ON gl_audit_log(gl_entry_id);
CREATE INDEX IF NOT EXISTS idx_gl_audit_action ON gl_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_gl_audit_date ON gl_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_gl_audit_user ON gl_audit_log(performed_by);

-- 3. VOID LOGIC (Add columns to GL entries)
ALTER TABLE gl_entries
ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS void_reason TEXT,
ADD COLUMN IF NOT EXISTS reversing_entry_id UUID;

CREATE INDEX IF NOT EXISTS idx_gl_entries_voided ON gl_entries(is_voided) WHERE is_voided = TRUE;

-- 4. TAX COMPLIANCE
CREATE TABLE IF NOT EXISTS tax_jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    state_code TEXT,
    level TEXT CHECK (level IN ('state', 'county', 'city', 'special')),
    tax_rate DECIMAL(10, 4) NOT NULL,
    agency_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_jurisdictions_state ON tax_jurisdictions(state_code);
CREATE INDEX IF NOT EXISTS idx_tax_jurisdictions_active ON tax_jurisdictions(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS tax_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_source_type TEXT NOT NULL CHECK (transaction_source_type IN ('invoice', 'credit_memo', 'bill')),
    transaction_source_id UUID NOT NULL,
    jurisdiction_id UUID REFERENCES tax_jurisdictions(id),
    taxable_amount DECIMAL(19, 4) NOT NULL,
    tax_amount DECIMAL(19, 4) NOT NULL,
    transaction_date DATE NOT NULL,
    is_remitted BOOLEAN DEFAULT FALSE,
    remitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_ledger_source ON tax_ledger(transaction_source_type, transaction_source_id);
CREATE INDEX IF NOT EXISTS idx_tax_ledger_jurisdiction ON tax_ledger(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_tax_ledger_date ON tax_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_tax_ledger_remitted ON tax_ledger(is_remitted) WHERE is_remitted = FALSE;

-- 5. VENDOR 1099 TRACKING
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS tax_id_number TEXT,
ADD COLUMN IF NOT EXISTS is_1099_eligible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_1099_box TEXT CHECK (default_1099_box IN ('NEC', 'MISC', 'RENT', 'ROYALTIES'));

CREATE INDEX IF NOT EXISTS idx_vendors_1099 ON vendors(is_1099_eligible) WHERE is_1099_eligible = TRUE;

-- 6. RLS for new tables
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_ledger ENABLE ROW LEVEL SECURITY;

-- Accounting periods RLS
CREATE POLICY "Periods viewable by authenticated users"
    ON accounting_periods FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can modify periods"
    ON accounting_periods FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- GL audit log RLS (read-only for most, admins can see all)
CREATE POLICY "Audit log viewable by admins"
    ON gl_audit_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Tax jurisdictions RLS
CREATE POLICY "Tax jurisdictions viewable by all"
    ON tax_jurisdictions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can modify tax jurisdictions"
    ON tax_jurisdictions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Tax ledger RLS
CREATE POLICY "Tax ledger viewable by admins and accountants"
    ON tax_ledger FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 7. PREVENT GL DELETES
CREATE OR REPLACE FUNCTION prevent_gl_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the attempt
    INSERT INTO gl_audit_log (gl_entry_id, entry_number, action, performed_by, reason)
    VALUES (OLD.id, OLD.entry_number, 'delete_attempt', auth.uid(), 'Delete attempted but blocked');

    RAISE EXCEPTION 'GL entries cannot be deleted. Use void instead.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_gl_delete ON gl_entries;
CREATE TRIGGER trg_prevent_gl_delete
BEFORE DELETE ON gl_entries
FOR EACH ROW EXECUTE FUNCTION prevent_gl_delete();

-- 8. PERIOD LOCK ENFORCEMENT
CREATE OR REPLACE FUNCTION enforce_period_lock()
RETURNS TRIGGER AS $$
DECLARE
    period_record accounting_periods%ROWTYPE;
BEGIN
    -- Find the period for this entry date
    SELECT * INTO period_record
    FROM accounting_periods
    WHERE NEW.entry_date BETWEEN start_date AND end_date
    LIMIT 1;

    -- If period exists and is closed, reject the change
    IF period_record.id IS NOT NULL AND period_record.status = 'closed' THEN
        RAISE EXCEPTION 'Cannot modify entries in closed period: % (% to %)',
            period_record.name, period_record.start_date, period_record.end_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_period_lock ON gl_entries;
CREATE TRIGGER trg_enforce_period_lock
BEFORE INSERT OR UPDATE ON gl_entries
FOR EACH ROW EXECUTE FUNCTION enforce_period_lock();

-- 9. GL AUDIT TRIGGER
CREATE OR REPLACE FUNCTION log_gl_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO gl_audit_log (gl_entry_id, entry_number, action, new_values, performed_by)
        VALUES (NEW.id, NEW.entry_number, 'insert', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO gl_audit_log (
            gl_entry_id, entry_number, action, old_values, new_values,
            changed_fields, performed_by, reason
        )
        VALUES (
            NEW.id, NEW.entry_number,
            CASE WHEN NEW.is_voided = TRUE AND (OLD.is_voided IS NULL OR OLD.is_voided = FALSE) THEN 'void' ELSE 'update' END,
            to_jsonb(OLD), to_jsonb(NEW),
            (SELECT jsonb_object_agg(key, value) FROM jsonb_each(to_jsonb(NEW)) WHERE to_jsonb(OLD) -> key IS DISTINCT FROM value),
            auth.uid(),
            NEW.void_reason
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_gl_changes ON gl_entries;
CREATE TRIGGER trg_log_gl_changes
AFTER INSERT OR UPDATE ON gl_entries
FOR EACH ROW EXECUTE FUNCTION log_gl_changes();

-- 10. VOID ENTRY FUNCTION
CREATE OR REPLACE FUNCTION void_gl_entry(
    p_entry_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_entry gl_entries%ROWTYPE;
    v_reversing_id UUID;
    v_period_status period_status;
BEGIN
    -- Get the entry
    SELECT * INTO v_entry FROM gl_entries WHERE id = p_entry_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Entry not found');
    END IF;

    IF v_entry.is_voided THEN
        RETURN jsonb_build_object('success', false, 'error', 'Entry already voided');
    END IF;

    -- Check period
    SELECT status INTO v_period_status
    FROM accounting_periods
    WHERE v_entry.entry_date BETWEEN start_date AND end_date;

    IF v_period_status = 'closed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot void entry in closed period');
    END IF;

    -- Create reversing entry
    INSERT INTO gl_entries (
        account_id, entry_date, entry_number, description,
        debit_amount, credit_amount, reference_type, reference_id,
        fiscal_year, fiscal_period, posted_by, is_posted
    )
    VALUES (
        v_entry.account_id,
        CURRENT_DATE,
        'VOID-' || v_entry.entry_number,
        'VOID: ' || v_entry.description,
        v_entry.credit_amount,  -- Reverse the amounts
        v_entry.debit_amount,
        'void',
        v_entry.id,
        v_entry.fiscal_year,
        v_entry.fiscal_period,
        auth.uid(),
        TRUE
    )
    RETURNING id INTO v_reversing_id;

    -- Mark original as voided
    UPDATE gl_entries
    SET is_voided = TRUE,
        voided_at = NOW(),
        voided_by = auth.uid(),
        void_reason = p_reason,
        reversing_entry_id = v_reversing_id
    WHERE id = p_entry_id;

    RETURN jsonb_build_object(
        'success', true,
        'voided_entry_id', p_entry_id,
        'reversing_entry_id', v_reversing_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. COMPLIANCE VIEWS

-- Trial Balance View
CREATE OR REPLACE VIEW vw_trial_balance AS
SELECT
    coa.id as account_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.account_subtype,
    COALESCE(SUM(CASE WHEN gle.is_voided = FALSE THEN gle.debit_amount ELSE 0 END), 0) as total_debits,
    COALESCE(SUM(CASE WHEN gle.is_voided = FALSE THEN gle.credit_amount ELSE 0 END), 0) as total_credits,
    COALESCE(SUM(CASE WHEN gle.is_voided = FALSE THEN gle.debit_amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN gle.is_voided = FALSE THEN gle.credit_amount ELSE 0 END), 0) as balance
FROM chart_of_accounts coa
LEFT JOIN gl_entries gle ON coa.id = gle.account_id
WHERE coa.is_active = TRUE
GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.account_subtype
ORDER BY coa.account_code;

-- Sales Tax Liability Report View
CREATE OR REPLACE VIEW vw_sales_tax_liability AS
SELECT
    tj.id as jurisdiction_id,
    tj.name as jurisdiction,
    tj.state_code,
    tj.agency_name,
    DATE_TRUNC('month', tl.transaction_date)::DATE as period_start,
    (DATE_TRUNC('month', tl.transaction_date) + INTERVAL '1 month - 1 day')::DATE as period_end,
    SUM(tl.taxable_amount) as taxable_sales,
    SUM(tl.tax_amount) as tax_collected,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN tl.is_remitted THEN tl.tax_amount ELSE 0 END) as amount_remitted,
    SUM(CASE WHEN NOT tl.is_remitted THEN tl.tax_amount ELSE 0 END) as amount_due
FROM tax_ledger tl
JOIN tax_jurisdictions tj ON tl.jurisdiction_id = tj.id
GROUP BY tj.id, tj.name, tj.state_code, tj.agency_name, DATE_TRUNC('month', tl.transaction_date)
ORDER BY period_start DESC, jurisdiction;

-- 1099 Report View
CREATE OR REPLACE VIEW vw_1099_report AS
SELECT
    v.id as vendor_id,
    v.name as vendor_name,
    v.tax_id_number,
    v.default_1099_box as box_type,
    v.address,
    v.city,
    v.state,
    v.postal_code,
    EXTRACT(YEAR FROM vp.payment_date)::INTEGER as tax_year,
    COUNT(vp.id) as payment_count,
    SUM(vp.payment_amount) as total_paid
FROM vendors v
JOIN vendor_payments vp ON v.id = vp.vendor_id
WHERE v.is_1099_eligible = TRUE
GROUP BY v.id, v.name, v.tax_id_number, v.default_1099_box, v.address, v.city, v.state, v.postal_code, EXTRACT(YEAR FROM vp.payment_date)
HAVING SUM(vp.payment_amount) >= 600
ORDER BY tax_year DESC, total_paid DESC;

-- Accounting Period Status View
CREATE OR REPLACE VIEW vw_accounting_period_status AS
SELECT
    ap.id,
    ap.name,
    ap.fiscal_year,
    ap.fiscal_period,
    ap.start_date,
    ap.end_date,
    ap.status,
    ap.locked_at,
    p.full_name as locked_by_name,
    ap.locked_reason,
    COUNT(DISTINCT gle.id) as entry_count,
    COALESCE(SUM(gle.debit_amount), 0) as total_debits,
    COALESCE(SUM(gle.credit_amount), 0) as total_credits
FROM accounting_periods ap
LEFT JOIN profiles p ON ap.locked_by = p.id
LEFT JOIN gl_entries gle ON gle.entry_date BETWEEN ap.start_date AND ap.end_date
    AND gle.is_voided = FALSE
GROUP BY ap.id, ap.name, ap.fiscal_year, ap.fiscal_period, ap.start_date, ap.end_date,
         ap.status, ap.locked_at, p.full_name, ap.locked_reason
ORDER BY ap.fiscal_year DESC, ap.fiscal_period DESC;

-- Seed initial accounting periods for current year
DO $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    month_num INTEGER;
    month_name TEXT;
    month_start DATE;
    month_end DATE;
BEGIN
    FOR month_num IN 1..12 LOOP
        month_name := TO_CHAR(TO_DATE(month_num::TEXT, 'MM'), 'Month') || ' ' || current_year;
        month_start := DATE_TRUNC('month', MAKE_DATE(current_year, month_num, 1));
        month_end := (month_start + INTERVAL '1 month - 1 day')::DATE;

        INSERT INTO accounting_periods (name, start_date, end_date, fiscal_year, fiscal_period, status)
        VALUES (TRIM(month_name), month_start, month_end, current_year, month_num, 'open')
        ON CONFLICT (fiscal_year, fiscal_period) DO NOTHING;
    END LOOP;
END $$;

-- Seed sample tax jurisdictions for tri-state pilot (MS, LA, AL)
INSERT INTO tax_jurisdictions (name, code, state_code, level, tax_rate, agency_name, effective_date) VALUES
('Mississippi State', 'MS-STATE', 'MS', 'state', 0.0700, 'Mississippi Department of Revenue', '2020-01-01'),
('Louisiana State', 'LA-STATE', 'LA', 'state', 0.0445, 'Louisiana Department of Revenue', '2020-01-01'),
('Alabama State', 'AL-STATE', 'AL', 'state', 0.0400, 'Alabama Department of Revenue', '2020-01-01'),
('Hinds County, MS', 'MS-HINDS', 'MS', 'county', 0.0100, 'Hinds County Tax Collector', '2020-01-01'),
('Jackson, MS', 'MS-JACKSON', 'MS', 'city', 0.0100, 'City of Jackson', '2020-01-01'),
('New Orleans, LA', 'LA-NOLA', 'LA', 'city', 0.0500, 'City of New Orleans', '2020-01-01'),
('Jefferson Parish, LA', 'LA-JEFF', 'LA', 'county', 0.0500, 'Jefferson Parish Sheriff', '2020-01-01'),
('Birmingham, AL', 'AL-BHAM', 'AL', 'city', 0.0400, 'City of Birmingham', '2020-01-01'),
('Mobile, AL', 'AL-MOBILE', 'AL', 'city', 0.0500, 'City of Mobile', '2020-01-01')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE accounting_periods IS 'Fiscal periods for controlling GL entry modifications';
COMMENT ON TABLE gl_audit_log IS 'Forensic audit trail for all GL changes';
COMMENT ON TABLE tax_jurisdictions IS 'Tax authorities and rates by jurisdiction';
COMMENT ON TABLE tax_ledger IS 'Per-transaction tax collection tracking';
COMMENT ON FUNCTION void_gl_entry IS 'Safely void a GL entry by creating a reversing entry';
COMMENT ON VIEW vw_trial_balance IS 'CPA-ready trial balance showing all account balances';
COMMENT ON VIEW vw_sales_tax_liability IS 'Tax liability summary by jurisdiction and period';
COMMENT ON VIEW vw_1099_report IS 'Year-end 1099 preparation for eligible vendors';
