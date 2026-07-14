import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <section className="w-full max-w-[380px] rounded-md border bg-card p-8 shadow-sm">
        <div className="mb-7">
          <Image
            src="/logo/logoDarcy.png"
            alt="Dr. Darcy Mavignier — odontologia integrada"
            width={600}
            height={215}
            priority
            className="h-auto w-44"
          />
          <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Acesso
          </p>
          <h1 className="mt-1 text-xl font-semibold text-foreground">Painel clínico</h1>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
