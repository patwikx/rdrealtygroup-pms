"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Settings, 
  Trash, 
  Users, 
  MoreHorizontal, 
  CheckCircle2, 
  Archive, 
  PauseCircle, 
  CalendarDays, 
  LayoutGrid,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { deleteProject, updateProject } from "@/actions/project-kanban/projects"
import { MembersDialog } from "./members-dialog"
import { formatDate } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED" | "ON_HOLD"

interface StatusConfig {
  color: string
  icon: typeof Clock | typeof CheckCircle2 | typeof Archive | typeof PauseCircle
}

interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  startDate: Date
  endDate: Date | null
  boards: Array<{
    columns: Array<{
      name: string
      tasks: any[]
    }>
  }>
  members: Array<{
    user: {
      id: string
      firstName: string
      lastName: string
      image: string | null
    }
  }>
}

interface ProjectHeaderProps {
  project: Project
}

const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  ACTIVE: {
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: Clock
  },
  COMPLETED: {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: CheckCircle2
  },
  ARCHIVED: {
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: Archive
  },
  ON_HOLD: {
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: PauseCircle
  }
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date(project.startDate))
  const [endDate, setEndDate] = useState<Date | undefined>(project.endDate ? new Date(project.endDate) : undefined)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // Calculate project statistics
  const totalTasks = project.boards[0].columns.reduce((acc, col) => acc + col.tasks.length, 0)
  const completedTasks = project.boards[0].columns.find(col => col.name === "Done")?.tasks.length || 0
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const StatusIcon = STATUS_CONFIG[project.status].icon

  async function onSubmit(formData: FormData) {
    if (startDate && endDate && startDate > endDate) {
      toast({
        title: "Invalid dates",
        description: "End date cannot be before start date",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await updateProject(project.id, {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        status: formData.get("status") as ProjectStatus,
        startDate,
        endDate: endDate || null,
      })

      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      })

      setEditDialogOpen(false)
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

  async function onDelete() {
    try {
      await deleteProject(project.id)
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="border-b bg-card">
      <div className="flex justify-start py-2">
        <div className="flex items-center justify-between mb-2 ml-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
              <h1 className="text-2xl font-semibold tracking-tight ml-4">{project.name}</h1>
              <Separator orientation="vertical" className="h-8" />
            <Badge 
              variant="outline" 
              className={`${STATUS_CONFIG[project.status].color} flex items-center gap-1.5 px-2 py-1 h-7`}
            >
              <StatusIcon className="w-4 h-4" />
              {project.status.replace('_', ' ')}
            </Badge>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Tasks</span>
              <span className="text-2xl font-bold">{totalTasks}</span>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Completed</span>
              <span className="text-2xl font-bold">{completedTasks}</span>
            </div>
            </div>

          </div>

        </div>

        <div className="grid grid-cols-4 gap-4 ml-4">{/** 
          <div className="flex items-center gap-4 rounded-lg border bg-card p-3">



          </div>

          <div className="flex flex-col justify-center rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
*/}
           <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Timeline</span>
              <span className="text-sm font-medium">
                {formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="flex -space-x-2">
              {project.members.slice(0, 4).map((member) => (
                <Avatar key={member.user.id} className="border-2 border-background w-8 h-8">
                  {member.user.image ? (
                    <AvatarImage src={member.user.image} alt={`${member.user.firstName} ${member.user.lastName}`} />
                  ) : (
                    <AvatarFallback>
                      {member.user.firstName[0]}
                      {member.user.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
              {project.members.length > 4 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                  <span className="text-xs font-medium">+{project.members.length - 4}</span>
                </div>
              )}
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Team</span>
              <span className="text-sm font-medium">{project.members.length} members</span>
            </div>
            <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMembersDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Manage Team
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Project Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details and settings.
            </DialogDescription>
          </DialogHeader>
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={project.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={project.description || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={project.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date)
                          // If end date exists and is before new start date, clear it
                          if (endDate && date > endDate) {
                            setEndDate(undefined)
                          }
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "No end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) =>
                        date < startDate || // Can't select dates before start date
                        date < new Date("1900-01-01") // Reasonable minimum date
                      }
                    />
                  </PopoverContent>
                </Popover>
                {endDate && endDate < startDate && (
                  <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>End date must be after start date</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || (endDate ? endDate < startDate : false)}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        project={project}
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  )
}