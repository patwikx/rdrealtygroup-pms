'use client';

import { Tenant } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantListItemProps {
  tenant?: Tenant;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  checked?: boolean;
  collapsed?: boolean;
  isLoading?: boolean;
}

export function TenantListItem({
  tenant,
  isSelected,
  onSelect,
  checked,
  collapsed = false,
  isLoading = false,
}: TenantListItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (isLoading || !tenant) return;
    router.replace(`/dashboard/tenants?selected=${tenant.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 px-3 py-2.5">
        {!collapsed && <Skeleton className="h-4 w-4 rounded-sm" />}
        <div className={cn(
          "flex items-center space-x-3 min-w-0",
          collapsed ? "justify-center" : "flex-1"
        )}>
          <Skeleton className="h-8 w-8 rounded-full" />
          {!collapsed && (
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-3 w-1/3" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  const content = (
    <div
      className={cn(
        "flex items-center space-x-3 px-3 py-2.5 cursor-pointer transition-colors duration-200",
        "hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
      onClick={handleClick}
    >
      {!collapsed && (
        <Checkbox
          checked={checked}
          onCheckedChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className={cn(
        "flex items-center space-x-3 min-w-0",
        collapsed ? "justify-center" : "flex-1"
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
          <Users className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium leading-none truncate pr-2">
                {tenant.company}
              </p>
              <Badge
                variant={tenant.status === "ACTIVE" ? "default" : "secondary"}
                className="capitalize text-xs"
              >
                {tenant.status.toLowerCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate pt-1">
              {tenant.bpCode}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[300px]">
          <div className="space-y-1">
            <p className="font-semibold">{tenant.company}</p>
            <p className="text-sm text-muted-foreground">
              {tenant.bpCode} • <span className="capitalize">{tenant.status.toLowerCase()}</span>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}