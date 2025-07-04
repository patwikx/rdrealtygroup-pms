'use client';

import { Property } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Building2, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PropertyListItemProps {
  property: Property;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  checked: boolean;
  collapsed?: boolean;
}

export function PropertyListItem({
  property,
  isSelected,
  onSelect,
  checked,
  collapsed = false,
}: PropertyListItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.replace(`/dashboard/properties?selected=${property.id}`);
  };

  const getPropertyTypeColor = (type: string) => {
    switch (type) {
      case "RESIDENTIAL":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "COMMERCIAL":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400";
      case "INDUSTRIAL":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const content = (
    <div
      className={cn(
        "group relative flex items-center rounded-lg border border-transparent transition-all duration-300 ease-in-out",
        "hover:border-border hover:bg-gradient-to-r hover:from-background hover:to-muted/30",
        "hover:shadow-sm hover:shadow-black/5",
        "cursor-pointer select-none",
        isSelected && [
          "border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
          "shadow-sm shadow-primary/10",
          "dark:border-primary/30 dark:from-primary/10 dark:to-primary/5"
        ],
        collapsed ? "p-3" : "p-4"
      )}
      onClick={handleClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300" />
      )}

      {!collapsed && (
        <div className="flex items-center mr-4">
          <Checkbox
            checked={checked}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "transition-all duration-200 ease-in-out",
              "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
              "hover:border-primary/50 hover:shadow-sm hover:shadow-primary/20"
            )}
          />
        </div>
      )}

      <div className={cn(
        "flex items-center min-w-0",
        collapsed ? "justify-center" : "flex-1 space-x-4"
      )}>
        {/* Icon container with enhanced styling */}
      

        {!collapsed && (
          <div className="flex-1 min-w-0 space-y-1">
            {/* Property name and type */}
            <div className="flex items-center gap-3">
              <h3 className={cn(
                "font-semibold text-foreground truncate transition-colors duration-200",
                "group-hover:text-foreground/90",
                isSelected && "text-primary"
              )}>
                {property.propertyName}
              </h3>
              
              <Badge 
                variant="outline"
                className={cn(
                  "flex-shrink-0 font-medium text-xs px-2.5 py-0.5 transition-all duration-200",
                  "border-0 shadow-sm",
                  getPropertyTypeColor(property.propertyType)
                )}
              >
                {property.propertyType}
              </Badge>
            </div>

            {/* Property code with icon */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 opacity-60" />
              <span className="truncate font-mono tracking-wide">
                {property.propertyCode}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hover accent line */}
      <div className={cn(
        "absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/50 to-primary",
        "transition-all duration-300 ease-out group-hover:w-3/4",
        isSelected && "w-3/4"
      )} />
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[320px] p-4 border-0 bg-card shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">{property.propertyName}</h4>
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5 border-0",
                  getPropertyTypeColor(property.propertyType)
                )}
              >
                {property.propertyType}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-mono">{property.propertyCode}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}