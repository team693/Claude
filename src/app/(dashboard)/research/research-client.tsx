"use client";

import { useState, useTransition, useRef } from "react";
import type { ResearchEntry } from "./page";

interface ResearchClientProps {
  entries: ResearchEntry[];
  createResearch: (formData: FormData) => Promise<void>;
  updateResearch: (formData: FormData) => Promise<void>;
  deleteResearch: (formData: FormData) => Promise<void>;
}

type ModalMode = "closed" | "add" | "edit";

const CATEGORIES = [
  { value: "pedagogy", label: "Pedagogy" },
  { value: "technology", label: "Technology" },
  { value: "inclusion", label: "Inclusion" },
  { value: "wellness", label: "Wellness" },
  { value: "general", label: "General" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "published", label: "Published" },
];

function categoryBadgeClass(category: string): string {
  switch (category) {
    case "pedagogy":
      return "badge badge-info";
    case "technology":
      return "badge badge-success";
    case "inclusion":
      return "badge badge-warning";
    case "wellness":
      return "badge badge-danger";
    default:
      return "badge badge-gray";
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "published":
      return "badge badge-success";
    case "review":
      return "badge badge-warning";
    default:
      return "badge badge-gray";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unpublished";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string | null, maxLen: number): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

export function ResearchClient({
  entries,
  createResearch,
  updateResearch,
  deleteResearch,
}: ResearchClientProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  const [editingEntry, setEditingEntry] = useState<ResearchEntry | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = entries.filter((e) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      e.title.toLowerCase().includes(term) ||
      (e.abstract && e.abstract.toLowerCase().includes(term));
    const matchesCategory = !categoryFilter || e.category === categoryFilter;
    const matchesStatus = !statusFilter || e.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  function openAdd() {
    setEditingEntry(null);
    setModalMode("add");
  }

  function openEdit(entry: ResearchEntry) {
    setEditingEntry(entry);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode("closed");
    setEditingEntry(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (modalMode === "add") {
        await createResearch(formData);
      } else {
        await updateResearch(formData);
      }
      closeModal();
    });
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => {
      await deleteResearch(fd);
      setDeleteConfirmId(null);
    });
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      {/* Toolbar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
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
                placeholder="Search title or abstract..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-full sm:w-auto"
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
              className="input w-full sm:w-auto"
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
            <svg className="h-4 w-4 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Research
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        Showing {filtered.length} of {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
      </p>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.467.89 6.065 2.348m0-14.306A8.967 8.967 0 0118 3.75c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.348m0-14.306v14.306"
            />
          </svg>
          <p className="text-gray-500 font-medium">No research entries found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new entry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const tags = entry.tags
              ? entry.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : [];

            return (
              <div key={entry.id} className="card flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                    onClick={() => toggleExpand(entry.id)}
                    title="Click to expand"
                  >
                    {entry.title}
                  </h3>
                  <div className="flex gap-1 shrink-0">
                    <span className={categoryBadgeClass(entry.category)}>
                      {entry.category}
                    </span>
                    <span className={statusBadgeClass(entry.status)}>
                      {entry.status}
                    </span>
                  </div>
                </div>

                {/* Abstract */}
                <p className="text-sm text-gray-600 mb-3">
                  {isExpanded ? entry.abstract : truncate(entry.abstract, 120)}
                </p>

                {/* Expanded content */}
                {isExpanded && entry.content && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                    {entry.content}
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div>
                    <span className="font-medium text-gray-700">{entry.author_name}</span>
                    <span className="mx-1.5">&middot;</span>
                    <span>{formatDate(entry.published_at)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      className="btn-secondary text-xs px-2 py-1"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(entry)}
                      className="btn-secondary text-xs px-2 py-1"
                    >
                      Edit
                    </button>
                    {deleteConfirmId === entry.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={isPending}
                          className="btn-danger text-xs px-2 py-1"
                        >
                          {isPending ? "..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="btn-secondary text-xs px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(entry.id)}
                        className="btn-danger text-xs px-2 py-1"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalMode !== "closed" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === "add" ? "Add Research Entry" : "Edit Research Entry"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
              {modalMode === "edit" && editingEntry && (
                <input type="hidden" name="id" value={editingEntry.id} />
              )}

              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingEntry?.title ?? ""}
                  className="input w-full"
                  placeholder="Research title"
                />
              </div>

              <div>
                <label className="label">Abstract</label>
                <textarea
                  name="abstract"
                  rows={3}
                  defaultValue={editingEntry?.abstract ?? ""}
                  className="input w-full"
                  placeholder="Brief summary of the research"
                />
              </div>

              <div>
                <label className="label">Content</label>
                <textarea
                  name="content"
                  rows={6}
                  defaultValue={editingEntry?.content ?? ""}
                  className="input w-full"
                  placeholder="Full research content..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    name="category"
                    required
                    defaultValue={editingEntry?.category ?? "general"}
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
                    required
                    defaultValue={editingEntry?.status ?? "draft"}
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

              <div>
                <label className="label">Tags</label>
                <input
                  type="text"
                  name="tags"
                  defaultValue={editingEntry?.tags ?? ""}
                  className="input w-full"
                  placeholder="Comma-separated tags, e.g. math, STEM, research"
                />
                <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending
                    ? "Saving..."
                    : modalMode === "add"
                      ? "Add Entry"
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
