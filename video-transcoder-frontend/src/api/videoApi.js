import api from "./axios";

// These functions talk to the real Spring Boot backend.
// They are not used yet (we're in frontend-only demo mode), but are kept
// ready so switching from demo mode to the real backend later is a
// one-line change in UploadPage.jsx and PreviewPage.jsx.

export const uploadVideo = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("video", file);

  const res = await api.post("/api/videos/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      const percent = Math.round((event.loaded * 100) / event.total);
      onProgress(percent);
    },
  });

  return res.data; // expected: { id, originalName, size, cloudUrl }
};

export const getVideoDetails = async (id) => {
  const res = await api.get(`/api/videos/${id}`);
  return res.data;
};

export const getPreviewUrl = async (id, quality) => {
  const res = await api.post(`/api/videos/${id}/preview`, { quality });
  return res.data; // expected: { url }
};

export const downloadVideo = async (id, quality) => {
  const res = await api.post(
    `/api/videos/${id}/download`,
    { quality },
    { responseType: "blob" }
  );
  return res.data; // blob
};