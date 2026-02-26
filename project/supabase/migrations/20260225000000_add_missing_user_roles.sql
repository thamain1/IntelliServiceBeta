-- Add the three missing roles used by the Dunaway persona set
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'office_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accounting';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lead_tech';
