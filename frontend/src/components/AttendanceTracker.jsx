"use client";
import { useState, useEffect } from "react";
import { attendanceService } from "../services/attendance.service";
import { courseService } from "../services/course.service";
import { toast } from "react-toastify";

export default function AttendanceTracker({ courseId }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: 'Present' | 'Absent' }
  const [loading, setLoading] = useState(false);

  // Fetch students for the course
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await courseService.getStudentsByCourse(courseId);
        setStudents(response.data);
        // Initialize attendance data as all 'Present' by default or empty?
        // Let's initialize based on fetch
        const initialData = {};
        response.data.forEach((s) => (initialData[s._id] = "Absent")); // Default absent for safety? Or Present?
        // Usually present is easier.
        response.data.forEach((s) => (initialData[s._id] = "Present"));
        setAttendanceData(initialData);
      } catch (error) {
        console.error("Error fetching students", error);
        toast.error("Failed to load students");
      }
    };
    fetchStudents();
  }, [courseId]);

  // Fetch existing attendance when date changes
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const response = await attendanceService.getCourseAttendance(
          courseId,
          date,
        );
        const records = response.data;
        if (records && records.length > 0) {
          const existingData = {};
          // Pre-fill existing
          records.forEach((r) => {
            existingData[r.student._id] = r.status;
          });
          // Merge with current students (some might not have records if added later)
          setAttendanceData((prev) => ({
            ...prev,
            ...existingData,
          }));
        } else {
          // Reset to default (Present) if no records found for this date
          const resetData = {};
          students.forEach((s) => (resetData[s._id] = "Present"));
          setAttendanceData(resetData);
        }
      } catch (error) {
        console.error("Error fetching attendance", error);
      } finally {
        setLoading(false);
      }
    };
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [date, courseId, students.length]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status) => {
    const newData = {};
    students.forEach((s) => (newData[s._id] = status));
    setAttendanceData(newData);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const records = Object.entries(attendanceData).map(
        ([studentId, status]) => ({
          studentId,
          status,
        }),
      );

      await attendanceService.markAttendance({
        courseId,
        date,
        records,
      });

      toast.success("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance", error);
      toast.error("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Mark Attendance</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Select Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => markAll("Present")}
          className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200"
        >
          Mark All Present
        </button>
        <button
          type="button"
          onClick={() => markAll("Absent")}
          className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
        >
          Mark All Absent
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {student.name}
                  <div className="text-xs text-gray-500">{student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(student._id, "Present")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        attendanceData[student._id] === "Present"
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleStatusChange(student._id, "Absent")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        attendanceData[student._id] === "Absent"
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                  No students enrolled in this course.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || students.length === 0}
          className="btn-primary px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Attendance"}
        </button>
      </div>
    </div>
  );
}
