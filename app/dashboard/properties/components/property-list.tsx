'use client';

import { User } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { PropertyBulkActions } from "./property-bulk-actions";
import { PropertyDetails } from "./property-details";
import { Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { PropertyListItem } from "./property-list-items";
import { PropertyWithRelations } from "@/types";

interface PropertyListProps {
  initialProperties: PropertyWithRelations[];
  users: User[];
  currentUserId: string;
}

export function PropertyList({ initialProperties, users, currentUserId }: PropertyListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const selectedProperty = selectedId 
    ? initialProperties.find(p => p.id === selectedId)
    : null;

  const filteredProperties = initialProperties.filter((property) =>
    property.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.propertyCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredProperties.map(p => p.id) : []);
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

  useEffect(() => {
    if (isMobile && selectedId) {
      setSidebarOpen(false);
    }
  }, [selectedId, isMobile]);

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-background shadow-sm">
      <div
        className={cn(
          "border-r flex flex-col absolute md:relative inset-y-0 left-0 z-20 bg-background transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-full md:w-80 translate-x-0" : "w-80 -translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className={cn("w-full", !sidebarOpen && "md:hidden")}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 bg-secondary/50"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex ml-4"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Selection Controls */}
        <div className={cn("p-2 border-b bg-secondary/10", !sidebarOpen && "md:hidden")}>
          <div className="flex items-center gap-2 px-2">
            <Checkbox
              checked={selectedIds.length === filteredProperties.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            {selectedIds.length > 0 && (
              <PropertyBulkActions selectedIds={selectedIds} />
            )}
          </div>
        </div>

        {/* Property List */}
        <div className="overflow-auto flex-1 divide-y divide-border">
          {filteredProperties.map((property) => (
            <PropertyListItem
              key={property.id}
              property={property}
              isSelected={selectedId === property.id}
              onSelect={(checked) => handleSelect(property.id, checked)}
              checked={selectedIds.includes(property.id)}
              collapsed={!sidebarOpen}
            />
          ))}
          {filteredProperties.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-sm text-muted-foreground">No properties found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-secondary/5 relative">
        {isMobile && selectedProperty && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeftOpen className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        )}
        {selectedProperty ? (
          <div className="p-4 md:p-6">
            <PropertyDetails 
              property={selectedProperty} 
              users={users}
              currentUserId={currentUserId}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">No property selected</p>
              <p className="text-sm text-muted-foreground">
                Select a property from the list to view its details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}