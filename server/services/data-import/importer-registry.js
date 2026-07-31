// Same decoupling shape as services/approval/workflow-executor-registry.js:
// the engine (import-batch.service.js) only ever knows how to look up a
// target_type and call it, never which domains have registered one. A
// module wanting to be importable registers itself at import time (see
// importers/student.importer.js) — adding "TEACHERS" or "EXAM_MARKS" later
// is a new registry entry, not an engine change (ADR-005).
const importers = new Map();

// definition: {
//   label: string — human-readable name for a target-types listing
//   expectedColumns: string[] — normalized header names the importer reads
//   validateRow: async (rowData, schoolId, context) => { valid, errors, normalized }
//   importRow: async (normalizedRowData, schoolId, userId, context) => { entityId }
// }
export function registerDataImporter(targetType, definition) {
    importers.set(targetType, definition);
}

export function getDataImporter(targetType) {
    return importers.get(targetType);
}

export function listDataImporters() {
    return [...importers.entries()].map(([targetType, definition]) => ({
        target_type: targetType,
        label: definition.label,
        expected_columns: definition.expectedColumns,
    }));
}
