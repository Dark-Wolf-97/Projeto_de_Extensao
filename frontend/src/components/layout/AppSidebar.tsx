import { NavLink, useLocation } from "react-router-dom";
import logo from "../../../src/assets/images/logo-isg.png";
import { useAuth } from "@/context/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  UserRound,
  Cake,
  CalendarDays,
  FileText,
} from "lucide-react";

const ADMIN_ITEMS = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Consultas", url: "/consultas", icon: CalendarDays },
  { title: "Usuários", url: "/usuarios", icon: Users },
  { title: "Pacientes", url: "/pacientes", icon: UserRound },
];

const SECRETARIA_ITEMS = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Consultas", url: "/consultas", icon: CalendarDays },
  { title: "Pacientes", url: "/pacientes", icon: UserRound },
  { title: "Aniversários", url: "/aniversarios", icon: Cake },
];

const MEDICO_ITEMS = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Consultas", url: "/consultas", icon: CalendarDays },
  { title: "Prontuários", url: "/prontuarios", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user } = useAuth();

  const items =
    user?.role === "ADMIN"
      ? ADMIN_ITEMS
      : user?.role === "SECRETARIA"
        ? SECRETARIA_ITEMS
        : MEDICO_ITEMS;

  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <NavLink to="/home" className="flex items-center gap-2 px-4 py-5">
          <div className="flex items-center gap-2 py-5 border-b border-sidebar-border">
            <img
              src={logo}
              width={50}
              height={50}
              alt="Logo"
              className="w-10 h-10 min-w-10 min-h-10 object-contain rounded-2xl"
            />
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sidebar-foreground font-bold text-base">ISG Cabreira</span>
              </div>
            )}
          </div>
        </NavLink>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={`mx-2 rounded-md transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-gold"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <NavLink
                        to={item.url}
                        className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
