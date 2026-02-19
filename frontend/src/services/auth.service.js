import axios from "../lib/axios";

export const authService = {
  login: async (credentials) => {
    const response = await axios.post("/auth/login", credentials);
    return response.data;
  },

  register: async (data) => {
    const response = await axios.post("/auth/signup", data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await axios.put(`/users/${id}`, data);
    return response.data;
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
    } finally {
      localStorage.removeItem("token");
    }
  },

  verifyToken: async (token) => {
    const response = await axios.get("/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
