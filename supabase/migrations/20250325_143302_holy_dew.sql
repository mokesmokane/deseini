/*
  # Fix role deletion cascade

  1. Changes
    - Add ON DELETE CASCADE to role foreign key constraints
    - This ensures when a role is deleted, its deliverables are automatically deleted

  2. Security
    - No changes to RLS policies
*/

-- First drop the existing foreign key constraint
ALTER TABLE deliverables
DROP CONSTRAINT IF EXISTS deliverables_role_id_fkey;

-- Re-add it with CASCADE
ALTER TABLE deliverables
ADD CONSTRAINT deliverables_role_id_fkey
FOREIGN KEY (role_id)
REFERENCES roles(id)
ON DELETE CASCADE;