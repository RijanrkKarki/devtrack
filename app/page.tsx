
"use client";

import { useEffect, useMemo, useState } from "react";
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

const emptyForm = {
  company: "",
  role: "",
  status: "Applied" as Status,
  application_date: new Date().toISOString().slice(0, 10),
  interview_date: "",
  notes: "",
};

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeNav, setActiveNav] = useState("Overview");
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        router.replace("/login");
        setAuthLoading(false);
        return;
      }

      setUser(data.session.user);
      setAuthLoading(false);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);

      if (!session) router.replace("/login");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function loadApplications() {
    setLoading(true);

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setApplications([]);
    } else {
      setApplications((data ?? []) as Application[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (user) loadApplications();
  }, [user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    const record = {
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      application_date: form.application_date,
      interview_date: form.interview_date || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from("applications").update(record).eq("id", editingId)
      : await supabase.from("applications").insert({
          ...record,
          user_id: user.id,
        });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(editingId ? "Application updated successfully." : "Application added successfully.");
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadApplications();
    }

    setSaving(false);
  }

  function startEditing(app: Application) {
    setEditingId(app.id);
    setForm({
      company: app.company,
      role: app.role,
      status: app.status,
      application_date: app.application_date,
      interview_date: app.interview_date ?? "",
      notes: app.notes ?? "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteApplication(id: string) {
    if (!window.confirm("Are you sure you want to delete this application?")) return;

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);

    if (error) setMessage(error.message);
    else {
      setMessage("Application deleted.");
      await loadApplications();
    }
  }

  async function changeStatus(id: string, status: Status) {
    const { error } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) setMessage(error.message);
    else await loadApplications();
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
    else router.replace("/login");
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        app.company.toLowerCase().includes(search.toLowerCase()) ||
        app.role.toLowerCase().includes(search.toLowerCase());

      return matchesSearch && (filter === "All" || app.status === filter);
    });
  }, [applications, search, filter]);



  const upcomingInterviews = applications.filter(
    (app) =>
      app.interview_date &&
      app.interview_date >= today &&
      app.status !== "Rejected"
  );

  const stats = [
    {
      label: "Total applications",
      value: applications.length,
      icon: "▤",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Interviews",
      value: upcomingInterviews.length,
      icon: "◷",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Shortlisted",
      value: applications.filter((a) => a.status === "Shortlisted").length,
      icon: "✦",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Selected",
      value: applications.filter((a) => a.status === "Selected").length,
      icon: "✓",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  const statusCounts = statuses.map((status) => ({
    status,
    count: applications.filter((a) => a.status === status).length,
  }));

  const maxCount = Math.max(1, ...statusCounts.map((s) => s.count));

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#090d18] flex items-center justify-center text-slate-300">
        Loading DevTrack...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#090d18] flex items-center justify-center text-slate-300">
        Redirecting to login...
      </main>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700/70 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500";

  return (
    <main className="min-h-screen bg-[#090d18] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-[#0c1120] p-5 lg:flex lg:flex-col">
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold shadow-lg shadow-blue-600/20">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Dev<span className="text-blue-400">Track</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[2px] text-slate-500">
                Career workspace
              </p>
            </div>
          </div>

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {[
              ["Overview", "◫"],
              ["Applications", "▤"],
              ["Interviews", "◷"],
            ].map(([name, icon]) => (
              <button
                key={name}
                onClick={() => {
                  setActiveNav(name);
                  if (name === "Applications") {
                    router.push("/applications");
                  } else if (name === "Interviews") {
                    document.getElementById("interviews")?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  activeNav === name
                    ? "bg-blue-600/15 font-semibold text-blue-400"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <span className="text-lg">{icon}</span>
                {name}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-800 bg-[#111a2c] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              ✦
            </div>
            <p className="text-sm font-semibold">Keep moving forward</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Every application is another step toward your career goals.
            </p>
          </div>

          <button
            onClick={logout}
            className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            ↪ Log out
          </button>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 bg-[#090d18]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div>
              <p className="text-xs text-slate-500">Workspace / Overview</p>
              <h2 className="mt-1 text-lg font-semibold">Career dashboard</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="max-w-48 truncate text-sm font-medium">{user.email}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/15 font-semibold text-blue-300">
                {(user.email?.[0] ?? "U").toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 lg:hidden"
              >
                Log out
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-blue-400">
                  YOUR CAREER, IN CONTROL
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome back<span className="text-blue-400">.</span>
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Here's an overview of your job search progress.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setShowForm(!showForm);
                  setMessage("");
                }}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
              >
                + Add application
              </button>
            </section>

            {message && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
                {message}
                <button onClick={() => setMessage("")}>✕</button>
              </div>
            )}

            {showForm && (
              <section className="rounded-2xl border border-blue-500/20 bg-[#10182a] p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {editingId ? "Edit application" : "New application"}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Add the details of your opportunity.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Company</label>
                      <input required className={inputClass} placeholder="Company name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Position</label>
                      <input required className={inputClass} placeholder="Developer Trainee" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Status</label>
                      <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
                        {statuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Application date</label>
                      <input required type="date" className={inputClass} value={form.application_date} onChange={(e) => setForm({ ...form, application_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Interview date</label>
                      <input type="date" className={inputClass} value={form.interview_date} onChange={(e) => setForm({ ...form, interview_date: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-slate-400">Notes</label>
                    <textarea rows={3} className={inputClass} placeholder="Additional details..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button disabled={saving} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
                      {saving ? "Saving..." : editingId ? "Save changes" : "Create application"}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800">
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="group rounded-2xl border border-slate-800/90 bg-[#101727] p-5 transition hover:-translate-y-1 hover:border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${stat.bg} ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">Your current progress</p>
                </div>
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-5">
              <div className="rounded-2xl border border-slate-800 bg-[#101727] p-6 xl:col-span-3">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Application overview</h3>
                    <p className="mt-1 text-xs text-slate-500">Distribution by application status</p>
                  </div>
                  <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-400">
                    {applications.length} total
                  </span>
                </div>

                {applications.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                    Add applications to see your analytics.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {statusCounts.map(({ status, count }) => (
                      <div key={status}>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-slate-300">{status}</span>
                          <span className="text-slate-400">{count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              status === "Applied" ? "bg-blue-500" :
                              status === "Interview" ? "bg-violet-500" :
                              status === "Shortlisted" ? "bg-amber-500" :
                              status === "Rejected" ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div id="interviews" className="rounded-2xl border border-slate-800 bg-[#101727] p-6 xl:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Upcoming interviews</h3>
                    <p className="mt-1 text-xs text-slate-500">Your scheduled meetings</p>
                  </div>
                  <span className="rounded-lg bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
                    {upcomingInterviews.length} scheduled
                  </span>
                </div>

                {upcomingInterviews.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-center text-sm text-slate-500">
                    No upcoming interviews yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingInterviews.map((app) => (
                      <div key={app.id} className="rounded-xl border border-slate-800 bg-[#0b1020] p-4">
                        <p className="text-sm font-semibold">{app.company}</p>
                        <p className="mt-1 text-xs text-slate-400">{app.role}</p>
                        <p className="mt-3 text-xs font-medium text-violet-400">
                          ◷ {app.interview_date}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section id="applications" className="rounded-2xl border border-slate-800 bg-[#101727] p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Recent applications</h3>
                  <p className="mt-1 text-xs text-slate-500">Manage and monitor your opportunities</p>
                </div>
                <button onClick={loadApplications} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800">
                  ↻ Refresh
                </button>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="⌕  Search company or position..." className={inputClass} />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputClass}>
                  <option value="All">All statuses</option>
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-slate-500">Loading applications...</div>
              ) : filteredApplications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center">
                  <p className="font-medium">No applications found</p>
                  <p className="mt-2 text-xs text-slate-500">Your opportunities will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs text-slate-500">
                          <th className="pb-4 font-medium">Company / Position</th>
                          <th className="pb-4 font-medium">Applied date</th>
                          <th className="pb-4 font-medium">Status</th>
                          <th className="pb-4 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr key={app.id} className="border-b border-slate-800/70 last:border-0">
                            <td className="py-5">
                              <p className="font-medium text-slate-200">{app.company}</p>
                              <p className="mt-1 text-xs text-slate-500">{app.role}</p>
                            </td>
                            <td className="py-5 text-xs text-slate-400">{app.application_date}</td>
                            <td className="py-5">
                              <select value={app.status} onChange={(e) => changeStatus(app.id, e.target.value as Status)} className={`rounded-full border px-3 py-1.5 text-xs outline-none ${statusColors[app.status]}`}>
                                {statuses.map((s) => <option key={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="py-5 text-right">
                              <button onClick={() => startEditing(app)} className="mr-3 text-xs text-blue-400 hover:text-blue-300">Edit</button>
                              <button onClick={() => deleteApplication(app.id)} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {filteredApplications.map((app) => (
                      <div key={app.id} className="rounded-xl border border-slate-800 bg-[#0b1020] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{app.company}</p>
                            <p className="mt-1 text-xs text-slate-400">{app.role}</p>
                          </div>
                          <span className={`rounded-full border px-2 py-1 text-[10px] ${statusColors[app.status]}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Applied: {app.application_date}</p>
                        <div className="mt-4 flex gap-4">
                          <button onClick={() => startEditing(app)} className="text-xs text-blue-400">Edit</button>
                          <button onClick={() => deleteApplication(app.id)} className="text-xs text-rose-400">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <footer className="pb-5 text-center text-xs text-slate-600">
              DevTrack © 2026 · Built to organize your career journey.
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
