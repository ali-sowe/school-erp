import api from '@/services/api';

// Extracts the filename the server chose (see report.controller.js's
// Content-Disposition header) instead of hardcoding one client-side, so a
// filename change on the backend doesn't need a matching frontend edit.
function extractFilename(contentDisposition, fallback) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/);
  return match?.[1] || fallback;
}

// Goes through the shared `api` instance (not a raw <a href>) so an
// expired access token still gets silently refreshed via the response
// interceptor instead of the download just failing.
export async function downloadFile(url, { params, fallbackFilename = 'download' } = {}) {
  const response = await api.get(url, { params, responseType: 'blob' });

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = extractFilename(response.headers['content-disposition'], fallbackFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
