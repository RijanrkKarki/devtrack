
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          window.location.href = "/";
        } else {
          setMessage("Account created! Check your email to confirm your account, then log in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        window.location.href = "/";
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-5 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Dev<span className="text-blue-400">Track</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Keep your career journey organized.
          </p>
        </div>

        <h2 className="mb-2 text-2xl font-semibold">
          {isSignup ? "Create your account" : "Welcome back"}
        </h2>

        <p className="mb-6 text-sm text-slate-400">
          {isSignup
            ? "Sign up to start tracking your applications."
            : "Log in to continue to your dashboard."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {message && (
            <p className="rounded-lg bg-slate-800 p-3 text-sm text-blue-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isSignup ? "Already have an account?" : "New to DevTrack?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setMessage("");
            }}
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            {isSignup ? "Log in" : "Create an account"}
          </button>
        </p>
      </div>
    </main>
  );
}
