import { Assignment } from "../models/Assignment.js";
import { Course } from "../models/Course.js";
import { sendResponse } from "../utils/responseHandler.js";

export const createAssignment = async (req, res) => {
  const { courseId } = req.params;
  const { title, description, totalMarks, dueDate } = req.body;
  const attachment = req.file ? req.file.path : null;

  try {
    const assignment = new Assignment({
      title,
      description,
      totalMarks,
      dueDate,
      attachment,
      courseId,
      createdBy: req.user.userId,
    });

    await assignment.save();
    sendResponse(res, 201, true, "Assignment created successfully", assignment);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to create assignment", null);
  }
};

export const getAssignmentsByCourse = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    if (userRole === "student") {
      const course = await Course.findOne({ _id: courseId, students: userId });
      if (!course) {
        return sendResponse(
          res,
          403,
          false,
          "Access denied. You are not enrolled in this course.",
          null,
        );
      }
    }

    const assignments = await Assignment.find({ courseId }).sort({
      createdAt: -1,
    });
    sendResponse(
      res,
      200,
      true,
      "Assignments fetched successfully",
      assignments,
    );
  } catch (error) {
    sendResponse(res, 500, false, "Failed to fetch assignments", null);
  }
};

export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    const assignment = await Assignment.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!assignment) {
      return sendResponse(res, 404, false, "Assignment not found", null);
    }
    sendResponse(res, 200, true, "Assignment updated successfully", assignment);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to update assignment", null);
  }
};

export const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return sendResponse(res, 404, false, "Assignment not found", null);
    }
    sendResponse(res, 200, true, "Assignment deleted successfully", null);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to delete assignment", null);
  }
};
