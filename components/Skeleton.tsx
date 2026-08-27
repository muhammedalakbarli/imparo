// Yüklənmə "skeleton" placeholder-ləri — boş ağ ekran əvəzinə peşəkar hiss.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-panel-2 ${className}`} />;
}

// Səhifə yüklənərkən göstərilən ümumi karkas (dashboard/fənn/dərs üçün).
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2.5 h-4 w-72" />

        <div className="mt-5 flex gap-2">
          <Skeleton className="h-10 w-28 rounded-2xl" />
          <Skeleton className="h-10 w-28 rounded-2xl" />
          <Skeleton className="h-10 w-28 rounded-2xl" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>

        <Skeleton className="mt-4 h-72 rounded-2xl" />
      </main>
    </div>
  );
}
