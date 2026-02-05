-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    town TEXT,
    industry TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    access_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on company name to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Create monthly_reports table
CREATE TABLE IF NOT EXISTS monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    report_month DATE NOT NULL,
    employees_total INT DEFAULT 0,
    recruited_new INT DEFAULT 0,
    resigned_total INT DEFAULT 0,
    net_growth INT GENERATED ALWAYS AS (recruited_new - resigned_total) STORED,
    shortage_total INT DEFAULT 0,
    shortage_detail JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to ensure one report per company per month
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_reports_company_month ON monthly_reports(company_id, report_month);

-- Create helper index for querying by month
CREATE INDEX IF NOT EXISTS idx_monthly_reports_month ON monthly_reports(report_month);
