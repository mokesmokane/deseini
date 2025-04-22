/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `project_name` (text)
      - `description` (text)
      - `banner_image` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users to:
      - Read their own projects
      - Create new projects
      - Update their own projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  description text,
  banner_image text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);