/*
  # Create roles and deliverables tables

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `title` (text)
      - `type` (text)
      - `country` (text)
      - `region` (text)
      - `town` (text)
      - `level` (text)
      - `professions` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `payment_by` (text)
      - `hourly_rate` (numeric)
      - `description` (text)

    - `deliverables`
      - `id` (uuid, primary key)
      - `role_id` (uuid, foreign key to roles)
      - `deliverable_name` (text)
      - `deadline` (date)
      - `fee` (numeric, nullable)
      - `description` (text)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read their own data
      - Create new data
      - Update their own data
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  country text NOT NULL,
  region text NOT NULL,
  town text NOT NULL,
  level text NOT NULL,
  professions text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  payment_by text NOT NULL,
  hourly_rate numeric(10,2) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  deliverable_name text NOT NULL,
  deadline date NOT NULL,
  fee numeric(10,2),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Policies for roles
CREATE POLICY "Users can read own roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = roles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create roles"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = roles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own roles"
  ON roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = roles.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = roles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policies for deliverables
CREATE POLICY "Users can read own deliverables"
  ON deliverables
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      JOIN projects ON projects.id = roles.project_id
      WHERE roles.id = deliverables.role_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create deliverables"
  ON deliverables
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      JOIN projects ON projects.id = roles.project_id
      WHERE roles.id = deliverables.role_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own deliverables"
  ON deliverables
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      JOIN projects ON projects.id = roles.project_id
      WHERE roles.id = deliverables.role_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      JOIN projects ON projects.id = roles.project_id
      WHERE roles.id = deliverables.role_id
      AND projects.user_id = auth.uid()
    )
  );