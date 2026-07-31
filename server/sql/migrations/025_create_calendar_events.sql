-- School Calendar Engine — the "holidays, exam periods, school events" part
-- of what docs/School Calendar Engine Design.md describes; academic years
-- and terms already implement the lifecycle half of that engine.
--
-- Deliberately NOT auto-recurring by month/day. Gambian schools observe
-- both fixed-date holidays (e.g. Independence Day) and Islamic-calendar
-- holidays (Eid al-Fitr, Eid al-Adha, Ramadan-linked closures) that shift
-- roughly 11 days earlier every Gregorian year — a "repeat this date every
-- year" feature would be silently wrong for a large share of the calendar
-- a Gambian school actually needs. Every academic year's calendar is
-- configured explicitly instead (see calendar.service.js#copyEventsToYear
-- for a convenience copy that still leaves variable-date entries for the
-- admin to adjust, rather than blindly repeating them).
--
-- is_school_closed is the one field other modules integrate against (see
-- attendance.service.js#markAttendance) — a direct, explicit flag rather
-- than something inferred from category, since category is free text and
-- shouldn't have to be parsed to answer "can attendance be taken today".
CREATE TABLE IF NOT EXISTS calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NULL,
    category VARCHAR(50) NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_school_closed BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_calendar_events_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_calendar_events_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    CONSTRAINT fk_calendar_events_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_calendar_events_year ON calendar_events (academic_year_id);

-- The query every integration point actually runs: "is the school closed on
-- this date" — school_id + date range + the closed flag together, so that
-- lookup stays an index hit rather than a table scan as a school's calendar
-- history grows across academic years.
CREATE INDEX idx_calendar_events_school_dates ON calendar_events (school_id, is_school_closed, start_date, end_date);
