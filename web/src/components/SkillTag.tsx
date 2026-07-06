interface SkillTagProps {
  children: string;
  tone?: "teach" | "learn" | "neutral";
}

const tones = {
  teach: "bg-coral-50 text-coral-800 ring-coral-100",
  learn: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  neutral: "bg-cream-100 text-ink-600 ring-cream-200",
};

export function SkillTag({ children, tone = "neutral" }: SkillTagProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}
