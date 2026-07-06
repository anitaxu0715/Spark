"use client";

import { Button } from "@/components/ui/Button";

export default function ApplicationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-shell grid min-h-[55vh] place-items-center py-16 text-center">
      <section className="max-w-xl rounded-[2rem] border border-cream-200 bg-white p-8 shadow-card">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-coral-100 text-2xl text-coral-800" aria-hidden="true">!</span>
        <h1 className="mt-5 text-2xl font-bold text-indigo-950">This page could not be loaded</h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">The service may be temporarily unavailable. Try the request again without losing your place.</p>
        <Button className="mt-6" onClick={reset} type="button">Try again</Button>
      </section>
    </div>
  );
}
