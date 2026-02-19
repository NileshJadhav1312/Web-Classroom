import api from "@/lib/axios";

export const analyticsService = {
  // Get Class Analytics (Teacher)
  getClassAnalytics: async (courseId) => {
    return await api.get(`/analytics/teacher/${courseId}`);
  },

  // Get Student Analytics (Student)
  getStudentAnalytics: async (courseId) => {
    return await api.get(`/analytics/student/${courseId}`);
  },
};
