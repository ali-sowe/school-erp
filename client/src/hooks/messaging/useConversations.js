import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useRealtimeEvent } from '@/context/RealtimeContext';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/conversations');
      return response.data?.data ?? [];
    },
  });
}

export function useConversation(conversationId) {
  return useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => {
      const response = await api.get(`/conversations/${conversationId}`);
      return response.data?.data;
    },
    enabled: Boolean(conversationId),
  });
}

// Conversations only ever store bare user_id rows (no join — see
// conversation-participant.repository.js), so this is the one place a
// thread's display name gets resolved, same id-to-name pattern as
// AdminDashboard's role_id and FinancePage's student_id.
export function useConversationParticipants(conversationId) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'participants'],
    queryFn: async () => {
      const response = await api.get(`/conversations/${conversationId}/participants`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(conversationId),
  });
}

export function useMessages(conversationId) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: async () => {
      const response = await api.get(`/conversations/${conversationId}/messages`);
      // Server returns newest-first (see message.repository.js's
      // findForConversation, ORDER BY id DESC) for cursor pagination —
      // reversed here so the thread renders oldest-to-newest, top-to-bottom.
      return (response.data?.data ?? []).slice().reverse();
    },
    enabled: Boolean(conversationId),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/conversations', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Optimistic updates for sending a message: add it to the list immediately, 
// then reconcile with the server response (or roll back on error). This is a bit more complex than the other mutations because we need to know the current user ID to construct a temporary message object. The current user ID is stored in the auth query cache, so we can retrieve it from there.
export function useSendMessage(conversationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body) => {
      const response = await api.post(`/conversations/${conversationId}/messages`, { body });
      return response.data?.data;
    },
    // Optimistically add the new message to the list
    onMutate: async (newMessageBody) => {
      const queryKey = ['conversations', conversationId, 'messages'];

      // Cancel any outgoing refetches for this query
      await queryClient.cancelQueries({ queryKey });

      // Get the current messages (oldest → newest, as useMessages returns)
      const previousMessages = queryClient.getQueryData(queryKey) ?? [];

      // Construct a temporary message object matching your backend shape
      // Adjust field names to match your real Message type.
      const tempMessage = {
        id: `temp-${Date.now()}`, // temporary ID until server responds
        conversation_id: conversationId,
        body: newMessageBody,
        sender_id: queryClient.getQueryData(['auth', 'user'])?.id, // or pass currentUserId in
        created_at: new Date().toISOString(),
        status: 'SENT', // or whatever your UI expects
      };

      // Append to the end (because useMessages returns oldest→newest)
      queryClient.setQueryData(queryKey, (old = []) => [...old, tempMessage]);

      // Return context for rollback
      return { previousMessages };
    },
    onError: (err, newMessageBody, context) => {
      const queryKey = ['conversations', conversationId, 'messages'];
      // Roll back to previous messages on error
      queryClient.setQueryData(queryKey, context?.previousMessages ?? []);
      // Optional: toast already handled in handleSend
    },
    onSuccess: () => {
      // Refetch to reconcile with server (real ID, timestamps, etc.)
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}


export function useDeleteMessage(conversationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId) => {
      const response = await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
    },
  });
}

export function useMarkConversationRead(conversationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.patch(`/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Subscribes to live message events for the currently-open conversation.
// The server pushes 'message:new'/'message:deleted' to every *other*
// participant (the sender already has it from their own mutation response
// — see conversation.service.js's sendMessage), so this only needs to
// refresh when a message belongs to the thread the user has open.
export function useConversationRealtimeSync(conversationId) {
  const queryClient = useQueryClient();

  useRealtimeEvent('message:new', (message) => {
    if (message.conversation_id !== conversationId) return;
    queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  });

  useRealtimeEvent('message:deleted', (payload) => {
    if (payload.conversation_id !== conversationId) return;
    queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
  });
}

// The server emits 'message:new' to every recipient regardless of which
// conversation (if any) they currently have open — but
// useConversationRealtimeSync above only listens while that specific
// thread is the active one. Without this, a message arriving in a
// conversation the user isn't currently viewing never refreshes the
// sidebar list at all, so it goes stale until a manual reload. This is
// unconditional (no conversation_id filter) and meant to be mounted once,
// at the page level, alongside the list query itself.
export function useConversationsListRealtimeSync() {
  const queryClient = useQueryClient();

  useRealtimeEvent('message:new', () => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  });
}
