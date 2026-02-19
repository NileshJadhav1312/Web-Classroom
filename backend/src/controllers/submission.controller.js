import { Submission } from "../models/Submission.js";
import { Assignment } from "../models/Assignment.js";
import { Notification } from "../models/Notification.js";
import { sendResponse } from "../utils/responseHandler.js";

export const submitAssignment = async (req, res) => {
  const { assignmentId } = req.params;
  const fileUrl = req.file ? req.file.path : null;

  if (!fileUrl) {
    return sendResponse(res, 400, false, "No file uploaded", null);
  }

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendResponse(res, 404, false, "Assignment not found", null);
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    let submission = await Submission.findOne({
      student: req.user.userId,
      assignment: assignmentId,
    });

    if (submission) {
      // Handle re-submission if allowed or if status is reverted
      if (submission.status === "graded") {
        return sendResponse(
          res,
          400,
          false,
          "Cannot resubmit graded assignment",
          null,
        );
      }
      submission.fileUrl = fileUrl;
      submission.submittedAt = Date.now();
      submission.status = isLate ? "late" : "submitted";
      await submission.save();
    } else {
      submission = new Submission({
        student: req.user.userId,
        assignment: assignmentId,
        fileUrl,
        status: isLate ? "late" : "submitted",
      });
      await submission.save();
    }

    sendResponse(
      res,
      201,
      true,
      "Assignment submitted successfully",
      submission,
    );
  } catch (error) {
    sendResponse(res, 500, false, "Failed to submit assignment", null);
  }
};

export const getSubmissionsByAssignment = async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const submissions = await Submission.find({
      assignment: assignmentId,
    }).populate("student", "name email");
    sendResponse(
      res,
      200,
      true,
      "Submissions fetched successfully",
      submissions,
    );
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch submissions", null);
  }
};

export const getStudentSubmissions = async (req, res) => {
  const studentId = req.user.userId;
  const { courseId } = req.query; // Optional filter

  try {
    let query = { student: studentId };
    if (courseId) {
      // Find assignments for this course first
      const assignments = await Assignment.find({ courseId }).select("_id");
      const assignmentIds = assignments.map((a) => a._id);
      query.assignment = { $in: assignmentIds };
    }

    const submissions = await Submission.find(query).populate("assignment");
    sendResponse(res, 200, true, "My submissions fetched", submissions);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch submissions", null);
  }
};

export const gradeSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { grade, remark } = req.body;

  try {
    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      {
        grade,
        remark,
        status: "graded",
      },
      { new: true },
    );

    if (!submission) {
      return sendResponse(res, 404, false, "Submission not found", null);
    }

    // Create Notification
    await Notification.create({
      recipient: submission.student,
      message: `Your assignment has been graded. Grade: ${grade}`,
      type: "info",
    });

    sendResponse(res, 200, true, "Submission graded successfully", submission);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to grade submission", null);
  }
};

export const revertSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { remark } = req.body;

  try {
    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      {
        status: "reverted",
        remark,
      },
      { new: true },
    );

    if (!submission) {
      return sendResponse(res, 404, false, "Submission not found", null);
    }

    // Create Notification
    await Notification.create({
      recipient: submission.student,
      message: `Your assignment submission was reverted. Reason: ${remark}`,
      type: "warning",
    });

    sendResponse(
      res,
      200,
      true,
      "Submission reverted successfully",
      submission,
    );
  } catch (error) {
    sendResponse(res, 500, false, "Failed to revert submission", null);
  }
};
export const getCourseGradebook = async (req, res) => {
  const { courseId } = req.params;

  try {
    // 1. Get all assignments for this course
    const assignments = await Assignment.find({ courseId: courseId }).lean();
    const assignmentIds = assignments.map((a) => a._id);

    // 2. Get all submissions for these assignments
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
    })
      .populate("student", "name email")
      .populate("assignment", "title totalMarks")
      .lean();

    // 3. Structure the data: Student -> Assignments
    const gradebook = {};

    submissions.forEach((sub) => {
      const studentId = sub.student._id.toString();
      if (!gradebook[studentId]) {
        gradebook[studentId] = {
          student: sub.student,
          submissions: {},
          totalObtained: 0,
          totalPossible: 0,
        };
      }

      gradebook[studentId].submissions[sub.assignment._id] = sub;
      if (
        sub.grade !== undefined &&
        sub.grade !== null &&
        sub.status === "graded"
      ) {
        gradebook[studentId].totalObtained += sub.grade;
      }
    });

    // Calculate total possible marks for the course (sum of all assignment totals)
    // Note: This logic assumes all students should have submitted all assignments.
    // Ideally, for each student, we might only care about what they submitted,
    // OR more commonly, the course total is fixed for everyone.
    const courseTotal = assignments.reduce((sum, a) => sum + a.totalMarks, 0);

    sendResponse(res, 200, true, "Gradebook fetched", {
      assignments,
      gradebook: Object.values(gradebook),
      courseTotal,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Failed to fetch gradebook", null);
  }
};
