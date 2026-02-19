import express from "express";
import {
  createAssignment,
  getAssignmentsByCourse,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignment.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/:courseId",
  authenticate,
  authorize(["lecturer"]),
  upload.single("attachment"),
  createAssignment,
);
router.get("/:courseId", authenticate, getAssignmentsByCourse);
router.put("/:id", authenticate, authorize(["lecturer"]), updateAssignment);
router.delete("/:id", authenticate, authorize(["lecturer"]), deleteAssignment);

export default router;
