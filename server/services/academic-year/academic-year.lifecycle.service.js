export async function processAcademicYearLifecycle() {

    const today = new Date().toISOString().split("T")[0];

    const academicYears = await academicYearRepository.findAll();

    for (const academicYear of academicYears) {

        const expectedStatus =
            determineAcademicYearStatus(today, academicYear);

        const updateData = {
            status: academicYear.status,
            actual_start_date: academicYear.actual_start_date,
            actual_end_date: academicYear.actual_end_date
        };

        let hasChanges = false;

        // Status changed?
        if (expectedStatus !== academicYear.status) {
            updateData.status = expectedStatus;
            hasChanges = true;
        }

        // Opened today?
        if (
            expectedStatus === "ACTIVE" &&
            !academicYear.actual_start_date
        ) {
            updateData.actual_start_date = today;
            hasChanges = true;
        }

        // Closed today?
        if (
            expectedStatus === "COMPLETED" &&
            !academicYear.actual_end_date
        ) {
            updateData.actual_end_date = today;
            hasChanges = true;
        }

        if (!hasChanges) {
            continue;
        }

        await academicYearRepository.updateLifecycle(
            academicYear.id,
            updateData
        );

        console.log(
            `${academicYear.name} lifecycle updated.`
        );
    }
}