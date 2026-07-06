interface AvatarProps {
  initials: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const colors: Record<string, string> = {
  coral: "bg-coral-100 text-coral-800",
  indigo: "bg-indigo-100 text-indigo-800",
  gold: "bg-amber-100 text-amber-800",
  sage: "bg-emerald-100 text-emerald-800",
  rose: "bg-rose-100 text-rose-800",
  blue: "bg-sky-100 text-sky-800",
  purple: "bg-violet-100 text-violet-800",
  orange: "bg-orange-100 text-orange-800",
};

const sizes = {
  sm: "size-10 text-sm",
  md: "size-14 text-base",
  lg: "size-24 text-2xl",
};

export function Avatar({ initials, color = "coral", size = "md" }: AvatarProps) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-[35%] font-bold tracking-wide ${colors[color] ?? colors.coral} ${sizes[size]}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
