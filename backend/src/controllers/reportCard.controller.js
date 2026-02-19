import { ReportCard } from "../models/ReportCard.js";
import { Course } from "../models/Course.js";
import { Assignment } from "../models/Assignment.js";
import { Submission } from "../models/Submission.js"; // Assuming this exists
import { sendResponse } from "../utils/responseHandler.js";

// Helper to calculate grade
const calculateGrade = (percentage) => {
  if (percentage >= 85) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 55) return "C";
  if (percentage >= 40) return "D";
  return "F";
};

// Generate Report Card (Teacher Action)
export const generateReportCard = async (req, res) => {
  const { courseId, studentId, remark } = req.body;

  try {
    // Fetch all assignments for the course
    const assignments = await Assignment.find({ course: courseId });
    if (!assignments.length) {
      return sendResponse(
        res,
        400,
        false,
        "No assignments found for this course",
        null,
      );
    }

    // Fetch student's submissions
    const submissions = await Submission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      student: studentId,
    });

    let overallTotal = 0;
    let overallObtained = 0;
    const assignmentDetails = [];

    assignments.forEach((assignment) => {
      const sub = submissions.find(
        (s) => s.assignment.toString() === assignment._id.toString(),
      );
      const obtained = sub && sub.grade !== undefined ? sub.grade : 0; // Default to 0 if not graded/submitted?

      const details = {
        assignmentId: assignment._id,
        assignmentTitle: assignment.title,
        obtainedMarks: obtained,
        totalMarks: assignment.totalMarks,
        grade: calculateGrade((obtained / assignment.totalMarks) * 100),
      };

      assignmentDetails.push(details);
      overallTotal += assignment.totalMarks;
      overallObtained += obtained;
    });

    const percentage =
      overallTotal > 0 ? (overallObtained / overallTotal) * 100 : 0;
    const finalGrade = calculateGrade(percentage);

    // Upsert Report Card
    const reportCard = await ReportCard.findOneAndUpdate(
      { course: courseId, student: studentId },
      {
        assignmentDetails,
        overallTotal,
        overallObtained,
        percentage: parseFloat(percentage.toFixed(2)),
        finalGrade,
        remark,
        generatedDate: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    sendResponse(
      res,
      200,
      true,
      "Report card generated successfully",
      reportCard,
    );
  } catch (error) {
    console.error("Error generating report card:", error);
    sendResponse(res, 500, false, "Failed to generate report card", null);
  }
};

// Publish/Unpublish Report Card (Teacher Action)
export const togglePublishStatus = async (req, res) => {
  const { reportCardId, isPublished } = req.body;

  try {
    const reportCard = await ReportCard.findByIdAndUpdate(
      reportCardId,
      {
        isPublished,
        publishedDate: isPublished ? new Date() : null,
      },
      { new: true },
    );

    if (!reportCard) {
      return sendResponse(res, 404, false, "Report card not found", null);
    }

    sendResponse(
      res,
      200,
      true,
      `Report card ${isPublished ? "published" : "unpublished"} successfully`,
      reportCard,
    );
  } catch (error) {
    console.error("Error updating publish status:", error);
    sendResponse(res, 500, false, "Failed to update status", null);
  }
};

// Get All Report Cards for a Course (Teacher View)
export const getCourseReportCards = async (req, res) => {
  const { courseId } = req.params;

  try {
    const reportCards = await ReportCard.find({ course: courseId }).populate(
      "student",
      "name email",
    );

    sendResponse(
      res,
      200,
      true,
      "Report cards fetched successfully",
      reportCards,
    );
  } catch (error) {
    console.error("Error fetching course report cards:", error);
    sendResponse(res, 500, false, "Failed to fetch report cards", null);
  }
};

// Get Report Card (Student View - only if published, Teacher View - always)
export const getReportCard = async (req, res) => {
  const { courseId, studentId } = req.query; // For Teacher to fetch specific student's
  const userId = req.user.userId;
  const role = req.user.role;

  try {
    let query = {};
    if (role === "student") {
      // Students can only see their own report for the course
      // AND it must be published
      query = {
        course: courseId,
        student: userId,
        isPublished: true,
      };
    } else {
      // Teachers/Admins can see any
      query = {
        course: courseId,
        student: studentId || userId, // If studentId not provided, maybe error or self?
      };
    }

    const reportCard = await ReportCard.findOne(query)
      .populate("student", "name email")
      .populate("course", "title courseCode");

    if (!reportCard) {
      if (role === "student") {
        return sendResponse(
          res,
          404,
          false,
          "Report card not available yet.",
          null,
        );
      }
      return sendResponse(res, 404, false, "Report card not found", null);
    }

    sendResponse(res, 200, true, "Report card fetched details", reportCard);
  } catch (error) {
    console.error("Error fetching report card:", error);
    sendResponse(res, 500, false, "Failed to fetch report card", null);
  }
};
