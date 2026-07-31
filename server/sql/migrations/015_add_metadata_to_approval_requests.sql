-- Adds workflow-specific data storage to the Approval Workflow Engine.
--
-- An executor often needs more than just entity_id to act (e.g.
-- STUDENT_TRANSFER needs the target class_id, not just which enrollment is
-- moving). Rather than adding a workflow-specific column to a table that's
-- deliberately decoupled from every module using it, a generic nullable
-- JSON column lets each workflow_type carry whatever shape it needs
-- (ADR-005: Configuration Over Hardcoding).

ALTER TABLE approval_requests ADD COLUMN metadata JSON NULL AFTER description;
