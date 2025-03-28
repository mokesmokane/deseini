-- Migration to create the charts table with a proper structure
-- Following SOLID principles with clear separation of concerns

-- Create the charts table with UUID primary key and JSON blob for chart data
CREATE TABLE IF NOT EXISTS "public"."charts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "chart_data" JSONB NOT NULL,
    "user_id" UUID REFERENCES auth.users(id) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_charts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_charts_updated_at_trigger
BEFORE UPDATE ON "public"."charts"
FOR EACH ROW
EXECUTE FUNCTION update_charts_updated_at();

-- Setup RLS policies for security
ALTER TABLE "public"."charts" ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing charts (all authenticated users can view)
CREATE POLICY "Charts are viewable by authenticated users" 
ON "public"."charts" FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for modifying charts (only owner can modify)
CREATE POLICY "Charts are editable by the user who created them" 
ON "public"."charts" FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS charts_user_id_idx ON "public"."charts" (user_id);
CREATE INDEX IF NOT EXISTS charts_created_at_idx ON "public"."charts" (created_at DESC);

-- Add a comment to document the table structure
COMMENT ON TABLE "public"."charts" IS 'Stores Gantt charts with JSON data structure';
