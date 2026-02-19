import express from "express";
import {
  requestEnrollment,
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment,
  getStudentEnrollments,
} from "../controllers/enrollment.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/request",
  authenticate,
  authorize(["student"]),
  requestEnrollment,
);
router.get(
  "/pending",
  authenticate,
  authorize(["lecturer"]),
  getPendingEnrollments,
);
router.put(
  "/:enrollmentId/approve",
  authenticate,
  authorize(["lecturer"]),
  approveEnrollment,
);
router.put(
  "/:enrollmentId/reject",
  authenticate,
  authorize(["lecturer"]),
  rejectEnrollment,
);
router.get(
  "/my-enrollments",
  authenticate,
  authorize(["student"]),
  getStudentEnrollments,
);

export default router;
