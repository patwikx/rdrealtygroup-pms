"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Shield, UserX } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getUsers } from "@/actions/project-kanban/get-users-kanban"
import { addMember, removeMember, updateMemberRole } from "@/actions/project-kanban/members"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  image?: string | null
}

interface MembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: any // TODO: Add proper type
  currentUserId: string
}

export function MembersDialog({
  open,
  onOpenChange,
  project,
  currentUserId,
}: MembersDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState("MEMBER")
  const { toast } = useToast()

  // Fetch users when the dialog opens
  useEffect(() => {
    if (open) {
      getUsers()
        .then(setUsers)
        .catch((error) => {
          console.error('Failed to fetch users:', error)
          toast({
            title: "Error",
            description: "Failed to fetch users. Please try again.",
            variant: "destructive",
          })
        })
    }
  }, [open, toast]) // Add dependencies here

  async function handleAddMember() {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user.",
        variant: "destructive",
      })
      return
    }

    try {
      await addMember({
        projectId: project.id,
        userId: selectedUserId,
        role: selectedRole as any,
      })

      toast({
        title: "Member added",
        description: "The member has been added to the project successfully.",
      })

      setSelectedUserId("")
      setSelectedRole("MEMBER")
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleUpdateRole(userId: string, role: string) {
    try {
      await updateMemberRole({
        projectId: project.id,
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

  async function handleRemoveMember(userId: string) {
    try {
      await removeMember(project.id, userId)

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Members</DialogTitle>
          <DialogDescription>
            Manage project members and their roles.
          </DialogDescription>
        </DialogHeader>

        {project.ownerId === currentUserId && (
          <div className="space-y-4 border-b pb-4">
            <Label>Add New Member</Label>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {user.image ? (
                              <AvatarImage src={user.image} alt={`${user.firstName} ${user.lastName}`} />
                            ) : (
                              <AvatarFallback>
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span>
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-muted-foreground">
                            ({user.email})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PURCHASER">Purchaser</SelectItem>
                <SelectItem value="ACCTG">Accounting</SelectItem>
                <SelectItem value="TREASURY">Treasury</SelectItem>
                <SelectItem value="STOCKROOM">Stockroom</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-4">
            <Label>Current Members</Label>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {project.members.map((member: any) => (
                  <div key={member.user.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
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
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{member.role}</Badge>
                      {project.ownerId === currentUserId && member.user.id !== currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.user.id, "ADMIN")}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.user.id, "MEMBER")}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.user.id, "VIEWER")}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveMember(member.user.id)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}