import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { StudentsClient } from "./students-client";

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  student_id: string;
  grade: string;
  date_of_birth: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  address: string | null;
  notes: string | null;
  enrolled_at: string;
}

async function createStudent(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO students (id, first_name, last_name, email, student_id, grade, date_of_birth, guardian_name, guardian_phone, guardian_email, address, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    formData.get("first_name") as string,
    formData.get("last_name") as string,
    (formData.get("email") as string) || null,
    formData.get("student_id") as string,
    formData.get("grade") as string,
    (formData.get("date_of_birth") as string) || null,
    (formData.get("guardian_name") as string) || null,
    (formData.get("guardian_phone") as string) || null,
    (formData.get("guardian_email") as string) || null,
    (formData.get("address") as string) || null,
    (formData.get("notes") as string) || null,
  );

  revalidatePath("/students");
}

async function updateStudent(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;

  db.prepare(`
    UPDATE students
    SET first_name = ?, last_name = ?, email = ?, student_id = ?, grade = ?, date_of_birth = ?, guardian_name = ?, guardian_phone = ?, guardian_email = ?, address = ?, notes = ?
    WHERE id = ?
  `).run(
    formData.get("first_name") as string,
    formData.get("last_name") as string,
    (formData.get("email") as string) || null,
    formData.get("student_id") as string,
    formData.get("grade") as string,
    (formData.get("date_of_birth") as string) || null,
    (formData.get("guardian_name") as string) || null,
    (formData.get("guardian_phone") as string) || null,
    (formData.get("guardian_email") as string) || null,
    (formData.get("address") as string) || null,
    (formData.get("notes") as string) || null,
    id,
  );

  revalidatePath("/students");
}

async function deleteStudent(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;

  db.prepare("DELETE FROM students WHERE id = ?").run(id);
  revalidatePath("/students");
}

export default async function StudentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const students = db.prepare(
    "SELECT * FROM students ORDER BY last_name ASC, first_name ASC"
  ).all() as Student[];

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${students.length} student${students.length !== 1 ? "s" : ""} enrolled`}
      />
      <StudentsClient
        students={students}
        createStudent={createStudent}
        updateStudent={updateStudent}
        deleteStudent={deleteStudent}
      />
    </div>
  );
}
