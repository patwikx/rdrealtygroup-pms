"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { addMember } from "@/actions/project-kanban/members"
import { Check, ChevronsUpDown, UserPlus, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  image?: string | null
}

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  users: User[] // Add this prop for the list of users
}

export function AddMemberDialog({
  open,
  onOpenChange,
  projectId,
  users,
}: AddMemberDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [openCombobox, setOpenCombobox] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function onSubmit(formData: FormData) {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user to add.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await addMember({
        projectId,
        userId: selectedUser,
        role: formData.get("role") as any,
      })

      toast({
        title: "Member added",
        description: "The member has been added to the project successfully.",
      })

      onOpenChange(false)
      setSelectedUser("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Project Member
          </DialogTitle>
          <DialogDescription>
            Add a new member to collaborate on this project.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Select User</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const user = users.find(u => u.id === selectedUser)
                        if (!user) return null
                        return (
                          <>
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
                            <span>{user.firstName} {user.lastName}</span>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    "Select user..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={(value) => {
                          setSelectedUser(value === selectedUser ? "" : value)
                          setOpenCombobox(false)
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="h-8 w-8">
                            {user.image ? (
                              <AvatarImage src={user.image} alt={`${user.firstName} ${user.lastName}`} />
                            ) : (
                              <AvatarFallback>
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex flex-col">
                            <span>{user.firstName} {user.lastName}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedUser === user.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role
            </Label>
            <Select name="role" defaultValue="PURCHASER">
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setSelectedUser("")
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedUser}>
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}