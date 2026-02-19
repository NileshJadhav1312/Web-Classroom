import { Course } from "../models/Course.js";
import { sendResponse } from "../utils/responseHandler.js";

export const createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    sendResponse(res, 201, true, "Course created successfully", course);
    return;
  } catch (error) {
    if (error.code === 11000) {
      sendResponse(res, 409, false, "Course code already exists", null);
      return;
    }
    sendResponse(res, 500, false, "Failed to create course", null);
    return;
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("lecturer", "name email");
    sendResponse(res, 200, true, "Courses fetched successfully", courses);
    return;
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch courses", null);
    return;
  }
};

export const getLecturerCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const lecturerId = req.params.lecturerId;

    const courses = await Course.find({ lecturer: lecturerId })
      .populate("lecturer", "name email")
      .populate("materials")
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments({ lecturer: lecturerId });

    sendResponse(
      res,
      200,
      true,
      "Lecturer courses fetched successfully",
      courses,
    );
    return;
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      sendResponse(res, 404, false, "Course not found", null);
      return;
    }
    sendResponse(res, 200, true, "Course fetched successfully", course);
    return;
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch course", null);
    return;
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!course) {
      sendResponse(res, 404, false, "Course not found", null);
      return;
    }
    sendResponse(res, 200, true, "Course updated successfully", course);
    return;
  } catch (error) {
    sendResponse(res, 500, false, "Failed to update course", null);
    return;
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      sendResponse(res, 404, false, "Course not found", null);
      return;
    }
    sendResponse(res, 200, true, "Course deleted successfully", null);
    return;
  } catch (error) {
    sendResponse(res, 500, false, "Failed to delete course", null);
    return;
  }
};

export const getStudentsByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findById(courseId).populate("students");
    if (!course) {
      sendResponse(res, 404, false, "Course not found", null);
      return;
    }
    sendResponse(
      res,
      200,
      true,
      "Students fetched successfully",
      course.students,
    );
    return;
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch students", null);
    return;
  }
};

export const fetchStudentCourses = async (req, res) => {
  const studentId = req.user?.userId;

  if (!studentId) {
    sendResponse(res, 401, false, "Unauthorized", null);
    return;
  }

  try {
    const enrolledCourses = await Course.find({ students: studentId })
      .populate("lecturer", "name email")
      .lean();

    if (!enrolledCourses.length) {
      sendResponse(res, 404, false, "No courses found for this student", null);
      return;
    }

    sendResponse(
      res,
      200,
      true,
      "Student Courses retrieve successfully",
      enrolledCourses,
    );
    return;
  } catch (error) {
    console.error("Error fetching student courses:", error);
    sendResponse(res, 500, false, "Internal Server Error", null);
    return;
  }
};

import { Enrollment } from "../models/Enrollment.js";

export const enrollStudent = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.userId;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return sendResponse(res, 404, false, "Course not found", null);
    }

    // Check if already enrolled or pending
    let enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (enrollment) {
      if (enrollment.status === "pending") {
        return sendResponse(
          res,
          400,
          false,
          "Enrollment request already pending",
          null,
        );
      }
      if (enrollment.status === "approved") {
        return sendResponse(
          res,
          400,
          false,
          "Already enrolled in this course",
          null,
        );
      }
      if (enrollment.status === "rejected") {
        enrollment.status = "pending";
        enrollment.enrolledAt = Date.now();
        await enrollment.save();
        return sendResponse(
          res,
          200,
          true,
          "Enrollment request submitted successfully",
          enrollment,
        );
      }
    } else {
      enrollment = new Enrollment({
        student: studentId,
        course: courseId,
        status: "pending",
      });
      await enrollment.save();
    }

    sendResponse(
      res,
      200,
      true,
      "Enrollment request submitted successfully",
      enrollment,
    );
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Failed to enroll student", null);
  }
};

// Student Disenrolls Implementation
export const disenrollStudent = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.userId;

  try {
    // 1. Remove from Course.students array
    const course = await Course.findByIdAndUpdate(
      courseId,
      { $pull: { students: studentId } },
      { new: true },
    );

    if (!course) {
      sendResponse(res, 404, false, "Course not found", null);
      return;
    }

    // 2. Remove the Enrollment record
    await Enrollment.findOneAndDelete({
      course: courseId,
      student: studentId,
    });

    sendResponse(res, 200, true, "Disenroll Successful", course);
    return;
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, false, "Failed to disenroll student", null);
    return;
  }
};

// Lecturer Removes Student Implementation
export const removeStudentFromCourse = async (req, res) => {
  const { courseId, studentId } = req.params;
  const lecturerId = req.user.userId;

  try {
    // 1. Verify Course ownership (optional but recommended)
    const course = await Course.findOne({
      _id: courseId,
      lecturer: lecturerId,
    });
    if (!course) {
      return sendResponse(
        res,
        404,
        false,
        "Course not found or unauthorized",
        null,
      );
    }

    // 2. Remove student from Course
    course.students = course.students.filter(
      (id) => id.toString() !== studentId,
    );
    await course.save();

    // 3. Delete Enrollment
    await Enrollment.findOneAndDelete({
      course: courseId,
      student: studentId,
    });

    sendResponse(res, 200, true, "Student removed successfully", null);
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Failed to remove student", null);
  }
};
