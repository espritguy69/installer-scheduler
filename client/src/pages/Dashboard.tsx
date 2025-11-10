import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { 
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  StickyNote,
  Filter,
  FileText
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Link } from "wouter";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: orders = [] } = trpc.orders.list.useQuery();
  const { data: installers = [] } = trpc.installers.list.useQuery();
  const { data: assignments = [] } = trpc.assignments.list.useQuery();
  const { data: allNotes = [] } = trpc.notes.list.useQuery();

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
      <Navigation />

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
        
        {/* Recent Notes Section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                <CardTitle>Recent Notes & Remarks</CardTitle>
              </div>
              <Link href="/notes" className="text-sm text-primary hover:underline">
                View All →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter notes from last 7 days
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              const recentNotes = allNotes.filter(note => {
                const noteDate = new Date(note.date);
                return noteDate >= sevenDaysAgo;
              }).slice(0, 10); // Show max 10 notes
              
              // Count open incidents and pending follow-ups
              const openIncidents = recentNotes.filter(n => n.noteType === "incident" && n.status === "open").length;
              const pendingFollowUps = recentNotes.filter(n => n.noteType === "follow_up" && n.status === "open").length;
              
              return (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-600">{openIncidents}</div>
                        <div className="text-sm text-red-700 dark:text-red-300">Open Incidents</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{pendingFollowUps}</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Pending Follow-ups</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes List */}
                  {recentNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent notes in the last 7 days
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentNotes.map(note => (
                        <div key={note.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{note.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                note.noteType === "incident" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                                note.noteType === "complaint" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                                note.noteType === "follow_up" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                note.noteType === "reschedule" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                                "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              }`}>
                                {note.noteType}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                note.status === "open" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                note.status === "in_progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                note.status === "resolved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              }`}>
                                {note.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>📅 {note.date}</span>
                            {note.serviceNumber && <span>🔧 {note.serviceNumber}</span>}
                            {note.customerName && <span>👤 {note.customerName}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
