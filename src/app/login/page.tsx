import { redirect } from "next/navigation";
import { getCurrentUser, login } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  async function handleLogin(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const user = await login(email, password);
    if (user) {
      redirect("/dashboard");
    }
    redirect("/login?error=invalid");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">EduManager</h1>
          <p className="text-indigo-300 mt-1">School Management System</p>
        </div>

        <LoginForm action={handleLogin} />

        <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
          <p className="text-indigo-200 text-xs font-medium mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-xs text-indigo-300">
            <p>Admin: admin@school.edu / password123</p>
            <p>Teacher: john@school.edu / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
