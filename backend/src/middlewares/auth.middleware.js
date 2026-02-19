import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/responseHandler.js";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    sendResponse(res, 401, true, "Unauthorized", null);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    sendResponse(res, 401, true, "Invalid token", null);
    return;
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendResponse(res, 403, true, "Forbidden", null);
      return;
    }
    next();
  };
};
