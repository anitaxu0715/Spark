import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import type { Skill } from "@/types";

interface DiscoveryFiltersProps {
  skills: Skill[];
  values: {
    search?: string;
    teaching?: string;
    learning?: string;
    format?: string;
    beginner?: string;
  };
}

export function DiscoveryFilters({ skills, values }: DiscoveryFiltersProps) {
  return (
    <form className="rounded-[1.75rem] border border-cream-200 bg-white p-4 shadow-card sm:p-5" method="get">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-500" htmlFor="discover-search">Search</label>
          <input className="field" defaultValue={values.search} id="discover-search" name="search" placeholder="Name, skill, or interest" type="search" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-500" htmlFor="teaching-filter">Can share</label>
          <select className="field" defaultValue={values.teaching} id="teaching-filter" name="teaching">
            <option value="">All skills</option>
            {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-500" htmlFor="learning-filter">Wants to learn</label>
          <select className="field" defaultValue={values.learning} id="learning-filter" name="learning">
            <option value="">All interests</option>
            {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-500" htmlFor="format-filter">Meeting format</label>
          <select className="field" defaultValue={values.format} id="format-filter" name="format">
            <option value="">Any format</option>
            <option value="online">Online</option>
            <option value="in-person">In person</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-cream-200 pt-4 sm:flex-row sm:items-center">
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-indigo-950">
          <input className="size-5 accent-coral-500" defaultChecked={values.beginner === "true"} name="beginner" type="checkbox" value="true" />
          Beginner-friendly only
        </label>
        <div className="flex gap-2">
          <Link className={buttonStyles("quiet")} href="/discover">Clear filters</Link>
          <button className={buttonStyles("primary")} type="submit">Apply filters</button>
        </div>
      </div>
    </form>
  );
}
