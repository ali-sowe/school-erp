// Shared by every module that follows the SCHEDULED -> ACTIVE -> COMPLETED
// lifecycle (academic years, terms, and future calendar-driven entities).
// Actual dates take precedence over planned dates: reality overrides plans.
// See docs: School Calendar Engine Design.
export function determineLifecycleStatus(today, { start_date, end_date, actual_start_date, actual_end_date }) {

    const startDate = new Date(actual_start_date ?? start_date);
    const endDate = new Date(actual_end_date ?? end_date);
    const currentDate = new Date(today);

    if (currentDate < startDate) {
        return "SCHEDULED";
    }

    if (currentDate <= endDate) {
        return "ACTIVE";
    }

    return "COMPLETED";
}
