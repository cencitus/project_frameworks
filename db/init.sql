-- Enable extensions for UUID generation (one of them should exist)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
    CREATE TYPE role_enum AS ENUM ('ENGINEER','MANAGER','VIEWER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_enum') THEN
    CREATE TYPE priority_enum AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
    CREATE TYPE status_enum AS ENUM ('NEW','IN_PROGRESS','IN_REVIEW','CLOSED','CANCELLED');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role role_enum NOT NULL DEFAULT 'ENGINEER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority priority_enum NOT NULL DEFAULT 'MEDIUM',
  status status_enum NOT NULL DEFAULT 'NEW',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS defects_status_idx ON defects(status);
CREATE INDEX IF NOT EXISTS defects_project_idx ON defects(project_id);
CREATE INDEX IF NOT EXISTS defects_assignee_idx ON defects(assignee_id);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- minimal seed project (optional)
INSERT INTO projects (name) 
SELECT 'Demo Project'
WHERE NOT EXISTS (SELECT 1 FROM projects);
