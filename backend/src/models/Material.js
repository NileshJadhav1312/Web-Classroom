import mongoose from "mongoose";
const { Schema } = mongoose;

const materialSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String },
    fileUrl: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Material = mongoose.model("Material", materialSchema);
