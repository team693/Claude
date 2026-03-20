import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProjectsClient } from "./projects-client";

export interface Project {
  id: string;
  title: string;
  description: string | null;
  classroom_id: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  classroom_name: string | null;
  creator_name: string;
  total_tasks: number;
  completed_tasks: number;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  due_date: string | null;
  created_at: string;
}

export interface Classroom {
  id: string;
  name: string;
}

export interface UserOption {
  id: string;
  name: string;
}

async function createProject(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO projects (id, title, description, classroom_id, status, priority, start_date, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    formData.get("title") as string,
    (formData.get("description") as string) || null,
    (formData.get("classroom_id") as string) || null,
    (formData.get("status") as string) || "planning",
    (formData.get("priority") as string) || "medium",
    (formData.get("start_date") as string) || null,
    (formData.get("due_date") as string) || null,
    user.id,
  );

  revalidatePath("/projects");
}

async function updateProject(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;

  db.prepare(`
    UPDATE projects
    SET title = ?, description = ?, classroom_id = ?, status = ?, priority = ?, start_date = ?, due_date = ?
    WHERE id = ?
  `).run(
    formData.get("title") as string,
    (formData.get("description") as string) || null,
    (formData.get("classroom_id") as string) || null,
    formData.get("status") as string,
    formData.get("priority") as string,
    (formData.get("start_date") as string) || null,
    (formData.get("due_date") as string) || null,
    id,
  );

  revalidatePath("/projects");
}

async function updateProjectStatus(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  db.prepare("UPDATE projects SET status = ? WHERE id = ?").run(
    formData.get("status") as string,
    formData.get("id") as string,
  );

  revalidatePath("/projects");
}

async function deleteProject(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;

  db.prepare("DELETE FROM project_tasks WHERE project_id = ?").run(id);
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  revalidatePath("/projects");
}

async function createTask(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO project_tasks (id, project_id, title, description, status, assigned_to, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    formData.get("project_id") as string,
    formData.get("title") as string,
    (formData.get("description") as string) || null,
    (formData.get("status") as string) || "todo",
    (formData.get("assigned_to") as string) || null,
    (formData.get("due_date") as string) || null,
  );

  revalidatePath("/projects");
}

async function updateTaskStatus(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  db.prepare("UPDATE project_tasks SET status = ? WHERE id = ?").run(
    formData.get("status") as string,
    formData.get("id") as string,
  );

  revalidatePath("/projects");
}

async function deleteTask(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  db.prepare("DELETE FROM project_tasks WHERE id = ?").run(
    formData.get("id") as string,
  );

  revalidatePath("/projects");
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();

  const projects = db.prepare(`
    SELECT
      p.*,
      c.name as classroom_name,
      u.name as creator_name,
      COALESCE((SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id), 0) as total_tasks,
      COALESCE((SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id AND status = 'completed'), 0) as completed_tasks
    FROM projects p
    LEFT JOIN classrooms c ON p.classroom_id = c.id
    JOIN users u ON p.created_by = u.id
    ORDER BY
      CASE p.status WHEN 'active' THEN 0 WHEN 'planning' THEN 1 WHEN 'on_hold' THEN 2 WHEN 'completed' THEN 3 END,
      CASE p.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
      p.due_date ASC
  `).all() as Project[];

  const tasks = db.prepare(`
    SELECT
      pt.*,
      u.name as assigned_name
    FROM project_tasks pt
    LEFT JOIN users u ON pt.assigned_to = u.id
    ORDER BY
      CASE pt.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'completed' THEN 2 END,
      pt.due_date ASC
  `).all() as ProjectTask[];

  const classrooms = db.prepare("SELECT id, name FROM classrooms ORDER BY name").all() as Classroom[];
  const users = db.prepare("SELECT id, name FROM users ORDER BY name").all() as UserOption[];

  const tasksByProject: Record<string, ProjectTask[]> = {};
  for (const task of tasks) {
    if (!tasksByProject[task.project_id]) {
      tasksByProject[task.project_id] = [];
    }
    tasksByProject[task.project_id].push(task);
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`${projects.length} project${projects.length !== 1 ? "s" : ""} total`}
      />
      <ProjectsClient
        projects={projects}
        tasksByProject={tasksByProject}
        classrooms={classrooms}
        users={users}
        createProject={createProject}
        updateProject={updateProject}
        updateProjectStatus={updateProjectStatus}
        deleteProject={deleteProject}
        createTask={createTask}
        updateTaskStatus={updateTaskStatus}
        deleteTask={deleteTask}
      />
    </div>
  );
}
