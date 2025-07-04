"use client"

import { Draggable } from "@hello-pangea/dnd"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  User,
  Edit,
  Trash,
  Loader,
  Save,
  AlignLeft,
  Type,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
  Activity,
  Circle,
  Timer,
  Eye,
  CheckCircle,
  CalendarIcon,
  View,
  ViewIcon,
  Expand,
  Loader2,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteTask, updateTask } from "@/actions/project-kanban/tasks"
import { DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { on } from "events"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface ProjectTaskProps {
  task: {
    id: string
    title: string
    description?: string
    dueDate?: string
    priority: keyof typeof priorityConfig
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
    _count: {
      comments: number
      attachments: number
    }
    labels: { id: string; color: string }[]
    assignedTo?: {
      image?: string
      firstName: string
      lastName: string
    }
  }
  index: number
  projectId: string
  onTaskDeleted?: (taskId: string) => void
  onTaskEdited?: (task: any) => void
}

const priorityConfig = {
  LOW: {
    color: "bg-blue-500/10 text-blue-500",
    icon: ArrowDown,
    label: "Low Priority",
  },
  MEDIUM: {
    color: "bg-yellow-500/10 text-yellow-500",
    icon: ArrowRight,
    label: "Medium Priority",
  },
  HIGH: {
    color: "bg-orange-500/10 text-orange-500",
    icon: ArrowUp,
    label: "High Priority",
  },
  URGENT: {
    color: "bg-red-500/10 text-red-500",
    icon: AlertTriangle,
    label: "Urgent",
  },
}

const statusConfig = {
  TODO: {
    icon: Circle,
    color: "text-slate-500",
  },
  IN_PROGRESS: {
    icon: Timer,
    color: "text-blue-500",
  },
  REVIEW: {
    icon: Eye,
    color: "text-purple-500",
  },
  DONE: {
    icon: CheckCircle,
    color: "text-green-500",
  },
}

export function ProjectTask({ task, index, projectId, onTaskDeleted, onTaskEdited }: ProjectTaskProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false);
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)

  const PriorityIcon = priorityConfig[task.priority].icon
  const StatusIcon = statusConfig[task.status].icon

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      const updatedTask = await updateTask(task.id, projectId, {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        priority: formData.get("priority") as any,
        status: formData.get("status") as any,
        dueDate: date,
      })

      toast.success("Task updated successfully")
      
      // Update parent component state
      if (onTaskEdited) {
        onTaskEdited({
          ...task,
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          priority: formData.get("priority") as any,
          status: formData.get("status") as any,
          dueDate: date
        });
      }

      setIsEditing(false)
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    setLoading(true);
    try {
      // Add animation before actually removing the task
      setIsDeleted(true);
      
      // Wait for API call to complete
      await deleteTask(task.id, projectId);
      
      // Wait for animation to complete before updating parent state
      setTimeout(() => {
        // Update parent state to remove task from UI
        if (onTaskDeleted) {
          onTaskDeleted(task.id);
        }
        
        // Close edit dialog if open
        setIsEditing(false);
        
        toast.success("Task deleted successfully");
      }, 300); // Match animation duration
    } catch (error) {
      setIsDeleted(false); // Revert animation if there's an error
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="group relative bg-card p-3 hover:shadow-md transition-all duration-200"
          >
            <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold leading-none">{task.title}</h4>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Expand className="h-4 w-4" />
                </Button>
                </div>

     

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1 text-xs">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{task._count?.comments || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>{task._count?.attachments || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                  {task.assignedTo ? (
                  <Avatar className="h-6 w-6 ring-2 ring-background">
                    {task.assignedTo.image ? (
                      <AvatarImage
                        src={task.assignedTo.image}
                        alt={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                      />
                    ) : (
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {task.assignedTo.firstName[0]}
                        {task.assignedTo.lastName[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ) : (
                  <Avatar className="h-6 w-6 bg-muted">
                    <AvatarFallback>
                      <User className="h-3 w-3 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                  <Badge
                  variant="secondary"
                  className={cn("flex items-center gap-1", priorityConfig[task.priority].color)}
                >
                  <PriorityIcon className="h-3 w-3" />
                  <span>{task.priority}</span>
                </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                  {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{formatDate(new Date(task.dueDate))}</span>
                  </div>
                )}
                  </div>

                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                  <Button variant="ghost" size='icon'><Trash className="w-4 h-4 text-red-500" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex justify-center gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="mt-2"> {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  Continue
                    </>
                  )}
                </AlertDialogAction>
                  </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
              </div>
            </div>
          </Card>
        )}
      </Draggable>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="font-xl h-5 w-5 text-muted-foreground" />
              {task.title}
            </DialogTitle>
            <DialogDescription>Make changes to your task here. Click save when you&apos;re done.</DialogDescription>
          </DialogHeader>
          <form action={onSubmit} className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={task.title}
                  className="font-medium"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    Priority
                  </Label>
                  <Select name="priority" defaultValue={task.priority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {React.createElement(config.icon, {
                              className: `h-4 w-4 ${config.color.split(" ")[1]}`,
                            })}
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                <Label className="flex items-center gap-2">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Status
                </Label>
                <Select name="status" defaultValue={task.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {React.createElement(config.icon, {
                            className: `h-4 w-4 ${config.color}`,
                          })}
                          {key.replace('_', ' ')}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={task.description}
                  className="min-h-[100px] resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button type="button" variant="destructive" size="sm" className="gap-2" onClick={onDelete} disabled={loading}>
                <Trash className="h-4 w-4" />
                Delete Task
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}