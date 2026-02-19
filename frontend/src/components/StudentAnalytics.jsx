"use client";
import React, { useEffect, useState } from "react";
import { analyticsService } from "../services/analytics.service";
import { toast } from "react-toastify";

export default function StudentAnalytics({ courseId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await analyticsService.getStudentAnalytics(courseId);
        setData(response.data);
      } catch (error) {
        console.error("Failed to load analytics", error);
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  if (loading) return <div>Loading analytics...</div>;
  if (!data || !data.performanceData) return <div>No data available.</div>;

  const { performanceData } = data;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-6">Performance Trend</h2>

      {performanceData.length > 0 ? (
        <div className="mb-8">
          {/* Simple Bar Chart Comparison */}
          <div className="h-64 flex items-end justify-around gap-4 border-b border-gray-300 pb-2">
            {performanceData.map((item, index) => {
              const myPercentage =
                item.totalMarks > 0
                  ? (item.myScore / item.totalMarks) * 100
                  : 0;
              const classPercentage =
                item.totalMarks > 0
                  ? (item.classAverage / item.totalMarks) * 100
                  : 0;

              return (
                <div
                  key={index}
                  className="flex-1 h-full flex flex-col justify-end group"
                >
                  <div className="flex gap-1 h-full items-end justify-center w-full">
                    {/* My Score */}
                    <div
                      className="w-1/3 bg-blue-500 rounded-t transition-all hover:bg-blue-600 relative group-hover:opacity-90"
                      style={{ height: `${Math.max(myPercentage, 2)}%` }}
                      title={`My Score: ${item.myScore}`}
                    ></div>
                    {/* Class Average */}
                    <div
                      className="w-1/3 bg-gray-300 rounded-t transition-all hover:bg-gray-400 relative group-hover:opacity-90"
                      style={{ height: `${Math.max(classPercentage, 2)}%` }}
                      title={`Class Avg: ${item.classAverage.toFixed(1)}`}
                    ></div>
                  </div>
                  <div
                    className="text-xs text-center mt-2 truncate max-w-[100px]"
                    title={item.title}
                  >
                    {item.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">My Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Class Average</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No performance data available.
        </p>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto mt-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Assignment
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                My Score
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Class Average
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performanceData.map((item, idx) => {
              const diff = item.myScore - item.classAverage;
              let status = "Average";
              let color = "text-yellow-600";
              if (diff > 0) {
                status = "Above Avg";
                color = "text-green-600";
              }
              if (diff < 0) {
                status = "Below Avg";
                color = "text-red-600";
              }

              return (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600">
                    {item.myScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                    {item.classAverage.toFixed(1)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${color}`}
                  >
                    {status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
