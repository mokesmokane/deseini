# Supabase Database Migrations

This directory contains database migration scripts for the Deseini application, following SOLID principles for database management.

## Migration: 20250328_update_charts_table.sql

This migration adds user tracking fields to the `charts` table to support proper Row Level Security (RLS) policies in Supabase:

- `created_by`: References a user in the auth.users table
- `created_at`: Timestamp of when the record was created
- `updated_at`: Timestamp that updates automatically on record changes

The migration also:
1. Creates a trigger to automatically update the `updated_at` column
2. Establishes RLS policies to ensure users can only view/edit their own charts
3. Sets appropriate constraints on columns

## How to Apply Migrations

### Option 1: Using the Supabase CLI (Recommended)

1. Ensure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed
2. Navigate to the project root directory
3. Run: `supabase db push`

### Option 2: Using the Helper Script

We've created a helper script to guide you through the migration process:

1. Navigate to the project root directory
2. Make the script executable: `chmod +x scripts/deploy-migration.js`
3. Run: `node scripts/deploy-migration.js`
4. Follow the prompts to review and apply the migration

### Option 3: Manual Application

If you prefer to apply the migration manually:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file
4. Execute the SQL statements

## Testing After Migration

After applying the migration, test the chart import functionality to verify the database changes are working correctly.

## Unit Testing

Once the migration is applied, consider adding unit tests to verify:

1. Chart creation with proper user attribution
2. RLS policies work correctly (users can only access their own charts)
3. Timestamps are automatically managed

## Rollback Plan

If issues arise after migration, a rollback can be performed by:

1. Creating a new migration that reverses these changes
2. Or using the Supabase Dashboard to manually remove the added columns
