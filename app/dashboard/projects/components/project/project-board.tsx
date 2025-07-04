"use client"

import { useCallback, useState } from "react"
import { DragDropContext } from "@hello-pangea/dnd"

import { updateTaskOrder } from "@/actions/project-kanban/tasks"
import { ProjectColumn } from "./project-column"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface Task {
    id: string
    order: number
    columnId: string
    [key: string]: any // For other task properties
}

interface Column {
    id: string
    name: string
    tasks: Task[]
    [key: string]: any // For other column properties
}

interface ProjectBoardProps {
    project: {
        id: string
        boards: {
            columns: Column[]
        }[]
        members: any[]; // Assuming members array contains user roles
    }
}

export function ProjectBoard({ project }: ProjectBoardProps) {
    const [columns, setColumns] = useState<Column[]>(project.boards[0].columns)
    const { data: session } = useSession()

    const getCurrentUserRole = useCallback(() => {
        if (!session?.user?.id) return null;
        const member = project.members.find((m: any) => m.userId === session.user.id);
        return member?.role;
    }, [session?.user?.id, project.members]);

    const onDragEnd = useCallback(async (result: any) => {
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const userRole = getCurrentUserRole();
        const sourceColumn = columns.find((col) => col.id === source.droppableId);
        const destColumn = columns.find((col) => col.id === destination.droppableId);

        if (!sourceColumn || !destColumn) return;

        let isMoveAllowed = false; // Default to not allowed

        if (userRole === "OWNER" || userRole === "ADMIN" || userRole === "MANAGER") {
            isMoveAllowed = true;
        } else if (userRole === "PURCHASER") {
            const allowedSourceColumns = ["PR", "Canvass", "CQS for Signature", "For PO", "For Budget", "PO Completed", "Delivered"];
            const allowedDestinationColumns = ["PR", "Canvass", "CQS for Signature", "For PO", "For Budget", "PO Completed", "Delivered"];
            if (allowedSourceColumns.includes(sourceColumn.name) && allowedDestinationColumns.includes(destColumn.name)) {
                isMoveAllowed = true;
            }
        } else if (userRole === "TREASURY") {
            const allowedSourceColumns = ["For Budget", "For Release", "PO for Signature", "Accounting"];
            const allowedDestinationColumns = ["For Budget", "For Release", "PO for Signature", "Accounting"];
            if (allowedSourceColumns.includes(sourceColumn.name) && allowedDestinationColumns.includes(destColumn.name)) {
                isMoveAllowed = true;
            }
        } else if (userRole === "ACCTG") {
            const allowedSourceColumns = ["Accounting"];
            const allowedDestinationColumns = ["PO Completed"];
            if (allowedSourceColumns.includes(sourceColumn.name) && allowedDestinationColumns.includes(destColumn.name)) {
                isMoveAllowed = true;
            }
        }

        if (!isMoveAllowed) {
            toast.error(`You are not authorized to move tasks between "${sourceColumn.name}" and "${destColumn.name}" with your role (${userRole}).`);
            return; // Prevent further processing
        }

        const newColumns = [...columns];
        const sourceColIndex = newColumns.findIndex(col => col.id === source.droppableId);
        const destColIndex = newColumns.findIndex(col => col.id === destination.droppableId);

        if (sourceColIndex === -1 || destColIndex === -1) return;

        const sourceTasks = Array.from(newColumns[sourceColIndex].tasks);
        const [removed] = sourceTasks.splice(source.index, 1);

        const destTasks = Array.from(newColumns[destColIndex].tasks);
        destTasks.splice(destination.index, 0, removed);

        newColumns[sourceColIndex] = { ...newColumns[sourceColIndex], tasks: sourceTasks.map((task, index) => ({ ...task, order: index })) };
        newColumns[destColIndex] = { ...newColumns[destColIndex], tasks: destTasks.map((task, index) => ({ ...task, order: index })) };

        setColumns(newColumns);

        try {
            await updateTaskOrder({
                tasks: [
                    ...sourceTasks.map((task, index) => ({
                        id: task.id,
                        columnId: source.droppableId,
                        order: index
                    })),
                    ...destTasks.map((task, index) => ({
                        id: task.id,
                        columnId: destination.droppableId,
                        order: index
                    }))
                ],
                projectId: project.id
            });
        } catch (error) {
            toast.error("Failed to update task order. Please try again.");
        }
    }, [columns, project.id, getCurrentUserRole])

    const handleTaskCreated = useCallback((newTask: Task) => {
        setColumns(prevColumns =>
            prevColumns.map(column => {
                if (column.id === newTask.columnId) {
                    return {
                        ...column,
                        tasks: [...column.tasks, newTask]
                    }
                }
                return column
            })
        )
    }, [])

    const handleTaskEdited = useCallback((newTask: Task) => {
        setColumns(prevColumns =>
            prevColumns.map(column => {
                if (column.id === newTask.columnId) {
                    return {
                        ...column,
                        tasks: [...column.tasks, newTask]
                    }
                }
                return column
            })
        )
    }, [])

    return (
        <div className="flex-1 overflow-auto bg-muted/20 p-4">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex h-full gap-4"> {/* Removed 'container' class */}
                    {columns.map((column, index) => ( // Get the index here
                        <ProjectColumn
                            key={column.id}
                            column={column}
                            projectId={project.id}
                            onTaskCreated={handleTaskCreated}
                            isFirstColumn={index === 0} // Pass isFirstColumn based on the index
                        />
                    ))}
                </div>
            </DragDropContext>
        </div>
    )
}