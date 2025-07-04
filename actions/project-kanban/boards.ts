'use server'

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export type CreateBoardInput = {
  projectId: string
  name: string
}

export async function createBoard(input: CreateBoardInput) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get the highest order
    const lastBoard = await prisma.board.findFirst({
      where: { projectId: input.projectId },
      orderBy: { order: "desc" },
      select: { order: true }
    })

    const board = await prisma.board.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        order: (lastBoard?.order ?? -1) + 1,
        columns: {
          createMany: {
            data: [
              { name: "Pending", order: 0 },
              { name: "In Progress", order: 1 },
              { name: "For Approval", order: 2 },
              { name: "Done", order: 3 }
            ]
          }
        }
      },
      include: {
        columns: {
          orderBy: {
            order: "asc"
          }
        }
      }
    })

    revalidatePath(`/dashboard/projects/${input.projectId}`)
    return board
  } catch (error) {
    throw new Error("Failed to create board")
  }
}

export type UpdateBoardInput = {
  name: string
  projectId: string
}

export async function updateBoard(boardId: string, input: UpdateBoardInput) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const board = await prisma.board.update({
      where: {
        id: boardId,
        projectId: input.projectId
      },
      data: {
        name: input.name
      }
    })

    revalidatePath(`/dashboard/projects/${input.projectId}`)
    return board
  } catch (error) {
    throw new Error("Failed to update board")
  }
}

export async function deleteBoard(boardId: string, projectId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    await prisma.board.delete({
      where: {
        id: boardId,
        projectId: projectId
      }
    })

    revalidatePath(`/dashboard/projects/${projectId}`)
  } catch (error) {
    throw new Error("Failed to delete board")
  }
}

export type CreateColumnInput = {
  boardId: string
  name: string
  projectId: string
}

export async function createColumn(input: CreateColumnInput) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get the highest order
    const lastColumn = await prisma.column.findFirst({
      where: { boardId: input.boardId },
      orderBy: { order: "desc" },
      select: { order: true }
    })

    const column = await prisma.column.create({
      data: {
        boardId: input.boardId,
        name: input.name,
        order: (lastColumn?.order ?? -1) + 1
      }
    })

    revalidatePath(`/dashboard/projects/${input.projectId}`)
    return column
  } catch (error) {
    throw new Error("Failed to create column")
  }
}

export type UpdateColumnInput = {
  name: string
  projectId: string
}

export async function updateColumn(columnId: string, input: UpdateColumnInput) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const column = await prisma.column.update({
      where: {
        id: columnId
      },
      data: {
        name: input.name
      }
    })

    revalidatePath(`/dashboard/projects/${input.projectId}`)
    return column
  } catch (error) {
    throw new Error("Failed to update column")
  }
}

export async function deleteColumn(columnId: string, projectId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    await prisma.column.delete({
      where: {
        id: columnId
      }
    })

    revalidatePath(`/dashboard/projects/${projectId}`)
  } catch (error) {
    throw new Error("Failed to delete column")
  }
}

export type UpdateColumnOrderInput = {
  columns: {
    id: string
    order: number
  }[]
  projectId: string
}

export async function updateColumnOrder(input: UpdateColumnOrderInput) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    // Update all columns in a transaction
    await prisma.$transaction(
      input.columns.map((column) =>
        prisma.column.update({
          where: { id: column.id },
          data: { order: column.order }
        })
      )
    )

    revalidatePath(`/dashboard/projects/${input.projectId}`)
  } catch (error) {
    throw new Error("Failed to update column order")
  }
}