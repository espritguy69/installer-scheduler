import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle2, Clock, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function InstallerView() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [rescheduleReason, setRescheduleReason] = useState<string>("");
  const [rescheduledDate, setRescheduledDate] = useState<string>("");
  const [rescheduledTime, setRescheduledTime] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: assignments = [], isLoading } = trpc.assignments.list.useQuery();
  const { data: orders = [] } = trpc.orders.list.useQuery();
  const { data: installers = [] } = trpc.installers.list.useQuery();
  const updateOrder = trpc.orders.update.useMutation();
  const utils = trpc.useUtils();

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Find current user's installer record by userId
  const currentInstaller = user ? installers.find(i => i.userId === user.id) : undefined;

  // Get today's assignments for current installer
  const todayAssignments = assignments.filter(a => {
    const assignmentDate = new Date(a.scheduledDate).toISOString().split('T')[0];
    return assignmentDate === today && a.installerId === currentInstaller?.id;
  });

  // Get orders for today's assignments
  const todayOrders = todayAssignments.map(assignment => {
    const order = orders.find(o => o.id === assignment.orderId);
    return { ...order, assignment };
  }).filter(Boolean);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "on_the_way":
        return "bg-indigo-100 text-indigo-800";
      case "met_customer":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "order_completed":
        return "bg-lime-100 text-lime-800";
      case "docket_received":
        return "bg-teal-100 text-teal-800";
      case "docket_uploaded":
        return "bg-cyan-100 text-cyan-800";
      case "rescheduled":
        return "bg-orange-100 text-orange-800";
      case "withdrawn":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setRescheduleReason("");
    setRescheduledDate("");
    setRescheduledTime("");
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    // Validate reschedule fields if status is rescheduled
    if (newStatus === "rescheduled") {
      if (!rescheduleReason || !rescheduledDate || !rescheduledTime) {
        toast.error("Please provide reason, date and time for rescheduling");
        return;
      }
    }

    try {
      const updateData: any = {
        id: selectedOrder.id,
        status: newStatus as any,
      };

      if (newStatus === "rescheduled") {
        updateData.rescheduleReason = rescheduleReason as any;
        updateData.rescheduledDate = new Date(rescheduledDate + "T" + rescheduledTime);
        updateData.rescheduledTime = rescheduledTime;
      }

      await updateOrder.mutateAsync(updateData);

      await utils.orders.list.invalidate();
      await utils.assignments.list.invalidate();
      toast.success("Order status updated successfully");
      setIsDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to view your tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">Installer Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">Full View</Button>
              </Link>
              <div className="text-sm">
                <div className="font-medium">{user?.name}</div>
                <button onClick={logout} className="text-xs text-muted-foreground hover:underline">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!currentInstaller ? (
          <Card>
            <CardHeader>
              <CardTitle>Installer Profile Not Found</CardTitle>
              <CardDescription>
                Your account is not linked to an installer profile. Please contact your administrator.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            {/* Today's Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Schedule - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardTitle>
                <CardDescription>
                  You have {todayOrders.length} task{todayOrders.length !== 1 ? 's' : ''} scheduled for today
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Tasks List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : todayOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No tasks scheduled for today</p>
                  <p className="text-sm text-muted-foreground mt-2">Enjoy your day!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {todayOrders.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.serviceNumber || 'N/A'}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.customerName}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">
                              {item.assignment.scheduledStartTime}
                            </div>
                            <div className="text-muted-foreground">{new Date(item.assignment.scheduledDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">Status</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(item.status)}`}>
                              {item.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.customerPhone && (
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium">Phone</div>
                              <div className="text-muted-foreground">{item.customerPhone}</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">WO No.</div>
                            <div className="text-muted-foreground">{item.orderNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </div>

                      {item.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-sm">{item.address}</div>
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {item.notes}
                        </div>
                      )}

                      <div className="pt-2">
                        <Button 
                          onClick={() => handleStatusChange(item)}
                          className="w-full"
                          size="lg"
                        >
                          Update Status
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Status Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Order: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="on_the_way">On the Way</SelectItem>
                  <SelectItem value="met_customer">Met the Customer</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="order_completed">Order Completed</SelectItem>
                  <SelectItem value="docket_received">Docket Received</SelectItem>
                  <SelectItem value="docket_uploaded">Docket Uploaded</SelectItem>
                  <SelectItem value="rescheduled">Reschedule</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === "rescheduled" && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div>
                  <label className="text-sm font-medium mb-2 block">Reschedule Reason *</label>
                  <Select value={rescheduleReason} onValueChange={setRescheduleReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_issue">Customer Issue</SelectItem>
                      <SelectItem value="building_issue">Building Issue</SelectItem>
                      <SelectItem value="network_issue">Network Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">New Date *</label>
                  <input
                    type="date"
                    value={rescheduledDate}
                    onChange={(e) => setRescheduledDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">New Time *</label>
                  <input
                    type="time"
                    value={rescheduledTime}
                    onChange={(e) => setRescheduledTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
