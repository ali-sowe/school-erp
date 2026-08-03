import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Send, Trash2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import {
  useConversations,
  useConversationParticipants,
  useMessages,
  useCreateConversation,
  useSendMessage,
  useDeleteMessage,
  useMarkConversationRead,
  useConversationRealtimeSync,
  useConversationsListRealtimeSync,
} from '@/hooks/messaging/useConversations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/erp/EmptyState';
import { StaffMultiSelect } from '@/components/erp/StaffMultiSelect';

// Resolves "who am I talking to" for the conversation list, since a
// conversation row itself only carries a type/title, never participant
// names — see useConversationParticipants' own comment for why.
function useConversationTitle(conversation, currentUserId) {
  const { data: participants } = useConversationParticipants(conversation?.id);

  if (conversation?.type === 'GROUP' && conversation.title) {
    return conversation.title;
  }

  const others = (participants ?? []).filter((participant) => participant.user_id !== currentUserId);
  if (others.length === 0) return '…';

  return others.map((participant) => `${participant.first_name} ${participant.last_name}`).join(', ');
}

function ConversationListItem({ conversation, currentUserId, isActive, onClick }) {
  const title = useConversationTitle(conversation, currentUserId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-sm px-space-3 py-space-2 text-left text-sm transition-colors hover:bg-accent ${
        isActive ? 'bg-accent font-medium' : ''
      }`}
    >
      <p className="truncate">{title}</p>
    </button>
  );
}

function NewConversationDialog({ open, onOpenChange, onCreated }) {
  const { t } = useTranslation('communication');
  const [participantIds, setParticipantIds] = useState([]);
  const [title, setTitle] = useState('');
  const createConversation = useCreateConversation();

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setParticipantIds([]);
      setTitle('');
    }
  };

  const handleCreate = async () => {
    if (participantIds.length === 0) {
      toast.error(t('conversations.newDialog.participantsRequired'));
      return;
    }
    if (participantIds.length > 1 && !title.trim()) {
      toast.error(t('conversations.newDialog.titleRequiredForGroup'));
      return;
    }

    try {
      const conversation = await createConversation.mutateAsync({
        participant_ids: participantIds,
        ...(title.trim() ? { title: title.trim() } : {}),
      });
      toast.success(t('conversations.newDialog.toastSuccess'));
      handleClose(false);
      onCreated(conversation.id);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('conversations.newDialog.toastError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('conversations.newDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-space-4">
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('conversations.newDialog.participantsLabel')}</label>
            <StaffMultiSelect value={participantIds} onChange={setParticipantIds} />
          </div>
          {participantIds.length > 1 && (
            <div className="space-y-space-2">
              <label className="text-sm font-medium">{t('conversations.newDialog.groupTitleLabel')}</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="button" onClick={handleCreate} disabled={createConversation.isPending}>
            {createConversation.isPending ? t('common:states.loading', { ns: 'common' }) : t('common:actions.confirm', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageThread({ conversationId, currentUserId }) {
  const { t } = useTranslation('communication');
  const { data: messages, isLoading } = useMessages(conversationId);
  const { data: participants } = useConversationParticipants(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const deleteMessage = useDeleteMessage(conversationId);
  const markRead = useMarkConversationRead(conversationId);
  useConversationRealtimeSync(conversationId);

  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  const senderName = (senderId) => {
    if (senderId === currentUserId) return t('conversations.you');
    const sender = (participants ?? []).find((participant) => participant.user_id === senderId);
    return sender ? `${sender.first_name} ${sender.last_name}` : t('conversations.unknownSender');
  };

  useEffect(() => {
    markRead.mutate();
    // Only when the open conversation actually changes — marking read is a
    // one-time action per thread-open, not something to repeat on every
    // unrelated re-render (mutate/markRead are stable-enough to omit safely).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim()) return;

    try {
      await sendMessage.mutateAsync(draft.trim());
      setDraft('');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('conversations.toasts.sendError'));
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage.mutateAsync(messageId);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('conversations.toasts.deleteError'));
    }
  };

  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-space-3 overflow-y-auto p-space-4">
        {(messages ?? []).length === 0 && <EmptyState title={t('conversations.emptyThread')} />}
        {(messages ?? []).map((message) => {
          const isMine = message.sender_id === currentUserId;
          const isDeleted = message.status === 'DELETED';

          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md rounded-md px-space-3 py-space-2 ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-xs opacity-70">{senderName(message.sender_id)}</p>
                <p className="text-sm">{isDeleted ? t('conversations.messageDeleted') : message.body}</p>
                {isMine && !isDeleted && (
                  <button
                    type="button"
                    onClick={() => handleDelete(message.id)}
                    className="mt-space-1 inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t('common:actions.delete', { ns: 'common' })}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-space-2 border-t p-space-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('conversations.messagePlaceholder')}
        />
        <Button type="submit" size="icon" disabled={sendMessage.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function ConversationsPage() {
  const { t } = useTranslation('communication');
  const { user } = useAuth();

  const { data: conversations, isLoading } = useConversations();
  useConversationsListRealtimeSync();
  const [activeId, setActiveId] = useState(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  return (
    <div className="space-y-space-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('conversations.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('conversations.subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('conversations.newButton')}
        </Button>
      </div>

      <Card className="grid h-[32rem] grid-cols-[16rem_1fr] overflow-hidden">
        <div className="overflow-y-auto border-r p-space-2">
          {isLoading && <Skeleton className="h-10 w-full" />}
          {!isLoading && (conversations ?? []).length === 0 && (
            <EmptyState title={t('conversations.empty.title')} description={t('conversations.empty.description')} />
          )}
          {(conversations ?? []).map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={user?.id}
              isActive={conversation.id === activeId}
              onClick={() => setActiveId(conversation.id)}
            />
          ))}
        </div>

        <div className="overflow-hidden">
          {activeId ? (
            <MessageThread conversationId={activeId} currentUserId={user?.id} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState title={t('conversations.selectPrompt')} />
            </div>
          )}
        </div>
      </Card>

      <NewConversationDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} onCreated={setActiveId} />
    </div>
  );
}

export default ConversationsPage;
