"use client"

import { Droppable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import {
    Plus,
    AlertCircle
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProjectTask } from "./project-task-card"
import { CreateTaskDialog } from "./create-task-dialog"
import { useCurrentRole } from "@/hooks/use-current-role"
import { useCurrentUser } from "@/hooks/use-current-user"

interface ProjectColumnProps {
    column: {
        id: string
        name: string
        tasks: any[]
    }
    projectId: string
    onTaskCreated: (task: any) => void
    isFirstColumn: boolean // New prop to identify the first column
}

export function ProjectColumn({ column, projectId, onTaskCreated, isFirstColumn }: ProjectColumnProps) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Calculate column statistics
    const totalTasks = column.tasks.length
    const completedTasks = column.tasks.filter(task => task.status === "DONE").length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return (
        <div className="flex flex-col w-80 shrink-0">
            <div className="bg-card rounded-lg border shadow-sm">
                <div className="flex items-center justify-between p-3 border-b">
                    <TooltipProvider>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{column.name}</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs hover:bg-secondary/80">
                                        {totalTasks}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{completedTasks} of {totalTasks} tasks completed</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>

                    <div className="flex items-center gap-1">
                        {isFirstColumn && ( // Conditionally render the "Add Task" button
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-secondary/80"
                                onClick={() => setCreateDialogOpen(true)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-2 min-h-[calc(100vh-16rem)] rounded-b-lg transition-colors ${
                                snapshot.isDraggingOver ? "bg-accent/50" : ""
                            }`}
                        >
                            {column.tasks.length === 0 && isFirstColumn && ( // Conditionally render the empty state with "Add Task"
                                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg border-muted">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="mt-2 text-sm text-muted-foreground">No tasks yet</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => setCreateDialogOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Task
                                    </Button>
                                </div>
                            )}
                            {column.tasks.length === 0 && !isFirstColumn && ( // Empty state without "Add Task" for other columns
                                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg border-muted">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="mt-2 text-sm text-muted-foreground">No tasks yet</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                {column.tasks.map((task: any, index: number) => (
                                    <ProjectTask
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        projectId={projectId}
                                    />
                                ))}
                            </div>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
            {isFirstColumn && ( // Only render the dialog for the first column
                <CreateTaskDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    projectId={projectId}
                    columnId={column.id}
                    onTaskCreated={onTaskCreated}
                />
            )}
        </div>
    )
}