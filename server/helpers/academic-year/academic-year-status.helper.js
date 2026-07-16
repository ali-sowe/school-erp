export function determineAcademicYearStatus(today, academicYear) {

    // Realty takes precedence over planned dates, so we check for actual dates first.
    const startDate = new Date(
        academicYear.actual_start_date ?? academicYear.start_date
    );

    const endDate = new Date(
        academicYear.actual_end_date ?? academicYear.end_date
    );

    const currentDate = new Date(today);

    if (currentDate < startDate) {
        return "SCHEDULED";
    }

    if (currentDate <= endDate) {
        return "ACTIVE";
    }

    return "COMPLETED";
}