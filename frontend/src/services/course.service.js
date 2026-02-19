import axios from "../lib/axios";

export const courseService = {
  getAllCourses: async (params) => {
    const response = await axios.get("/courses", { params });
    return response.data;
  },

  getLecturerCourses: async (lecturerId, params) => {
    const response = await axios.get(`/courses/lecturer/${lecturerId}`, {
      params,
    });
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await axios.get(`/courses/${id}`);
    return response.data;
  },

  getStudentsByCourse: async (courseId) => {
    const response = await axios.get(`/courses/${courseId}/students`);
    return response.data;
  },

  getEnrolledCourses: async () => {
    const response = await axios.get("/courses/students");
    return response.data;
  },

  enrollStudent: async (courseId) => {
    const response = await axios.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  disenrollStudent: async (courseId) => {
    const response = await axios.delete(`/courses/${courseId}/disenroll`);
    return response.data;
  },

  removeStudentFromCourse: async (courseId, studentId) => {
    const response = await axios.delete(
      `/courses/${courseId}/students/${studentId}`,
    );
    return response.data;
  },

  createCourse: async (data) => {
    const response = await axios.post("/courses", data);
    return response.data;
  },

  updateCourse: async (id, data) => {
    const response = await axios.put(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await axios.delete(`/courses/${id}`);
    return response.data;
  },
};
