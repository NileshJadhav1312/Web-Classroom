"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TeacherReportManager from "@/components/TeacherReportManager";
import StudentReportView from "@/components/StudentReportView";
import Link from "next/link"; // Ensure Link is imported

export default function ReportCardPage() {
  const { id } = useParams(); // courseId
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link
          href={`/dashboard/courses/${id}`}
          className="text-blue-600 hover:underline"
        >
          &larr; Back to Course
        </Link>
      </div>

      {user.role === "lecturer" ? (
        <TeacherReportManager courseId={id} />
      ) : (
        <StudentReportView courseId={id} />
      )}
    </div>
  );
}
