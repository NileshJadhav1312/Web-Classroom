import { Assignment } from "../models/Assignment.js";
import { Submission } from "../models/Submission.js";
import { Course } from "../models/Course.js";
import { ReportCard } from "../models/ReportCard.js";
import { sendResponse } from "../utils/responseHandler.js";

// Teacher Analytics: Class Performance
export const getClassAnalytics = async (req, res) => {
  const { courseId } = req.params;

  try {
    const assignments = await Assignment.find({ course: courseId });
    if (!assignments.length) {
      return sendResponse(res, 200, true, "No data available", {
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        assignmentPerformance: [],
      });
    }

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
    });

    // Helper to calculate stats
    let totalScore = 0;
    let count = 0;
    let highest = 0;
    let lowest = 100; // Percentage based

    // Assignment specific performance
    const assignmentPerformance = assignments.map((assignment) => {
      const assignmentSubmissions = submissions.filter(
        (s) => s.assignment.toString() === assignment._id.toString(),
      );

      if (assignmentSubmissions.length === 0) {
        return {
          title: assignment.title,
          average: 0,
          totalMarks: assignment.totalMarks,
        };
      }

      const sum = assignmentSubmissions.reduce(
        (acc, s) => acc + (s.grade || 0),
        0,
      );
      const avg = sum / assignmentSubmissions.length;

      // Update global stats (weighted by total marks could be better, but simple avg for now)
      // Actually, let's look at percentage for global stats
      // Or just return assignment breakdown

      return {
        title: assignment.title,
        average: avg,
        totalMarks: assignment.totalMarks,
      };
    });

    // Calculate Overall Course Stats based on ReportCards if generated,
    // or fallback to raw Submission data.
    // Let's use ReportCards if available for "Final Grade" distribution.
    const reportCards = await ReportCard.find({ course: courseId });

    let gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    if (reportCards.length > 0) {
      reportCards.forEach((rc) => {
        if (gradeDistribution[rc.finalGrade] !== undefined) {
          gradeDistribution[rc.finalGrade]++;
        }
      });

      const overallSum = reportCards.reduce(
        (acc, rc) => acc + rc.percentage,
        0,
      );
      const overallAvg = overallSum / reportCards.length;
      // Find high/low
      const percentages = reportCards.map((rc) => rc.percentage);
      highest = Math.max(...percentages);
      lowest = Math.min(...percentages);

      return sendResponse(res, 200, true, "Class analytics fetched", {
        averagePercentage: overallAvg.toFixed(2),
        highestPercentage: highest,
        lowestPercentage: lowest,
        gradeDistribution,
        assignmentPerformance,
      });
    }

    // Fallback if no report cards generated yet
    sendResponse(res, 200, true, "Class analytics fetched (Preliminary)", {
      assignmentPerformance,
    });
  } catch (error) {
    console.error("Error fetching class analytics:", error);
    sendResponse(res, 500, false, "Failed to fetch analytics", null);
  }
};

// Student Analytics: My Performance
export const getStudentAnalytics = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.userId;

  try {
    const assignments = await Assignment.find({ course: courseId });
    const submissions = await Submission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      course: courseId, // Ensure course context
    });

    const mySubmissions = submissions.filter(
      (s) => s.student.toString() === studentId,
    );

    const performanceData = assignments.map((assignment) => {
      const mySub = mySubmissions.find(
        (s) => s.assignment.toString() === assignment._id.toString(),
      );
      const classSubs = submissions.filter(
        (s) => s.assignment.toString() === assignment._id.toString(),
      );

      const classAvg =
        classSubs.length > 0
          ? classSubs.reduce((acc, s) => acc + (s.grade || 0), 0) /
            classSubs.length
          : 0;

      return {
        title: assignment.title,
        myScore: mySub?.grade || 0,
        classAverage: classAvg,
        totalMarks: assignment.totalMarks,
      };
    });

    sendResponse(res, 200, true, "Student analytics fetched", {
      performanceData,
    });
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    sendResponse(res, 500, false, "Failed to fetch analytics", null);
  }
};
