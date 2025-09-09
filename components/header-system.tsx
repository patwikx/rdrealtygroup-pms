"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

import {
  Building2,
  Users,
  FileText,
  Settings,
  Menu,
  HelpCircle,
  LucideLandmark,
  Notebook,
  LogOut,
  LockKeyholeOpen,
  CreditCardIcon,
  Bell,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { DashboardIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDrawer } from "./notifcation-drawer";
import TeamSwitcher from "./team-switcher";
import { GlobalSearch } from "./global-search";
import { ChangePasswordDialog } from "@/app/auth/login/components/change-password-dialog";
import { logoutWithAudit } from "@/actions/logout";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

interface NavGroup {
  name: string;
  icon: React.ElementType;
  items: NavItem[];
  roles: UserRole[];
}

// Single navigation items (not grouped)
const singleNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.ACCTG] },
];

// Grouped navigation items
const navigationGroups: NavGroup[] = [
  {
    name: "Property Management",
    icon: Building2,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
    items: [
      { name: "Properties", href: "/dashboard/properties", icon: Building2, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
      { name: "Spaces", href: "/dashboard/spaces", icon: LucideLandmark, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
      { name: "Tenants", href: "/dashboard/tenants", icon: Users, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.ACCTG] },
    ]
  },
  {
    name: "Financial Management",
    icon: CreditCardIcon,
    roles: [UserRole.ADMIN, UserRole.ACCTG, UserRole.MANAGER],
    items: [
      { name: "PDC Monitoring", href: "/dashboard/pdc-monitoring", icon: CreditCardIcon, roles: [UserRole.ADMIN, UserRole.ACCTG] },
      { name: "Tenant Notices", href: "/dashboard/tenant-notice", icon: Bell, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCTG] },
    ]
  },
  {
    name: "Administration",
    icon: Settings,
    roles: [UserRole.ADMIN],
    items: [
      { name: "Projects", href: "/dashboard/projects", icon: FileText, roles: [UserRole.ADMIN] },
      { name: "Audit Logs", href: "/dashboard/audit-logs", icon: Notebook, roles: [UserRole.ADMIN] },
      { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: [UserRole.ADMIN] },
    ]
  }
];

interface HeaderProps {
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
    image?: string | null;
    role?: UserRole;
  };
}

export function Header({ user: propUser }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openDropdowns, setOpenDropdowns] = React.useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  
  const currentUser = useCurrentUser();
  const user = currentUser || propUser;

  // Filter accessible single items and groups
  const accessibleSingleItems = React.useMemo(() => {
    if (!user?.role) return [];
    return singleNavItems.filter(item => item.roles.includes(user.role!));
  }, [user?.role]);

  const accessibleGroups = React.useMemo(() => {
    if (!user?.role) return [];
    return navigationGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(user.role!))
      }))
      .filter(group => 
        group.roles.includes(user.role!) && group.items.length > 0
      );
  }, [user?.role]);

  const handleDropdownToggle = (groupName: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => 
      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
  };

  const isItemActive = (item: NavItem) => {
    return pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await logoutWithAudit();
    } catch (error) {
      console.error("Logout failed:", error);
      await logoutWithAudit();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 md:mx-12 lg:mx-12 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <TeamSwitcher />

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              {/* Single navigation items */}
              {accessibleSingleItems.map((item) => (
                <NavigationMenuItem key={item.name}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 gap-2",
                        isItemActive(item) && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}

              {/* Grouped navigation items */}
              {accessibleGroups.map((group) => (
                <NavigationMenuItem key={group.name}>
                  <DropdownMenu 
                    open={openDropdowns[group.name]} 
                    onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [group.name]: open }))}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "h-10 px-4 py-2 text-sm font-medium gap-2 hover:bg-accent hover:text-accent-foreground",
                          isGroupActive(group) && "bg-accent text-accent-foreground"
                        )}
                      >
                        <group.icon className="h-4 w-4" />
                        {group.name}
                        <ChevronDown className="h-3 w-3 ml-1 transition-transform duration-200" 
                          style={{ 
                            transform: openDropdowns[group.name] ? 'rotate(180deg)' : 'rotate(0deg)' 
                          }} 
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center justify-between cursor-pointer px-3 py-2 hover:bg-accent",
                              isItemActive(item) && "bg-accent text-accent-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <item.icon className="h-4 w-4" />
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <GlobalSearch />
          <Button variant="ghost" size="sm" className="relative h-8 w-8 px-0">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <NotificationDrawer />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image ?? undefined} alt={user?.firstName || "User avatar"} />
                  <AvatarFallback>{user?.firstName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.image ?? undefined} alt="User profile picture" />
                    <AvatarFallback>{user?.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex justify-between items-center cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
                <span>Profile</span>
                <Users className="h-4 w-4 ml-2" />
              </DropdownMenuItem>
              
              {user?.role === UserRole.ADMIN && (
                <DropdownMenuItem className="flex justify-between items-center cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                  <span>Settings</span>
                  <Settings className="h-4 w-4 ml-2" />
                </DropdownMenuItem>
              )}

              <ChangePasswordDialog>
                <DropdownMenuItem
                  className="flex justify-between items-center cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <span>Change Password</span>
                  <LockKeyholeOpen className="h-4 w-4 ml-2" />
                </DropdownMenuItem>
              </ChangePasswordDialog>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 flex justify-between items-center cursor-pointer" onClick={handleLogout}>
                <span>Log out</span>
                <LogOut className="h-4 w-4 ml-2" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="relative h-8 px-0 md:hidden" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-2 mt-4">
                {/* Single items in mobile */}
                {accessibleSingleItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isItemActive(item) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                ))}

                {/* Grouped items in mobile */}
                {accessibleGroups.map((group) => (
                  <div key={group.name} className="space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.name}
                    </div>
                    {group.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ml-2",
                          isItemActive(item) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}