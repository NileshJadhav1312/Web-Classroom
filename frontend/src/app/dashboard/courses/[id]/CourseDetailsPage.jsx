"use client";
import { useState, useEffect } from "react";
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

import AttendanceTracker from "@/components/AttendanceTracker";
import StudentAttendanceView from "@/components/StudentAttendanceView";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState("materials");
  const [students, setStudents] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
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
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id, handleError, user]);

  const handleDeleteCourse = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone.",
      )
    )
      return;
    try {
      await courseService.deleteCourse(id);
      toast.success("Course deleted successfully");
      window.location.href = "/dashboard/courses";
    } catch (err) {
      handleError(err);
    }
  };

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
              <button
                onClick={handleDeleteCourse}
                className="btn-danger px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition duration-200"
              >
                Delete Course
              </button>
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
          <div className="flex border-b overflow-x-auto">
            <button
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === "materials"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("materials")}
            >
              Course Materials
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
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
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
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
            <button
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === "attendance"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("attendance")}
            >
              Attendance
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === "analytics"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("analytics")}
            >
              Analytics
            </button>

            {user?.role === "student" && (
              <Link
                href={`/dashboard/courses/${course._id}/reports`}
                className="px-6 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                View Report Card
              </Link>
            )}
          </div>

          <div className="p-6">
            {/* Materials Tab */}
            {activeTab === "materials" && (
              <div>
                {user?.role === "lecturer" && (
                  <div className="mb-4 flex justify-end">
                    <Link
                      href={`/dashboard/courses/${course?._id}/materials/upload`}
                      className="btn-primary px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
                    >
                      Upload New Material
                    </Link>
                  </div>
                )}
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
                        <p className="p-4 text-gray-500">
                          No enrolled students.
                        </p>
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
                  <AttendanceTracker courseId={course?._id} />
                ) : (
                  <StudentAttendanceView courseId={course?._id} />
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div>
                {user?.role === "lecturer" ? (
                  <TeacherAnalytics courseId={course?._id} />
                ) : (
                  <StudentAnalytics courseId={course?._id} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import submissionService from "@/services/submission.service";

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
