"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {  Building2,  Users,  FileText, Settings, Menu, HelpCircle,LucideLandmark, Notebook, LogOut, LockKeyhole, LockKeyholeOpen, CreditCardIcon } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationDrawer } from "./notifcation-drawer"
import { logoutWithAudit } from "@/actions/logout"
import TeamSwitcher from "./team-switcher"
import { DashboardIcon } from "@radix-ui/react-icons"
import { GlobalSearch } from "./global-search"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
  },
  {
    name: "Properties",
    href: "/dashboard/properties",
    icon: Building2,
  },
  {
    name: "Space",
    href: "/dashboard/spaces",
    icon: LucideLandmark,
  },
  {
    name: "Tenants",
    href: "/dashboard/tenants",
    icon: Users,
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: FileText,
  },
  {
    name: "Credit & Collection",
    href: "/dashboard/pdc-monitoring",
    icon: CreditCardIcon,  
  },
  {
    name: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: Notebook,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

interface HeaderProps {
  user?: {
    name: string
    email: string
    image?: string
  }
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      // Call our API to log the logout before actually signing out
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      // Then perform the logout with audit
      await logoutWithAudit();
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback to direct logout if API call fails
      await logoutWithAudit();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 md:mx-12 lg:mx-12 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <TeamSwitcher />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Global Search */}
          <GlobalSearch />

          {/* Help */}
          <Button variant="ghost" size="sm" className="relative h-8 w-8 px-0">
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <NotificationDrawer />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image} alt={user?.name || "User avatar"} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
<DropdownMenuContent align="end" className="w-56">
  <DropdownMenuLabel className="font-normal">
    {/* This is the new container for text and the avatar */}
    <div className="flex items-center justify-between space-x-2">
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium leading-none">{user?.name}</p>
        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
      </div>
      {/* The Avatar component for the profile picture */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={user?.image} alt="User profile picture" />
        <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
  </DropdownMenuLabel>
  <DropdownMenuSeparator />
  <DropdownMenuItem className="flex justify-between items-center">
    <span>Profile</span>
    <Users className="h-4 w-4 ml-2" />
  </DropdownMenuItem>
  <DropdownMenuItem className="flex justify-between items-center">
    <span>Settings</span>
    <Settings className="h-4 w-4 ml-2" />
  </DropdownMenuItem>
  <DropdownMenuItem className="flex justify-between items-center">
    <span>Change Password</span>
    <LockKeyholeOpen className="h-4 w-4 ml-2" />
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem className="text-red-600 flex justify-between items-center" onClick={handleLogout}>
    <span>Log out</span>
    <LogOut className="h-4 w-4 ml-2" />
  </DropdownMenuItem>
</DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
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
              <nav className="flex flex-col space-y-4 mt-4">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center py-2 text-sm font-medium transition-colors hover:text-primary",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}