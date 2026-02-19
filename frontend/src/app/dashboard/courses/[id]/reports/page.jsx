"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { courseService } from "@/services/course.service";
import assignmentService from "@/services/assignment.service";
import submissionService from "@/services/submission.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function ReportCardPage() {
  const { id } = useParams(); // courseId
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const courseRes = await courseService.getCourseById(id);
        setCourse(courseRes.data);

        const assignmentsRes = await assignmentService.getAssignmentsByCourse(
          id,
          token,
        );
        setAssignments(assignmentsRes.data);

        // If teacher, fetch all students and all submissions
        if (user.role === "lecturer") {
          const studentsRes = await courseService.getStudentsByCourse(id);
          setStudents(studentsRes.data);

          // Fetch submissions for all assignments (this might be heavy, optimized backend would be better)
          // For now, simpler approach: fetch submissions for each assignment
          let allSubmissions = [];
          for (const assignment of assignmentsRes.data) {
            const subRes = await submissionService.getSubmissionsByAssignment(
              assignment._id,
              token,
            );
            allSubmissions = [...allSubmissions, ...subRes.data];
          }
          setSubmissions(allSubmissions);
        } else {
          // If student, fetch only my submissions
          const mySubRes = await submissionService.getStudentSubmissions(
            token,
            id,
          );
          setSubmissions(mySubRes.data);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast.error("Failed to load report card");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchData();
  }, [id, user]);

  if (loading) return <div>Loading...</div>;

  const getStudentGrade = (studentId, assignmentId) => {
    const submission = submissions.find(
      (s) =>
        (s.student._id === studentId || s.student === studentId) &&
        (s.assignment._id === assignmentId || s.assignment === assignmentId),
    );
    return submission?.grade || 0;
  };

  const getStudentTotal = (studentId) => {
    let total = 0;
    assignments.forEach((a) => {
      total += getStudentGrade(studentId, a._id);
    });
    return total;
  };

  const getTotalMarksOfCourse = () => {
    return assignments.reduce((sum, a) => sum + a.totalMarks, 0);
  };

  const getPercentage = (studentId) => {
    const totalObtained = getStudentTotal(studentId);
    const totalPossible = getTotalMarksOfCourse();
    if (totalPossible === 0) return 0;
    return ((totalObtained / totalPossible) * 100).toFixed(2);
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 70) return "A";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 45) return "D";
    return "F";
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Report Card: {course?.title}</h1>

      {user?.role === "lecturer" ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Student Name</th>
                {assignments.map((a) => (
                  <th key={a._id} className="border p-2 text-center">
                    {a.title} ({a.totalMarks})
                  </th>
                ))}
                <th className="border p-2 text-center">
                  Total ({getTotalMarksOfCourse()})
                </th>
                <th className="border p-2 text-center">Grade</th>
                <th className="border p-2 text-center">Remark</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const percentage = getPercentage(student._id);
                return (
                  <tr key={student._id}>
                    <td className="border p-2">{student.name}</td>
                    {assignments.map((a) => (
                      <td key={a._id} className="border p-2 text-center">
                        {getStudentGrade(student._id, a._id)}
                      </td>
                    ))}
                    <td className="border p-2 text-center font-bold">
                      {getStudentTotal(student._id)}
                    </td>
                    <td className="border p-2 text-center">
                      {getLetterGrade(percentage)}
                    </td>
                    <td className="border p-2 text-center">
                      {percentage >= 50 ? "Pass" : "Fail"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <p className="text-lg">
              <strong>Student Name:</strong> {user?.name}
            </p>
            <p className="text-lg">
              <strong>Total Score:</strong>{" "}
              {getStudentTotal(user?.userId || user?._id)} /{" "}
              {getTotalMarksOfCourse()}
            </p>
            <p className="text-lg">
              <strong>Percentage:</strong>{" "}
              {getPercentage(user?.userId || user?._id)}%
            </p>
            <p className="text-lg">
              <strong>Grade:</strong>{" "}
              {getLetterGrade(getPercentage(user?.userId || user?._id))}
            </p>
          </div>
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Assignment</th>
                <th className="border p-2 text-center">Marks Obtained</th>
                <th className="border p-2 text-center">Total Marks</th>
                <th className="border p-2 text-center">Remark</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const submission = submissions.find(
                  (s) => s.assignment._id === a._id || s.assignment === a._id,
                );
                return (
                  <tr key={a._id}>
                    <td className="border p-2">{a.title}</td>
                    <td className="border p-2 text-center">
                      {submission?.grade !== undefined ? submission.grade : "-"}
                    </td>
                    <td className="border p-2 text-center">{a.totalMarks}</td>
                    <td className="border p-2 text-center">
                      {submission?.remark || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
