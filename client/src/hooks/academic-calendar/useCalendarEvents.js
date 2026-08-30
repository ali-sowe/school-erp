import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// academicYearId is the common case (viewing one year's calendar); the
// backend also accepts category/status/from/to filters (see
// calendar.controller.js#getEvents) that callers can pass through params
// if a future page needs them — none currently do.
export function useCalendarEvents(academicYearId, params = {}) {
  return useQuery({
    queryKey: ['calendar-events', { academicYearId, ...params }],
    queryFn: async () => {
      const response = await api.get('/calendar-events', { params: { academic_year_id: academicYearId, ...params } });
      return response.data?.data ?? [];
    },
    enabled: Boolean(academicYearId),
  });
}

function useCalendarEventMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

export function useCreateCalendarEvent() {
  return useCalendarEventMutation(async (payload) => {
    const response = await api.post('/calendar-events', payload);
    return response.data?.data;
  });
}

export function useUpdateCalendarEvent(eventId) {
  return useCalendarEventMutation(async (payload) => {
    const response = await api.patch(`/calendar-events/${eventId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveCalendarEvent() {
  return useCalendarEventMutation(async (eventId) => {
    const response = await api.patch(`/calendar-events/${eventId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreCalendarEvent() {
  return useCalendarEventMutation(async (eventId) => {
    const response = await api.patch(`/calendar-events/${eventId}/restore`);
    return response.data?.data;
  });
}

// "Most of last year's calendar still applies" convenience — copies every
// active event verbatim into a new academic year (see
// calendar.service.js#copyEventsToYear). Deliberately not automatic: dates
// tied to the Islamic calendar (Eid, Ramadan-linked closures) shift roughly
// 11 days earlier every Gregorian year, so this is a starting point the
// admin is expected to review and adjust, not a "these dates are correct"
// promise — the confirmation dialog that calls this should say as much.
export function useCopyCalendarEvents() {
  return useCalendarEventMutation(async ({ sourceAcademicYearId, targetAcademicYearId }) => {
    const response = await api.post('/calendar-events/copy', {
      source_academic_year_id: sourceAcademicYearId,
      target_academic_year_id: targetAcademicYearId,
    });
    return response.data?.data;
  });
}
