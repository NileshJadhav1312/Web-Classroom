import mongoose from "mongoose";

const reportCardSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignmentDetails: [
      {
        assignmentId: mongoose.Schema.Types.ObjectId,
        assignmentTitle: String,
        obtainedMarks: Number,
        totalMarks: Number,
        grade: String,
      },
    ],
    overallTotal: Number,
    overallObtained: Number,
    percentage: Number,
    finalGrade: String,
    remark: String,
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedDate: Date,
    generatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Ensure one report card per student per course? Or allow multiple versions?
// Usually one active report card.
reportCardSchema.index({ course: 1, student: 1 }, { unique: true });

export const ReportCard = mongoose.model("ReportCard", reportCardSchema);
