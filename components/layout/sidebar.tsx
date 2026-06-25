"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  UserMultiple02Icon,
  DentalToothIcon,
  UserSettings01Icon,
  SidebarLeft01Icon,
  Sun02Icon,
  Moon02Icon,
} from "@hugeicons/core-free-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { canAccessResource, type Resource, type Role } from "@/lib/permissions";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Calendar03Icon;
  resource: Resource;
}

interface SidebarProps {
  userRole: Role;
}

export function Sidebar({ userRole }: SidebarProps) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const expanded = pinned || hovered;
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => setMounted(true), []);

  const navItems: NavItem[] = [
    { label: "Agenda", href: "/agenda", icon: Calendar03Icon, resource: "appointments" },
    { label: "Pacientes", href: "/pacientes", icon: UserMultiple02Icon, resource: "patients" },
    { label: "Catálogo", href: "/catalogo", icon: DentalToothIcon, resource: "catalog" },
    { label: "Usuários", href: "/usuarios", icon: UserSettings01Icon, resource: "users" },
  ];

  const visibleNav = navItems.filter((item) => canAccessResource(userRole, item.resource, "read"));

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <TooltipProvider delayDuration={0}>
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-sidebar-border bg-sidebar md:flex"
      style={{
        width: expanded ? 240 : 52,
        transitionProperty: "width",
        transitionDuration: "var(--duration-base)",
        transitionTimingFunction: "var(--ease-out)",
      }}
    >
      {/* Wordmark */}
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-3.5">
        {expanded && (
          <span className="font-mono text-sm font-semibold text-sidebar-foreground">
            lia
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-hidden px-1.5 py-2">
        {visibleNav.map((item) => {
          const active = isActive(item.href);
          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm",
                "transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              style={{
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-out)",
              }}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                strokeWidth={active ? 2 : 1.5}
                className="shrink-0"
              />
              {expanded && (
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );

          if (!expanded) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <div className="relative">{linkContent}</div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <div key={item.href} className="relative">
              {linkContent}
            </div>
          );
        })}
      </nav>

      {/* Theme + Pin toggles */}
      <div className="border-t border-sidebar-border px-1.5 py-2 space-y-1">
        {/* Theme toggle */}
        {expanded ? (
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm",
              "text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
            style={{
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out)",
            }}
          >
            <HugeiconsIcon
              icon={mounted && isDark ? Sun02Icon : Moon02Icon}
              size={18}
              strokeWidth={1.5}
              className="shrink-0"
            />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {isDark ? "Tema claro" : "Tema escuro"}
            </span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={cn(
                  "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm",
                  "text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                style={{
                  transitionDuration: "var(--duration-fast)",
                  transitionTimingFunction: "var(--ease-out)",
                }}
              >
                <HugeiconsIcon
                  icon={mounted && isDark ? Sun02Icon : Moon02Icon}
                  size={18}
                  strokeWidth={1.5}
                  className="shrink-0"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {isDark ? "Tema claro" : "Tema escuro"}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Pin toggle */}
        {expanded ? (
          <button
            onClick={() => setPinned(!pinned)}
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm",
              "text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
            style={{
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out)",
            }}
          >
            <HugeiconsIcon
              icon={SidebarLeft01Icon}
              size={18}
              strokeWidth={1.5}
              className="shrink-0"
              style={{
                transform: pinned ? "rotate(180deg)" : undefined,
                transitionProperty: "transform",
                transitionDuration: "var(--duration-base)",
                transitionTimingFunction: "var(--ease-out)",
              }}
            />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {pinned ? "Soltar menu" : "Fixar menu"}
            </span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPinned(!pinned)}
                className={cn(
                  "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm",
                  "text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                style={{
                  transitionDuration: "var(--duration-fast)",
                  transitionTimingFunction: "var(--ease-out)",
                }}
              >
                <HugeiconsIcon
                  icon={SidebarLeft01Icon}
                  size={18}
                  strokeWidth={1.5}
                  className="shrink-0"
                  style={{
                    transform: pinned ? "rotate(180deg)" : undefined,
                    transitionProperty: "transform",
                    transitionDuration: "var(--duration-base)",
                    transitionTimingFunction: "var(--ease-out)",
                  }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {pinned ? "Soltar menu" : "Fixar menu"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
    </TooltipProvider>
  );
}
