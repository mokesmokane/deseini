/*
  # Fix missing DELETE policies for roles and deliverables tables

  1. Changes
    - Add DELETE policy for roles table
    - Add DELETE policy for deliverables table
    - This ensures authenticated users can delete their own roles and deliverables

  2. Security
    - Maintains same security pattern as other policies
*/

-- Add missing DELETE policy for roles
CREATE POLICY "Users can delete own roles"
  ON roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = roles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Add missing DELETE policy for deliverables
CREATE POLICY "Users can delete own deliverables"
  ON deliverables
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      JOIN projects ON projects.id = roles.project_id
      WHERE roles.id = deliverables.role_id
      AND projects.user_id = auth.uid()
    )
  );
