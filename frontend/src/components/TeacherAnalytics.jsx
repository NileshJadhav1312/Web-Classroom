"use client";
import React, { useEffect, useState } from "react";
import { analyticsService } from "../services/analytics.service";
import { toast } from "react-toastify";

export default function TeacherAnalytics({ courseId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await analyticsService.getClassAnalytics(courseId);
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
  if (!data) return <div>No analytics data available.</div>;

  const {
    averagePercentage,
    highestPercentage,
    lowestPercentage,
    assignmentPerformance,
    gradeDistribution,
  } = data;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Class Average</p>
          <p className="text-2xl font-bold">{averagePercentage}%</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Highest Score</p>
          <p className="text-2xl font-bold">{highestPercentage}%</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Lowest Score</p>
          <p className="text-2xl font-bold">{lowestPercentage}%</p>
        </div>
      </div>

      {/* Assignment Performance Chart */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-bold mb-4">
          Assignment Performance (Average Score)
        </h3>

        {assignmentPerformance && assignmentPerformance.length > 0 ? (
          <div className="space-y-4">
            {assignmentPerformance.map((assignment, index) => {
              const percentage =
                (assignment.average / assignment.totalMarks) * 100;
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{assignment.title}</span>
                    <span className="text-gray-600">
                      {assignment.average.toFixed(1)} / {assignment.totalMarks}{" "}
                      ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No assignments found.</p>
        )}
      </div>

      {/* Grade Distribution */}
      {gradeDistribution && (
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-bold mb-4">Grade Distribution</h3>
          <div className="flex items-end justify-around h-48 pt-4 gap-2">
            {["A", "B", "C", "D", "F"].map((grade) => {
              const count = gradeDistribution[grade] || 0;
              // Find max for scaling
              const maxCount = Math.max(...Object.values(gradeDistribution));
              const heightPercentage =
                maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div
                  key={grade}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <div className="w-full text-center text-xs mb-1 font-bold">
                    {count}
                  </div>
                  <div
                    className="w-12 bg-purple-500 rounded-t hover:bg-purple-600 transition-all duration-500"
                    style={{ height: `${Math.max(heightPercentage, 2)}%` }} // Minimum height for visibility
                  ></div>
                  <p className="mt-2 font-bold text-gray-700">{grade}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
