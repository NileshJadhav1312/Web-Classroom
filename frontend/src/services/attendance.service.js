import api from "@/lib/axios";

export const attendanceService = {
  // Mark or Bulk Mark Attendance
  markAttendance: async (data) => {
    return await api.post("/attendance", data);
  },

  // Get Attendance for a specific Course and Date (Teacher View)
  getCourseAttendance: async (courseId, date) => {
    return await api.get(
      `/attendance/course?courseId=${courseId}&date=${date}`,
    );
  },

  // Get Student Attendance History & Stats (Student View)
  getStudentStats: async (courseId) => {
    return await api.get(`/attendance/student/${courseId}`);
  },

  // Get Aggregated Stats for Course (Teacher View)
  getCourseStats: async (courseId) => {
    return await api.get(`/attendance/stats/${courseId}`);
  },
  // Get attendance dates for a course
  getAttendanceDates: (courseId) => api.get(`/attendance/dates/${courseId}`),

  // Get specific student stats for teacher
  getStudentStatisticsForTeacher: (courseId, studentId) =>
    api.get(`/attendance/history/${courseId}/${studentId}`),
};
