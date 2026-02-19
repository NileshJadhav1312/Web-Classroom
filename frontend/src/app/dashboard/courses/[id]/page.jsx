"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { courseService } from "@/services/course.service";
import { materialService } from "@/services/material.service";
import assignmentService from "@/services/assignment.service";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatDate } from "../../../../../utils/formatDate";
import { toast } from "react-toastify";
import { useApiError } from "@/hooks/useApiError";

import enrollmentService from "@/services/enrollment.service";
import { attendanceService } from "@/services/attendance.service";
import submissionService from "@/services/submission.service";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState("materials");
  const [students, setStudents] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeAttendanceView, setActiveAttendanceView] = useState("stats"); // "stats" | "date"
  const [attendanceDates, setAttendanceDates] = useState([]);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState("");
  const [dateAttendanceList, setDateAttendanceList] = useState([]);
  const [dateLoading, setDateLoading] = useState(false);

  // New State for Modals
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionData, setSessionData] = useState(null); // { date, students: [] }
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [studentHistory, setStudentHistory] = useState(null); // { name, percentage, history: [] }
  const [historyLoading, setHistoryLoading] = useState(false);

  const { error, handleError } = useApiError();

  const fetchCourseDetails = async () => {
    try {
      const courseResponse = await courseService.getCourseById(id);
      setCourse(courseResponse.data);

      const materialsResponse = await materialService.getMaterialsByCourse(id);
      setMaterials(materialsResponse.data);

      const token = localStorage.getItem("token");
      const assignmentsResponse =
        await assignmentService.getAssignmentsByCourse(id, token);
      setAssignments(assignmentsResponse.data);

      const studentsResponse = await courseService.getStudentsByCourse(id);
      setStudents(studentsResponse.data);

      if (user?.role === "lecturer") {
        const pendingResponse =
          await enrollmentService.getPendingEnrollments(token);
        // Filter for this course
        const pendingForCourse = pendingResponse.data.filter(
          (e) => e.course._id === id || e.course === id,
        );
        setPendingEnrollments(pendingForCourse);

        // Fetch Attendance Stats
        try {
          const statsRes = await attendanceService.getCourseStats(id);
          console.log("Teacher Stats Response:", statsRes);
          setAttendanceStats(statsRes.data.data || []);

          // Fetch available dates
          const datesRes = await attendanceService.getAttendanceDates(id);
          console.log("Teacher Dates Response:", datesRes);
          setAttendanceDates(datesRes.data.data || []);
        } catch (err) {
          console.error("Failed to load attendance stats", err);
        }
      } else if (user?.role === "student") {
        try {
          const statsRes = await attendanceService.getStudentStats(id);
          console.log("Student Stats Response:", statsRes);
          setStudentAttendance(statsRes.data.data);
        } catch (err) {
          console.error("Failed to load student attendance", err);
        }
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = async (date) => {
    setSelectedAttendanceDate(date);
    if (!date) {
      setDateAttendanceList([]);
      return;
    }
    setDateLoading(true);
    try {
      const response = await attendanceService.getCourseAttendance(id, date);
      setDateAttendanceList(response.data || []);
    } catch (err) {
      console.error("Failed to fetch date attendance", err);
      toast.error("Failed to load attendance for selected date");
    } finally {
      setDateLoading(false);
    }
  };

  const handleViewSession = async (dateObj) => {
    // dateObj: { date, presentCount, absentCount }
    setSessionData({ ...dateObj, students: [] }); // Set metadata first
    setShowSessionModal(true);
    setDateLoading(true);
    try {
      const response = await attendanceService.getCourseAttendance(
        id,
        dateObj.date,
      );
      setSessionData((prev) => ({
        ...prev,
        students: response.data.data || [],
      }));
    } catch (err) {
      console.error("Failed to fetch session attendance", err);
      toast.error("Failed to load session details");
    } finally {
      setDateLoading(false);
    }
  };

  const handleViewHistory = async (student) => {
    // student: { _id, name }
    setStudentHistory({ ...student, history: [], percentage: 0 });
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const response = await attendanceService.getStudentStatisticsForTeacher(
        id,
        student._id,
      );
      setStudentHistory((prev) => ({ ...prev, ...response.data.data }));
    } catch (err) {
      console.error("Failed to fetch student history", err);
      toast.error("Failed to load student history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id, handleError, user]);

  const handleDeleteMaterial = async (materialId) => {
    try {
      await materialService.deleteMaterial(materialId);
      toast.info("Material has been successfully deleted!");
      setMaterials((prev) => prev.filter((m) => m._id !== materialId));
    } catch (err) {
      handleError(err);
    }
  };

  const handleApprove = async (enrollmentId) => {
    try {
      const token = localStorage.getItem("token");
      await enrollmentService.approveEnrollment(enrollmentId, token);
      toast.success("Enrollment approved");
      // Refresh data
      fetchCourseDetails();
    } catch (error) {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (enrollmentId) => {
    try {
      const token = localStorage.getItem("token");
      await enrollmentService.rejectEnrollment(enrollmentId, token);
      toast.success("Enrollment rejected");
      fetchCourseDetails();
    } catch (error) {
      toast.error("Failed to reject");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    try {
      await courseService.removeStudentFromCourse(id, studentId);
      toast.success("Student removed successfully");
      setStudents((prev) => prev.filter((s) => s._id !== studentId));
    } catch (error) {
      toast.error("Failed to remove student");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  if (!course) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-lg text-gray-600">Course not found.</p>
        <Link
          href="/dashboard/courses"
          className="btn-primary mt-4 inline-block"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Course Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col items-start lg:flex-row gap-4 lg:gap-0 justify-between">
          <h1 className="text-2xl font-bold mb-4">{course?.title}</h1>

          {user?.role === "lecturer" && (
            <div className="mb-4">
              <Link
                href={`/dashboard/courses/${course._id}/edit`}
                className="btn-secondary mr-2 px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 transition duration-200"
              >
                Edit Course
              </Link>
              <Link
                href={`/dashboard/courses/${course._id}/materials/upload`}
                className="btn-primary px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
              >
                Upload New Material
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center text-gray-600 mb-4">
          <span className="mr-4">Course Code: {course?.courseCode}</span>
        </div>
        <p className="text-gray-700 mb-4">{course?.description}</p>
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-4">
            No of Enrolled Students: {course?.students?.length || 0}
          </span>
          <span>No of Materials: {course?.materials?.length || 0}</span>
        </div>
      </div>

      {user?.role === "student" && !course.students.includes(user?._id) ? (
        <div className="bg-white p-8 rounded-lg shadow text-center mt-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You are not enrolled in this course or your enrollment is pending
            approval.
          </p>
          <Link
            href="/dashboard/courses"
            className="btn-primary bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Back to Courses
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "materials"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("materials")}
            >
              Course Materials
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "assignments"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments
            </button>
            {user?.role !== "student" && (
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "students"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("students")}
              >
                Enrolled Students
                {pendingEnrollments.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingEnrollments.length}
                  </span>
                )}
              </button>
            )}

            {user?.role === "student" && (
              <Link
                href={`/dashboard/courses/${course._id}/reports`}
                className="px-6 py-3 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View Report Card
              </Link>
            )}

            {(user?.role === "lecturer" || user?.role === "student") && (
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "attendance"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("attendance")}
              >
                Attendance
              </button>
            )}
          </div>

          <div className="p-6">
            {/* Materials Tab */}
            {activeTab === "materials" && (
              <div>
                {materials?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Uploaded
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {materials.map((material) => (
                          <tr key={material._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {material.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {material.updatedAt &&
                                formatDate(material.updatedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <a
                                href={material.fileUrl}
                                download
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Download
                              </a>
                              {user?.role === "lecturer" && (
                                <button
                                  onClick={() =>
                                    handleDeleteMaterial(material._id)
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      No materials have been uploaded for this course yet.
                    </p>
                    {user?.role === "lecturer" && (
                      <Link
                        href={`/dashboard/courses/${course?._id}/materials/upload`}
                        className="btn-primary px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
                      >
                        Upload First Material
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === "assignments" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Assignments ({assignments?.length || 0})
                  </h2>
                  {user?.role === "lecturer" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          document.getElementById("gradebook-modal").showModal()
                        }
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                      >
                        Overall Report
                      </button>
                      <Link
                        href={`/dashboard/courses/${course?._id}/assignments/new`}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                      >
                        Create Assignment
                      </Link>
                    </div>
                  )}
                </div>

                {/* Gradebook Modal */}
                {user?.role === "lecturer" && (
                  <GradebookModal courseId={course._id} />
                )}

                {assignments?.length > 0 ? (
                  <div className="grid gap-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment._id}
                        className="border p-4 rounded shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">
                              {assignment.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              Due:{" "}
                              {new Date(
                                assignment.dueDate,
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-gray-700">
                              {assignment.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/dashboard/courses/${course._id}/assignments/${assignment._id}`}
                              className="text-white bg-blue-500 px-3 py-1 rounded text-sm text-center hover:bg-blue-600"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No assignments created yet.
                  </p>
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === "students" && (
              <div>
                {user?.role === "lecturer" && pendingEnrollments.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-orange-600">
                      Pending Requests ({pendingEnrollments.length})
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 bg-orange-50">
                        <thead className="bg-orange-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pendingEnrollments.map((enrollment) => (
                            <tr key={enrollment._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {enrollment.student.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {enrollment.student.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleApprove(enrollment._id)}
                                  className="text-green-600 hover:text-green-900 mr-4 font-bold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(enrollment._id)}
                                  className="text-red-600 hover:text-red-900 font-bold"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <h2 className="text-lg font-semibold mb-4">
                  Enrolled Students ({students?.length || 0})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        {user?.role === "lecturer" && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students?.length > 0 ? (
                        students.map((student) => (
                          <tr key={student._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {student.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.email}
                            </td>
                            {user?.role === "lecturer" && (
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() =>
                                    handleRemoveStudent(student._id)
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="p-4 text-center text-gray-500"
                          >
                            No enrolled students.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <div>
                {user?.role === "lecturer" ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">
                        Student Attendance Records
                      </h2>
                      <div className="flex gap-4">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setActiveAttendanceView("stats")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              activeAttendanceView === "stats"
                                ? "bg-white shadow text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Overview Stats
                          </button>
                          <button
                            onClick={() => setActiveAttendanceView("date")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              activeAttendanceView === "date"
                                ? "bg-white shadow text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            By Date
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setShowAttendanceModal(true);
                          }}
                          className="btn-primary px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
                        >
                          Mark Attendance
                        </button>
                      </div>
                    </div>

                    {activeAttendanceView === "stats" ? (
                      attendanceStats.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Student Name
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Total Days Conducted
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Total Days Present
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Attendance %
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {attendanceStats.map((stat) => (
                                <tr key={stat._id}>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                                    {stat.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {stat.totalDays}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {stat.presentDays}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-blue-600">
                                    {typeof stat.percentage === "number"
                                      ? stat.percentage.toFixed(2)
                                      : stat.percentage}
                                    %
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                      onClick={() => handleViewHistory(stat)}
                                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                    >
                                      View History
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          No attendance records found. Start by clicking "Mark
                          Attendance".
                        </div>
                      )
                    ) : (
                      <div className="space-y-6">
                        {attendanceDates.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                  </th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Present
                                  </th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Absent
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {attendanceDates.map((dateObj) => (
                                  <tr key={dateObj._id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                      {formatDate(dateObj.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        {dateObj.presentCount || 0}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        {dateObj.absentCount || 0}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <button
                                        onClick={() =>
                                          handleViewSession(dateObj)
                                        }
                                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                      >
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            No attendance sessions found.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : user?.role === "student" && studentAttendance ? (
                  <div>
                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
                          Overall Attendance
                        </h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {studentAttendance.percentage}%
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
                          Days Present
                        </h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {studentAttendance.presentDays} /{" "}
                          {studentAttendance.totalDays}
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
                          Days Absent
                        </h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {(studentAttendance.totalDays || 0) -
                            (studentAttendance.presentDays || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Attendance History */}
                    <h3 className="text-lg font-semibold mb-4">
                      Attendance History
                    </h3>
                    {studentAttendance.history?.length > 0 ? (
                      <div className="bg-white shadow overflow-hidden rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {studentAttendance.history.map((record) => (
                            <li
                              key={record._id}
                              className="p-4 hover:bg-gray-50 transition"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <p className="text-sm font-medium text-blue-600 truncate">
                                    {new Date(record.date).toLocaleDateString(
                                      undefined,
                                      {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      },
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span
                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      record.status === "Present"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {record.status}
                                  </span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No attendance records found.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">Loading attendance...</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render Modal if showAttendanceModal is true */}
      {showAttendanceModal && (
        <AttendanceModal
          courseId={course._id}
          students={students}
          onClose={() => {
            setShowAttendanceModal(false);
          }}
          onSuccess={fetchCourseDetails}
        />
      )}

      {/* Session Details Modal */}
      <SessionDetailsModal
        show={showSessionModal}
        sessionData={sessionData}
        onClose={() => setShowSessionModal(false)}
      />

      {/* Student History Modal */}
      <StudentHistoryModal
        show={showHistoryModal}
        student={studentHistory}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
}

function GradebookModal({ courseId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGradebook = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await submissionService.getCourseGradebook(
        courseId,
        token,
      );
      console.log("Gradebook Data:", response.data);
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch gradebook", error);
      toast.error("Failed to load gradebook");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradebook();
  }, [courseId]);

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (!data) return;

    const assignmentHeaders = data.assignments.map((a) => `${a.title}`);
    const headers = [
      "Student Name",
      ...assignmentHeaders,
      "Total Marks",
      "Total Obtained",
      "Percentage",
    ];

    const rows = data.gradebook.map((entry) => {
      const assignmentGrades = data.assignments.map((a) => {
        const sub = entry.submissions[a._id];
        const obtained = sub && sub.grade !== undefined ? sub.grade : 0;
        return `${obtained}/${a.totalMarks}`;
      });

      const percentage =
        data.courseTotal > 0
          ? ((entry.totalObtained / data.courseTotal) * 100).toFixed(2) + "%"
          : "0%";

      return [
        entry.student.name,
        ...assignmentGrades,
        data.courseTotal,
        entry.totalObtained,
        percentage,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Overall_Gradebook.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <dialog
      id="gradebook-modal"
      className="p-0 rounded-lg shadow-xl backdrop:bg-gray-800/50 w-full max-w-6xl"
    >
      <div className="bg-white p-6 w-full h-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <h2 className="text-xl font-bold">Overall Assignment Report</h2>
          <button
            onClick={() => document.getElementById("gradebook-modal").close()}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <div id="gradebook-content">
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #gradebook-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                visibility: visible;
                display: block;
                background: white;
              }
              #gradebook-content,
              #gradebook-content * {
                visibility: visible;
              }
              dialog {
                position: static !important;
              }
            }
          `}</style>
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold mb-2">
              Overall Assignment Report
            </h2>
            <button
              onClick={fetchGradebook}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 underline no-print"
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          {loading ? (
            <div className="text-center p-8">Loading...</div>
          ) : data ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border">
                      Student Name
                    </th>
                    {data.assignments.map((a) => (
                      <th
                        key={a._id}
                        className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border"
                      >
                        {a.title}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border bg-gray-200">
                      Total Marks
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border bg-gray-200">
                      Total Obtained
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border bg-gray-200">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.gradebook.map((entry, idx) => {
                    const percentage =
                      data.courseTotal > 0
                        ? (
                            (entry.totalObtained / data.courseTotal) *
                            100
                          ).toFixed(2) + "%"
                        : "0%";
                    return (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap border font-medium">
                          {entry.student.name}
                        </td>
                        {data.assignments.map((a) => {
                          const sub = entry.submissions[a._id];
                          const marks =
                            sub && sub.grade !== undefined ? sub.grade : 0;
                          return (
                            <td
                              key={a._id}
                              className="px-6 py-4 whitespace-nowrap border text-center"
                            >
                              {marks}/{a.totalMarks}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap border text-center font-bold">
                          {data.courseTotal}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border text-center font-bold">
                          {entry.totalObtained}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border text-center font-bold text-blue-600">
                          {percentage}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No data available.</p>
          )}
        </div>

        <div className="flex gap-4 no-print mt-6 justify-end">
          <button
            onClick={() => document.getElementById("gradebook-modal").close()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Print Report
          </button>
          <button
            onClick={handleDownloadCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Download CSV
          </button>
        </div>
      </div>
    </dialog>
  );
}

function AttendanceModal({ courseId, students, onClose, onSuccess }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const modalRef = React.useRef(null);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  }, []);

  // Fetch attendance when date changes
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const response = await attendanceService.getCourseAttendance(
          courseId,
          date,
        );
        const records = response.data || [];
        // Map existing records
        const newMap = {};
        if (Array.isArray(records)) {
          records.forEach((r) => {
            if (r.student && r.student._id) {
              newMap[r.student._id] = r.status === "Present";
            }
          });
        }
        setAttendanceMap(newMap);
      } catch (error) {
        console.error("Failed to fetch attendance", error);
      } finally {
        setLoading(false);
      }
    };
    if (courseId && date) {
      fetchAttendance();
    }
  }, [courseId, date]);

  const handleToggle = (studentId) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleMarkAll = () => {
    const newMap = { ...attendanceMap };
    students.forEach((s) => {
      newMap[s._id] = true;
    });
    setAttendanceMap(newMap);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendanceMap[s._id] ? "Present" : "Absent",
      }));

      await attendanceService.markAttendance({
        courseId,
        date,
        records,
      });

      toast.success("Attendance marked successfully");
      onSuccess(); // Refresh stats
      onClose();
    } catch (error) {
      console.error("Failed to mark attendance", error);
      toast.error("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={modalRef}
      id="attendance-modal"
      className="p-0 rounded-lg shadow-xl backdrop:bg-gray-800/50 w-full max-w-2xl"
      onClose={onClose}
    >
      <div className="bg-white p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Manage Attendance</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Students ({students.length})</h3>
            <button
              onClick={handleMarkAll}
              className="text-sm text-blue-600 hover:underline"
              type="button"
            >
              Mark All Present
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto border rounded-md">
            {loading ? (
              <div className="p-4 text-center">Loading...</div>
            ) : students.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present?
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={!!attendanceMap[student._id]}
                          onChange={() => handleToggle(student._id)}
                          className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-4 text-gray-500 text-center">
                No students enrolled in this course.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || students.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function SessionDetailsModal({ show, onClose, sessionData }) {
  const modalRef = React.useRef(null);

  useEffect(() => {
    if (show && modalRef.current) {
      modalRef.current.showModal();
    } else if (!show && modalRef.current) {
      modalRef.current.close();
    }
  }, [show]);

  if (!show || !sessionData) return null;

  return (
    <dialog
      ref={modalRef}
      className="modal rounded-lg shadow-xl p-0 w-full max-w-2xl backdrop:bg-gray-500/50"
      onClose={onClose}
    >
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Session Details: {formatDate(sessionData.date)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
              <p className="text-xs text-green-600 uppercase font-semibold">
                Present
              </p>
              <p className="text-2xl font-bold text-green-700">
                {sessionData.presentCount || 0}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
              <p className="text-xs text-red-600 uppercase font-semibold">
                Absent
              </p>
              <p className="text-2xl font-bold text-red-700">
                {sessionData.absentCount || 0}
              </p>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessionData.students && sessionData.students.length > 0 ? (
                sessionData.students.map((record, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {record.student?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === "Present"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="2"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading student list...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  );
}

function StudentHistoryModal({ show, onClose, student }) {
  const modalRef = React.useRef(null);

  useEffect(() => {
    if (show && modalRef.current) {
      modalRef.current.showModal();
    } else if (!show && modalRef.current) {
      modalRef.current.close();
    }
  }, [show]);

  if (!show || !student) return null;

  return (
    <dialog
      ref={modalRef}
      className="modal rounded-lg shadow-xl p-0 w-full max-w-3xl backdrop:bg-gray-500/50"
      onClose={onClose}
    >
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Attendance History: {student.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
              <p className="text-xs text-blue-600 uppercase font-semibold">
                Attendance %
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {student.percentage}%
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
              <p className="text-xs text-green-600 uppercase font-semibold">
                Days Present
              </p>
              <p className="text-2xl font-bold text-green-700">
                {student.presentDays} / {student.totalDays}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
              <p className="text-xs text-red-600 uppercase font-semibold">
                Days Absent
              </p>
              <p className="text-2xl font-bold text-red-700">
                {(student.totalDays || 0) - (student.presentDays || 0)}
              </p>
            </div>
          </div>

          <h4 className="text-md font-semibold text-gray-800 mb-3">
            History Log
          </h4>
          <div className="space-y-3">
            {student.history && student.history.length > 0 ? (
              student.history.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDate(record.date)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      record.status === "Present"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No attendance history found.
              </p>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
