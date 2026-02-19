"use client";
import { useEffect, useState } from "react";
import { attendanceService } from "../services/attendance.service";
import { formatDate } from "../utils/formatDate"; // Assuming this utility exists

export default function StudentAttendanceView({ courseId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await attendanceService.getStudentStats(courseId);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch attendance stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [courseId]);

  if (loading) return <div>Loading attendance data...</div>;
  if (!stats) return <div>No attendance data available.</div>;

  const { percentage, history, totalDays, presentDays } = stats;
  const percentageNum = parseFloat(percentage);

  // Determine color based on percentage
  let colorClass = "text-red-600";
  if (percentageNum > 75) colorClass = "text-green-600";
  else if (percentageNum >= 50) colorClass = "text-yellow-600";

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">My Attendance</h2>

      <div className="mb-6 flex items-center justify-between bg-gray-50 p-4 rounded">
        <div>
          <p className="text-gray-600">Overall Attendance</p>
          <p className={`text-3xl font-bold ${colorClass}`}>{percentage}%</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Present: {presentDays}</p>
          <p className="text-sm text-gray-500">Total Classes: {totalDays}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2">History</h3>
      <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {history.map((record) => (
              <tr key={record._id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      record.status === "Present"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
