'use client';

import { Property } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Building2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PropertyListItemProps {
  property: Property;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  checked: boolean; // Retained for logic, but not visually used as a checkbox
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
    // Navigate to the property details page
    router.replace(`/dashboard/properties?selected=${property.id}`);
    // You can also trigger the selection logic here if desired
    // onSelect(!checked);
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
        "group relative flex items-center rounded-lg border border-border/50 bg-card transition-all duration-300 ease-in-out",
        "hover:border-primary/30 hover:bg-muted/50 hover:shadow-md hover:shadow-black/5",
        "cursor-pointer select-none",
        isSelected && [
          "border-primary/40 bg-primary/5",
          "shadow-lg shadow-primary/10",
        ],
        collapsed ? "p-2" : "p-3"
      )}
      onClick={handleClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300" />
      )}

      <div className={cn(
        "flex w-full items-center",
        collapsed ? "justify-center" : "space-x-4"
      )}>
        {/* Icon container */}
        <div className={cn(
          "relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border bg-background/70 shadow-sm transition-all duration-300",
          "group-hover:scale-105 group-hover:shadow-lg group-hover:border-primary/20",
          isSelected && "border-primary/30 scale-105 shadow-primary/10"
        )}>
           <Building2 className={cn(
              "h-6 w-6 text-muted-foreground transition-colors duration-300",
              "group-hover:text-primary",
               isSelected && "text-primary"
            )} />
           {/* Glow effect on hover/selection */}
           <div className={cn(
              "absolute inset-0 -z-10 rounded-md bg-gradient-to-tr from-primary/20 to-transparent opacity-0 blur-md transition-all duration-500",
              "group-hover:opacity-50 group-hover:-inset-1",
              isSelected && "opacity-50 -inset-1"
            )} />
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-foreground truncate">
                {property.propertyName}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "flex-shrink-0 font-medium text-xs px-2 py-0.5 border",
                  getPropertyTypeColor(property.propertyType)
                )}
              >
                {property.propertyType.charAt(0) + property.propertyType.slice(1).toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 opacity-70" />
              <span className="truncate font-mono text-xs tracking-wider">
                {property.propertyCode}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-[320px] p-3 border-border bg-card shadow-lg">
          <div className="flex items-center gap-4">
             <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background/50">
                 <Building2 className="h-5 w-5 text-primary" />
             </div>
             <div className="space-y-1">
                 <h4 className="font-semibold text-foreground">{property.propertyName}</h4>
                 <div className="flex items-center gap-2">
                     <Badge
                      variant="outline"
                      className={cn("text-xs px-2 py-0.5", getPropertyTypeColor(property.propertyType))}
                    >
                      {property.propertyType.charAt(0) + property.propertyType.slice(1).toLowerCase()}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">{property.propertyCode}</span>
                 </div>
             </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}