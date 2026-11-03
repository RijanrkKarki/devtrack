"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  interview_date: string | null;
  notes: string | null;
};

export default function InterviewsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  async function loadInterviews() {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      router.push("/login");
      return;
    }

    setEmail(sessionData.session.user.email || "");

    const { data, error } = await supabase
      .from("applications")
      .select("id, company, role, status, interview_date, notes")
      .not("interview_date", "is", null)
      .order("interview_date", { ascending: true });

    if (error) {
      console.error(error.message);
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const [today, setToday] = useState("");
  const upcoming = applications.filter(
    (app) => app.interview_date && app.interview_date >= today
  );
  const past = applications.filter(
    (app) => app.interview_date && app.interview_date < today
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-[#101a2d] p-6 md:block">
        <Link href="/" className="text-2xl font-bold">
          <span className="text-cyan-400">D</span> DevTrack
        </Link>
        <p className="mt-2 text-sm text-slate-400">Career workspace</p>

        <p className="mb-4 mt-10 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="space-y-2">
          <Link href="/" className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800">
            ◫ Overview
          </Link>
          <Link href="/applications" className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800">
            ▤ Applications
          </Link>
          <Link href="/interviews" className="block rounded-lg bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-400">
            ◷ Interviews
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <p className="mb-4 text-xs text-slate-500">Keep moving forward.</p>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-white">
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="min-h-screen p-5 md:ml-64 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Workspace / Interviews</p>
            <h1 className="mt-2 text-3xl font-bold">Interviews</h1>
            <p className="mt-2 text-slate-400">
              Prepare for the next step in your career.
            </p>
          </div>

          <div className="text-sm text-slate-400">{email}</div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total interviews", value: applications.length },
            { label: "Upcoming", value: upcoming.length },
            { label: "Completed dates", value: past.length },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-800 bg-[#111c30] p-6">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-slate-800 bg-[#111c30] p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Upcoming interviews</h2>
              <p className="mt-1 text-sm text-slate-400">Your scheduled meetings</p>
            </div>
            <button
              onClick={loadInterviews}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-400">Loading interviews...</p>
          ) : upcoming.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl">◷</div>
              <h3 className="mt-4 text-lg font-semibold">No upcoming interviews</h3>
              <p className="mt-2 text-sm text-slate-400">
                Add an interview date to an application to see it here.
              </p>
              <Link
                href="/applications"
                className="mt-5 inline-block rounded-lg bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Manage applications
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((app) => (
                <div key={app.id} className="rounded-xl border border-slate-800 bg-[#0b1425] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{app.company}</h3>
                      <p className="mt-1 text-sm text-slate-400">{app.role}</p>
                      {app.notes && (
                        <p className="mt-3 text-sm text-slate-500">{app.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-cyan-400">
                        {new Date(app.interview_date + "T00:00:00").toLocaleDateString()}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">
                        {app.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-[#111c30] p-6">
            <h2 className="mb-4 text-xl font-semibold">Previous interview dates</h2>
            {past.map((app) => (
              <div key={app.id} className="border-b border-slate-800 py-4 last:border-0">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">{app.company}</p>
                    <p className="text-sm text-slate-400">{app.role}</p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(app.interview_date + "T00:00:00").toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        <footer className="mt-10 text-center text-sm text-slate-600">
          DevTrack © 2026 · Built to organize your career journey.
        </footer>
      </main>
    </div>
  );
}