import { getDb } from "./db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const db = getDb();

// Check if already seeded
const existing = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (existing.count > 0) {
  console.log("Database already seeded.");
  process.exit(0);
}

console.log("Seeding database...");

// Create users
const adminId = uuidv4();
const teacher1Id = uuidv4();
const teacher2Id = uuidv4();
const teacher3Id = uuidv4();

const hash = bcrypt.hashSync("password123", 10);

db.prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)").run(
  adminId, "admin@school.edu", hash, "Dr. Sarah Mitchell", "admin"
);
db.prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)").run(
  teacher1Id, "john@school.edu", hash, "John Anderson", "teacher"
);
db.prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)").run(
  teacher2Id, "maria@school.edu", hash, "Maria Garcia", "teacher"
);
db.prepare("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)").run(
  teacher3Id, "james@school.edu", hash, "James Wilson", "teacher"
);

// Create staff entries
db.prepare("INSERT INTO staff (id, user_id, department, position, phone, hire_date, qualifications) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
  uuidv4(), adminId, "Administration", "Principal", "555-0100", "2018-08-15", "Ed.D in Educational Leadership"
);
db.prepare("INSERT INTO staff (id, user_id, department, position, phone, hire_date, qualifications) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
  uuidv4(), teacher1Id, "Mathematics", "Senior Teacher", "555-0101", "2019-08-20", "M.S. in Mathematics"
);
db.prepare("INSERT INTO staff (id, user_id, department, position, phone, hire_date, qualifications) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
  uuidv4(), teacher2Id, "Science", "Teacher", "555-0102", "2020-08-18", "M.S. in Biology"
);
db.prepare("INSERT INTO staff (id, user_id, department, position, phone, hire_date, qualifications) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
  uuidv4(), teacher3Id, "English", "Teacher", "555-0103", "2021-08-16", "M.A. in English Literature"
);

// Create classrooms
const class1Id = uuidv4();
const class2Id = uuidv4();
const class3Id = uuidv4();
const class4Id = uuidv4();

db.prepare("INSERT INTO classrooms (id, name, subject, grade, room_number, teacher_id, capacity, schedule, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  class1Id, "Algebra II", "Mathematics", "10th", "A-101", teacher1Id, 28, "Mon/Wed/Fri 9:00-10:00", "Advanced algebra concepts including polynomials and quadratics"
);
db.prepare("INSERT INTO classrooms (id, name, subject, grade, room_number, teacher_id, capacity, schedule, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  class2Id, "AP Biology", "Science", "11th", "B-205", teacher2Id, 24, "Tue/Thu 10:00-11:30", "College-level biology with lab components"
);
db.prepare("INSERT INTO classrooms (id, name, subject, grade, room_number, teacher_id, capacity, schedule, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  class3Id, "English Literature", "English", "12th", "C-110", teacher3Id, 30, "Mon/Wed/Fri 11:00-12:00", "Analysis of classic and modern literary works"
);
db.prepare("INSERT INTO classrooms (id, name, subject, grade, room_number, teacher_id, capacity, schedule, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  class4Id, "Geometry", "Mathematics", "9th", "A-103", teacher1Id, 32, "Tue/Thu 9:00-10:30", "Foundations of geometric principles and proofs"
);

// Create students
const studentIds: string[] = [];
const students = [
  ["Emma", "Thompson", "S10001", "10th", "2009-03-15"],
  ["Liam", "Johnson", "S10002", "10th", "2009-07-22"],
  ["Olivia", "Williams", "S10003", "10th", "2009-01-08"],
  ["Noah", "Brown", "S10004", "11th", "2008-11-30"],
  ["Ava", "Jones", "S10005", "11th", "2008-05-14"],
  ["Ethan", "Davis", "S10006", "11th", "2008-09-03"],
  ["Sophia", "Miller", "S10007", "12th", "2007-12-19"],
  ["Mason", "Wilson", "S10008", "12th", "2007-04-27"],
  ["Isabella", "Moore", "S10009", "9th", "2010-06-11"],
  ["Lucas", "Taylor", "S10010", "9th", "2010-02-05"],
  ["Mia", "Anderson", "S10011", "10th", "2009-08-20"],
  ["Jackson", "Thomas", "S10012", "11th", "2008-03-16"],
  ["Charlotte", "Harris", "S10013", "12th", "2007-10-08"],
  ["Aiden", "Martin", "S10014", "9th", "2010-07-29"],
  ["Harper", "Clark", "S10015", "10th", "2009-11-12"],
];

for (const [fn, ln, sid, grade, dob] of students) {
  const id = uuidv4();
  studentIds.push(id);
  db.prepare(
    "INSERT INTO students (id, first_name, last_name, email, student_id, grade, date_of_birth, guardian_name, guardian_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, fn, ln, `${fn.toLowerCase()}.${ln.toLowerCase()}@student.school.edu`, sid, grade, dob, `Mr/Mrs ${ln}`, `555-${Math.floor(1000 + Math.random() * 9000)}`);
}

// Assign students to classrooms
const classAssignments: [string, number[]][] = [
  [class1Id, [0, 1, 2, 10, 14]],
  [class2Id, [3, 4, 5, 11]],
  [class3Id, [6, 7, 12]],
  [class4Id, [8, 9, 13]],
];

for (const [classId, indices] of classAssignments) {
  for (const idx of indices) {
    db.prepare("INSERT INTO classroom_students (classroom_id, student_id) VALUES (?, ?)").run(classId, studentIds[idx]);
  }
}

// Create attendance records for today
const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

for (const [classId, indices] of classAssignments) {
  const teacherId = db.prepare("SELECT teacher_id FROM classrooms WHERE id = ?").get(classId) as { teacher_id: string };
  for (const idx of indices) {
    const status = Math.random() > 0.1 ? "present" : Math.random() > 0.5 ? "absent" : "late";
    db.prepare("INSERT INTO attendance (id, classroom_id, student_id, date, status, recorded_by) VALUES (?, ?, ?, ?, ?, ?)").run(
      uuidv4(), classId, studentIds[idx], today, status, teacherId.teacher_id
    );
    const status2 = Math.random() > 0.1 ? "present" : Math.random() > 0.5 ? "absent" : "late";
    db.prepare("INSERT INTO attendance (id, classroom_id, student_id, date, status, recorded_by) VALUES (?, ?, ?, ?, ?, ?)").run(
      uuidv4(), classId, studentIds[idx], yesterday, status2, teacherId.teacher_id
    );
  }
}

// Create projects
const proj1Id = uuidv4();
const proj2Id = uuidv4();
const proj3Id = uuidv4();

db.prepare("INSERT INTO projects (id, title, description, classroom_id, status, priority, start_date, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  proj1Id, "Science Fair 2026", "Annual science fair project coordinating student experiments and presentations", class2Id, "active", "high", "2026-02-01", "2026-04-15", teacher2Id
);
db.prepare("INSERT INTO projects (id, title, description, classroom_id, status, priority, start_date, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  proj2Id, "Math Olympiad Prep", "Preparation program for district math competition", class1Id, "active", "medium", "2026-01-15", "2026-03-30", teacher1Id
);
db.prepare("INSERT INTO projects (id, title, description, classroom_id, status, priority, start_date, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  proj3Id, "Literary Magazine", "Student-written literary magazine publication", class3Id, "planning", "low", "2026-03-01", "2026-05-30", teacher3Id
);

// Project tasks
const tasks = [
  [proj1Id, "Define experiment topics", "completed", "Select and approve student experiment topics"],
  [proj1Id, "Lab safety briefing", "completed", "Conduct mandatory lab safety training"],
  [proj1Id, "Midpoint check-in", "in_progress", "Review progress on all experiments"],
  [proj1Id, "Presentation prep", "todo", "Help students prepare final presentations"],
  [proj2Id, "Diagnostic assessment", "completed", "Initial skills assessment for all participants"],
  [proj2Id, "Weekly practice sets", "in_progress", "Distribute and grade weekly problem sets"],
  [proj2Id, "Mock competition", "todo", "Run full-length mock competition"],
  [proj3Id, "Call for submissions", "todo", "Send out submission guidelines to students"],
  [proj3Id, "Editorial review", "todo", "Review and select submissions"],
  [proj3Id, "Layout and design", "todo", "Design magazine layout"],
];

for (const [projId, title, status, desc] of tasks) {
  db.prepare("INSERT INTO project_tasks (id, project_id, title, description, status) VALUES (?, ?, ?, ?, ?)").run(
    uuidv4(), projId, title, desc, status
  );
}

// Create objectives
const objectives = [
  ["Improve Math Proficiency", "Raise average math scores by 15% across all grades", "academic", "2026-06-15", "in_progress", 45, class1Id, teacher1Id],
  ["STEM Engagement", "Increase STEM club participation by 25%", "engagement", "2026-05-01", "in_progress", 60, class2Id, teacher2Id],
  ["Reading Initiative", "Achieve 90% completion rate on reading assignments", "academic", "2026-06-15", "in_progress", 35, class3Id, teacher3Id],
  ["Parent Engagement", "Host monthly parent-teacher conferences with 80% attendance", "community", "2026-06-01", "on_track", 70, null, adminId],
  ["Technology Integration", "Implement digital tools in 100% of classrooms", "operational", "2026-04-01", "in_progress", 85, null, adminId],
];

for (const [title, desc, cat, target, status, progress, classId, createdBy] of objectives) {
  db.prepare("INSERT INTO objectives (id, title, description, category, target_date, status, progress, classroom_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    uuidv4(), title, desc, cat, target, status, progress, classId, createdBy
  );
}

// Create research entries
const researchEntries = [
  ["Impact of Project-Based Learning on Student Engagement", "A study examining how project-based learning methodologies affect student engagement metrics in secondary education.", "Project-based learning (PBL) has emerged as a transformative approach...", "pedagogy", "published", "PBL, engagement, secondary education", teacher2Id],
  ["Digital Assessment Tools: A Comparative Analysis", "Comparing effectiveness of digital vs traditional assessment methods in mathematics education.", "The shift toward digital assessment tools has accelerated...", "technology", "published", "assessment, digital tools, mathematics", teacher1Id],
  ["Inclusive Classroom Strategies for Diverse Learners", "Exploring effective strategies for creating inclusive learning environments that support all students.", "Creating an inclusive classroom requires intentional planning...", "inclusion", "draft", "inclusion, diversity, differentiation", teacher3Id],
  ["Social-Emotional Learning Integration in Core Subjects", "Methods for embedding SEL competencies within standard academic curricula.", "Social-emotional learning (SEL) is increasingly recognized...", "wellness", "review", "SEL, curriculum, integration", adminId],
];

for (const [title, abstract_, content, cat, status, tags, authorId] of researchEntries) {
  db.prepare("INSERT INTO research (id, title, abstract, content, category, status, tags, author_id, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    uuidv4(), title, abstract_, content, cat, status, tags, authorId, status === "published" ? "2026-01-15" : null
  );
}

// Create announcements
db.prepare("INSERT INTO announcements (id, title, content, priority, author_id, target) VALUES (?, ?, ?, ?, ?, ?)").run(
  uuidv4(), "Spring Break Schedule", "Spring break will be from March 23-27. All assignments due before break should be submitted by March 20.", "high", adminId, "all"
);
db.prepare("INSERT INTO announcements (id, title, content, priority, author_id, target) VALUES (?, ?, ?, ?, ?, ?)").run(
  uuidv4(), "Science Fair Registration Open", "Registration for the annual science fair is now open. See Mrs. Garcia for details.", "normal", teacher2Id, "students"
);
db.prepare("INSERT INTO announcements (id, title, content, priority, author_id, target) VALUES (?, ?, ?, ?, ?, ?)").run(
  uuidv4(), "Staff Meeting Friday", "Mandatory staff meeting this Friday at 3:30 PM in the auditorium.", "high", adminId, "staff"
);

console.log("Database seeded successfully!");
console.log("Login credentials:");
console.log("  Admin: admin@school.edu / password123");
console.log("  Teacher: john@school.edu / password123");
console.log("  Teacher: maria@school.edu / password123");
console.log("  Teacher: james@school.edu / password123");
