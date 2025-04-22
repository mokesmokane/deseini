/*
  # Add attachments table and storage configuration

  1. New Tables
    - `attachments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `file_path` (text)
      - `size` (bigint)
      - `type` (text)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `attachments` table
    - Add policies for authenticated users to manage their attachments
*/

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can upload attachments"
  ON attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = attachments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own attachments"
  ON attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = attachments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own attachments"
  ON attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = attachments.project_id
      AND projects.user_id = auth.uid()
    )
  );