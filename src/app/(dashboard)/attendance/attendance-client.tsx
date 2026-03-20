"use client";

import { useState, useTransition } from "react";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade: string;
  room_number: string | null;
}

interface StudentAttendance {
  student_id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  status: "present" | "absent" | "late" | null;
  notes: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  recorded: number;
}

interface AttendanceClientProps {
  classrooms: Classroom[];
  initialClassroomId: string;
  initialDate: string;
  initialStudents: StudentAttendance[];
  initialStats: AttendanceStats;
  loadStudents: (classroomId: string, date: string) => Promise<{
    students: StudentAttendance[];
    stats: AttendanceStats;
  }>;
  saveAttendance: (
    classroomId: string,
    date: string,
    records: { studentId: string; status: string; notes: string }[]
  ) => Promise<{ success: boolean; error?: string }>;
}

export function AttendanceClient({
  classrooms,
  initialClassroomId,
  initialDate,
  initialStudents,
  initialStats,
  loadStudents,
  saveAttendance,
}: AttendanceClientProps) {
  const [classroomId, setClassroomId] = useState(initialClassroomId);
  const [date, setDate] = useState(initialDate);
  const [students, setStudents] = useState<StudentAttendance[]>(initialStudents);
  const [stats, setStats] = useState<AttendanceStats>(initialStats);
  const [attendance, setAttendance] = useState<
    Record<string, { status: string; notes: string }>
  >(() => {
    const map: Record<string, { status: string; notes: string }> = {};
    for (const s of initialStudents) {
      map[s.student_id] = { status: s.status || "present", notes: s.notes || "" };
    }
    return map;
  });
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleFilterChange(newClassroomId: string, newDate: string) {
    setClassroomId(newClassroomId);
    setDate(newDate);
    setSaveMessage(null);

    if (!newClassroomId) {
      setStudents([]);
      setStats({ total: 0, present: 0, absent: 0, late: 0, recorded: 0 });
      setAttendance({});
      return;
    }

    startTransition(async () => {
      const result = await loadStudents(newClassroomId, newDate);
      setStudents(result.students);
      setStats(result.stats);
      const map: Record<string, { status: string; notes: string }> = {};
      for (const s of result.students) {
        map[s.student_id] = { status: s.status || "present", notes: s.notes || "" };
      }
      setAttendance(map);
    });
  }

  function setStatusForStudent(studentId: string, status: string) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  }

  function setNotesForStudent(studentId: string, notes: string) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  }

  function markAll(status: string) {
    setAttendance((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = { ...next[key], status };
      }
      return next;
    });
  }

  function handleSave() {
    if (!classroomId) return;
    setSaveMessage(null);

    const records = Object.entries(attendance).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      notes: data.notes,
    }));

    startTransition(async () => {
      const result = await saveAttendance(classroomId, date, records);
      if (result.success) {
        setSaveMessage({ type: "success", text: "Attendance saved successfully." });
        // Refresh stats
        const refreshed = await loadStudents(classroomId, date);
        setStudents(refreshed.students);
        setStats(refreshed.stats);
      } else {
        setSaveMessage({ type: "error", text: result.error || "Failed to save attendance." });
      }
    });
  }

  const selectedClassroom = classrooms.find((c) => c.id === classroomId);

  return (
    <div>
      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Classroom</label>
            <select
              className="input"
              value={classroomId}
              onChange={(e) => handleFilterChange(e.target.value, date)}
            >
              <option value="">Select a classroom...</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.subject} (Grade {c.grade})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => handleFilterChange(classroomId, e.target.value)}
            />
          </div>
          {selectedClassroom && (
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">{selectedClassroom.name}</p>
                <p>
                  {selectedClassroom.subject} | Grade {selectedClassroom.grade}
                  {selectedClassroom.room_number && ` | Room ${selectedClassroom.room_number}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {classroomId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total Students</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
            <p className="text-xs text-gray-500 mt-1">
              Present {stats.recorded > 0 && `(${Math.round((stats.present / stats.total) * 100)}%)`}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-gray-500 mt-1">Absent</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
            <p className="text-xs text-gray-500 mt-1">Late</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {classroomId && students.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Student Attendance
              <span className="text-sm font-normal text-gray-500 ml-2">
                {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                onClick={() => markAll("present")}
                disabled={isPending}
              >
                All Present
              </button>
              <button
                className="btn-secondary"
                onClick={() => markAll("absent")}
                disabled={isPending}
              >
                All Absent
              </button>
              <button
                className="btn-secondary"
                onClick={() => markAll("late")}
                disabled={isPending}
              >
                All Late
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="table-header">#</th>
                  <th className="table-header">Student ID</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student, index) => {
                  const record = attendance[student.student_id] || {
                    status: "present",
                    notes: "",
                  };
                  return (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="table-cell text-gray-500">{index + 1}</td>
                      <td className="table-cell text-gray-500 font-mono text-xs">
                        {student.student_code}
                      </td>
                      <td className="table-cell font-medium">
                        {student.last_name}, {student.first_name}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className={`badge ${
                              record.status === "present"
                                ? "badge-success"
                                : "opacity-40 hover:opacity-70 badge-success"
                            } cursor-pointer`}
                            onClick={() =>
                              setStatusForStudent(student.student_id, "present")
                            }
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={`badge ${
                              record.status === "absent"
                                ? "badge-danger"
                                : "opacity-40 hover:opacity-70 badge-danger"
                            } cursor-pointer`}
                            onClick={() =>
                              setStatusForStudent(student.student_id, "absent")
                            }
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            className={`badge ${
                              record.status === "late"
                                ? "badge-warning"
                                : "opacity-40 hover:opacity-70 badge-warning"
                            } cursor-pointer`}
                            onClick={() =>
                              setStatusForStudent(student.student_id, "late")
                            }
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td className="table-cell">
                        <input
                          type="text"
                          className="input text-sm"
                          placeholder="Optional notes..."
                          value={record.notes}
                          onChange={(e) =>
                            setNotesForStudent(student.student_id, e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div>
              {saveMessage && (
                <p
                  className={`text-sm ${
                    saveMessage.type === "success"
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {saveMessage.text}
                </p>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {classroomId && students.length === 0 && !isPending && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No students enrolled in this classroom.</p>
        </div>
      )}

      {!classroomId && (
        <div className="card text-center py-12">
          <p className="text-gray-500">Select a classroom to manage attendance.</p>
        </div>
      )}

      {isPending && (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      )}
    </div>
  );
}
