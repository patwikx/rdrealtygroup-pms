"use client";

import { ExitIcon } from "@radix-ui/react-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogoutButton } from "@/components/auth/logout-button";
import { Bell, CircleUser, User2 } from "lucide-react";
import { ModeToggle } from "../theme-toggle";
import { Button } from "../ui/button";


export const UserButton = () => {
  const user = useCurrentUser();

  return (
    <DropdownMenu>
      <div className="flex ml-auto mr-4">
        <DropdownMenuTrigger className="ml-2">
          <Avatar>
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback>
              <CircleUser className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <Button variant="outline" size="icon" className="h-9 w-9 ml-4">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <ModeToggle/>
      </div>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem>
          <User2 className="h-4 w-4 mr-2" />
          Manage Profile
        </DropdownMenuItem>
        <LogoutButton>
          <DropdownMenuItem>
            <ExitIcon className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};