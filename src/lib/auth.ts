import { cookies } from "next/headers";
import { getDb } from "./db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

const SESSION_COOKIE = "school_session";

const sessions = new Map<string, string>();

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const userId = sessions.get(sessionId);
  if (!userId) return null;

  const db = getDb();
  const user = db
    .prepare("SELECT id, email, name, role, avatar_url, created_at FROM users WHERE id = ?")
    .get(userId) as User | undefined;

  return user || null;
}

export async function login(email: string, password: string): Promise<User | null> {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | (User & { password_hash: string })
    | undefined;

  if (!row) return null;

  const valid = bcrypt.compareSync(password, row.password_hash);
  if (!valid) return null;

  const sessionId = uuidv4();
  sessions.set(sessionId, row.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return { id: row.id, email: row.email, name: row.name, role: row.role, avatar_url: row.avatar_url, created_at: row.created_at };
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    sessions.delete(sessionId);
    cookieStore.delete(SESSION_COOKIE);
  }
}

export function createUser(email: string, password: string, name: string, role: string = "teacher"): User {
  const db = getDb();
  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)").run(
    id, email, password_hash, name, role
  );
  return { id, email, name, role, avatar_url: null, created_at: new Date().toISOString() };
}
