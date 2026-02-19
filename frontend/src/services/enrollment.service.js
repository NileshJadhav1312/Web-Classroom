import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const requestEnrollment = async (courseCode, token) => {
  const response = await axios.post(
    `${API_URL}/enrollment/request`,
    { courseCode },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
};

const getPendingEnrollments = async (token) => {
  const response = await axios.get(`${API_URL}/enrollment/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const approveEnrollment = async (enrollmentId, token) => {
  const response = await axios.put(
    `${API_URL}/enrollment/${enrollmentId}/approve`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
};

const rejectEnrollment = async (enrollmentId, token) => {
  const response = await axios.put(
    `${API_URL}/enrollment/${enrollmentId}/reject`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
};

const getStudentEnrollments = async (token) => {
  const response = await axios.get(`${API_URL}/enrollment/my-enrollments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const enrollmentService = {
  requestEnrollment,
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment,
  getStudentEnrollments,
};

export default enrollmentService;
