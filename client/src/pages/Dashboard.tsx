import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { 
  Home as HomeIcon, 
  Upload as UploadIcon, 
  FileText, 
  Users, 
  Calendar,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: orders = [] } = trpc.orders.list.useQuery();
  const { data: installers = [] } = trpc.installers.list.useQuery();
  const { data: assignments = [] } = trpc.assignments.list.useQuery();

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAssignments = assignments.filter(a => {
      const assignmentDate = new Date(a.scheduledDate);
      assignmentDate.setHours(0, 0, 0, 0);
      return assignmentDate.getTime() === today.getTime();
    });

    const completedOrders = orders.filter(o => o.status === "completed");
    const pendingOrders = orders.filter(o => o.status === "pending");
    const inProgressOrders = orders.filter(o => o.status === "on_the_way" || o.status === "met_customer");
    const rescheduledOrders = orders.filter(o => o.status === "rescheduled");

    const completionRate = orders.length > 0 
      ? ((completedOrders.length / orders.length) * 100).toFixed(1)
      : "0.0";

    // Calculate assignments per installer
    const installerWorkload = installers.map(installer => {
      const installerAssignments = todayAssignments.filter(a => a.installerId === installer.id);
      const installerCompleted = installerAssignments.filter(a => {
        const order = orders.find(o => o.id === a.orderId);
        return order?.status === "completed";
      });
      
      return {
        name: installer.name,
        assigned: installerAssignments.length,
        completed: installerCompleted.length,
        completionRate: installerAssignments.length > 0
          ? ((installerCompleted.length / installerAssignments.length) * 100).toFixed(0)
          : "0"
      };
    }).sort((a, b) => b.assigned - a.assigned);

    // Calculate average job duration (estimated 2 hours per job)
    const avgDuration = "2.0";

    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      inProgressOrders: inProgressOrders.length,
      rescheduledOrders: rescheduledOrders.length,
      completionRate,
      todayAssignments: todayAssignments.length,
      installerWorkload,
      avgDuration,
      activeInstallers: installers.filter(i => i.isActive).length
    };
  }, [orders, installers, assignments]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl">
              {APP_TITLE}
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                <HomeIcon className="inline h-4 w-4 mr-1" />
                Home
              </Link>
              <Link href="/upload" className="text-sm font-medium hover:text-primary transition-colors">
                <UploadIcon className="inline h-4 w-4 mr-1" />
                Upload
              </Link>
              <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">
                <FileText className="inline h-4 w-4 mr-1" />
                Orders
              </Link>
              <Link href="/installers" className="text-sm font-medium hover:text-primary transition-colors">
                <Users className="inline h-4 w-4 mr-1" />
                Installers
              </Link>
              <Link href="/schedule" className="text-sm font-medium hover:text-primary transition-colors">
                <Calendar className="inline h-4 w-4 mr-1" />
                Schedule
              </Link>
              <Link href="/performance" className="text-sm font-medium hover:text-primary transition-colors">
                <BarChart3 className="inline h-4 w-4 mr-1" />
                Performance
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-primary">
                <TrendingUp className="inline h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Daily Summary Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of today's operations and key performance metrics
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.completedOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.inProgressOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently active jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting assignment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Today's Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.todayAssignments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Jobs assigned for today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Installers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.activeInstallers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Job Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.avgDuration}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated per job
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Installer Workload Table */}
        <Card>
          <CardHeader>
            <CardTitle>Installer Workload - Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Installer</th>
                    <th className="text-center p-2 font-medium">Assigned</th>
                    <th className="text-center p-2 font-medium">Completed</th>
                    <th className="text-center p-2 font-medium">Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.installerWorkload.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-muted-foreground">
                        No assignments for today
                      </td>
                    </tr>
                  ) : (
                    metrics.installerWorkload.map((installer, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{installer.name}</td>
                        <td className="text-center p-2">{installer.assigned}</td>
                        <td className="text-center p-2">{installer.completed}</td>
                        <td className="text-center p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            parseInt(installer.completionRate) >= 75 
                              ? "bg-green-100 text-green-700"
                              : parseInt(installer.completionRate) >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {installer.completionRate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600" 
                      style={{ width: `${(metrics.completedOrders / metrics.totalOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{metrics.completedOrders}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">In Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${(metrics.inProgressOrders / metrics.totalOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{metrics.inProgressOrders}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-600" 
                      style={{ width: `${(metrics.pendingOrders / metrics.totalOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{metrics.pendingOrders}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rescheduled</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-600" 
                      style={{ width: `${(metrics.rescheduledOrders / metrics.totalOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{metrics.rescheduledOrders}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
