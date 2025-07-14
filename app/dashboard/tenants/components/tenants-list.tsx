'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { TenantWithRelations } from "@/types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getTenants, getTenantById } from "@/actions/tenants";
import { TenantListSkeleton } from "./tenants-list-skeletion";
import { TenantBulkActions } from "./tenants-bulkd-action";
import { TenantListItem } from "./tenants-list-items";
import { TenantDetails } from "./tenants-details";

export function TenantList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tenants, setTenants] = useState<TenantWithRelations[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTenant, setIsLoadingTenant] = useState(false);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();

  // Fetch tenants on component mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setIsLoading(true);
        const data = await getTenants();
        setTenants(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch tenants",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [toast]);

  // Fetch selected tenant details when selectedId changes
  useEffect(() => {
    const fetchSelectedTenant = async () => {
      if (!selectedId) {
        setSelectedTenant(null);
        return;
      }

      try {
        setIsLoadingTenant(true);
        // First try to find in existing tenants list
        const existingTenant = tenants.find(t => t.id === selectedId);
        if (existingTenant) {
          setSelectedTenant(existingTenant);
        } else {
          // If not found, fetch from server
          const tenantData = await getTenantById(selectedId);
          if (tenantData) {
            setSelectedTenant(tenantData);
          } else {
            setSelectedTenant(null);
            toast({
              title: "Error",
              description: "Tenant not found",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
        setSelectedTenant(null);
        toast({
          title: "Error",
          description: "Failed to fetch tenant details",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTenant(false);
      }
    };

    fetchSelectedTenant();
  }, [selectedId, tenants, toast]);

  const filteredTenants = tenants.filter((tenant) =>
    (tenant.firstName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
    (tenant.lastName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
    (tenant.bpCode?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredTenants.map(t => t.id) : []);
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

  // Auto-collapse sidebar on mobile when tenant is selected
  useEffect(() => {
    if (isMobile && selectedId) {
      setSidebarOpen(false);
    }
  }, [selectedId, isMobile]);

  if (isLoading) {
    return <TenantListSkeleton />;
  }

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
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 bg-secondary/50"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex"
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
              checked={selectedIds.length === filteredTenants.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            {selectedIds.length > 0 && (
              <TenantBulkActions selectedIds={selectedIds} />
            )}
          </div>
        </div>

        {/* Tenant List */}
        <div className="overflow-auto flex-1 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TenantListItem
                key={index}
                isLoading={true}
                collapsed={!sidebarOpen}
              />
            ))
          ) : (
            <>
              {filteredTenants.map((tenant) => (
                <TenantListItem
                  key={tenant.id}
                  tenant={tenant}
                  isSelected={selectedId === tenant.id}
                  onSelect={(checked) => handleSelect(tenant.id, checked)}
                  checked={selectedIds.includes(tenant.id)}
                  collapsed={!sidebarOpen}
                />
              ))}
              {filteredTenants.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <p className="text-sm text-muted-foreground">No tenants found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-secondary/5 relative">
        {isMobile && selectedTenant && (
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
        {isLoadingTenant ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading tenant details...</p>
            </div>
          </div>
        ) : selectedTenant ? (
          <div className="p-4 md:p-6">
            <TenantDetails tenant={selectedTenant} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">No tenant selected</p>
              <p className="text-sm text-muted-foreground">
                Select a tenant from the list to view their details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}