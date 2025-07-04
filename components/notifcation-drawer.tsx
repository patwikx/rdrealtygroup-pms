"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationItem } from "./notification-item"
import { useNotifications } from "@/hooks/use-notifications"

export function NotificationDrawer() {
  const [open, setOpen] = useState(false)
  const [displayCount, setDisplayCount] = useState(10)
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications()

  const visibleNotifications = notifications.slice(0, displayCount)
  const hasMore = displayCount < notifications.length

  const handleShowMore = () => {
    setDisplayCount((prev) => prev + 10)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 px-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center justify-between border-b pb-2">
              <p className="text-sm text-muted-foreground">
                You have {unreadCount} unread notification{unreadCount !== 1 && "s"}
              </p>
              <Button variant="ghost" size="sm" onClick={() => notifications.forEach((n) => markAsRead(n.id))}>
                Mark all as read
              </Button>
            </div>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="space-y-4 py-4">
            {notifications.length > 0 ? (
              <>
                {visibleNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onClose={handleClose}
                  />
                ))}
                {hasMore && (
                  <Button variant="ghost" className="w-full mt-4" onClick={handleShowMore}>
                    View More ({notifications.length - displayCount} remaining)
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                <p className="text-sm text-muted-foreground">You have no new notifications.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

