import { determineLifecycleStatus } from "../lifecycle/lifecycle-status.helper.js";

// Thin, module-named wrapper around the shared lifecycle calculator, kept so
// call sites read clearly (and so existing imports/tests don't need to change).
export function determineAcademicYearStatus(today, academicYear) {
    return determineLifecycleStatus(today, academicYear);
}
