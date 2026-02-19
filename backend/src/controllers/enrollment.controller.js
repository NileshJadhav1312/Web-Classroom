import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { sendResponse } from "../utils/responseHandler.js";

// Student requests to join a course
export const requestEnrollment = async (req, res) => {
  const { courseCode } = req.body;
  const studentId = req.user.userId;

  try {
    const course = await Course.findOne({ courseCode });
    if (!course) {
      return sendResponse(res, 404, false, "Course not found", null);
    }

    // Check if already enrolled or pending
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: course._id,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === "pending") {
        return sendResponse(
          res,
          400,
          false,
          "Enrollment request already pending",
          null,
        );
      }
      if (existingEnrollment.status === "approved") {
        return sendResponse(
          res,
          400,
          false,
          "Already enrolled in this course",
          null,
        );
      }
      if (existingEnrollment.status === "rejected") {
        existingEnrollment.status = "pending";
        existingEnrollment.enrolledAt = Date.now();
        await existingEnrollment.save();
        return sendResponse(
          res,
          200,
          true,
          "Enrollment request submitted successfully",
          existingEnrollment,
        );
      }
    }

    const enrollment = new Enrollment({
      student: studentId,
      course: course._id,
      status: "pending",
    });

    await enrollment.save();
    sendResponse(
      res,
      201,
      true,
      "Enrollment request submitted successfully",
      enrollment,
    );
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Failed to submit enrollment request", null);
  }
};

// Teacher gets pending enrollments
export const getPendingEnrollments = async (req, res) => {
  try {
    const lecturerId = req.user.userId;
    const courses = await Course.find({ lecturer: lecturerId }).select("_id");
    const courseIds = courses.map((c) => c._id);

    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      status: "pending",
    })
      .populate("student", "name email")
      .populate("course", "title courseCode");

    sendResponse(res, 200, true, "Pending enrollments fetched", enrollments);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch pending enrollments", null);
  }
};

export const approveEnrollment = async (req, res) => {
  const { enrollmentId } = req.params;
  try {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment)
      return sendResponse(res, 404, false, "Enrollment not found", null);

    enrollment.status = "approved";
    await enrollment.save();

    // Add student to course.students array
    await Course.findByIdAndUpdate(enrollment.course, {
      $addToSet: { students: enrollment.student },
    });

    sendResponse(res, 200, true, "Enrollment approved", enrollment);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to approve enrollment", null);
  }
};

export const rejectEnrollment = async (req, res) => {
  const { enrollmentId } = req.params;
  try {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment)
      return sendResponse(res, 404, false, "Enrollment not found", null);

    enrollment.status = "rejected";
    await enrollment.save();

    sendResponse(res, 200, true, "Enrollment rejected", enrollment);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to reject enrollment", null);
  }
};

export const getStudentEnrollments = async (req, res) => {
  const studentId = req.user.userId;
  try {
    const enrollments = await Enrollment.find({ student: studentId }).populate(
      "course",
      "title courseCode lecturer",
    );
    sendResponse(res, 200, true, "Student enrollments fetched", enrollments);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch enrollments", null);
  }
};
