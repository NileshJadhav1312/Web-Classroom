import express from "express";
import {
  getClassAnalytics,
  getStudentAnalytics,
} from "../controllers/analytics.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Teacher: Class Performance
router.get(
  "/teacher/:courseId",
  authenticate,
  authorize(["lecturer", "admin"]),
  getClassAnalytics,
);

// Student: My Performance
router.get("/student/:courseId", authenticate, getStudentAnalytics);

export default router;
