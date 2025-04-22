
-- UP
BEGIN;

CREATE TABLE IF NOT EXISTS project_markdown (
  project_id   UUID PRIMARY KEY
                REFERENCES projects(id)
                ON DELETE CASCADE,
  content      TEXT   NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- DOWN (rollback)
-- DROP TABLE IF EXISTS project_markdown;