"use client";
import { useEffect, useState } from "react";
import { courseService } from "../services/course.service"; // Adjust path
import { reportCardService } from "../services/reportCard.service"; // Adjust path
import { toast } from "react-toastify";
import { formatDate } from "../utils/formatDate"; // Adjust path

export default function TeacherReportManager({ courseId }) {
  const [students, setStudents] = useState([]);
  const [reportCards, setReportCards] = useState({}); // Map studentId -> ReportCard
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // studentId currently being processed

  const fetchData = async () => {
    try {
      const [studentsRes, reportsRes] = await Promise.all([
        courseService.getStudentsByCourse(courseId),
        reportCardService.getCourseReportCards(courseId),
      ]);

      setStudents(studentsRes.data);

      const reportsMap = {};
      reportsRes.data.forEach((rc) => {
        reportsMap[rc.student._id] = rc;
      });
      setReportCards(reportsMap);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load students or reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const handleGenerate = async (studentId) => {
    setProcessing(studentId);
    try {
      const res = await reportCardService.generateReportCard({
        courseId,
        studentId,
        remark: "Auto-generated report", // Could add a modal for custom remark earlier
      });

      setReportCards((prev) => ({
        ...prev,
        [studentId]: res.data,
      }));
      toast.success("Report generated");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setProcessing(null);
    }
  };

  const handlePublishToggle = async (reportCard) => {
    if (!reportCard) return;
    setProcessing(reportCard.student._id);
    const newStatus = !reportCard.isPublished;

    try {
      const res = await reportCardService.togglePublishStatus({
        reportCardId: reportCard._id,
        isPublished: newStatus,
      });

      setReportCards((prev) => ({
        ...prev,
        [reportCard.student._id]: res.data,
      }));
      toast.success(newStatus ? "Report published" : "Report unpublished");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Report Card Management</h2>
        <button
          onClick={fetchData}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh Data
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Generated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              const rc = reportCards[student._id];
              const isProcessing = processing === student._id;

              return (
                <tr key={student._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rc ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${rc.isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {rc.isPublished ? "Published" : "Draft"}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        Not Generated
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rc ? formatDate(rc.generatedDate) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {rc && (
                        <button
                          onClick={() => handlePublishToggle(rc)}
                          disabled={isProcessing}
                          className={`px-3 py-1 rounded border transition-colors ${
                            rc.isPublished
                              ? "border-red-300 text-red-600 hover:bg-red-50"
                              : "border-green-300 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {rc.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      )}
                      <button
                        onClick={() => handleGenerate(student._id)}
                        disabled={isProcessing}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {rc ? "Regenerate" : "Generate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No students enrolled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
