import { determineLifecycleStatus } from "../lifecycle/lifecycle-status.helper.js";

export function determineTermStatus(today, term) {
    return determineLifecycleStatus(today, term);
}
