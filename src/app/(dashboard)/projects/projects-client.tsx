"use client";

import { useState, useTransition } from "react";
import type { Project, ProjectTask, Classroom, UserOption } from "./page";

interface ProjectsClientProps {
  projects: Project[];
  tasksByProject: Record<string, ProjectTask[]>;
  classrooms: Classroom[];
  users: UserOption[];
  createProject: (formData: FormData) => Promise<void>;
  updateProject: (formData: FormData) => Promise<void>;
  updateProjectStatus: (formData: FormData) => Promise<void>;
  deleteProject: (formData: FormData) => Promise<void>;
  createTask: (formData: FormData) => Promise<void>;
  updateTaskStatus: (formData: FormData) => Promise<void>;
  deleteTask: (formData: FormData) => Promise<void>;
}

type ProjectModal = "closed" | "add" | "edit";
type TaskModal = "closed" | "add";

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const TASK_STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "badge badge-success";
    case "planning":
      return "badge badge-info";
    case "completed":
      return "badge badge-gray";
    case "on_hold":
      return "badge badge-warning";
    default:
      return "badge";
  }
}

function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "high":
      return "badge badge-danger";
    case "medium":
      return "badge badge-warning";
    case "low":
      return "badge badge-gray";
    default:
      return "badge";
  }
}

function taskStatusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "badge badge-success";
    case "in_progress":
      return "badge badge-info";
    case "todo":
      return "badge badge-gray";
    default:
      return "badge";
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString();
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "completed") return false;
  return new Date(dueDate) < new Date();
}

export function ProjectsClient({
  projects,
  tasksByProject,
  classrooms,
  users,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  createTask,
  updateTaskStatus,
  deleteTask,
}: ProjectsClientProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [projectModal, setProjectModal] = useState<ProjectModal>("closed");
  const [taskModal, setTaskModal] = useState<TaskModal>("closed");
  const [taskProjectId, setTaskProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = projects.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      p.title.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.classroom_name && p.classroom_name.toLowerCase().includes(term));
    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesPriority = !priorityFilter || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  function openAddProject() {
    setEditingProject(null);
    setProjectModal("add");
  }

  function openEditProject(project: Project) {
    setEditingProject(project);
    setProjectModal("edit");
  }

  function closeProjectModal() {
    setProjectModal("closed");
    setEditingProject(null);
  }

  function openAddTask(projectId: string) {
    setTaskProjectId(projectId);
    setTaskModal("add");
  }

  function closeTaskModal() {
    setTaskModal("closed");
    setTaskProjectId(null);
  }

  function handleProjectSubmit(formData: FormData) {
    startTransition(async () => {
      if (projectModal === "add") {
        await createProject(formData);
      } else {
        await updateProject(formData);
      }
      closeProjectModal();
    });
  }

  function handleTaskSubmit(formData: FormData) {
    startTransition(async () => {
      await createTask(formData);
      closeTaskModal();
    });
  }

  function handleStatusChange(projectId: string, newStatus: string) {
    const fd = new FormData();
    fd.append("id", projectId);
    fd.append("status", newStatus);
    startTransition(async () => {
      await updateProjectStatus(fd);
    });
  }

  function handleTaskStatusChange(taskId: string, newStatus: string) {
    const fd = new FormData();
    fd.append("id", taskId);
    fd.append("status", newStatus);
    startTransition(async () => {
      await updateTaskStatus(fd);
    });
  }

  function handleDeleteProject(id: string) {
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => {
      await deleteProject(fd);
      setDeleteConfirmId(null);
      if (expandedProject === id) setExpandedProject(null);
    });
  }

  function handleDeleteTask(taskId: string) {
    const fd = new FormData();
    fd.append("id", taskId);
    startTransition(async () => {
      await deleteTask(fd);
    });
  }

  function toggleExpand(projectId: string) {
    setExpandedProject((prev) => (prev === projectId ? null : projectId));
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
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input w-full sm:w-auto"
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={openAddProject} className="btn-primary whitespace-nowrap">
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
            New Project
          </button>
        </div>
      </div>

      {/* Project Cards Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          {projects.length === 0
            ? "No projects yet. Create your first project to get started."
            : "No projects match your filters."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const tasks = tasksByProject[project.id] || [];
            const progressPct =
              project.total_tasks > 0
                ? Math.round((project.completed_tasks / project.total_tasks) * 100)
                : 0;
            const isExpanded = expandedProject === project.id;
            const overdue = isOverdue(project.due_date, project.status);

            return (
              <div key={project.id} className="card flex flex-col">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => toggleExpand(project.id)}
                      title={project.title}
                    >
                      {project.title}
                    </h3>
                    {project.classroom_name && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {project.classroom_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={statusBadgeClass(project.status)}>
                      {STATUS_OPTIONS.find((s) => s.value === project.status)?.label}
                    </span>
                    <span className={priorityBadgeClass(project.priority)}>
                      {project.priority}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Due Date */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  {project.due_date && (
                    <span className={overdue ? "text-red-500 font-medium" : ""}>
                      <svg
                        className="w-3.5 h-3.5 inline mr-1"
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
                      Due {formatDate(project.due_date)}
                      {overdue && " (overdue)"}
                    </span>
                  )}
                  <span>
                    By {project.creator_name}
                  </span>
                </div>

                {/* Task Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Tasks</span>
                    <span>
                      {project.completed_tasks}/{project.total_tasks} completed
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <select
                      value={project.status}
                      onChange={(e) =>
                        handleStatusChange(project.id, e.target.value)
                      }
                      disabled={isPending}
                      className="input text-xs py-1 px-2"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleExpand(project.id)}
                      className="btn-secondary text-xs px-2 py-1"
                    >
                      {isExpanded ? "Collapse" : "Tasks"}
                    </button>
                    <button
                      onClick={() => openEditProject(project)}
                      className="btn-secondary text-xs px-2 py-1"
                    >
                      Edit
                    </button>
                    {deleteConfirmId === project.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={isPending}
                          className="btn-primary text-xs px-2 py-1 !bg-red-600 !hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="btn-secondary text-xs px-2 py-1"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(project.id)}
                        className="btn-secondary text-xs px-2 py-1 text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Tasks */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Tasks ({tasks.length})
                      </h4>
                      <button
                        onClick={() => openAddTask(project.id)}
                        className="btn-primary text-xs px-2 py-1"
                      >
                        <svg
                          className="w-3 h-3 mr-1 inline"
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
                        Add Task
                      </button>
                    </div>
                    {tasks.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No tasks yet. Add a task to track progress.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-medium ${
                                    task.status === "completed"
                                      ? "line-through text-gray-400"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                <span className={taskStatusBadgeClass(task.status)}>
                                  {TASK_STATUS_OPTIONS.find(
                                    (s) => s.value === task.status
                                  )?.label}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                {task.assigned_name && (
                                  <span>Assigned: {task.assigned_name}</span>
                                )}
                                {task.due_date && (
                                  <span
                                    className={
                                      isOverdue(task.due_date, task.status)
                                        ? "text-red-500"
                                        : ""
                                    }
                                  >
                                    Due {formatDate(task.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleTaskStatusChange(task.id, e.target.value)
                                }
                                disabled={isPending}
                                className="input text-xs py-0.5 px-1"
                              >
                                {TASK_STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                disabled={isPending}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                title="Delete task"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Showing count */}
      {filtered.length > 0 && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          Showing {filtered.length} of {projects.length} project
          {projects.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Project Modal (Add/Edit) */}
      {projectModal !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeProjectModal}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900">
                {projectModal === "add" ? "New Project" : "Edit Project"}
              </h2>
              <button
                onClick={closeProjectModal}
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

            <form action={handleProjectSubmit} className="p-6 space-y-5">
              {editingProject && (
                <input type="hidden" name="id" value={editingProject.id} />
              )}

              <div>
                <label className="label">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingProject?.title ?? ""}
                  className="input w-full"
                  placeholder="Project title"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingProject?.description ?? ""}
                  className="input w-full resize-none"
                  placeholder="Describe the project..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Classroom</label>
                  <select
                    name="classroom_id"
                    defaultValue={editingProject?.classroom_id ?? ""}
                    className="input w-full"
                  >
                    <option value="">No classroom</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    name="priority"
                    defaultValue={editingProject?.priority ?? "medium"}
                    className="input w-full"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    defaultValue={editingProject?.status ?? "planning"}
                    className="input w-full"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={editingProject?.due_date ?? ""}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={editingProject?.start_date ?? ""}
                  className="input w-full sm:w-1/2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending
                    ? "Saving..."
                    : projectModal === "add"
                      ? "Create Project"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal (Add) */}
      {taskModal !== "closed" && taskProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeTaskModal}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
              <button
                onClick={closeTaskModal}
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

            <form action={handleTaskSubmit} className="p-6 space-y-5">
              <input type="hidden" name="project_id" value={taskProjectId} />

              <div>
                <label className="label">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="input w-full"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  className="input w-full resize-none"
                  placeholder="Task details..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select name="status" defaultValue="todo" className="input w-full">
                    {TASK_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Assigned To</label>
                  <select
                    name="assigned_to"
                    defaultValue=""
                    className="input w-full"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  className="input w-full sm:w-1/2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
