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
  navigationMenuTriggerStyle,
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

const allNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.ACCTG] },
  { name: "Properties", href: "/dashboard/properties", icon: Building2, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.ACCTG] },
  { name: "Space", href: "/dashboard/spaces", icon: LucideLandmark, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.ACCTG] },
  { name: "Tenants", href: "/dashboard/tenants", icon: Users, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.ACCTG] },
  { name: "Projects", href: "/dashboard/projects", icon: FileText, roles: [UserRole.ADMIN] },
  { name: "Credit & Collection", href: "/dashboard/pdc-monitoring", icon: CreditCardIcon, roles: [UserRole.ADMIN, UserRole.ACCTG] },
  { name: "Audit Logs", href: "/dashboard/audit-logs", icon: Notebook, roles: [UserRole.ADMIN] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: [UserRole.ADMIN] },
];

interface HeaderProps {
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
    image?: string | null; // Acknowledge that image can be null from the DB
    role?: UserRole;
  };
}

export function Header({ user: propUser }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const currentUser = useCurrentUser();
  const user = currentUser || propUser;

  const accessibleNav = React.useMemo(() => {
    if (!user?.role) return [];
    return allNavigation.filter(item => item.roles.includes(user.role!));
  }, [user?.role]);

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
        <div className="flex items-center gap-8">
          <TeamSwitcher />

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {accessibleNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <NavigationMenuItem key={item.name}>
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        active={isActive}
                        className={cn(navigationMenuTriggerStyle(), "gap-2")}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                );
              })}
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
                  {/* FIX: Convert null to undefined for the src prop */}
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
                    {/* FIX: Convert null to undefined for the src prop */}
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
                {accessibleNav.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.name}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}