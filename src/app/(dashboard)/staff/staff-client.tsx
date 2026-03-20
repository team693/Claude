"use client";

import { useState, useTransition, useRef } from "react";
import type { StaffMember } from "./page";

interface StaffClientProps {
  staffMembers: StaffMember[];
  createStaff: (formData: FormData) => Promise<void>;
  updateStaff: (formData: FormData) => Promise<void>;
  deleteStaff: (formData: FormData) => Promise<void>;
}

type ModalMode = "closed" | "add" | "edit";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "badge-warning";
    case "teacher":
      return "badge-success";
    case "staff":
      return "badge-info";
    default:
      return "badge";
  }
}

export function StaffClient({
  staffMembers,
  createStaff,
  updateStaff,
  deleteStaff,
}: StaffClientProps) {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = staffMembers.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.position.toLowerCase().includes(term);
    const matchesDepartment =
      !departmentFilter || s.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const uniqueDepartments = Array.from(
    new Set(staffMembers.map((s) => s.department))
  ).sort();

  function openAdd() {
    setEditingStaff(null);
    setModalMode("add");
  }

  function openEdit(staff: StaffMember) {
    setEditingStaff(staff);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode("closed");
    setEditingStaff(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (modalMode === "add") {
        await createStaff(formData);
      } else {
        await updateStaff(formData);
      }
      closeModal();
    });
  }

  function handleDelete(staff: StaffMember) {
    const fd = new FormData();
    fd.append("id", staff.id);
    fd.append("user_id", staff.user_id);
    startTransition(async () => {
      await deleteStaff(fd);
      setDeleteConfirmId(null);
    });
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
                placeholder="Search by name, email, position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input w-full sm:w-auto"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
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
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          {staffMembers.length === 0
            ? "No staff members yet. Add your first staff member to get started."
            : "No staff members match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((staff) => (
            <div key={staff.id} className="card group relative">
              {/* Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {deleteConfirmId === staff.id ? (
                  <>
                    <span className="text-xs text-red-600 mr-1">Delete?</span>
                    <button
                      onClick={() => handleDelete(staff)}
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
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(staff)}
                      className="btn-secondary text-xs px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(staff.id)}
                      className="btn-danger text-xs px-2 py-1"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* Header with avatar */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(staff.name)}`}
                >
                  {getInitials(staff.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {staff.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {staff.position}
                  </p>
                </div>
              </div>

              {/* Role badge & department */}
              <div className="flex items-center gap-2 mb-3">
                <span className={getRoleBadgeClass(staff.role)}>
                  {staff.role}
                </span>
                <span className="badge">{staff.department}</span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg
                    className="w-4 h-4 text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="truncate">{staff.email}</span>
                </div>
                {staff.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg
                      className="w-4 h-4 text-gray-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{staff.phone}</span>
                  </div>
                )}
                {staff.hire_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg
                      className="w-4 h-4 text-gray-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      Hired{" "}
                      {new Date(staff.hire_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {staff.qualifications && (
                  <div className="flex items-start gap-2 text-gray-600 mt-2">
                    <svg
                      className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                    <span className="line-clamp-2">{staff.qualifications}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          Showing {filtered.length} of {staffMembers.length} staff member
          {staffMembers.length !== 1 ? "s" : ""}
        </div>
      )}

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
                {modalMode === "add"
                  ? "Add New Staff Member"
                  : "Edit Staff Member"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="p-6 space-y-5">
              {editingStaff && (
                <>
                  <input type="hidden" name="id" value={editingStaff.id} />
                  <input
                    type="hidden"
                    name="user_id"
                    value={editingStaff.user_id}
                  />
                </>
              )}

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingStaff?.name ?? ""}
                    className="input w-full"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="label">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingStaff?.email ?? ""}
                    className="input w-full"
                    placeholder="john@school.edu"
                  />
                </div>
              </div>

              {/* Password (only on create) */}
              {modalMode === "add" && (
                <div>
                  <label className="label">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="input w-full"
                    placeholder="Enter a password"
                    minLength={6}
                  />
                </div>
              )}

              {/* Role & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    required
                    defaultValue={editingStaff?.role ?? "teacher"}
                    className="input w-full"
                  >
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    required
                    defaultValue={editingStaff?.department ?? ""}
                    className="input w-full"
                    placeholder="e.g. Mathematics"
                  />
                </div>
              </div>

              {/* Position & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="position"
                    required
                    defaultValue={editingStaff?.position ?? ""}
                    className="input w-full"
                    placeholder="e.g. Senior Teacher"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingStaff?.phone ?? ""}
                    className="input w-full"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Hire Date */}
              <div>
                <label className="label">Hire Date</label>
                <input
                  type="date"
                  name="hire_date"
                  defaultValue={editingStaff?.hire_date ?? ""}
                  className="input w-full"
                />
              </div>

              {/* Qualifications */}
              <div>
                <label className="label">Qualifications</label>
                <textarea
                  name="qualifications"
                  rows={3}
                  defaultValue={editingStaff?.qualifications ?? ""}
                  className="input w-full resize-none"
                  placeholder="Degrees, certifications, specializations..."
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
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending
                    ? "Saving..."
                    : modalMode === "add"
                      ? "Add Staff Member"
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
