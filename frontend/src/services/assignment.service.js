import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const createAssignment = async (courseId, formData, token) => {
  const response = await axios.post(
    `${API_URL}/assignments/${courseId}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

const getAssignmentsByCourse = async (courseId, token) => {
  const response = await axios.get(`${API_URL}/assignments/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const updateAssignment = async (id, data, token) => {
  const response = await axios.put(`${API_URL}/assignments/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const deleteAssignment = async (id, token) => {
  const response = await axios.delete(`${API_URL}/assignments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const assignmentService = {
  createAssignment,
  getAssignmentsByCourse,
  updateAssignment,
  deleteAssignment,
};

export default assignmentService;
