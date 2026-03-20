import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { StaffClient } from "./staff-client";

export interface StaffMember {
  id: string;
  user_id: string;
  department: string;
  position: string;
  phone: string | null;
  hire_date: string | null;
  qualifications: string | null;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

async function createStaff(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const userId = uuidv4();
  const staffId = uuidv4();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const phone = (formData.get("phone") as string) || null;
  const hire_date = (formData.get("hire_date") as string) || null;
  const qualifications = (formData.get("qualifications") as string) || null;

  const password_hash = bcrypt.hashSync(password, 10);

  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, email, password_hash, name, role);

  db.prepare(
    "INSERT INTO staff (id, user_id, department, position, phone, hire_date, qualifications) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(staffId, userId, department, position, phone, hire_date, qualifications);

  revalidatePath("/staff");
}

async function updateStaff(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;
  const userId = formData.get("user_id") as string;

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const phone = (formData.get("phone") as string) || null;
  const hire_date = (formData.get("hire_date") as string) || null;
  const qualifications = (formData.get("qualifications") as string) || null;

  db.prepare(
    "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?"
  ).run(name, email, role, userId);

  db.prepare(
    "UPDATE staff SET department = ?, position = ?, phone = ?, hire_date = ?, qualifications = ? WHERE id = ?"
  ).run(department, position, phone, hire_date, qualifications, id);

  revalidatePath("/staff");
}

async function deleteStaff(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;
  const userId = formData.get("user_id") as string;

  db.prepare("DELETE FROM staff WHERE id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);

  revalidatePath("/staff");
}

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const staffMembers = db.prepare(`
    SELECT
      s.id,
      s.user_id,
      s.department,
      s.position,
      s.phone,
      s.hire_date,
      s.qualifications,
      u.name,
      u.email,
      u.role,
      u.avatar_url
    FROM staff s
    JOIN users u ON s.user_id = u.id
    ORDER BY u.name ASC
  `).all() as StaffMember[];

  return (
    <div>
      <PageHeader
        title="Staff"
        description={`${staffMembers.length} staff member${staffMembers.length !== 1 ? "s" : ""}`}
      />
      <StaffClient
        staffMembers={staffMembers}
        createStaff={createStaff}
        updateStaff={updateStaff}
        deleteStaff={deleteStaff}
      />
    </div>
  );
}
