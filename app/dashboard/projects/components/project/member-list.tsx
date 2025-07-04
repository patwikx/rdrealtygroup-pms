"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MoreHorizontal, Shield, UserX } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { removeMember, updateMemberRole } from "@/actions/project-kanban/members"

interface MemberListProps {
  members: any[] // TODO: Add proper type
  projectId: string
  currentUserId: string
  isOwner: boolean
}

export function MemberList({
  members,
  projectId,
  currentUserId,
  isOwner,
}: MemberListProps) {
  const { toast } = useToast()

  async function onUpdateRole(userId: string, role: string) {
    try {
      await updateMemberRole({
        projectId,
        userId,
        role: role as any,
      })

      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function onRemoveMember(userId: string) {
    try {
      await removeMember(projectId, userId)

      toast({
        title: "Member removed",
        description: "Member has been removed from the project.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.user.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                {member.user.image ? (
                  <AvatarImage
                    src={member.user.image}
                    alt={`${member.user.firstName} ${member.user.lastName}`}
                  />
                ) : (
                  <AvatarFallback>
                    {member.user.firstName[0]}
                    {member.user.lastName[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium">
                  {member.user.firstName} {member.user.lastName}
                </p>
                <Badge variant="secondary">{member.role}</Badge>
              </div>
            </div>
            {isOwner && member.user.id !== currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onUpdateRole(member.user.id, "ADMIN")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Make Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateRole(member.user.id, "Purchaser")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Make Purchaser
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateRole(member.user.id, "VIEWER")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Make Viewer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onRemoveMember(member.user.id)}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}