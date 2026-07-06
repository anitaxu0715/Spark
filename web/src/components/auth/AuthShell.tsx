import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <div className="page-shell py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <Logo />
          <p className="eyebrow mt-8 text-coral-600">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-indigo-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-ink-500">{description}</p>
        </div>
        <section className="mt-8 rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-8">
          {children}
        </section>
        {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
        <p className="mt-6 text-center text-xs leading-5 text-ink-400">
          By continuing, you agree to use Spark respectfully and protect the privacy of other members.
        </p>
        <Link className="mt-4 block text-center text-sm font-semibold text-indigo-800 hover:text-coral-600" href="/">Return home</Link>
      </div>
    </div>
  );
}
