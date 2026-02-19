import mongoose from "mongoose";
const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    fileUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["submitted", "late", "reverted", "graded"],
      default: "submitted",
    },
    grade: { type: Number },
    remark: { type: String },
  },
  { timestamps: true },
);

export const Submission = mongoose.model("Submission", submissionSchema);
