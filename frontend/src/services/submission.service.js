import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const submitAssignment = async (assignmentId, formData, token) => {
  const response = await axios.post(
    `${API_URL}/submissions/${assignmentId}`,
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

const getSubmissionsByAssignment = async (assignmentId, token) => {
  const response = await axios.get(
    `${API_URL}/submissions/assignment/${assignmentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

const getStudentSubmissions = async (token, courseId = null) => {
  let url = `${API_URL}/submissions/my-submissions`;
  if (courseId) url += `?courseId=${courseId}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const gradeSubmission = async (submissionId, grade, remark, token) => {
  const response = await axios.put(
    `${API_URL}/submissions/${submissionId}/grade`,
    { grade, remark },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

const revertSubmission = async (submissionId, remark, token) => {
  const response = await axios.put(
    `${API_URL}/submissions/${submissionId}/revert`,
    { remark },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

const submissionService = {
  submitAssignment,
  getSubmissionsByAssignment,
  getStudentSubmissions,
  gradeSubmission,
  revertSubmission,
  getCourseGradebook: async (courseId, token) => {
    const response = await axios.get(
      `${API_URL}/submissions/course/${courseId}/gradebook`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },
};

export default submissionService;
