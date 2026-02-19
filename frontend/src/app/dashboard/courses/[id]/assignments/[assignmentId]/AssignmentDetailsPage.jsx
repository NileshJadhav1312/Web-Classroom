"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import assignmentService from "@/services/assignment.service";
import submissionService from "@/services/submission.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { formatDate } from "../../../../../../../utils/formatDate";

export default function AssignmentDetailsPage() {
  const { id, assignmentId } = useParams(); // id is courseId
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Grading state
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeData, setGradeData] = useState({ grade: "", remark: "" });

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch assignment details
      const assignmentData = await assignmentService.getAssignmentsByCourse(
        id,
        token,
      );
      const currentAssignment = assignmentData.data.find(
        (a) => a._id === assignmentId,
      );
      setAssignment(currentAssignment);

      if (user?.role === "lecturer") {
        // Fetch all submissions
        const submissionsData =
          await submissionService.getSubmissionsByAssignment(
            assignmentId,
            token,
          );
        setSubmissions(submissionsData.data);
      } else {
        // Fetch my submission
        const mySubData = await submissionService.getStudentSubmissions(token);
        const sub = mySubData.data.find(
          (s) => s.assignment._id === assignmentId,
        );
        setMySubmission(sub);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  }, [id, assignmentId, user]);

  useEffect(() => {
    if (user && assignmentId) {
      fetchData();
    }
  }, [user, assignmentId, fetchData]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return toast.error("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      await submissionService.submitAssignment(assignmentId, formData, token);
      toast.success("Assignment submitted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to submit assignment");
    } finally {
      setUploading(false);
    }
  };

  const handleGrade = async (submissionId) => {
    try {
      const token = localStorage.getItem("token");
      await submissionService.gradeSubmission(
        submissionId,
        gradeData.grade,
        gradeData.remark,
        token,
      );
      toast.success("Graded successfully");
      setGradingSubmissionId(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to grade");
    }
  };

  const handleRevert = async (submissionId) => {
    const remark = prompt("Enter reason for revert:");
    if (!remark) return;

    try {
      const token = localStorage.getItem("token");
      await submissionService.revertSubmission(submissionId, remark, token);
      toast.success("Submission reverted");
      fetchData();
    } catch (error) {
      toast.error("Failed to revert");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!assignment) return <div>Assignment not found</div>;

  const isLate = new Date() > new Date(assignment.dueDate);

  return (
    <div className="p-6">
      <div className="mb-6 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
        <div className="flex justify-between text-gray-600 mb-4">
          <span>Due: {formatDate(assignment.dueDate)}</span>
          <span>Marks: {assignment.totalMarks}</span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap mb-4">
          {assignment.description}
        </p>
        {assignment.attachment && (
          <div className="mb-4">
            <a
              href={assignment.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Download Attachment
            </a>
          </div>
        )}
      </div>

      {user?.role === "student" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Your Submission</h2>
          {mySubmission ? (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    mySubmission.status === "metrics" ||
                    mySubmission.status === "graded"
                      ? "bg-green-100 text-green-800"
                      : mySubmission.status === "late"
                        ? "bg-yellow-100 text-yellow-800"
                        : mySubmission.status === "reverted"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                  }`}
                >
                  Status: {mySubmission.status.toUpperCase()}
                </span>
                <span>Submitted: {formatDate(mySubmission.submittedAt)}</span>
              </div>
              <div className="mb-4">
                <a
                  href={mySubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Submitted File
                </a>
              </div>
              {mySubmission.status === "graded" && (
                <div className="bg-gray-50 p-4 rounded">
                  <p>
                    <strong>Grade:</strong> {mySubmission.grade} /{" "}
                    {assignment.totalMarks}
                  </p>
                  <p>
                    <strong>Remark:</strong> {mySubmission.remark}
                  </p>
                </div>
              )}
              {mySubmission.status === "reverted" && (
                <div className="bg-red-50 p-4 rounded mb-4">
                  <p className="text-red-800">
                    Your submission was reverted. Reason: {mySubmission.remark}
                  </p>
                  <p className="text-sm mt-2">Please resubmit below.</p>
                </div>
              )}

              {/* Allow resubmission if reverted */}
              {mySubmission.status === "reverted" && (
                <form
                  onSubmit={handleFileUpload}
                  className="mt-4 border-t pt-4"
                >
                  <label className="block mb-2">Resubmit File:</label>
                  <input type="file" name="file" required className="mb-2" />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    {uploading ? "Uploading..." : "Resubmit"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleFileUpload}>
              {isLate && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="font-bold text-red-700">Past Due Date</p>
                  <p className="text-red-600 text-sm">
                    This assignment is past the due date. Your submission will
                    be marked as <strong>LATE</strong>.
                  </p>
                </div>
              )}
              <div className="mb-4">
                <label className="block mb-2">Upload File</label>
                <input
                  type="file"
                  name="file"
                  required
                  className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {uploading ? "Submitting..." : "Submit Assignment"}
              </button>
            </form>
          )}
        </div>
      )}

      {user?.role === "lecturer" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">
            Student Submissions ({submissions.length})
          </h2>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sub.student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sub.student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sub.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sub.status === "graded"
                            ? "bg-green-100 text-green-800"
                            : sub.status === "late"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.grade !== undefined
                        ? `${sub.grade} / ${assignment.totalMarks}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative">
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </a>

                        {gradingSubmissionId === sub._id ? (
                          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] p-4 animate-in fade-in zoom-in-95 duration-200 whitespace-normal">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Grade (/{assignment.totalMarks})
                            </label>
                            <input
                              type="number"
                              max={assignment.totalMarks}
                              placeholder="Enter grade"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 mb-3 border"
                              value={gradeData.grade}
                              onChange={(e) =>
                                setGradeData({
                                  ...gradeData,
                                  grade: e.target.value,
                                })
                              }
                            />
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Remark
                            </label>
                            <textarea
                              placeholder="Enter remark"
                              rows={3}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 mb-3 border resize-none"
                              value={gradeData.remark}
                              onChange={(e) =>
                                setGradeData({
                                  ...gradeData,
                                  remark: e.target.value,
                                })
                              }
                            ></textarea>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setGradingSubmissionId(null)}
                                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleGrade(sub._id)}
                                className="px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors"
                              >
                                Save Grade
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingSubmissionId(sub._id);
                              setGradeData({
                                grade: sub.grade || "",
                                remark: sub.remark || "",
                              });
                            }}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Grade
                          </button>
                        )}

                        <button
                          onClick={() => handleRevert(sub._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Revert
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ReportSection assignment={assignment} submissions={submissions} />
        </div>
      )}
    </div>
  );
}

function ReportSection({ assignment, submissions }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Student Name",
      "Marks (Total)",
      "Obtained Marks",
      "Submission Date",
      "Remark",
    ];
    const rows = submissions.map((sub) => [
      sub.student.name,
      assignment.totalMarks,
      sub.grade !== undefined && sub.grade !== null ? sub.grade : "N/A",
      formatDate(sub.submittedAt),
      sub.remark || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${assignment.title}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 pt-8 border-t">
      <button
        onClick={() => document.getElementById("report-modal").showModal()}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-4"
      >
        View Assignment Report
      </button>

      <dialog
        id="report-modal"
        className="p-0 rounded-lg shadow-xl backdrop:bg-gray-800/50 w-full max-w-4xl"
      >
        <div className="bg-white p-6 w-full h-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 no-print">
            <h2 className="text-xl font-bold">Assignment Report</h2>
            <button
              onClick={() => document.getElementById("report-modal").close()}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          <div id="report-section">
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #report-modal {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                  max-width: none;
                  background: white;
                  visibility: visible;
                  display: block;
                }
                #report-section,
                #report-section * {
                  visibility: visible;
                }
                .no-print {
                  display: none !important;
                }
                /* Ensure the dialog is treated as the main content page for printing */
                dialog {
                  position: static !important;
                }
              }
            `}</style>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 print-only">
                {assignment.title} - Report
              </h3>
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border">
                      Obtained Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border">
                      Submission Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((sub) => (
                    <tr key={sub._id}>
                      <td className="px-6 py-4 whitespace-nowrap border">
                        {sub.student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border">
                        {assignment.totalMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border">
                        {sub.grade !== undefined && sub.grade !== null
                          ? sub.grade
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border">
                        {formatDate(sub.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border">
                        {sub.remark || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4 no-print mt-6 justify-end">
            <button
              onClick={() => document.getElementById("report-modal").close()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <span>Print Report</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
