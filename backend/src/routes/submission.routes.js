import express from "express";
import {
  submitAssignment,
  getSubmissionsByAssignment,
  getStudentSubmissions,
  gradeSubmission,
  revertSubmission,
  getCourseGradebook,
} from "../controllers/submission.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get(
  "/course/:courseId/gradebook",
  authenticate,
  authorize(["lecturer"]),
  getCourseGradebook,
);

router.post(
  "/:assignmentId",
  authenticate,
  authorize(["student"]),
  upload.single("file"),
  submitAssignment,
);
router.get(
  "/assignment/:assignmentId",
  authenticate,
  authorize(["lecturer"]),
  getSubmissionsByAssignment,
);
router.get(
  "/my-submissions",
  authenticate,
  authorize(["student"]),
  getStudentSubmissions,
);
router.put(
  "/:submissionId/grade",
  authenticate,
  authorize(["lecturer"]),
  gradeSubmission,
);
router.put(
  "/:submissionId/revert",
  authenticate,
  authorize(["lecturer"]),
  revertSubmission,
);

export default router;
