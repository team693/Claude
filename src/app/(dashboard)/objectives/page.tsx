import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectivesClient } from "./objectives-client";

export interface Objective {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  status: string;
  progress: number;
  classroom_id: string | null;
  created_by: string;
  created_at: string;
  classroom_name: string | null;
}

export interface Classroom {
  id: string;
  name: string;
}

async function createObjective(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO objectives (id, title, description, category, target_date, status, progress, classroom_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    formData.get("title") as string,
    (formData.get("description") as string) || null,
    (formData.get("category") as string) || "academic",
    (formData.get("target_date") as string) || null,
    (formData.get("status") as string) || "in_progress",
    parseInt((formData.get("progress") as string) || "0", 10),
    (formData.get("classroom_id") as string) || null,
    user.id,
  );

  revalidatePath("/objectives");
}

async function updateObjective(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;

  db.prepare(`
    UPDATE objectives
    SET title = ?, description = ?, category = ?, target_date = ?, status = ?, progress = ?, classroom_id = ?
    WHERE id = ?
  `).run(
    formData.get("title") as string,
    (formData.get("description") as string) || null,
    formData.get("category") as string,
    (formData.get("target_date") as string) || null,
    formData.get("status") as string,
    parseInt((formData.get("progress") as string) || "0", 10),
    (formData.get("classroom_id") as string) || null,
    id,
  );

  revalidatePath("/objectives");
}

async function updateProgress(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;
  const progress = parseInt(formData.get("progress") as string, 10);

  // Auto-update status based on progress
  let status: string | undefined;
  if (progress === 100) {
    status = "completed";
  }

  if (status) {
    db.prepare("UPDATE objectives SET progress = ?, status = ? WHERE id = ?").run(progress, status, id);
  } else {
    db.prepare("UPDATE objectives SET progress = ? WHERE id = ?").run(progress, id);
  }

  revalidatePath("/objectives");
}

async function deleteObjective(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  db.prepare("DELETE FROM objectives WHERE id = ?").run(
    formData.get("id") as string,
  );

  revalidatePath("/objectives");
}

export default async function ObjectivesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();

  const objectives = db.prepare(`
    SELECT
      o.*,
      c.name as classroom_name
    FROM objectives o
    LEFT JOIN classrooms c ON o.classroom_id = c.id
    ORDER BY
      CASE o.status WHEN 'at_risk' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'on_track' THEN 2 WHEN 'completed' THEN 3 END,
      o.target_date ASC,
      o.created_at DESC
  `).all() as Objective[];

  const classrooms = db.prepare("SELECT id, name FROM classrooms ORDER BY name").all() as Classroom[];

  return (
    <div>
      <PageHeader
        title="Objectives"
        description={`${objectives.length} objective${objectives.length !== 1 ? "s" : ""} total`}
      />
      <ObjectivesClient
        objectives={objectives}
        classrooms={classrooms}
        createObjective={createObjective}
        updateObjective={updateObjective}
        updateProgress={updateProgress}
        deleteObjective={deleteObjective}
      />
    </div>
  );
}
