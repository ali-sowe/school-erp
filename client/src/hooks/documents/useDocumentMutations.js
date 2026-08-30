import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

function useDocumentMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// multer expects the file under the field name 'file' (see
// document-upload.middleware.js's buildUploader().single('file')) — every
// other field is plain form data alongside it, not JSON.
export function useUploadDocument() {
  return useDocumentMutation(async ({ file, title, category, description }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (category) formData.append('category', category);
    if (description) formData.append('description', description);

    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data;
  });
}

export function useUpdateDocument(documentId) {
  return useDocumentMutation(async (payload) => {
    const response = await api.patch(`/documents/${documentId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveDocument() {
  return useDocumentMutation(async (documentId) => {
    const response = await api.patch(`/documents/${documentId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreDocument() {
  return useDocumentMutation(async (documentId) => {
    const response = await api.patch(`/documents/${documentId}/restore`);
    return response.data?.data;
  });
}

// Only valid on a document whose preview or text extraction actually
// failed (see document.service.js — REPROCESS_NOT_ALLOWED otherwise).
export function useReprocessDocument() {
  return useDocumentMutation(async (documentId) => {
    const response = await api.post(`/documents/${documentId}/reprocess`);
    return response.data?.data;
  });
}
