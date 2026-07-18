-- Roles previously carried no permissions of their own: every user's
-- permissions were derived at login time from a hardcoded map keyed by
-- role_name (see helpers/auth/permission.helper.js). That contradicted
-- ADR-005 (Configuration Over Hardcoding) -- a school-created custom role
-- silently got zero permissions, and any `permissions` sent to
-- POST /roles was discarded.
--
-- This migration lets each role store its own permissions, so login reads
-- them from the role record instead of guessing from its name. The
-- hardcoded map in permission.helper.js is kept only as a fallback for rows
-- that predate this migration (NULL permissions).

ALTER TABLE roles ADD COLUMN permissions JSON NULL AFTER description;
