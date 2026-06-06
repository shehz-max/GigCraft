-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Single user ID (e.g., '1') or auth.uid()
    name TEXT NOT NULL,
    headline TEXT,
    base_rate NUMERIC,
    bio TEXT,
    tone TEXT DEFAULT 'Professional',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    technologies TEXT[] DEFAULT '{}',
    link TEXT,
    metrics TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create case_studies table
CREATE TABLE IF NOT EXISTS public.case_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    problem TEXT,
    solution TEXT,
    result TEXT,
    technologies TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create few_shot_proposals table
CREATE TABLE IF NOT EXISTS public.few_shot_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL, -- 'Upwork', 'Freelancer', etc.
    niche TEXT, -- 'Web Development', 'Design', etc.
    job_description TEXT NOT NULL,
    proposal TEXT NOT NULL,
    status TEXT DEFAULT 'Won', -- 'Sent', 'Replied', 'Won', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create proposals_history table
CREATE TABLE IF NOT EXISTS public.proposals_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_description TEXT NOT NULL,
    client_name TEXT,
    generated_proposal TEXT NOT NULL,
    generated_questions JSONB DEFAULT '[]'::jsonb,
    generated_loom_script TEXT,
    generated_milestones JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Draft', -- 'Draft', 'Sent', 'Viewed', 'Replied', 'Won', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Disable Row Level Security (RLS) for simple personal setup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.few_shot_proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals_history DISABLE ROW LEVEL SECURITY;
