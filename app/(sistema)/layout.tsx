import Sidebar from "@/components/Sidebar/Sidebar";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">

      {/* Sidebar */}
      <aside className="h-full flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>

    </div>
  );
}