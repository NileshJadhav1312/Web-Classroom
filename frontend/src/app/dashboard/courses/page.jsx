"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import CourseCard from "@/components/CourseCard";
import { courseService } from "@/services/course.service";
import enrollmentService from "@/services/enrollment.service";
import { toast } from "react-toastify";

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const [myEnrollments, setMyEnrollments] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getAllCourses();
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMyEnrollments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await enrollmentService.getStudentEnrollments(token);
        setMyEnrollments(response.data);
      } catch (error) {
        console.error("Error fetching enrollments:", error);
      }
    };

    if (user) {
      fetchCourses();
      if (user.role === "student") fetchMyEnrollments();
    }
  }, [user]);

  const handleEnroll = async (courseId) => {
    try {
      const response = await courseService.enrollStudent(courseId);
      console.log("handleEnroll", response);

      if (response.success) {
        toast.success("Enrollment request submitted successfully");
        // Update local enrollments state to show "Pending" immediately
        setMyEnrollments((prev) => [
          ...prev,
          {
            course: courseId, // or full course object if needed by finding it
            status: "pending",
            _id: response.data._id,
          },
        ]);
      }
    } catch (err) {
      console.log("err", err);
      toast.error(err.response?.data?.message || "Failed to enroll");
    }
  };

  const handleDisenroll = async (courseId) => {
    try {
      const response = await courseService.disenrollStudent(courseId);
      console.log("handleDisenroll", response);

      toast.info("Course disenrolled successfully");

      // Update courses state (remove self from student list)
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId
            ? {
                ...course,
                students: Array.isArray(course.students)
                  ? course.students.filter((id) => id !== user._id)
                  : [],
              }
            : course,
        ),
      );

      // Update myEnrollments state (remove enrollment entry)
      setMyEnrollments((prevEnrollments) =>
        prevEnrollments.filter(
          (e) => e.course._id !== courseId && e.course !== courseId,
        ),
      );
    } catch (err) {
      console.log("err", err);
      toast.error(err.response?.data?.message || "Failed to disenroll");
    }
  };

  // Removed search by ID logic as requested

  const filteredCourses = courses.filter((course) => {
    // If student, show only enrolled courses
    if (user?.role === "student") {
      const isEnrolled = myEnrollments.some(
        (e) => e.course._id === course._id || e.course === course._id,
      );

      if (!isEnrolled) return false;
    }

    const lecturerName =
      typeof course.lecturer === "object" && course.lecturer
        ? course.lecturer.name
        : "";

    return (
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecturerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    console.log("handleJoinByCode started", joinCode);
    if (!joinCode) return;
    setJoining(true); // Start loading state

    // Check if modal is open to close it later
    const modal = document.getElementById("join-course-modal");

    try {
      const token = localStorage.getItem("token");
      console.log("Sending request to enrollment service...");
      await enrollmentService.requestEnrollment(joinCode, token);
      console.log("Request successful");
      toast.success("Request sent successfully! Wait for approval.");
      setJoinCode("");

      // Close only on success
      if (modal && modal.open) {
        modal.close();
      }
    } catch (error) {
      console.error("Request failed", error);
      toast.error(error.response?.data?.message || "Failed to join class");
    } finally {
      console.log("Finally block executed, resetting joining state");
      // Ensure loading state is reset
      setJoining(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {user?.role === "student" ? "My Courses" : "All Courses"}
          </h1>
          <p className="text-gray-600">
            {user?.role === "student"
              ? "Your enrolled courses"
              : "Browse and manage courses"}
          </p>
        </div>
      </div>

      {/* Student: Joint Course Button */}
      {user?.role === "student" && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              setJoinCode("");
              // setJoining(true); // INCORRECT: Removed to fix infinite loading
              document.getElementById("join-course-modal").showModal();
            }}
            className="btn-primary bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Join Course
          </button>

          {/* Native HTML dialog for modal - simple and effective */}
          <dialog
            id="join-course-modal"
            className="p-0 rounded-lg shadow-xl backdrop:bg-gray-800/50"
          >
            <div className="bg-white p-6 w-[400px] max-w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Join New Course</h3>
                <button
                  onClick={() => {
                    setJoining(false);
                    document.getElementById("join-course-modal").close();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleJoinByCode}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Code or ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Course Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setJoining(false);
                      document.getElementById("join-course-modal").close();
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joining}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                  >
                    {joining ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Sending...
                      </>
                    ) : (
                      "Send Request"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        </div>
      )}

      {/* Search and filter (Only show for non-students or if student has enrolled courses to search through) */}
      {(user?.role !== "student" || myEnrollments.length > 0) && (
        <div className="bg-gray-300 p-4 rounded-lg shadow mb-6">
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <input
                type="text"
                placeholder="Search your courses..."
                className="form-input border rounded-md p-2 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const enrollment = myEnrollments.find(
              (e) => e.course._id === course._id || e.course === course._id,
            );
            const isEnrolled = enrollment?.status === "approved";
            const isPending = enrollment?.status === "pending";

            let label = "Enroll";
            if (isEnrolled) label = "Disenroll"; // Or "View Course"
            if (isPending) label = "Pending";

            return (
              <CourseCard
                key={course._id}
                course={course}
                actionButton={{
                  label: label,
                  disabled: isPending,
                  onClick: isEnrolled
                    ? () => handleDisenroll(course._id)
                    : isPending
                      ? null
                      : () => handleEnroll(course._id),
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-lg text-gray-600">
            {user?.role === "student"
              ? "You are not enrolled in any courses yet. Use the 'Find & Join' section above."
              : "No courses found matching your search criteria."}
          </p>
        </div>
      )}
    </div>
  );
}
