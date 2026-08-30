// Same decoupling shape as services/data-import/importer-registry.js, just
// running in the opposite direction: that engine turns a spreadsheet into
// ERP rows, this one turns ERP rows into a downloadable file. Neither
// engine knows which domains have registered with it — report.service.js
// only ever knows how to look up a dataset key and call it. A module
// wanting its data exportable registers itself at import time (see
// datasets/students.dataset.js) — adding "teachers" or "invoices" later is
// a new registry entry, not an engine change (ADR-005).
const datasets = new Map();

// definition: {
//   label: string — used as the document title / sheet name
//   permissions: string[] — ALL required to export this dataset, checked
//     in report.service.js in addition to the generic 'reports.read' the
//     route requires — a Teacher shouldn't see a finance-only dataset just
//     because they can run reports at all
//   columns: [{ key, label, width? }]
//   fetch: async (schoolId, filters) => rows[] (plain objects keyed by column.key)
// }
export function registerReportDataset(key, definition) {
    datasets.set(key, definition);
}

export function getReportDataset(key) {
    return datasets.get(key);
}

export function listReportDatasets() {
    return [...datasets.entries()].map(([key, definition]) => ({
        key,
        label: definition.label,
        permissions: definition.permissions
    }));
}
