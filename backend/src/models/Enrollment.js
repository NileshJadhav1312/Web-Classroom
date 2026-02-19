import mongoose from "mongoose";
const { Schema, model } = mongoose;

const EnrollmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  enrolledAt: { type: Date, default: Date.now },
});

const Enrollment = model("Enrollment", EnrollmentSchema);

export { Enrollment };
