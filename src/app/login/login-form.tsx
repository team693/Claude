"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginFormInner({ action }: { action: (formData: FormData) => Promise<void> }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <form action={action} className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          Invalid email or password. Please try again.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email Address</label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@school.edu" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required className="input" placeholder="Enter your password" />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full mt-6 py-2.5">
        Sign In
      </button>
    </form>
  );
}

export function LoginForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
        <div className="space-y-4">
          <div><label className="label">Email Address</label><input className="input" disabled /></div>
          <div><label className="label">Password</label><input className="input" disabled type="password" /></div>
        </div>
        <button className="btn-primary w-full mt-6 py-2.5" disabled>Sign In</button>
      </div>
    }>
      <LoginFormInner action={action} />
    </Suspense>
  );
}
