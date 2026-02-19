import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Define Old Schema (for reading if necessary, but we can use raw collection)
// We'll trust the raw data scan.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend root
dotenv.config({ path: join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/campusconnect";

async function migrate() {
  try {
    console.log("Connecting to:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const collection = db.collection("attendances");

    // 1. Fetch all records
    const allRecords = await collection.find({}).toArray();
    console.log(`Found ${allRecords.length} total attendance records.`);

    // 2. Identify Old vs New
    const oldSchemaRecords = [];
    const newSchemaRecords = [];

    for (const doc of allRecords) {
      if (doc.presentStudents && Array.isArray(doc.presentStudents)) {
        newSchemaRecords.push(doc);
      } else if (doc.student && doc.status) {
        oldSchemaRecords.push(doc);
      } else {
        console.warn("Unknown record format:", doc._id);
      }
    }

    console.log(`- New Schema Records: ${newSchemaRecords.length}`);
    console.log(`- Old Schema Records: ${oldSchemaRecords.length}`);

    if (oldSchemaRecords.length === 0) {
      console.log("No old schema records found. Migration not needed.");
      return;
    }

    // 3. Group Old Records by Course + Date
    const groups = {};

    for (const rec of oldSchemaRecords) {
      // Normalize date to YYYY-MM-DD for grouping (ignoring time for the session group)
      // OR better: use the exact date object if they align, but usually we want to group by day.
      // Let's assume the date stored is reliable enough or normalize to start of day.
      const d = new Date(rec.date);
      d.setHours(0, 0, 0, 0);
      const dateKey = d.toISOString();
      const courseId = rec.course.toString();

      const key = `${courseId}_${dateKey}`;

      if (!groups[key]) {
        groups[key] = {
          course: rec.course,
          date: d,
          markedBy: rec.markedBy, // take first one found
          present: [],
          absent: [],
          idsToDelete: [],
        };
      }

      groups[key].idsToDelete.push(rec._id);

      if (rec.status === "Present") {
        groups[key].present.push(rec.student);
      } else {
        groups[key].absent.push(rec.student);
      }
    }

    console.log(
      `Identified ${Object.keys(groups).length} unique sessions to create.`,
    );

    // 4. Transform and Save
    for (const key in groups) {
      const group = groups[key];

      const newDoc = {
        course: group.course,
        date: group.date,
        presentStudents: group.present,
        absentStudents: group.absent,
        totalStudents: group.present.length + group.absent.length,
        markedBy: group.markedBy,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      };

      // Insert new
      await collection.insertOne(newDoc);

      // Delete old
      await collection.deleteMany({ _id: { $in: group.idsToDelete } });

      console.log(
        `Migrated session for course ${group.course} on ${group.date.toISOString().split("T")[0]}`,
      );
    }

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

migrate();
