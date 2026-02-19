import express from "express";
import {
  markAttendance,
  getCourseAttendance,
  getStudentStats,
  getCourseStats,
  getAttendanceDates,
  getStudentStatisticsForTeacher,
} from "../controllers/attendance.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize(["lecturer", "admin"]),
  markAttendance,
);
router.get(
  "/course",
  authenticate,
  authorize(["lecturer", "admin"]),
  getCourseAttendance,
);
router.get("/student/:courseId", authenticate, getStudentStats);
router.get(
  "/stats/:courseId",
  authenticate,
  authorize(["lecturer", "admin"]),
  getCourseStats,
);
router.get(
  "/dates/:courseId",
  authenticate,
  authorize(["lecturer", "admin"]),
  getAttendanceDates,
);
router.get(
  "/history/:courseId/:studentId",
  authenticate,
  authorize(["lecturer", "admin"]),
  getStudentStatisticsForTeacher,
);

export default router;
