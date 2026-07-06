export function SetupState() {
  return (
    <div className="page-shell grid min-h-[55vh] place-items-center py-16">
      <section className="max-w-xl rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-2xl" aria-hidden="true">⚙</span>
        <h1 className="mt-5 text-2xl font-bold text-indigo-950">Connect Spark to Supabase</h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          Add the variables from <code className="rounded bg-white px-1.5 py-0.5">web/.env.example</code> to <code className="rounded bg-white px-1.5 py-0.5">web/.env.local</code>, then restart the application.
        </p>
      </section>
    </div>
  );
}
