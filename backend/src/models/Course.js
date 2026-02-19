import mongoose from "mongoose";
const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    title: { type: String, required: true },
    courseCode: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    lecturer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    materials: [{ type: Schema.Types.ObjectId, ref: "Material" }],
  },
  { timestamps: true },
);

export const Course = mongoose.model("Course", courseSchema);
