import api from "@/lib/axios";

export const reportCardService = {
  // Generate Report (Lecturer)
  generateReportCard: async (data) => {
    return await api.post("/report-cards/generate", data);
  },

  // Publish/Unpublish (Lecturer)
  togglePublishStatus: async (data) => {
    return await api.post("/report-cards/publish", data);
  },

  // Get Report (Student: own published, Lecturer: any student in course)
  getReportCard: async (courseId, studentId = null) => {
    let url = `/report-cards?courseId=${courseId}`;
    if (studentId) {
      url += `&studentId=${studentId}`;
    }
    return await api.get(url);
  },

  // Get All Reports for Course
  getCourseReportCards: async (courseId) => {
    return await api.get(`/report-cards/course/${courseId}`);
  },
};
