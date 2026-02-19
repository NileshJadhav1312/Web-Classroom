import { Router } from "express";
import {
  registerUser,
  loginUser,
  verifyToken,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { sendResponse } from "../utils/responseHandler.js";

const router = Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", authenticate, (_req, res) => {
  sendResponse(res, 200, true, "Logged out successfully", null);
});
router.get("/verify", verifyToken);

export default router;
