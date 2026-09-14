import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// ---- Members ----
export const getMembers = (search = "") =>
  api.get("/members", { params: search ? { search } : {} }).then((r) => r.data);

export const getMember = (id) => api.get(`/members/${id}`).then((r) => r.data);

export const createMember = (formData) =>
  api
    .post("/members", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);

export const updateMember = (id, formData) =>
  api
    .put(`/members/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);

export const deleteMember = (id) => api.delete(`/members/${id}`).then((r) => r.data);

export const renewMember = (id, payload) =>
  api.post(`/members/${id}/renew`, payload).then((r) => r.data);

export const getDashboardStats = () => api.get("/members/stats/dashboard").then((r) => r.data);

// ---- WhatsApp ----
export const getWhatsappStatus = () => api.get("/whatsapp/status").then((r) => r.data);

export const sendWhatsappReminder = (payload) =>
  api.post("/whatsapp/send-reminder", payload).then((r) => r.data);

export const runReminderCheck = () =>
  api.post("/whatsapp/run-reminder-check").then((r) => r.data);

// ---- Settings ----
export const getSettings = () => api.get("/settings").then((r) => r.data);

export const updateSettings = (payload) => api.put("/settings", payload).then((r) => r.data);

export default api;
