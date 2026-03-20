import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const db = getDb();

  const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM students").get() as { count: number }).count;
  const totalClassrooms = (db.prepare("SELECT COUNT(*) as count FROM classrooms").get() as { count: number }).count;
  const totalStaff = (db.prepare("SELECT COUNT(*) as count FROM staff").get() as { count: number }).count;
  const activeProjects = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").get() as { count: number }).count;

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = db.prepare(`
    SELECT status, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY status
  `).all(today) as { status: string; count: number }[];

  const presentCount = todayAttendance.find((a) => a.status === "present")?.count || 0;
  const totalToday = todayAttendance.reduce((s, a) => s + a.count, 0);
  const attendanceRate = totalToday > 0 ? Math.round((presentCount / totalToday) * 100) : 0;

  const recentAnnouncements = db.prepare(`
    SELECT a.*, u.name as author_name FROM announcements a
    JOIN users u ON a.author_id = u.id
    ORDER BY a.created_at DESC LIMIT 5
  `).all() as Array<{
    id: string; title: string; content: string; priority: string;
    author_name: string; target: string; created_at: string;
  }>;

  const upcomingProjects = db.prepare(`
    SELECT p.*, u.name as creator_name, c.name as classroom_name
    FROM projects p
    JOIN users u ON p.created_by = u.id
    LEFT JOIN classrooms c ON p.classroom_id = c.id
    WHERE p.status IN ('active', 'planning')
    ORDER BY p.due_date ASC LIMIT 5
  `).all() as Array<{
    id: string; title: string; status: string; priority: string;
    due_date: string; creator_name: string; classroom_name: string | null;
  }>;

  const objectives = db.prepare(`
    SELECT * FROM objectives ORDER BY progress DESC LIMIT 5
  `).all() as Array<{
    id: string; title: string; category: string; status: string; progress: number;
  }>;

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(" ")[0]}!</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
          color="indigo"
          label="Total Students"
          value={totalStudents}
        />
        <StatCard
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
          color="emerald"
          label="Classrooms"
          value={totalClassrooms}
        />
        <StatCard
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}
          color="amber"
          label="Attendance Rate"
          value={`${attendanceRate}%`}
        />
        <StatCard
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />}
          color="purple"
          label="Active Projects"
          value={activeProjects}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Announcements</h2>
          </div>
          <div className="space-y-3">
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.priority === "high" ? "bg-red-500" : "bg-blue-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1">by {a.author_name}</p>
                </div>
                <span className={`badge ${a.target === "all" ? "badge-info" : a.target === "staff" ? "badge-warning" : "badge-success"}`}>
                  {a.target}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Objectives Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Objectives</h2>
            <Link href="/objectives" className="text-indigo-600 text-sm hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {objectives.map((obj) => (
              <div key={obj.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700 truncate pr-2">{obj.title}</p>
                  <span className="text-xs text-gray-500 shrink-0">{obj.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${obj.progress >= 75 ? "bg-emerald-500" : obj.progress >= 50 ? "bg-blue-500" : obj.progress >= 25 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${obj.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Projects</h2>
          <Link href="/projects" className="text-indigo-600 text-sm hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="table-header">Project</th>
                <th className="table-header">Classroom</th>
                <th className="table-header">Status</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {upcomingProjects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{p.title}</td>
                  <td className="table-cell text-gray-500">{p.classroom_name || "General"}</td>
                  <td className="table-cell">
                    <span className={`badge ${p.status === "active" ? "badge-success" : "badge-gray"}`}>{p.status}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${p.priority === "high" ? "badge-danger" : p.priority === "medium" ? "badge-warning" : "badge-info"}`}>{p.priority}</span>
                  </td>
                  <td className="table-cell text-gray-500">{p.due_date ? new Date(p.due_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string | number }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="stat-card">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
