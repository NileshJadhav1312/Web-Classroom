"use client";
import { useEffect, useState } from "react";
import { reportCardService } from "../../services/reportCard.service"; // Adjust path as needed
import { formatDate } from "../../utils/formatDate"; // Adjust path

export default function StudentReportView({ courseId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await reportCardService.getReportCard(courseId);
        setReport(response.data);
      } catch (err) {
        // 404 is expected if not published yet
        if (err.response && err.response.status === 404) {
          setError("Report card is not available yet.");
        } else {
          setError("Failed to load report card.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [courseId]);

  if (loading) return <div>Loading report card...</div>;

  if (error) {
    return (
      <div className="bg-yellow-50 p-6 rounded text-center">
        <p className="text-yellow-700 font-medium">{error}</p>
        <p className="text-sm text-yellow-600 mt-2">
          Please check back later or contact your lecturer.
        </p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-white p-8 rounded shadow border max-w-4xl mx-auto">
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold mb-2">My Report Card</h1>
        <p className="text-gray-600">
          {report.course.title} ({report.course.courseCode})
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Generated on: {formatDate(report.generatedDate)}
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded">
        <div>
          <p className="text-gray-600 text-sm uppercase">Student</p>
          <p className="font-bold text-lg">
            {report.student.name || "Student"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-600 text-sm uppercase">Final Grade</p>
          <p
            className={`font-bold text-3xl ${report.finalGrade === "F" ? "text-red-600" : "text-green-600"}`}
          >
            {report.finalGrade}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignment
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marks
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {report.assignmentDetails.map((detail, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {detail.assignmentTitle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {detail.obtainedMarks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  {detail.totalMarks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold">
                  {detail.grade}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr>
              <td className="px-6 py-4">Total</td>
              <td className="px-6 py-4 text-center">
                {report.overallObtained}
              </td>
              <td className="px-6 py-4 text-center">{report.overallTotal}</td>
              <td className="px-6 py-4 text-center">{report.percentage}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {report.remark && (
        <div className="bg-blue-50 p-4 rounded border border-blue-100">
          <p className="font-bold text-blue-800 text-sm mb-1">Remarks</p>
          <p className="text-blue-900">{report.remark}</p>
        </div>
      )}

      <div className="mt-8 text-center no-print">
        <button
          onClick={() => window.print()}
          className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-700"
        >
          Print Report
        </button>
      </div>
    </div>
  );
}
