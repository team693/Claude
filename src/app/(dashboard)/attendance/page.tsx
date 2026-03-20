import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AttendanceClient } from "./attendance-client";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade: string;
  room_number: string | null;
}

interface StudentRow {
  student_id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  status: "present" | "absent" | "late" | null;
  notes: string;
}

function getStudentsForClassroom(classroomId: string, date: string) {
  const db = getDb();

  const students = db
    .prepare(
      `SELECT
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.student_id as student_code,
        a.status,
        a.notes
      FROM classroom_students cs
      JOIN students s ON cs.student_id = s.id
      LEFT JOIN attendance a ON a.student_id = s.id
        AND a.classroom_id = cs.classroom_id
        AND a.date = ?
      WHERE cs.classroom_id = ?
      ORDER BY s.last_name, s.first_name`
    )
    .all(date, classroomId) as StudentRow[];

  const total = students.length;
  const recorded = students.filter((s) => s.status !== null).length;
  const present = students.filter((s) => s.status === "present").length;
  const absent = students.filter((s) => s.status === "absent").length;
  const late = students.filter((s) => s.status === "late").length;

  return {
    students,
    stats: { total, present, absent, late, recorded },
  };
}

async function loadStudents(classroomId: string, date: string) {
  "use server";
  return getStudentsForClassroom(classroomId, date);
}

async function saveAttendance(
  classroomId: string,
  date: string,
  records: { studentId: string; status: string; notes: string }[]
) {
  "use server";

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  try {
    const db = getDb();

    const upsert = db.prepare(`
      INSERT INTO attendance (id, classroom_id, student_id, date, status, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(classroom_id, student_id, date)
      DO UPDATE SET status = excluded.status, notes = excluded.notes, recorded_by = excluded.recorded_by
    `);

    const transaction = db.transaction(() => {
      for (const record of records) {
        upsert.run(
          uuidv4(),
          classroomId,
          record.studentId,
          date,
          record.status,
          record.notes || null,
          user.id
        );
      }
    });

    transaction();
    revalidatePath("/attendance");
    return { success: true };
  } catch (error) {
    console.error("Failed to save attendance:", error);
    return { success: false, error: "Failed to save attendance records." };
  }
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  const classrooms = db
    .prepare(
      `SELECT id, name, subject, grade, room_number
       FROM classrooms
       ORDER BY grade, name`
    )
    .all() as Classroom[];

  const selectedClassroomId = params.classroom || "";
  const selectedDate = params.date || today;

  let initialStudents: StudentRow[] = [];
  let initialStats = { total: 0, present: 0, absent: 0, late: 0, recorded: 0 };

  if (selectedClassroomId) {
    const data = getStudentsForClassroom(selectedClassroomId, selectedDate);
    initialStudents = data.students;
    initialStats = data.stats;
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Record and manage daily student attendance by classroom."
      />

      <AttendanceClient
        classrooms={classrooms}
        initialClassroomId={selectedClassroomId}
        initialDate={selectedDate}
        initialStudents={initialStudents}
        initialStats={initialStats}
        loadStudents={loadStudents}
        saveAttendance={saveAttendance}
      />
    </div>
  );
}
