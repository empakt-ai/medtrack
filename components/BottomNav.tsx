"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const PATIENT_NAV: NavItem[] = [
  { href: "/patient/today", label: "Today", icon: "today" },
  { href: "/patient/history", label: "History", icon: "history" },
  { href: "/patient/settings", label: "Settings", icon: "settings" },
];

export const CARETAKER_NAV: NavItem[] = [
  { href: "/caretaker/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/caretaker/patients", label: "Patients", icon: "group" },
  { href: "/caretaker/inventory", label: "Inventory", icon: "inventory_2" },
  { href: "/caretaker/settings", label: "Settings", icon: "settings" },
];

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-max-width-content items-center justify-around rounded-t-xl bg-surface-container-lowest px-gutter pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-nav-top">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center rounded-full px-4 py-1 transition-all duration-200 active:scale-90",
              active
                ? "bg-primary-fixed text-primary"
                : "text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            <Icon name={item.icon} filled={active} />
            <span className="font-label-md text-label-md">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
