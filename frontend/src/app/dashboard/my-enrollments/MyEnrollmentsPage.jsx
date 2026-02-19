"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import enrollmentService from "@/services/enrollment.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function MyEnrollmentsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await enrollmentService.getStudentEnrollments(token);
        setEnrollments(response.data);
      } catch (error) {
        console.error("Error fetching enrollments:", error);
        toast.error("Failed to load your classes");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Classes</h1>

      {enrollments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded shadow">
          <p className="text-gray-500 mb-4">
            You have not enrolled in any classes yet.
          </p>
          <Link
            href="/dashboard/courses"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment._id}
              className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{enrollment.course.title}</h2>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    enrollment.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : enrollment.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {enrollment.status}
                </span>
              </div>
              <p className="text-gray-600 mb-2">
                Code: {enrollment.course.courseCode}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Requested:{" "}
                {new Date(enrollment.enrolledAt).toLocaleDateString()}
              </p>

              {enrollment.status === "approved" ? (
                <Link
                  href={`/dashboard/courses/${enrollment.course._id}`}
                  className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Enter Class
                </Link>
              ) : (
                <button
                  disabled
                  className="block w-full text-center bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed"
                >
                  Access Locked
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
