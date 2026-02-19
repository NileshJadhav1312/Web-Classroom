import axios from "../lib/axios";

export const materialService = {
  getMaterialsByCourse: async (courseId, params) => {
    const response = await axios.get(`/materials/${courseId}`, {
      params,
    });
    return response.data;
  },

  uploadMaterial: async (courseId, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value instanceof File ? value : String(value));
    });

    const response = await axios.post(`/materials/${courseId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteMaterial: async (id) => {
    const response = await axios.delete(`/materials/${id}`);
    return response.data;
  },

  getMaterialById: async (id) => {
    const response = await axios.get(`/materials/${id}`);
    return response.data;
  },
};
