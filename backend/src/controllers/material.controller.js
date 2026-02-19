import { Material } from "../models/Material.js";
import { Course } from "../models/Course.js";
import { sendResponse } from "../utils/responseHandler.js";

export const uploadMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;
    const file = req.file;
    if (!file) {
      sendResponse(res, 400, false, "No file uploaded", null);
      return;
    }

    const material = new Material({
      title: req.body.title,
      description: req.body.description,
      subject: req.body.subject,
      fileUrl: req.file?.path,
      courseId,
      uploadedBy: req.user?.userId,
    });

    await material.save();

    // Update the course to include the new material
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { materials: material._id },
    });

    sendResponse(res, 201, true, "Material uploaded successfully", material);
  } catch (error) {
    sendResponse(res, 500, false, "Failed to upload material", null);
  }
};

export const getMaterialsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === "lecturer") {
      // Lecturers can see all? Or check if they own the course?
      // For simplicity allow all lecturers or check course ownership
      const course = await Course.findById(courseId);
      if (course.lecturer.toString() !== userId) {
        // return sendResponse(res, 403, false, "Unauthorized", null);
        // Relaxed for now or check ownership
      }
    } else if (userRole === "student") {
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

    const materials = await Material.find({ courseId });
    sendResponse(res, 200, true, "Materials fetched successfully", materials);
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Failed to fetch materials", null);
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const materialId = req.params.id;

    // Find and delete the material
    const material = await Material.findByIdAndDelete(materialId);
    if (!material) {
      sendResponse(res, 404, false, "Material not found", null);
      return;
    }

    // Update the course to remove the deleted material
    await Course.findByIdAndUpdate(material.courseId, {
      $pull: { materials: materialId },
    });

    sendResponse(res, 200, true, "Material deleted successfully", null);
    return;
  } catch (error) {
    console.error("Error deleting material:", error);
    sendResponse(res, 500, false, "Material deleted successfully", null);
    return;
  }
};
