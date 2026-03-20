import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClassroomsClient } from "./classrooms-client";

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade: string;
  room_number: string | null;
  teacher_id: string;
  capacity: number;
  schedule: string | null;
  description: string | null;
  created_at: string;
  teacher_name: string;
  student_count: number;
}

export interface Teacher {
  id: string;
  name: string;
}

async function createClassroom(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO classrooms (id, name, subject, grade, room_number, teacher_id, capacity, schedule, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    formData.get("name") as string,
    formData.get("subject") as string,
    formData.get("grade") as string,
    (formData.get("room_number") as string) || null,
    formData.get("teacher_id") as string,
    parseInt(formData.get("capacity") as string) || 30,
    (formData.get("schedule") as string) || null,
    (formData.get("description") as string) || null,
  );

  revalidatePath("/classrooms");
}

async function updateClassroom(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;

  db.prepare(`
    UPDATE classrooms
    SET name = ?, subject = ?, grade = ?, room_number = ?, teacher_id = ?, capacity = ?, schedule = ?, description = ?
    WHERE id = ?
  `).run(
    formData.get("name") as string,
    formData.get("subject") as string,
    formData.get("grade") as string,
    (formData.get("room_number") as string) || null,
    formData.get("teacher_id") as string,
    parseInt(formData.get("capacity") as string) || 30,
    (formData.get("schedule") as string) || null,
    (formData.get("description") as string) || null,
    id,
  );

  revalidatePath("/classrooms");
}

async function deleteClassroom(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;

  db.prepare("DELETE FROM classroom_students WHERE classroom_id = ?").run(id);
  db.prepare("DELETE FROM classrooms WHERE id = ?").run(id);
  revalidatePath("/classrooms");
}

export default async function ClassroomsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();

  const classrooms = db.prepare(`
    SELECT
      c.*,
      u.name AS teacher_name,
      (SELECT COUNT(*) FROM classroom_students cs WHERE cs.classroom_id = c.id) AS student_count
    FROM classrooms c
    LEFT JOIN users u ON c.teacher_id = u.id
    ORDER BY c.name ASC
  `).all() as Classroom[];

  const teachers = db.prepare(
    "SELECT id, name FROM users ORDER BY name ASC"
  ).all() as Teacher[];

  return (
    <div>
      <PageHeader
        title="Classrooms"
        description={`${classrooms.length} classroom${classrooms.length !== 1 ? "s" : ""} total`}
      />
      <ClassroomsClient
        classrooms={classrooms}
        teachers={teachers}
        createClassroom={createClassroom}
        updateClassroom={updateClassroom}
        deleteClassroom={deleteClassroom}
      />
    </div>
  );
}
