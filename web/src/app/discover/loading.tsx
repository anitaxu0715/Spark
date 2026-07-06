export default function DiscoverLoading() {
  return (
    <div className="page-shell animate-pulse py-16" aria-label="Loading discovery">
      <div className="h-12 w-72 rounded-xl bg-cream-200" />
      <div className="mt-8 h-36 rounded-[2rem] bg-cream-100" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => <div className="h-80 rounded-[2rem] bg-cream-100" key={item} />)}
      </div>
    </div>
  );
}
