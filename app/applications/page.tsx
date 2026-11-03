
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Status =
  | "Applied"
  | "Interview"
  | "Shortlisted"
  | "Rejected"
  | "Selected";

type Application = {
  id: string;
  company: string;
  role: string;
  status: Status;
  application_date: string;
  interview_date: string | null;
  notes: string | null;
};

const statuses: Status[] = [
  "Applied",
  "Interview",
  "Shortlisted",
  "Rejected",
  "Selected",
];

const statusColors: Record<Status, string> = {
  Applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Interview: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Shortlisted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Selected: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-blue-500";

export default function ApplicationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [today, setToday] = useState("");

  const [form, setForm] = useState({
    company: "",
    role: "",
    status: "Applied" as Status,
    application_date: "",
    interview_date: "",
    notes: "",
  });

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));

    async function checkUser() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setUser(data.session.user);
    }

    checkUser();
  }, [router]);

  async function loadApplications() {
    setLoading(true);

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setApplications((data ?? []) as Application[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (user) loadApplications();
  }, [user]);

  function openAddForm() {
    setEditingId(null);
    setForm({
      company: "",
      role: "",
      status: "Applied",
      application_date: today,
      interview_date: "",
      notes: "",
    });
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(app: Application) {
    setEditingId(app.id);
    setForm({
      company: app.company,
      role: app.role,
      status: app.status,
      application_date: app.application_date,
      interview_date: app.interview_date ?? "",
      notes: app.notes ?? "",
    });
    setMessage("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user || !form.company.trim() || !form.role.trim()) {
      setMessage("Please enter both company and role.");
      return;
    }

    setSaving(true);
    setMessage("");

    const record = {
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      application_date: form.application_date || today,
      interview_date: form.interview_date || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase
          .from("applications")
          .update(record)
          .eq("id", editingId)
      : await supabase.from("applications").insert({
          ...record,
          user_id: user.id,
        });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setShowForm(false);
      setEditingId(null);
      setMessage(editingId ? "Application updated." : "Application added.");
      await loadApplications();
    }

    setSaving(false);
  }

  async function deleteApplication(id: string) {
    if (!window.confirm("Are you sure you want to delete this application?")) {
      return;
    }

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Application deleted.");
      await loadApplications();
    }
  }

  async function changeStatus(id: string, status: Status) {
    const { error } = await supabase
      .from("applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      await loadApplications();
    }
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const term = search.toLowerCase();

      const matchesSearch =
        app.company.toLowerCase().includes(term) ||
        app.role.toLowerCase().includes(term);

      const matchesFilter =
        filter === "All" || app.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [applications, search, filter]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080d19] text-slate-400">
        Checking your account...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080d19] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-[#0c1322] p-6 md:flex md:flex-col">
          <Link href="/" className="mb-10 text-2xl font-bold tracking-tight">
            <span className="text-blue-400">D</span> DevTrack
            <p className="mt-1 text-xs font-normal text-slate-500">
              Career workspace
            </p>
          </Link>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            <Link
              href="/"
              className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-800"
            >
              ◫ Overview
            </Link>
            <Link
              href="/applications"
              className="block rounded-xl bg-blue-600/15 px-4 py-3 text-sm font-semibold text-blue-400"
            >
              ▤ Applications
            </Link>
            <Link
              href="/#interviews"
              className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-800"
            >
              ◷ Interviews
            </Link>
          </nav>

          <div className="mt-auto border-t border-slate-800 pt-5">
            <p className="mb-3 truncate text-xs text-slate-500">
              {user.email}
            </p>
            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ↪ Log out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">
                Workspace / Applications
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Applications
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Manage and track all your job opportunities.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/"
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
              >
                Overview
              </Link>
              <button
                onClick={openAddForm}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500"
              >
                + Add application
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
              {message}
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: "Total", value: applications.length },
              {
                label: "Applied",
                value: applications.filter((a) => a.status === "Applied").length,
              },
              {
                label: "Interviews",
                value: applications.filter((a) => a.status === "Interview").length,
              },
              {
                label: "Shortlisted",
                value: applications.filter((a) => a.status === "Shortlisted").length,
              },
              {
                label: "Selected",
                value: applications.filter((a) => a.status === "Selected").length,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-800 bg-[#101727] p-5"
              >
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 rounded-2xl border border-slate-800 bg-[#101727] p-5 sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit application" : "Add application"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Company *
                  <input
                    required
                    className={`${inputClass} mt-2`}
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                    placeholder="Company name"
                  />
                </label>

                <label className="text-sm text-slate-300">
                  Job role *
                  <input
                    required
                    className={`${inputClass} mt-2`}
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    placeholder="e.g. Frontend Developer"
                  />
                </label>

                <label className="text-sm text-slate-300">
                  Status
                  <select
                    className={`${inputClass} mt-2`}
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as Status })
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-slate-300">
                  Application date
                  <input
                    type="date"
                    className={`${inputClass} mt-2`}
                    value={form.application_date}
                    onChange={(e) =>
                      setForm({ ...form, application_date: e.target.value })
                    }
                  />
                </label>

                <label className="text-sm text-slate-300">
                  Interview date
                  <input
                    type="date"
                    className={`${inputClass} mt-2`}
                    value={form.interview_date}
                    onChange={(e) =>
                      setForm({ ...form, interview_date: e.target.value })
                    }
                  />
                </label>

                <label className="text-sm text-slate-300 sm:col-span-2">
                  Notes
                  <textarea
                    rows={3}
                    className={`${inputClass} mt-2`}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Add useful notes..."
                  />
                </label>
              </div>

              <button
                disabled={saving}
                className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Save application"}
              </button>
            </form>
          )}

          <div className="rounded-2xl border border-slate-800 bg-[#101727] p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                className={inputClass}
                placeholder="Search company or job role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className={`${inputClass} sm:max-w-52`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All statuses</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>

              <button
                onClick={loadApplications}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Loading applications...
              </p>
            ) : filteredApplications.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-semibold">No applications found</p>
                <p className="mt-2 text-sm text-slate-500">
                  Try another search or add a new application.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#0b1020] p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold">{app.company}</h3>
                      <p className="mt-1 text-sm text-slate-400">{app.role}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Applied: {app.application_date}
                        {app.interview_date
                          ? ` · Interview: ${app.interview_date}`
                          : ""}
                      </p>
                      {app.notes && (
                        <p className="mt-2 text-xs text-slate-500">
                          {app.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Status for ${app.company}`}
                        className={`rounded-lg border px-3 py-2 text-xs outline-none ${statusColors[app.status]}`}
                        value={app.status}
                        onChange={(e) =>
                          changeStatus(app.id, e.target.value as Status)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => openEditForm(app)}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteApplication(app.id)}
                        className="rounded-lg border border-rose-500/20 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-600">
            DevTrack © 2026 · Built to organize your career journey.
          </p>
        </section>
      </div>
    </main>
  );
}
