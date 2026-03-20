import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "school.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'teacher',
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classrooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      room_number TEXT,
      teacher_id TEXT NOT NULL,
      capacity INTEGER DEFAULT 30,
      schedule TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      student_id TEXT UNIQUE NOT NULL,
      grade TEXT NOT NULL,
      date_of_birth TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      guardian_email TEXT,
      address TEXT,
      notes TEXT,
      enrolled_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classroom_students (
      classroom_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      PRIMARY KEY (classroom_id, student_id),
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      classroom_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'present',
      notes TEXT,
      recorded_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(classroom_id, student_id, date),
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (recorded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      classroom_id TEXT,
      status TEXT NOT NULL DEFAULT 'planning',
      priority TEXT NOT NULL DEFAULT 'medium',
      start_date TEXT,
      due_date TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      assigned_to TEXT,
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS objectives (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'academic',
      target_date TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress',
      progress INTEGER DEFAULT 0,
      classroom_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS research (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      abstract TEXT,
      content TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'draft',
      tags TEXT,
      author_id TEXT NOT NULL,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      position TEXT NOT NULL,
      phone TEXT,
      hire_date TEXT,
      qualifications TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      author_id TEXT NOT NULL,
      target TEXT DEFAULT 'all',
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
  `);
}
