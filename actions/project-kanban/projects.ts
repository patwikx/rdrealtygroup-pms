"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createNotification } from "@/lib/utils/notifications"
import { createAuditLog } from "@/lib/audit"
import { EntityType, NotificationType } from "@prisma/client"

export type CreateProjectInput = {
  name: string
  description?: string
  startDate: Date
  endDate?: Date | null
}

export async function createProject(input: CreateProjectInput) {
  console.log("Creating project with input:", input)
  
  const session = await auth()
  if (!session?.user) {
    console.log("No session found")
    throw new Error("Unauthorized")
  }

  console.log("Session user:", session.user)

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    const project = await prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER"
          }
        },
        boards: {
          create: {
            name: "Main Board",
            order: 0,
            columns: {
              createMany: {
                data: [
                  { name: "PR", order: 0 },
                  { name: "Canvass", order: 1 },
                  { name: "CQS for Signature", order: 2 },
                  { name: "For PO", order: 3 },
                  { name: "For Budget", order: 4 },
                  { name: "For Release", order: 5} ,
                  { name: "PO for Signature", order: 6 },
                  { name: "Accounting", order: 7 },
                  { name: "PO Completed", order: 8 },
                  { name: "Delivered", order: 9 }
                ]
              }
            }
          }
        }
      }
    })

    // Create audit log
    await createAuditLog({
      entityId: project.id,
      entityType: EntityType.PROJECT,
      action: "CREATE",
      changes: input,
    })

    // Create notification for all users
    await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title: "New Project Created",
          message: `Project "${project.name}" has been created by ${session.user.firstName} ${session.user.lastName}`,
          type: NotificationType.SYSTEM,
          entityId: project.id,
          entityType: EntityType.PROJECT,
          actionUrl: `/dashboard/projects/${project.id}`,
        })
      )
    )

    console.log("Created project:", project)
    revalidatePath("/dashboard/projects")
    return project
  } catch (error) {
    console.error("Create project error:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }
    throw new Error("Failed to create project")
  }
}


export async function getProjects() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/login")
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return projects
  } catch (error) {
    throw new Error("Failed to fetch projects")
  }
}

export async function getProject(projectId: string) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/login")
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true
              }
            }
          }
        },
        boards: {
          include: {
            columns: {
              include: {
                tasks: {
                  include: {
                    assignedTo: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true
                      }
                    },
                    labels: true,
                    _count: {
                      select: {
                        comments: true,
                        attachments: true
                      }
                    }
                  },
                  orderBy: {
                    order: "asc"
                  }
                }
              },
              orderBy: {
                order: "asc"
              }
            }
          },
          orderBy: {
            order: "asc"
          }
        }
      }
    })

    if (!project) {
      throw new Error("Project not found")
    }

    return project
  } catch (error) {
    throw new Error("Failed to fetch project")
  }
}

export type UpdateProjectInput = {
  name?: string
  description?: string
  status?: "ACTIVE" | "COMPLETED" | "ARCHIVED" | "ON_HOLD"
  startDate?: Date
  endDate?: Date | null
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const project = await prisma.project.update({
      where: {
        id: projectId,
        ownerId: session.user.id
      },
      data: input,
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    // Create audit log
    await createAuditLog({
      entityId: project.id,
      entityType: EntityType.PROJECT,
      action: "UPDATE",
      changes: input,
    })

    // Notify all project members about the update
    await Promise.all(
      project.members.map(member =>
        createNotification({
          userId: member.user.id,
          title: "Project Updated",
          message: `Project "${project.name}" has been updated`,
          type: NotificationType.SYSTEM,
          entityId: project.id,
          entityType: EntityType.PROJECT,
          actionUrl: `/dashboard/projects/${project.id}`,
        })
      )
    )

    revalidatePath(`/dashboard/projects/${projectId}`)
    return project
  } catch (error) {
    throw new Error("Failed to update project")
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const project = await prisma.project.delete({
      where: {
        id: projectId,
        ownerId: session.user.id
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    // Create audit log
    await createAuditLog({
      entityId: project.id,
      entityType: EntityType.PROJECT,
      action: "DELETE",
    })

    // Notify all project members about the deletion
    await Promise.all(
      project.members.map(member =>
        createNotification({
          userId: member.user.id,
          title: "Project Deleted",
          message: `Project "${project.name}" has been deleted`,
          type: NotificationType.SYSTEM,
          priority: "HIGH",
          entityId: project.id,
          entityType: EntityType.PROJECT,
        })
      )
    )

    revalidatePath("/projects")
    redirect("/dashboard/projects")
  } catch (error) {
    throw new Error("Failed to delete project")
  }
}