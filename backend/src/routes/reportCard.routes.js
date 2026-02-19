import express from "express";
import {
  generateReportCard,
  togglePublishStatus,
  getReportCard,
  getCourseReportCards,
} from "../controllers/reportCard.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Generate Report (Lecturer only)
router.post(
  "/generate",
  authenticate,
  authorize(["lecturer", "admin"]),
  generateReportCard,
);

// Publish/Unpublish (Lecturer only)
router.post(
  "/publish",
  authenticate,
  authorize(["lecturer", "admin"]),
  togglePublishStatus,
);

// Get All Reports for Course (Lecturer only)
router.get(
  "/course/:courseId",
  authenticate,
  authorize(["lecturer", "admin"]),
  getCourseReportCards,
);

// Get Report (Student: own published, Lecturer: any)
router.get("/", authenticate, getReportCard);

export default router;
