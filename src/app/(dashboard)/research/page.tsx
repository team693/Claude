import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ResearchClient } from "./research-client";

export interface ResearchEntry {
  id: string;
  title: string;
  abstract: string | null;
  content: string | null;
  category: string;
  status: string;
  tags: string | null;
  author_id: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

async function createResearch(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = uuidv4();
  const status = formData.get("status") as string;
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  db.prepare(`
    INSERT INTO research (id, title, abstract, content, category, status, tags, author_id, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    formData.get("title") as string,
    (formData.get("abstract") as string) || null,
    (formData.get("content") as string) || null,
    formData.get("category") as string,
    status,
    (formData.get("tags") as string) || null,
    user.id,
    publishedAt,
  );

  revalidatePath("/research");
}

async function updateResearch(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  const existing = db.prepare("SELECT status, published_at FROM research WHERE id = ?").get(id) as {
    status: string;
    published_at: string | null;
  } | undefined;

  let publishedAt = existing?.published_at ?? null;
  if (status === "published" && existing?.status !== "published") {
    publishedAt = new Date().toISOString();
  } else if (status !== "published") {
    publishedAt = null;
  }

  db.prepare(`
    UPDATE research
    SET title = ?, abstract = ?, content = ?, category = ?, status = ?, tags = ?, published_at = ?
    WHERE id = ?
  `).run(
    formData.get("title") as string,
    (formData.get("abstract") as string) || null,
    (formData.get("content") as string) || null,
    formData.get("category") as string,
    status,
    (formData.get("tags") as string) || null,
    publishedAt,
    id,
  );

  revalidatePath("/research");
}

async function deleteResearch(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const id = formData.get("id") as string;

  db.prepare("DELETE FROM research WHERE id = ?").run(id);
  revalidatePath("/research");
}

export default async function ResearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const entries = db.prepare(`
    SELECT r.*, u.name AS author_name
    FROM research r
    JOIN users u ON r.author_id = u.id
    ORDER BY r.created_at DESC
  `).all() as ResearchEntry[];

  return (
    <div>
      <PageHeader
        title="Research"
        description={`${entries.length} research entr${entries.length !== 1 ? "ies" : "y"}`}
      />
      <ResearchClient
        entries={entries}
        createResearch={createResearch}
        updateResearch={updateResearch}
        deleteResearch={deleteResearch}
      />
    </div>
  );
}
