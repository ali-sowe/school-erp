import * as studentRepository from "../../repositories/student/student.repository.js";
import * as teacherRepository from "../../repositories/teacher/teacher.repository.js";
import * as attendanceRepository from "../../repositories/attendance/attendance.repository.js";
import * as approvalRepository from "../../repositories/approval/approval.repository.js";
import * as examRepository from "../../repositories/exam/exam.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";

// LATE counts as "attended" for this rate, same as ABSENT and EXCUSED both
// count as "not attended" — a late arrival still showed up. Only PRESENT
// and LATE go in the numerator.
function calculateAttendanceRate(statusCounts) {
    let present = 0;
    let total = 0;

    for (const row of statusCounts) {
        const count = Number(row.total);
        total += count;

        if (row.status === 'PRESENT' || row.status === 'LATE') {
            present += count;
        }
    }

    if (total === 0) {
        return 0;
    }

    return Math.round((present / total) * 100);
}

function todayAsMysqlDate() {
    return new Date().toISOString().slice(0, 10);
}

export async function getStats(schoolId) {
    const today = todayAsMysqlDate();

    const [studentCount, staffCount, attendanceSummary, pendingApprovalList] = await Promise.all([
        studentRepository.countForSchool(schoolId),
        teacherRepository.countForSchool(schoolId),
        attendanceRepository.getSchoolSummaryForDate(schoolId, today),
        approvalRepository.findAll(schoolId, { status: 'PENDING_REVIEW' }),
    ]);

    return {
        studentCount,
        staffCount,
        attendanceRate: calculateAttendanceRate(attendanceSummary),
        pendingApprovals: pendingApprovalList.length,
        // Capped client-side too, but no reason to ship more rows than the
        // dashboard card will ever render.
        pendingApprovalList: pendingApprovalList.slice(0, 5).map((request) => ({
            id: request.id,
            title: request.title,
            status: request.status,
        })),
    };
}

export async function getRecentActivity(schoolId, limit = 10) {
    const rows = await auditRepository.getRecentForSchool(schoolId, limit);

    return rows.map((row) => {
        const actorName = row.actor_first_name
            ? `${row.actor_first_name} ${row.actor_last_name}`
            : 'System';

        return {
            id: row.id,
            timestamp: row.created_at,
            // e.g. "Jane Doe created a STUDENT record" — readable without
            // needing a per-entity-type translation table right now.
            description: `${actorName} ${row.action.toLowerCase()}d a ${row.entity_type.toLowerCase()} record`,
        };
    });
}

export async function getUpcomingEvents(schoolId, limit = 5) {
    const today = todayAsMysqlDate();
    const exams = await examRepository.findUpcoming(schoolId, { from: today, limit });

    return exams.map((exam) => ({
        id: exam.id,
        title: exam.name,
        date: exam.planned_start_date,
    }));
}
