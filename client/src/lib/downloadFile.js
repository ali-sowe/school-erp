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

/**
 * Extract a human-readable error message from a failed download request.
 * Works with the standard API error shape: { success: false, message: string }
 * and also handles network/axios errors gracefully.
 */
export async function extractDownloadErrorMessage(error, fallbackMessage = 'Failed to download the file. Please try again.') {
  const data = error?.response?.data;

  // 1. Because downloadFile() requests responseType: 'blob', an error
  // response's JSON body comes back as a Blob too — axios doesn't parse it
  // for you just because the request failed. It has to be read and parsed
  // by hand to get at the backend's real message.
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed?.message) {
        return parsed.message;
      }
    } catch {
      // Not JSON (e.g. an HTML error page from a proxy) — fall through.
    }
  } else if (data?.message) {
    return data.message;
  }

  // 2. Axios status text (e.g., "Not Found", "Unauthorized")
  if (error?.response?.statusText) {
    return `Download failed: ${error.response.statusText}`;
  }

  // 3. Generic error message (e.g., network error)
  if (error?.message) {
    return error.message;
  }

  // 4. Ultimate fallback (caller-supplied, e.g. a translated string)
  return fallbackMessage;
}