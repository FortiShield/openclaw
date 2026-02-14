export default function RootLoading() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="h-7 w-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 w-60 mt-3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-64 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>
        <div className="h-64 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      </div>

      <div className="h-96 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
    </div>
  );
}
