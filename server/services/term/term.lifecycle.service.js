import * as termRepository from "../../repositories/term/term.repository.js";
import { determineTermStatus } from "../../helpers/term/term-status.helper.js";

export async function processTermLifecycle() {

    const today = new Date().toISOString().split("T")[0];

    const terms = await termRepository.findAll();

    for (const term of terms) {

        const expectedStatus = determineTermStatus(today, term);

        const updateData = {
            status: term.status,
            actual_start_date: term.actual_start_date,
            actual_end_date: term.actual_end_date
        };

        let hasChanges = false;

        if (expectedStatus !== term.status) {
            updateData.status = expectedStatus;
            hasChanges = true;
        }

        if (expectedStatus === "ACTIVE" && !term.actual_start_date) {
            updateData.actual_start_date = today;
            hasChanges = true;
        }

        if (expectedStatus === "COMPLETED" && !term.actual_end_date) {
            updateData.actual_end_date = today;
            hasChanges = true;
        }

        if (!hasChanges) {
            continue;
        }

        await termRepository.updateLifecycle(term.id, updateData);

        console.log(`${term.name} lifecycle updated.`);
    }
}
