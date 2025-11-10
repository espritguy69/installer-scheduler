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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Orders() {
  const { user, logout } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [rescheduleReason, setRescheduleReason] = useState<string>("");
  const [rescheduledDate, setRescheduledDate] = useState<string>("");
  const [rescheduledTime, setRescheduledTime] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = trpc.orders.list.useQuery();
  const { data: assignments = [] } = trpc.assignments.list.useQuery();
  const updateOrder = trpc.orders.update.useMutation();
  const utils = trpc.useUtils();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "on_the_way":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "met_customer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rescheduled":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "withdrawn":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getAssignmentInfo = (orderId: number) => {
    return assignments.find(a => a.orderId === orderId);
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
      toast.success("Order status updated successfully");
      setIsDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
            <nav className="flex gap-4">
              <Link href="/">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </a>
              </Link>
              <Link href="/upload">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Upload
                </a>
              </Link>
              <Link href="/orders">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Orders
                </a>
              </Link>
              <Link href="/installers">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Installers
                </a>
              </Link>
              <Link href="/schedule">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Schedule
                </a>
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

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
          <p className="text-muted-foreground">
            View and manage all service orders with status tracking
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  All Orders
                </CardTitle>
                <CardDescription>
                  Total: {orders.length} orders
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO No.</TableHead>
                    <TableHead>Service No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>WO Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No orders found. Upload orders to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => {
                      const assignment = getAssignmentInfo(order.id);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell className="text-xs">{order.serviceNumber || "-"}</TableCell>
                          <TableCell>
                            <div>{order.customerName}</div>
                            {order.customerPhone && (
                              <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">{order.serviceType || "-"}</div>
                            {order.salesModiType && (
                              <div className="text-xs text-muted-foreground">{order.salesModiType}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(order.priority)}`}>
                              {order.priority}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                              {order.status.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            {assignment ? (
                              <div className="text-sm">
                                <div className="text-xs text-muted-foreground">
                                  {new Date(assignment.scheduledDate).toLocaleDateString()}
                                </div>
                                <div className="text-xs">
                                  {assignment.scheduledStartTime} - {assignment.scheduledEndTime}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order)}
                            >
                              Update Status
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of order: {selectedOrder?.orderNumber}
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="on_the_way">On the Way</SelectItem>
                  <SelectItem value="met_customer">Met the Customer</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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
            <Button onClick={handleUpdateStatus} disabled={!newStatus || newStatus === selectedOrder?.status}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
