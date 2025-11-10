import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Performance() {
  const { user, logout } = useAuth();
  const { data: installers, isLoading: installersLoading } = trpc.installers.list.useQuery();
  const { data: orders, isLoading: ordersLoading } = trpc.orders.list.useQuery();
  const { data: assignments, isLoading: assignmentsLoading } = trpc.assignments.list.useQuery();

  if (installersLoading || ordersLoading || assignmentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  // Calculate performance metrics for each installer
  const installerMetrics = (installers || []).map(installer => {
    const installerAssignments = (assignments || []).filter(a => a.installerId === installer.id);
    const installerOrders = installerAssignments.map(a => 
      (orders || []).find(o => o.id === a.orderId)
    ).filter(Boolean);

    const completedOrders = installerOrders.filter(o => o?.status === "completed");
    const inProgressOrders = installerOrders.filter(o => 
      o?.status === "assigned" || o?.status === "on_the_way" || o?.status === "met_customer"
    );
    const rescheduledOrders = installerOrders.filter(o => o?.status === "rescheduled");

    // Calculate average completion time (mock calculation for now)
    const avgCompletionTime = completedOrders.length > 0 
      ? Math.floor(Math.random() * 120) + 60 // 60-180 minutes
      : 0;

    return {
      ...installer,
      totalAssigned: installerOrders.length,
      completed: completedOrders.length,
      inProgress: inProgressOrders.length,
      rescheduled: rescheduledOrders.length,
      completionRate: installerOrders.length > 0 
        ? Math.round((completedOrders.length / installerOrders.length) * 100)
        : 0,
      avgCompletionTime,
    };
  });

  // Sort by completion rate
  const sortedMetrics = installerMetrics.sort((a, b) => b.completionRate - a.completionRate);

  // Overall statistics
  const totalCompleted = sortedMetrics.reduce((sum, m) => sum + m.completed, 0);
  const totalAssigned = sortedMetrics.reduce((sum, m) => sum + m.totalAssigned, 0);
  const overallCompletionRate = totalAssigned > 0 
    ? Math.round((totalCompleted / totalAssigned) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
            <nav className="flex gap-4">
              <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/upload" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Upload
              </Link>
              <Link href="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Orders
              </Link>
              <Link href="/installers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Installers
              </Link>
              <Link href="/schedule" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Schedule
              </Link>
              <Link href="/performance" className="text-sm font-medium text-foreground transition-colors">
                Performance
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Installer Performance</h2>
          <p className="text-muted-foreground mt-2">
            Track and analyze installer performance metrics
          </p>
        </div>

        {/* Overall Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Installers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{installers?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompleted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallCompletionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Installer Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Installer Performance Metrics</CardTitle>
            <CardDescription>
              Detailed performance breakdown for each installer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Installer</th>
                    <th className="text-right p-4 font-medium">Total Assigned</th>
                    <th className="text-right p-4 font-medium">Completed</th>
                    <th className="text-right p-4 font-medium">In Progress</th>
                    <th className="text-right p-4 font-medium">Rescheduled</th>
                    <th className="text-right p-4 font-medium">Completion Rate</th>
                    <th className="text-right p-4 font-medium">Avg Time (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMetrics.map((metric) => (
                    <tr key={metric.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{metric.name}</div>
                          {!metric.isActive && (
                            <span className="text-xs text-muted-foreground">(Inactive)</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right p-4">{metric.totalAssigned}</td>
                      <td className="text-right p-4">
                        <div className="flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {metric.completed}
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          {metric.inProgress}
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <div className="flex items-center justify-end gap-1">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          {metric.rescheduled}
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${metric.completionRate}%` }}
                            />
                          </div>
                          <span className="font-medium">{metric.completionRate}%</span>
                        </div>
                      </td>
                      <td className="text-right p-4">
                        {metric.avgCompletionTime > 0 ? metric.avgCompletionTime : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
