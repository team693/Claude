"use client";

import { useState, useTransition, useRef } from "react";
import type { Student } from "./page";

interface StudentsClientProps {
  students: Student[];
  createStudent: (formData: FormData) => Promise<void>;
  updateStudent: (formData: FormData) => Promise<void>;
  deleteStudent: (formData: FormData) => Promise<void>;
}

type ModalMode = "closed" | "add" | "edit";

const GRADES = [
  "Pre-K", "K",
  "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th", "11th", "12th",
];

export function StudentsClient({
  students,
  createStudent,
  updateStudent,
  deleteStudent,
}: StudentsClientProps) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = students.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term) ||
      s.student_id.toLowerCase().includes(term) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.guardian_name && s.guardian_name.toLowerCase().includes(term));
    const matchesGrade = !gradeFilter || s.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  function openAdd() {
    setEditingStudent(null);
    setModalMode("add");
  }

  function openEdit(student: Student) {
    setEditingStudent(student);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode("closed");
    setEditingStudent(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (modalMode === "add") {
        await createStudent(formData);
      } else {
        await updateStudent(formData);
      }
      closeModal();
    });
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => {
      await deleteStudent(fd);
      setDeleteConfirmId(null);
    });
  }

  const uniqueGrades = Array.from(new Set(students.map((s) => s.grade))).sort(
    (a, b) => {
      const idxA = GRADES.indexOf(a);
      const idxB = GRADES.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    }
  );

  return (
    <>
      {/* Toolbar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="input w-full sm:w-auto"
            >
              <option value="">All Grades</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <button onClick={openAdd} className="btn-primary whitespace-nowrap">
            <svg
              className="w-4 h-4 mr-1.5 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="table-header">Name</th>
                <th className="table-header">Student ID</th>
                <th className="table-header">Grade</th>
                <th className="table-header">Email</th>
                <th className="table-header">Guardian</th>
                <th className="table-header">Enrolled</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-gray-400 py-12">
                    {students.length === 0
                      ? "No students yet. Add your first student to get started."
                      : "No students match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 group">
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                      {student.date_of_birth && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          DOB: {new Date(student.date_of_birth).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-sm">{student.student_id}</span>
                    </td>
                    <td className="table-cell">
                      <span className="badge">{student.grade}</span>
                    </td>
                    <td className="table-cell text-gray-500 text-sm">
                      {student.email || "\u2014"}
                    </td>
                    <td className="table-cell">
                      {student.guardian_name ? (
                        <div>
                          <div className="text-sm text-gray-900">{student.guardian_name}</div>
                          {student.guardian_phone && (
                            <div className="text-xs text-gray-400">{student.guardian_phone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">{"\u2014"}</span>
                      )}
                    </td>
                    <td className="table-cell text-gray-500 text-sm">
                      {new Date(student.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell text-right">
                      {deleteConfirmId === student.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-red-600 mr-1">Delete?</span>
                          <button
                            onClick={() => handleDelete(student.id)}
                            disabled={isPending}
                            className="btn-danger text-xs px-2 py-1"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="btn-secondary text-xs px-2 py-1"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(student)}
                            className="btn-secondary text-xs px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(student.id)}
                            className="btn-danger text-xs px-2 py-1"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t text-xs text-gray-400">
            Showing {filtered.length} of {students.length} student{students.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === "add" ? "Add New Student" : "Edit Student"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="p-6 space-y-5">
              {editingStudent && (
                <input type="hidden" name="id" value={editingStudent.id} />
              )}

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    defaultValue={editingStudent?.first_name ?? ""}
                    className="input w-full"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="label">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    defaultValue={editingStudent?.last_name ?? ""}
                    className="input w-full"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Student ID & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    required
                    defaultValue={editingStudent?.student_id ?? ""}
                    className="input w-full"
                    placeholder="STU-0001"
                  />
                </div>
                <div>
                  <label className="label">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="grade"
                    required
                    defaultValue={editingStudent?.grade ?? ""}
                    className="input w-full"
                  >
                    <option value="" disabled>
                      Select grade
                    </option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingStudent?.email ?? ""}
                    className="input w-full"
                    placeholder="student@school.edu"
                  />
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    defaultValue={editingStudent?.date_of_birth ?? ""}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Guardian section */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Guardian Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Guardian Name</label>
                    <input
                      type="text"
                      name="guardian_name"
                      defaultValue={editingStudent?.guardian_name ?? ""}
                      className="input w-full"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="label">Guardian Phone</label>
                    <input
                      type="tel"
                      name="guardian_phone"
                      defaultValue={editingStudent?.guardian_phone ?? ""}
                      className="input w-full"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="label">Guardian Email</label>
                  <input
                    type="email"
                    name="guardian_email"
                    defaultValue={editingStudent?.guardian_email ?? ""}
                    className="input w-full"
                    placeholder="guardian@email.com"
                  />
                </div>
              </div>

              {/* Address & Notes */}
              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingStudent?.address ?? ""}
                  className="input w-full"
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingStudent?.notes ?? ""}
                  className="input w-full resize-none"
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending
                    ? "Saving..."
                    : modalMode === "add"
                      ? "Add Student"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
