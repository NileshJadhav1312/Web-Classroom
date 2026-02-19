import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const getNotifications = async (token) => {
  const response = await axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const markAsRead = async (id, token) => {
  const response = await axios.put(
    `${API_URL}/notifications/${id}/read`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
};

export default notificationService;
