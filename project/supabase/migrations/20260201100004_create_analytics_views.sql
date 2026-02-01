/*
  # Create Analytics Views for Problem/Resolution Code Analysis

  Creates the following views:
  - vw_problem_pareto: 80/20 analysis of problem frequency and cost
  - vw_resolution_pareto: Analysis of resolution code usage
  - vw_rework_analysis: Callback detection within 30 days
  - vw_equipment_reliability: MTBF by equipment model
  - vw_technician_quality: Tech performance based on callbacks
*/

-- Pareto Analysis View for Problem Codes
CREATE OR REPLACE VIEW vw_problem_pareto AS
SELECT
    sc.code,
    sc.label,
    sc.category,
    sc.severity,
    COUNT(t.id) as ticket_count,
    COALESCE(SUM(t.billed_amount), 0) as total_revenue,
    COALESCE(AVG(t.billed_amount), 0) as avg_ticket_value,
    ROUND(100.0 * COUNT(t.id) / NULLIF((SELECT COUNT(*) FROM tickets WHERE problem_code IS NOT NULL), 0), 2) as percentage_of_total,
    SUM(COUNT(t.id)) OVER (ORDER BY COUNT(t.id) DESC ROWS UNBOUNDED PRECEDING) as cumulative_count,
    ROUND(100.0 * SUM(COUNT(t.id)) OVER (ORDER BY COUNT(t.id) DESC ROWS UNBOUNDED PRECEDING) /
        NULLIF((SELECT COUNT(*) FROM tickets WHERE problem_code IS NOT NULL), 0), 2) as cumulative_percentage
FROM standard_codes sc
LEFT JOIN tickets t ON t.problem_code = sc.code
WHERE sc.code_type = 'problem' AND sc.is_active = TRUE
GROUP BY sc.code, sc.label, sc.category, sc.severity
ORDER BY ticket_count DESC;

-- Pareto Analysis View for Resolution Codes
CREATE OR REPLACE VIEW vw_resolution_pareto AS
SELECT
    sc.code,
    sc.label,
    sc.category,
    COUNT(t.id) as ticket_count,
    COALESCE(SUM(t.billed_amount), 0) as total_revenue,
    COALESCE(AVG(t.billed_amount), 0) as avg_ticket_value,
    ROUND(100.0 * COUNT(t.id) / NULLIF((SELECT COUNT(*) FROM tickets WHERE resolution_code IS NOT NULL), 0), 2) as percentage_of_total
FROM standard_codes sc
LEFT JOIN tickets t ON t.resolution_code = sc.code
WHERE sc.code_type = 'resolution' AND sc.is_active = TRUE
GROUP BY sc.code, sc.label, sc.category
ORDER BY ticket_count DESC;

-- Rework Analysis View (Callbacks within 30 days)
CREATE OR REPLACE VIEW vw_rework_analysis AS
SELECT
    t1.id as original_ticket_id,
    t1.ticket_number as original_ticket,
    t1.problem_code as original_problem,
    t1.resolution_code as original_resolution,
    t1.completed_at as original_completed,
    t2.id as callback_ticket_id,
    t2.ticket_number as callback_ticket,
    t2.problem_code as callback_problem,
    t2.created_at as callback_date,
    t1.assigned_to as technician_id,
    p.full_name as technician_name,
    t1.equipment_id,
    e.manufacturer as equipment_manufacturer,
    e.model_number as equipment_model,
    t1.customer_id,
    c.name as customer_name,
    EXTRACT(DAY FROM t2.created_at - t1.completed_at)::INTEGER as days_between
FROM tickets t1
JOIN tickets t2 ON t1.customer_id = t2.customer_id
    AND (t1.equipment_id = t2.equipment_id OR (t1.equipment_id IS NULL AND t2.equipment_id IS NULL))
    AND t2.created_at > t1.completed_at
    AND t2.created_at <= t1.completed_at + INTERVAL '30 days'
    AND t1.id != t2.id
LEFT JOIN profiles p ON t1.assigned_to = p.id
LEFT JOIN equipment e ON t1.equipment_id = e.id
LEFT JOIN customers c ON t1.customer_id = c.id
WHERE t1.status = 'completed'
ORDER BY t2.created_at DESC;

-- Equipment Reliability View (MTBF by Model)
CREATE OR REPLACE VIEW vw_equipment_reliability AS
WITH ticket_gaps AS (
    SELECT
        e.id as equipment_id,
        e.manufacturer,
        e.model_number,
        e.equipment_type,
        t.created_at as failure_date,
        LAG(t.created_at) OVER (PARTITION BY e.id ORDER BY t.created_at) as prev_failure_date,
        EXTRACT(DAY FROM t.created_at - LAG(t.created_at) OVER (PARTITION BY e.id ORDER BY t.created_at)) as days_since_last
    FROM equipment e
    JOIN tickets t ON t.equipment_id = e.id
    WHERE t.status = 'completed'
)
SELECT
    manufacturer,
    model_number,
    equipment_type,
    COUNT(DISTINCT equipment_id) as unit_count,
    COUNT(*) as total_service_calls,
    ROUND(AVG(days_since_last), 1) as avg_days_between_failures,
    MIN(days_since_last) as min_days_between,
    MAX(days_since_last) as max_days_between,
    COUNT(CASE WHEN days_since_last <= 30 THEN 1 END) as callbacks_within_30_days
FROM ticket_gaps
WHERE days_since_last IS NOT NULL
GROUP BY manufacturer, model_number, equipment_type
HAVING COUNT(*) > 1
ORDER BY avg_days_between_failures ASC NULLS LAST;

-- Technician Quality Metrics View
CREATE OR REPLACE VIEW vw_technician_quality AS
WITH tech_stats AS (
    SELECT
        t.assigned_to as technician_id,
        COUNT(t.id) as total_tickets,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
        COUNT(DISTINCT t.resolution_code) as unique_resolutions,
        COUNT(CASE WHEN t.resolution_code = 'RES-TEMP-FIX' THEN 1 END) as temp_fixes,
        SUM(t.billed_amount) as total_billed
    FROM tickets t
    WHERE t.assigned_to IS NOT NULL
    GROUP BY t.assigned_to
),
callback_stats AS (
    SELECT
        technician_id,
        COUNT(*) as callback_count
    FROM vw_rework_analysis
    GROUP BY technician_id
)
SELECT
    ts.technician_id,
    p.full_name as technician_name,
    ts.total_tickets,
    ts.completed_tickets,
    COALESCE(cs.callback_count, 0) as callback_count,
    ROUND(100.0 * COALESCE(cs.callback_count, 0) / NULLIF(ts.completed_tickets, 0), 2) as callback_rate,
    ts.temp_fixes,
    ROUND(100.0 * ts.temp_fixes / NULLIF(ts.completed_tickets, 0), 2) as temp_fix_rate,
    ts.total_billed,
    ROUND(ts.total_billed / NULLIF(ts.completed_tickets, 0), 2) as avg_ticket_value
FROM tech_stats ts
LEFT JOIN callback_stats cs ON ts.technician_id = cs.technician_id
LEFT JOIN profiles p ON ts.technician_id = p.id
ORDER BY callback_rate DESC NULLS LAST;

-- Sales Opportunities View (flagged tickets)
CREATE OR REPLACE VIEW vw_sales_opportunities AS
SELECT
    t.id as ticket_id,
    t.ticket_number,
    t.title,
    t.problem_code,
    sc_p.label as problem_label,
    t.resolution_code,
    sc_r.label as resolution_label,
    t.completed_at,
    t.customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    e.manufacturer as equipment_manufacturer,
    e.model_number as equipment_model,
    e.installation_date as equipment_install_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.installation_date))::INTEGER as equipment_age_years,
    t.assigned_to as technician_id,
    p.full_name as technician_name
FROM tickets t
LEFT JOIN standard_codes sc_p ON t.problem_code = sc_p.code
LEFT JOIN standard_codes sc_r ON t.resolution_code = sc_r.code
LEFT JOIN customers c ON t.customer_id = c.id
LEFT JOIN equipment e ON t.equipment_id = e.id
LEFT JOIN profiles p ON t.assigned_to = p.id
WHERE t.sales_opportunity_flag = TRUE
ORDER BY t.completed_at DESC;

-- Add comments
COMMENT ON VIEW vw_problem_pareto IS 'Pareto analysis showing top problem codes by frequency with cumulative percentages';
COMMENT ON VIEW vw_resolution_pareto IS 'Analysis of resolution code usage and revenue';
COMMENT ON VIEW vw_rework_analysis IS 'Identifies callbacks within 30 days of original service';
COMMENT ON VIEW vw_equipment_reliability IS 'Mean Time Between Failures analysis by equipment model';
COMMENT ON VIEW vw_technician_quality IS 'Technician performance metrics including callback and temp fix rates';
COMMENT ON VIEW vw_sales_opportunities IS 'Tickets flagged as sales opportunities based on problem/resolution codes';
