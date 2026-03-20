"use client";

import { useState, useTransition, useRef } from "react";
import type { Objective, Classroom } from "./page";

interface ObjectivesClientProps {
  objectives: Objective[];
  classrooms: Classroom[];
  createObjective: (formData: FormData) => Promise<void>;
  updateObjective: (formData: FormData) => Promise<void>;
  updateProgress: (formData: FormData) => Promise<void>;
  deleteObjective: (formData: FormData) => Promise<void>;
}

type ModalMode = "closed" | "add" | "edit";

const CATEGORIES = [
  { value: "academic", label: "Academic" },
  { value: "engagement", label: "Engagement" },
  { value: "community", label: "Community" },
  { value: "operational", label: "Operational" },
];

const STATUSES = [
  { value: "in_progress", label: "In Progress" },
  { value: "on_track", label: "On Track" },
  { value: "completed", label: "Completed" },
  { value: "at_risk", label: "At Risk" },
];

function categoryBadgeClass(category: string): string {
  switch (category) {
    case "academic":
      return "badge badge-info";
    case "engagement":
      return "badge badge-warning";
    case "community":
      return "badge badge-success";
    case "operational":
      return "badge badge-gray";
    default:
      return "badge badge-gray";
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "on_track":
      return "badge badge-success";
    case "in_progress":
      return "badge badge-info";
    case "completed":
      return "badge badge-success";
    case "at_risk":
      return "badge badge-danger";
    default:
      return "badge badge-gray";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "on_track":
      return "On Track";
    case "completed":
      return "Completed";
    case "at_risk":
      return "At Risk";
    default:
      return status;
  }
}

function progressBarColor(progress: number): string {
  if (progress >= 75) return "bg-green-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress >= 25) return "bg-yellow-500";
  return "bg-red-500";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No target date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ObjectivesClient({
  objectives,
  classrooms,
  createObjective,
  updateObjective,
  updateProgress,
  deleteObjective,
}: ObjectivesClientProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = objectives.filter((o) => {
    const matchesCategory = !categoryFilter || o.category === categoryFilter;
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  function openAdd() {
    setEditingObjective(null);
    setModalMode("add");
  }

  function openEdit(objective: Objective) {
    setEditingObjective(objective);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode("closed");
    setEditingObjective(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (modalMode === "add") {
        await createObjective(formData);
      } else {
        await updateObjective(formData);
      }
      closeModal();
    });
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => {
      await deleteObjective(fd);
      setDeleteConfirmId(null);
    });
  }

  function handleProgressChange(id: string, progress: number) {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("progress", progress.toString());
    startTransition(async () => {
      await updateProgress(fd);
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={openAdd} className="btn-primary whitespace-nowrap">
            <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Objective
          </button>
        </div>
      </div>

      {/* Objectives Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No objectives found</h3>
          <p className="text-gray-500 text-sm">
            {categoryFilter || statusFilter
              ? "Try adjusting your filters."
              : "Get started by adding your first objective."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((objective) => (
            <div key={objective.id} className="card flex flex-col">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
                  {objective.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(objective)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Edit objective"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(objective.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete objective"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={categoryBadgeClass(objective.category)}>
                  {objective.category.charAt(0).toUpperCase() + objective.category.slice(1)}
                </span>
                <span className={statusBadgeClass(objective.status)}>
                  {statusLabel(objective.status)}
                </span>
              </div>

              {/* Description */}
              {objective.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {objective.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Progress</span>
                  <span className="text-xs font-semibold text-gray-900">{objective.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${progressBarColor(objective.progress)}`}
                    style={{ width: `${objective.progress}%` }}
                  />
                </div>
                {/* Inline Progress Slider */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={objective.progress}
                  onChange={(e) => handleProgressChange(objective.id, parseInt(e.target.value, 10))}
                  className="w-full mt-1.5 h-1.5 accent-blue-600 cursor-pointer"
                  disabled={isPending}
                />
              </div>

              {/* Meta info */}
              <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Target: {formatDate(objective.target_date)}</span>
                </div>
                {objective.classroom_name && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{objective.classroom_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirmId(null)} />
          <div className="card relative z-10 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Objective</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this objective? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn-danger"
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalMode !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="card relative z-10 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalMode === "add" ? "Add Objective" : "Edit Objective"}
            </h3>
            <form ref={formRef} action={handleSubmit} className="space-y-4">
              {modalMode === "edit" && editingObjective && (
                <input type="hidden" name="id" value={editingObjective.id} />
              )}

              {/* Title */}
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingObjective?.title || ""}
                  className="input w-full"
                  placeholder="Enter objective title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingObjective?.description || ""}
                  className="input w-full"
                  placeholder="Describe the objective"
                />
              </div>

              {/* Category & Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    name="category"
                    defaultValue={editingObjective?.category || "academic"}
                    className="input w-full"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    defaultValue={editingObjective?.status || "in_progress"}
                    className="input w-full"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className="label">Progress: {editingObjective?.progress ?? 0}%</label>
                <input
                  type="range"
                  name="progress"
                  min={0}
                  max={100}
                  step={5}
                  defaultValue={editingObjective?.progress ?? 0}
                  className="w-full accent-blue-600"
                  onChange={(e) => {
                    const label = e.target.closest("div")?.querySelector("label");
                    if (label) label.textContent = `Progress: ${e.target.value}%`;
                  }}
                />
              </div>

              {/* Target Date */}
              <div>
                <label className="label">Target Date</label>
                <input
                  type="date"
                  name="target_date"
                  defaultValue={editingObjective?.target_date || ""}
                  className="input w-full"
                />
              </div>

              {/* Classroom */}
              <div>
                <label className="label">Classroom</label>
                <select
                  name="classroom_id"
                  defaultValue={editingObjective?.classroom_id || ""}
                  className="input w-full"
                >
                  <option value="">No classroom (school-wide)</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending
                    ? modalMode === "add"
                      ? "Creating..."
                      : "Saving..."
                    : modalMode === "add"
                      ? "Create Objective"
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
