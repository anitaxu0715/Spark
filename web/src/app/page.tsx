import Link from "next/link";
import { SafetyNotice } from "@/components/SafetyNotice";
import { buttonStyles } from "@/components/ui/Button";
import { getViewer } from "@/lib/auth/viewer";

const steps = [
  {
    number: "01",
    title: "Share what you know",
    description: "Add the practical, creative, or everyday skills you would feel comfortable sharing.",
  },
  {
    number: "02",
    title: "Discover interesting people",
    description: "Find peers through what they know, what they are curious about, and how they like to learn.",
  },
  {
    number: "03",
    title: "Learn and grow together",
    description: "Send a thoughtful request, choose a comfortable format, and make something click.",
  },
];

const previews = [
  { initials: "PC", title: "Photography", interest: "Japanese", context: "Design student", color: "bg-coral-100 text-coral-800" },
  { initials: "JB", title: "Python Basics", interest: "Guitar", context: "Computer science student", color: "bg-indigo-100 text-indigo-800" },
  { initials: "SR", title: "Baking", interest: "Fitness", context: "Food systems student", color: "bg-amber-100 text-amber-800" },
];

export default async function Home() {
  const viewer = await getViewer();
  const primaryHref = viewer.user && viewer.membership ? "/discover" : "/auth/sign-up";
  const secondaryHref = viewer.user ? "/profile" : "/auth/sign-in";
  return (
    <>
      <section className="overflow-hidden border-b border-cream-200">
        <div className="page-shell grid min-h-[620px] items-center gap-14 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow text-coral-600">Peer-to-peer skill exchange</p>
            <h1 className="mt-5 text-balance text-5xl font-bold leading-[1.03] tracking-[-0.045em] text-indigo-950 sm:text-6xl lg:text-7xl">
              Teach what you know. <span className="text-coral-500">Discover</span> what you can become.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-ink-600">
              Spark helps students turn everyday knowledge into meaningful connections. Share a skill, follow your curiosity, and learn with someone who remembers being new.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className={buttonStyles("primary", "px-7")} href={primaryHref}>{viewer.user ? "Discover skills" : "Join Spark"}</Link>
              <Link className={buttonStyles("secondary", "px-7")} href={secondaryHref}>{viewer.user ? "View your profile" : "Sign in"}</Link>
            </div>
            <p className="mt-5 text-sm text-ink-500">Free to explore · No expertise required · You choose how to meet</p>
          </div>

          <div className="relative mx-auto min-h-[420px] w-full max-w-lg" aria-label="A glimpse of the Spark community">
            <div className="absolute inset-x-8 top-6 h-80 rotate-3 rounded-[3rem] bg-indigo-100" />
            <div className="absolute inset-x-8 top-6 h-80 -rotate-3 rounded-[3rem] bg-coral-100" />
            <div className="absolute inset-x-3 top-10 rounded-[2.5rem] border border-cream-200 bg-white p-6 shadow-card-hover sm:inset-x-10">
              <div className="flex items-center gap-4">
                <span className="grid size-16 place-items-center rounded-[35%] bg-violet-100 text-lg font-bold text-violet-800">NE</span>
                <div>
                  <p className="text-xl font-bold text-indigo-950">A member shares illustration</p>
                  <p className="mt-1 text-sm text-ink-500">Fictional product preview</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-cream-100 p-5">
                <p className="text-sm font-semibold text-indigo-900">“Let&apos;s turn one rough idea into a piece you are proud to finish.”</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Illustration", "Photoshop", "Beginner-friendly"].map((tag) => (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800" key={tag}>{tag}</span>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center text-xs font-semibold">
                <span className="rounded-xl border border-cream-200 p-3 text-ink-600">Wants to learn Guitar</span>
                <span className="rounded-xl bg-coral-500 p-3 text-white">View profile</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm font-bold text-indigo-900 shadow-card">
              <span className="mr-2 text-coral-500">✦</span> Everyone has something to share
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-24" id="how-it-works">
        <div className="max-w-2xl">
          <p className="eyebrow text-coral-600">How it works</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-indigo-950 sm:text-4xl">A simple way to start learning together</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article className="rounded-[1.75rem] border border-cream-200 bg-white p-7 shadow-card" key={step.number}>
              <span className="font-mono text-sm font-bold text-coral-500">{step.number}</span>
              <h3 className="mt-8 text-xl font-bold text-indigo-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-500">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-indigo-950 py-20 text-white sm:py-24">
        <div className="page-shell grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow text-coral-200">Why Spark exists</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Knowledge feels different when someone shares it generously.</h2>
          </div>
          <div className="space-y-5 text-base leading-7 text-indigo-100">
            <p>Expertise is not only a credential. It is the recipe you have made ten times, the shortcut you wish someone had shown you, or the creative habit that finally works.</p>
            <p>Spark makes room for that kind of knowledge—and for the confidence that grows when you realize someone else can learn from you.</p>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-coral-600">A private member community</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-indigo-950 sm:text-4xl">A preview of what you can discover</h2>
          </div>
          <Link className={buttonStyles("secondary")} href={primaryHref}>{viewer.user ? "Explore verified profiles" : "Join to explore"}</Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {previews.map((preview) => (
            <article className="rounded-[1.75rem] border border-cream-200 bg-white p-6 shadow-card" key={preview.title}>
              <div className="flex items-center gap-4">
                <span className={`grid size-14 place-items-center rounded-[35%] font-bold ${preview.color}`} aria-hidden="true">{preview.initials}</span>
                <div><h3 className="font-bold text-indigo-950">Shares {preview.title}</h3><p className="mt-1 text-sm text-ink-500">{preview.context}</p></div>
              </div>
              <p className="mt-5 text-sm text-ink-500">Curious about <strong className="text-indigo-900">{preview.interest}</strong></p>
              <p className="mt-5 rounded-xl bg-cream-100 p-3 text-xs font-semibold text-ink-500">Illustrative profile — no member data is shown publicly</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell pb-20 sm:pb-24">
        <SafetyNotice />
      </section>
    </>
  );
}
