export default function DABCardSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2 animate-pulse">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5">
          <div className="h-3 bg-slate-100 rounded-full w-3/5" />
          <div className="h-2.5 bg-slate-100 rounded-full w-4/5" />
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full w-8 flex-shrink-0 mt-1" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 bg-slate-100 rounded-full w-14" />
        <div className="h-3 bg-slate-100 rounded-full w-16" />
      </div>
    </div>
  );
}
