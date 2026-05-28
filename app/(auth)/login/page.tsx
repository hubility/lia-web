import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <section className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">Lia</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Painel Dr. Darcy</h1>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
