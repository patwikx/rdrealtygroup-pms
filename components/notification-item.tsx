"use client"

import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

import type { Notification } from "@prisma/client"
import { getNotificationIcon } from "@/lib/utils/ui"
import { useRouter } from "next/navigation"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onClose: () => void
}

export function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const router = useRouter()
  const Icon = getNotificationIcon(notification.type)
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  })

  const handleViewDetails = () => {
    onClose()
    router.push(notification.actionUrl!)
  }

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-lg border p-4 transition-colors",
        !notification.isRead && "bg-secondary/50",
      )}
    >
      <div className={cn("rounded-full p-2", !notification.isRead && "bg-primary/10 text-primary")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className={cn("text-sm", !notification.isRead && "font-medium")}>{notification.message}</p>
        <div className="flex items-center gap-4">
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
          {notification.actionUrl && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleViewDetails}>
              View details
            </Button>
          )}
        </div>
      </div>
      {!notification.isRead && (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onMarkAsRead(notification.id)}>
          <Check className="h-4 w-4" />
          <span className="sr-only">Mark as read</span>
        </Button>
      )}
    </div>
  )
}

