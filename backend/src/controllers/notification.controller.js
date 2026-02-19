import { Notification } from "../models/Notification.js";
import { sendResponse } from "../utils/responseHandler.js";

export const getNotifications = async (req, res) => {
  const userId = req.user.userId;
  try {
    const notifications = await Notification.find({ recipient: userId }).sort({
      createdAt: -1,
    });
    sendResponse(
      res,
      200,
      true,
      "Notifications fetched successfully",
      notifications,
    );
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch notifications", null);
  }
};

export const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await Notification.findByIdAndUpdate(id, { isRead: true });
    sendResponse(res, 200, true, "Notification marked as read", null);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to update notification", null);
  }
};
