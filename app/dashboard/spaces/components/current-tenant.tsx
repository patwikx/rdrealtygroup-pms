'use client'

import { Tenant, Lease } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Phone, Mail, Building2, Calendar, User, CreditCard, Clock, AlertTriangle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface CurrentTenantProps {
  tenant: Tenant;
  lease: Lease;
}

export function CurrentTenant({ tenant, lease }: CurrentTenantProps) {
  // Calculate lease progress
  const today = new Date();
  const start = new Date(lease.startDate);
  const end = new Date(lease.endDate);
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
  const daysElapsed = (today.getTime() - start.getTime()) / (1000 * 3600 * 24);
  const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);
  
  // Calculate days remaining
  const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const isExpiringSoon = daysRemaining <= 30;
  const router = useRouter();

  return (
    <Card className="bg-card">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Current Tenant</CardTitle>
            <CardDescription>Details of the current occupant</CardDescription>
          </div>
          <Button variant="outline" onClick={() => router.push(`/dashboard/tenants?selected=${tenant.id}`)}><Users className="h-4 w-4 mr-2" />View Full Profile</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Tenant Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {tenant.businessName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="font-mono">
                    {tenant.bpCode}
                  </Badge>
                  <Badge variant="outline" className={tenant.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                    {tenant.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{tenant.phone}</p>
                  <p className="text-xs text-muted-foreground">Primary Contact</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{tenant.email}</p>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{tenant.company}</p>
                  <p className="text-xs text-muted-foreground">Company</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lease Information */}
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-primary/5 border">
              <h4 className="font-semibold mb-4">Lease Progress</h4>
              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>{format(lease.startDate, "MMM d, yyyy")}</span>
                <span>{format(lease.endDate, "MMM d, yyyy")}</span>
              </div>
              {isExpiringSoon && (
                <div className="flex items-center gap-2 mt-3 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Lease expires in {daysRemaining} days
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Lease Duration</p>
                    <p className="text-xs text-muted-foreground">
                      {format(lease.startDate, "MMMM d, yyyy")} - {format(lease.endDate, "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {lease.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Security Deposit</p>
                    <p className="text-xs text-muted-foreground">Held in escrow</p>
                  </div>
                </div>
                <span className="text-lg font-semibold">
                  {formatCurrency(Number(lease.securityDeposit))}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Remaining Time</p>
                    <p className="text-xs text-muted-foreground">Until lease expiration</p>
                  </div>
                </div>
                <Badge variant={isExpiringSoon ? "destructive" : "secondary"}>
                  {daysRemaining} days
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}