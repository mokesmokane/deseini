/*
  # Create attachments table and link to projects

  1. New Tables
    - `attachments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `name` (text)
      - `file_path` (text)
      - `size` (bigint)
      - `type` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on attachments table
    - Add policies for authenticated users to:
      - Create attachments for their projects
      - Read attachments from their projects
      - Delete attachments from their projects
*/

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy for inserting attachments
CREATE POLICY "Users can create attachments for their projects"
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

-- Policy for reading attachments
CREATE POLICY "Users can read attachments from their projects"
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

-- Policy for deleting attachments
CREATE POLICY "Users can delete attachments from their projects"
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