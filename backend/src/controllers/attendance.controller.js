import { Attendance } from "../models/Attendance.js";
import { Course } from "../models/Course.js";
import { sendResponse } from "../utils/responseHandler.js";
import mongoose from "mongoose";

// Mark or Update Attendance (Single Doc per Session)
export const markAttendance = async (req, res) => {
  const { courseId, date, records } = req.body; // records: [{ studentId, status }]
  const markedBy = req.user.userId;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return sendResponse(res, 404, false, "Course not found", null);
    }

    // Separate records into present and absent arrays
    const presentStudents = [];
    const absentStudents = [];

    records.forEach((record) => {
      if (record.status === "Present") {
        presentStudents.push(record.studentId);
      } else {
        absentStudents.push(record.studentId);
      }
    });

    // Check if attendance already exists for this date/course
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      course: courseId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingAttendance) {
      // Update existing
      existingAttendance.presentStudents = presentStudents;
      existingAttendance.absentStudents = absentStudents;
      existingAttendance.totalStudents = records.length;
      existingAttendance.markedBy = markedBy;
      await existingAttendance.save();
    } else {
      // Create new
      await Attendance.create({
        course: courseId,
        date: new Date(date),
        presentStudents,
        absentStudents,
        totalStudents: records.length,
        markedBy,
      });
    }

    sendResponse(res, 200, true, "Attendance marked successfully", null);
  } catch (error) {
    console.error("Error marking attendance:", error);
    sendResponse(res, 500, false, "Failed to mark attendance", null);
  }
};

// Get Attendance for a specific Course and Date (Teacher View)
export const getCourseAttendance = async (req, res) => {
  const { courseId, date } = req.query;

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceDoc = await Attendance.findOne({
      course: courseId,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("presentStudents", "name email")
      .populate("absentStudents", "name email");

    let attendanceRecords = [];

    if (attendanceDoc) {
      // Transform into list format expected by frontend: { student, status }
      const presentRecs = attendanceDoc.presentStudents.map((s) => ({
        student: s,
        status: "Present",
      }));
      const absentRecs = attendanceDoc.absentStudents.map((s) => ({
        student: s,
        status: "Absent",
      }));
      attendanceRecords = [...presentRecs, ...absentRecs];
    }

    sendResponse(
      res,
      200,
      true,
      "Attendance records fetched successfully",
      attendanceRecords,
    );
  } catch (error) {
    console.error("Error fetching course attendance:", error);
    sendResponse(res, 500, false, "Failed to fetch attendance", null);
  }
};

// Get Student Attendance History & Stats (Student View)
export const getStudentStats = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.userId;

  try {
    const historyDocs = await Attendance.find({
      course: courseId,
    }).sort({ date: -1 });

    const history = [];
    let presentDays = 0;
    let totalDays = 0;

    historyDocs.forEach((doc) => {
      const isPresent = doc.presentStudents.some(
        (id) => id.toString() === studentId,
      );
      const isAbsent = doc.absentStudents.some(
        (id) => id.toString() === studentId,
      );

      if (isPresent || isAbsent) {
        totalDays++;
        if (isPresent) presentDays++;
        history.push({
          _id: doc._id,
          date: doc.date,
          status: isPresent ? "Present" : "Absent",
        });
      }
    });

    const percentage =
      totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    sendResponse(res, 200, true, "Student attendance stats fetched", {
      percentage,
      history,
      totalDays,
      presentDays,
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    sendResponse(res, 500, false, "Failed to fetch student stats", null);
  }
};
// Get Stats for All Students in a Course (Teacher View)
export const getCourseStats = async (req, res) => {
  const { courseId } = req.params;

  try {
    const stats = await Attendance.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      {
        $facet: {
          presentCounts: [
            { $unwind: "$presentStudents" },
            { $group: { _id: "$presentStudents", count: { $sum: 1 } } },
          ],
          totalCounts: [
            {
              $project: {
                students: {
                  $setUnion: ["$presentStudents", "$absentStudents"],
                },
              },
            },
            { $unwind: "$students" },
            { $group: { _id: "$students", count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    // Format the stats for frontend
    // Use course students list to ensure we include everyone even if they have 0 attendance
    const course = await Course.findById(courseId).populate(
      "students",
      "name email",
    );

    if (!course) {
      return sendResponse(res, 404, false, "Course not found", null);
    }

    const presentMap = {};
    if (stats[0].presentCounts) {
      stats[0].presentCounts.forEach((item) => {
        presentMap[item._id.toString()] = item.count;
      });
    }

    const totalDays = await Attendance.countDocuments({
      course: courseId,
    });

    const studentStats = course.students.map((student) => {
      const presentDays = presentMap[student._id.toString()] || 0;
      let percentage = 0;
      if (totalDays > 0) {
        percentage = ((presentDays / totalDays) * 100).toFixed(2);
      }
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        totalDays,
        presentDays,
        percentage,
      };
    });

    sendResponse(
      res,
      200,
      true,
      "Course attendance stats fetched",
      studentStats,
    );
  } catch (error) {
    console.error("Error fetching course stats:", error);
    sendResponse(res, 500, false, "Failed to fetch course stats", null);
  }
};

export const getAttendanceDates = async (req, res) => {
  const { courseId } = req.params;
  try {
    const records = await Attendance.find({ course: courseId })
      .select("date presentStudents absentStudents")
      .sort({ date: -1 });

    const dates = records.map((rec) => ({
      _id: rec._id,
      date: rec.date,
      presentCount: rec.presentStudents.length,
      absentCount: rec.absentStudents.length,
    }));

    sendResponse(res, 200, true, "Attendance dates fetched", dates);
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Failed to fetch attendance dates", null);
  }
};

export const getStudentStatisticsForTeacher = async (req, res) => {
  const { courseId, studentId } = req.params;

  try {
    const historyDocs = await Attendance.find({
      course: courseId,
    }).sort({ date: -1 });

    const history = [];
    let presentDays = 0;
    let totalDays = 0;

    historyDocs.forEach((doc) => {
      const isPresent = doc.presentStudents.some(
        (id) => id.toString() === studentId,
      );
      const isAbsent = doc.absentStudents.some(
        (id) => id.toString() === studentId,
      );

      if (isPresent || isAbsent) {
        totalDays++;
        if (isPresent) presentDays++;
        history.push({
          _id: doc._id,
          date: doc.date,
          status: isPresent ? "Present" : "Absent",
        });
      }
    });

    const percentage =
      totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    sendResponse(res, 200, true, "Student attendance stats fetched", {
      percentage,
      history,
      totalDays,
      presentDays,
    });
  } catch (error) {
    console.error("Error fetching student stats for teacher:", error);
    sendResponse(res, 500, false, "Failed to fetch student stats", null);
  }
};
