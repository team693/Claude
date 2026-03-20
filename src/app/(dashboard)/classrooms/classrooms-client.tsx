"use client";

import { useState, useTransition, useRef } from "react";
import type { Classroom, Teacher } from "./page";

interface ClassroomsClientProps {
  classrooms: Classroom[];
  teachers: Teacher[];
  createClassroom: (formData: FormData) => Promise<void>;
  updateClassroom: (formData: FormData) => Promise<void>;
  deleteClassroom: (formData: FormData) => Promise<void>;
}

type ModalMode = "closed" | "add" | "edit";

const GRADES = [
  "Pre-K", "K",
  "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th", "11th", "12th",
];

const SUBJECTS = [
  "Mathematics", "English", "Science", "History",
  "Geography", "Art", "Music", "Physical Education",
  "Computer Science", "Foreign Language", "Social Studies",
  "Biology", "Chemistry", "Physics", "Literature", "Other",
];

export function ClassroomsClient({
  classrooms,
  teachers,
  createClassroom,
  updateClassroom,
  deleteClassroom,
}: ClassroomsClientProps) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = classrooms.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      c.name.toLowerCase().includes(term) ||
      c.subject.toLowerCase().includes(term) ||
      c.teacher_name?.toLowerCase().includes(term) ||
      c.room_number?.toLowerCase().includes(term);
    const matchesGrade = !gradeFilter || c.grade === gradeFilter;
    const matchesSubject = !subjectFilter || c.subject === subjectFilter;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  const uniqueGrades = Array.from(new Set(classrooms.map((c) => c.grade))).sort(
    (a, b) => {
      const idxA = GRADES.indexOf(a);
      const idxB = GRADES.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    }
  );

  const uniqueSubjects = Array.from(new Set(classrooms.map((c) => c.subject))).sort();

  function openAdd() {
    setEditingClassroom(null);
    setModalMode("add");
  }

  function openEdit(classroom: Classroom) {
    setEditingClassroom(classroom);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode("closed");
    setEditingClassroom(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (modalMode === "add") {
        await createClassroom(formData);
      } else {
        await updateClassroom(formData);
      }
      closeModal();
    });
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => {
      await deleteClassroom(fd);
      setDeleteConfirmId(null);
    });
  }

  function getCapacityColor(studentCount: number, capacity: number) {
    const ratio = studentCount / capacity;
    if (ratio >= 0.9) return "text-red-600 bg-red-50";
    if (ratio >= 0.7) return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  }

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
                placeholder="Search classrooms..."
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
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input w-full sm:w-auto"
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
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
            Add Classroom
          </button>
        </div>
      </div>

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          <p className="text-gray-500">
            {classrooms.length === 0
              ? "No classrooms yet. Create your first classroom to get started."
              : "No classrooms match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((classroom) => (
            <div key={classroom.id} className="card hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {classroom.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="badge">{classroom.subject}</span>
                    <span className="badge">{classroom.grade}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    onClick={() => openEdit(classroom)}
                    className="btn-secondary text-xs px-2 py-1"
                    title="Edit classroom"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {deleteConfirmId === classroom.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(classroom.id)}
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
                    <button
                      onClick={() => setDeleteConfirmId(classroom.id)}
                      className="btn-danger text-xs px-2 py-1"
                      title="Delete classroom"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="space-y-2.5 text-sm">
                {/* Teacher */}
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">{classroom.teacher_name || "Unassigned"}</span>
                </div>

                {/* Room */}
                {classroom.room_number && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Room {classroom.room_number}</span>
                  </div>
                )}

                {/* Schedule */}
                {classroom.schedule && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{classroom.schedule}</span>
                  </div>
                )}

                {/* Capacity Bar */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Students</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getCapacityColor(classroom.student_count, classroom.capacity)}`}>
                      {classroom.student_count} / {classroom.capacity}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        classroom.student_count / classroom.capacity >= 0.9
                          ? "bg-red-500"
                          : classroom.student_count / classroom.capacity >= 0.7
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (classroom.student_count / classroom.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              {classroom.description && (
                <p className="text-xs text-gray-400 mt-3 line-clamp-2">
                  {classroom.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          Showing {filtered.length} of {classrooms.length} classroom{classrooms.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Modal */}
      {modalMode !== "closed" && (
        <div className="modal-overlay">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="modal-content relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === "add" ? "Add New Classroom" : "Edit Classroom"}
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
              {editingClassroom && (
                <input type="hidden" name="id" value={editingClassroom.id} />
              )}

              {/* Name */}
              <div>
                <label className="label">
                  Classroom Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingClassroom?.name ?? ""}
                  className="input w-full"
                  placeholder="e.g. Algebra I - Period 1"
                />
              </div>

              {/* Subject & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subject"
                    required
                    defaultValue={editingClassroom?.subject ?? ""}
                    className="input w-full"
                  >
                    <option value="" disabled>Select subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="grade"
                    required
                    defaultValue={editingClassroom?.grade ?? ""}
                    className="input w-full"
                  >
                    <option value="" disabled>Select grade</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Teacher <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="teacher_id"
                    required
                    defaultValue={editingClassroom?.teacher_id ?? ""}
                    className="input w-full"
                  >
                    <option value="" disabled>Select teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Room Number</label>
                  <input
                    type="text"
                    name="room_number"
                    defaultValue={editingClassroom?.room_number ?? ""}
                    className="input w-full"
                    placeholder="e.g. 204B"
                  />
                </div>
              </div>

              {/* Capacity & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    min={1}
                    max={200}
                    defaultValue={editingClassroom?.capacity ?? 30}
                    className="input w-full"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="label">Schedule</label>
                  <input
                    type="text"
                    name="schedule"
                    defaultValue={editingClassroom?.schedule ?? ""}
                    className="input w-full"
                    placeholder="e.g. MWF 9:00-10:00 AM"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingClassroom?.description ?? ""}
                  className="input w-full resize-none"
                  placeholder="Brief description of this classroom..."
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
                      ? "Create Classroom"
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
