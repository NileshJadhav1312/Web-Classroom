import express from "express";
import {
  uploadMaterial,
  getMaterialsByCourse,
  deleteMaterial,
} from "../controllers/material.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/:courseId",
  authenticate,
  authorize(["lecturer"]),
  upload.single("file"),
  uploadMaterial,
);
router.get("/:courseId", authenticate, getMaterialsByCourse);
router.delete(
  "/:id",
  authenticate,
  authorize(["lecturer", "admin"]),
  deleteMaterial,
);

export default router;
