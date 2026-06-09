"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Home,
  Calendar,
  CheckSquare,
  Users,
  DollarSign,
  Folders,
  UserPen,
  FileText,
  ClipboardList,
  LogOut,
  MoreHorizontal,
  Target,

  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Car,
  Fuel,
  Wrench,
  LineChart,
  Landmark,
  Briefcase,
  PiggyBank,
  Shield,
  Bitcoin,

  type LucideIcon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem { label: string; href: string; icon: LucideIcon }
interface NavGroup {
  key: keyof typeof MODULES;
  group: string;
  children: NavItem[];
}
type NavEntry = NavItem | NavGroup;

function isGroup(e: NavEntry): e is NavGroup { return "group" in e; }

// ── Navegação ─────────────────────────────────────────────────────────────────
const MODULES = {
  uber: true,
  financeiro: true,
  investimentos: false,
  organizacao: false,
  cadastro: true,
};


const NAV: NavEntry[] = [
  {
    key: "organizacao",
    group: "Organização",
    children: [
      { label: "Calendário", href: "/calendario", icon: Calendar },
      { label: "Tarefas", href: "/tarefas", icon: CheckSquare },
      { label: "Metas", href: "/metas", icon: Target },
    ],
  },

  {
    key: "financeiro",
    group: "Financeiro",
    children: [
      { label: "Visão Geral", href: "/financeiro", icon: Wallet },
      { label: "Receitas Provisionadas", href: "/financeiro/receitas-previstas", icon: TrendingUp },
      { label: "Receitas Realizadas", href: "/financeiro/receitas-realizadas", icon: TrendingUp },
      { label: "Despesas", href: "/financeiro/despesas", icon: TrendingDown },
      { label: "Cartões", href: "/financeiro/cartoes", icon: CreditCard },
    ],
  },

  {
    key: "uber",
    group: "Uber",
    children: [
      { label: "Visão Geral", href: "/uber", icon: Car },
      { label: "Ganhos", href: "/uber/ganhos", icon: TrendingUp },
      { label: "Combustível", href: "/uber/combustivel", icon: Fuel },
      { label: "Manutenção", href: "/uber/manutencao?openKmModal=true", icon: Wrench },
      // { label: "Relatórios", href: "/relatorios", icon: ClipboardList },
    ],
  },

  {
    key: "investimentos",
    group: "Investimentos",
    children: [
      { label: "Visão Geral", href: "/investimentos", icon: LineChart },
      { label: "Carteira", href: "/investimentos/carteira", icon: Briefcase },
      { label: "Aportes", href: "/investimentos/aportes", icon: PiggyBank },
      { label: "Dividendos", href: "/investimentos/dividendos", icon: Landmark },
      { label: "Renda Fixa", href: "/investimentos/renda-fixa", icon: Shield },
      { label: "Criptomoedas", href: "/investimentos/cripto", icon: Bitcoin },
      { label: "Metas", href: "/investimentos/metas", icon: Target },
    ],
  },

  {
    key: "cadastro",
    group: "Cadastro",
    children: [
      { label: "Usuários", href: "/usuarios", icon: UserPen },
    ],
  },
];

const NAV_VISIBLE: NavEntry[] = NAV.filter((entry) => {
  if (!isGroup(entry)) return true;

  return MODULES[entry.key];
});

const ALL_ITEMS: NavItem[] = NAV_VISIBLE.flatMap((e) =>
  isGroup(e) ? e.children : [e]
);

const ITEM_H = 44;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(n: string) {
  return n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function getActiveGroups(pathname: string): Set<string> {
  const s = new Set<string>();
  for (const e of NAV) {
    if (isGroup(e) && e.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")))
      s.add(e.group);
  }
  return s;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Sidebar() {

  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const pathname = usePathname();

  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const collapsed = !isHovered;
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ bottom: 0, left: 0 });
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  const navRef = useRef<HTMLElement>(null);
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const userName = session?.user?.name || "";
  const userEmail = session?.user?.email || "";

  // ── Grupos colapsáveis ────────────────────────────────────────────────────

  const [manualOpen, setManualOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    setManualOpen(new Set());
  }, [pathname]);

  const isLoading = status === "loading";



  const openGroups = useMemo(() => {
    return new Set([...getActiveGroups(pathname), ...manualOpen]);
  }, [pathname, manualOpen]);

  function toggleGroup(group: string) {
    if (getActiveGroups(pathname).has(group)) return;
    setManualOpen((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  // ── Overflow (modo recolhido) ─────────────────────────────────────────────

  useEffect(() => {
    if (!collapsed) { setVisibleCount(null); setOverflowOpen(false); return; }
    function calc() {
      if (!navRef.current) return;
      const available = navRef.current.clientHeight - 8;
      const max = Math.floor(available / ITEM_H);
      setVisibleCount(ALL_ITEMS.length <= max ? ALL_ITEMS.length : Math.max(0, max - 1));
    }
    calc();
    const ro = new ResizeObserver(calc);
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [collapsed]);

  function openOverflow() {
    if (!overflowBtnRef.current) return;
    const r = overflowBtnRef.current.getBoundingClientRect();
    setPopoverPos({ bottom: window.innerHeight - r.bottom, left: r.right + 8 });
    setOverflowOpen(true);
  }

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (!overflowOpen) return;
    function onOut(e: MouseEvent) {
      const t = e.target as Node;
      if (!popoverRef.current?.contains(t) && !overflowBtnRef.current?.contains(t))
        setOverflowOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [overflowOpen]);

  const visibleItems = visibleCount !== null ? ALL_ITEMS.slice(0, visibleCount) : ALL_ITEMS;
  const overflowItems = visibleCount !== null ? ALL_ITEMS.slice(visibleCount) : [];
  const showExpander = overflowItems.length > 0;

  // ── Sub-componentes ───────────────────────────────────────────────────────

  function CollapsedItem({ item }: { item: NavItem }) {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        title={item.label}
        className={`flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-all duration-150
          ${active ? "bg-slate-700 text-orange-400" : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"}`}
      >
        <item.icon size={18} strokeWidth={1.75} />
      </Link>
    );
  }

  function ExpandedItem({ item, indent = false }: { item: NavItem; indent?: boolean }) {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 rounded-lg text-sm transition-all duration-150 whitespace-nowrap
          ${indent ? "px-3 py-1.5 ml-2" : "px-3 py-2"}
          ${active ? "bg-slate-700 text-orange-400 font-medium" : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"}`}
      >
        <item.icon size={16} strokeWidth={1.75} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  function ExpandedGroup({ entry }: { entry: NavGroup }) {
    const isOpen = openGroups.has(entry.group);
    const hasActive = entry.children.some(
      (c) => pathname === c.href || pathname.startsWith(c.href + "/")
    );
    return (
      <div className="mt-1">
        <button
          onClick={() => toggleGroup(entry.group)}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg
            text-[10px] font-semibold uppercase tracking-widest select-none transition-colors duration-150
            ${hasActive ? "text-slate-300" : "text-slate-500 hover:text-slate-300"}`}
        >
          <span>{entry.group}</span>
          {isOpen
            ? <ChevronUp size={11} className="shrink-0" />
            : <ChevronDown size={11} className="shrink-0" />}
        </button>
        {isOpen && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {entry.children.map((child) => (
              <ExpandedItem key={child.href} item={child} indent />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <aside
        className={`relative flex flex-col h-screen bg-slate-800 border-r border-slate-700 transition-all duration-300 z-10 shrink-0
          ${collapsed ? "w-16" : "w-56"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setManualOpen(new Set());
          setOverflowOpen(false);
        }}
      >
        {/* Header: logo */}
        <div className="flex items-center justify-center border-b border-slate-700 h-16 shrink-0 px-3">
          <Link href="/dashboard" title="Início">
            <Image
              src="/img/logoPadrao.png"
              alt="Logo"
              width={36}
              height={36}
              className="rounded-lg object-contain"
            />
          </Link>
        </div>

        {/* Navegação */}
        {collapsed ? (
          <>
            <nav ref={navRef} className="flex flex-col gap-1 p-2 flex-1 overflow-hidden">
              {visibleItems.map((item) => (
                <CollapsedItem key={item.href} item={item} />
              ))}
            </nav>

            {showExpander && (
              <div className="px-2 pb-2 shrink-0">
                <button
                  ref={overflowBtnRef}
                  onClick={openOverflow}
                  title="Mais itens"
                  className={`flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-all duration-150
                    ${overflowOpen ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"}`}
                  aria-label="Mais itens"
                >
                  <MoreHorizontal size={18} strokeWidth={1.75} />
                </button>
              </div>
            )}
          </>
        ) : (
          <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-hidden">
            {NAV_VISIBLE
              .filter((entry) => {
                if (
                  isGroup(entry) &&
                  entry.group === "Cadastro" &&
                  !isAdmin
                ) {
                  return false;
                }

                return true;
              })
              .map((entry) =>
                isGroup(entry)
                  ? <ExpandedGroup key={entry.group} entry={entry} />
                  : <ExpandedItem key={(entry as NavItem).href} item={entry as NavItem} />
              )}
          </nav>
        )}

        {/* Botão Sair + Avatar — sempre na base */}
        <div className="border-t border-slate-700 p-2 shrink-0 flex flex-col gap-1">
          <button
            onClick={() =>
              signOut({
                callbackUrl: "/",
              })
            }
            title="Sair"
            className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-400
              hover:text-slate-100 hover:bg-slate-700 transition-colors w-full
              ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
            {!collapsed && <span className="truncate">Sair</span>}
          </button>

          <div
            className={`flex items-center gap-3 px-2 py-2 ${collapsed ? "justify-center" : ""}`}
          >
            <span
              className="shrink-0 flex items-center justify-center rounded-full text-white text-xs font-bold"
              style={{
                width: 32, height: 32,
                backgroundColor: "#f97316",
                letterSpacing: "0.03em",
              }}
            >
              {userName ? getInitials(userName) : "?"}
            </span>
            {!collapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-sm font-semibold text-slate-200 truncate leading-tight">
                  {userName || "Usuário"}
                </span>
                {userEmail && (
                  <span className="text-[0.68rem] text-slate-500 truncate">{userEmail}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Popover overflow — portal para escapar do overflow:hidden */}
      {mounted && overflowOpen && createPortal(
        <div
          ref={popoverRef}
          style={{ position: "fixed", bottom: popoverPos.bottom, left: popoverPos.left }}
          className="w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden z-[9999] py-1"
        >
          {overflowItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOverflowOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors
                  ${active ? "bg-slate-700 text-orange-400 font-medium" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"}`}
              >
                <item.icon size={15} strokeWidth={1.75} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>,
        document.body
      )}

    </>
  );
}
