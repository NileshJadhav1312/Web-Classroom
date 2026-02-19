"use client";

import { useState, useEffect } from "react";
import enrollmentService from "@/services/enrollment.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function EnrollmentManagement() {
  const { user } = useAuth();
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "lecturer") {
      fetchPendingEnrollments();
    }
  }, [user]);

  const fetchPendingEnrollments = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await enrollmentService.getPendingEnrollments(token);
      if (data.success) {
        setPendingEnrollments(data.data);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      toast.error("Failed to load pending enrollments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await enrollmentService.approveEnrollment(id, token);
      toast.success("Enrollment approved");
      fetchPendingEnrollments();
    } catch (error) {
      toast.error("Failed to approve enrollment");
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await enrollmentService.rejectEnrollment(id, token);
      toast.info("Enrollment rejected");
      fetchPendingEnrollments();
    } catch (error) {
      toast.error("Failed to reject enrollment");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Enrollments</h1>
      {pendingEnrollments.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Student Name</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Course</th>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingEnrollments.map((enrollment) => (
                <tr key={enrollment._id} className="text-center">
                  <td className="py-2 px-4 border-b">
                    {enrollment.student.name}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {enrollment.student.email}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {enrollment.course.title} ({enrollment.course.courseCode})
                  </td>
                  <td className="py-2 px-4 border-b">
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border-b space-x-2">
                    <button
                      onClick={() => handleApprove(enrollment._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(enrollment._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
