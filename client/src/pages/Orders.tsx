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
import { Navigation } from "@/components/Navigation";
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
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rescheduleReasonFilter, setRescheduleReasonFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Bulk operations
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  
  // Clear all orders
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  // Edit order dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);

  const { data: allOrders = [], isLoading } = trpc.orders.list.useQuery();
  
  // Apply filters
  const orders = allOrders.filter(order => {
    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    
    // Reschedule reason filter
    if (rescheduleReasonFilter !== "all" && order.rescheduleReason !== rescheduleReasonFilter) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.serviceNumber && order.serviceNumber.toLowerCase().includes(query)) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  const { data: assignments = [] } = trpc.assignments.list.useQuery();
  const updateOrder = trpc.orders.update.useMutation();
  const clearAllOrders = trpc.orders.clearAll.useMutation();
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
  
  const handleEditOrder = (order: any) => {
    setEditOrder({
      id: order.id,
      orderNumber: order.orderNumber || "",
      serviceNumber: order.serviceNumber || "",
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      serviceType: order.serviceType || "",
      salesModiType: order.salesModiType || "",
      address: order.address || "",
      appointmentDate: order.appointmentDate || "",
      appointmentTime: order.appointmentTime || "",
      buildingName: order.buildingName || "",
      priority: order.priority || "medium",
      notes: order.notes || "",
    });
    setIsEditDialogOpen(true);
  };
  
  const handleSaveEdit = async () => {
    if (!editOrder || !editOrder.orderNumber || !editOrder.customerName) {
      toast.error("Order number and customer name are required");
      return;
    }
    
    try {
      await updateOrder.mutateAsync(editOrder);
      await utils.orders.list.invalidate();
      toast.success("Order updated successfully");
      setIsEditDialogOpen(false);
      setEditOrder(null);
    } catch (error) {
      toast.error("Failed to update order");
      console.error(error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllOrders.mutateAsync();
      await utils.orders.list.invalidate();
      await utils.assignments.list.invalidate();
      toast.success("All orders and assignments cleared successfully");
      setIsClearDialogOpen(false);
    } catch (error) {
      toast.error("Failed to clear orders");
      console.error(error);
    }
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
      <Navigation />

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
              <Button 
                variant="destructive" 
                onClick={() => setIsClearDialogOpen(true)}
                disabled={orders.length === 0}
              >
                Clear All Orders
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <input
                  type="text"
                  placeholder="Search by WO No., Customer, Service No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="on_the_way">On the Way</SelectItem>
                    <SelectItem value="met_customer">Met Customer</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Reschedule Reason</label>
                <Select value={rescheduleReasonFilter} onValueChange={setRescheduleReasonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All reasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    <SelectItem value="customer_issue">Customer Issue</SelectItem>
                    <SelectItem value="building_issue">Building Issue</SelectItem>
                    <SelectItem value="network_issue">Network Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground mb-4">
              Showing {orders.length} of {allOrders.length} orders
            </div>
            
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
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOrder(order)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(order)}
                              >
                                Update Status
                              </Button>
                            </div>
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

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update order details for: {editOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Order Number *</label>
                <input
                  type="text"
                  value={editOrder.orderNumber}
                  onChange={(e) => setEditOrder({ ...editOrder, orderNumber: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g., WO-2025-001"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Service Number</label>
                <input
                  type="text"
                  value={editOrder.serviceNumber}
                  onChange={(e) => setEditOrder({ ...editOrder, serviceNumber: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g., TBBNB029186G"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Customer Name *</label>
                <input
                  type="text"
                  value={editOrder.customerName}
                  onChange={(e) => setEditOrder({ ...editOrder, customerName: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Customer Phone</label>
                <input
                  type="text"
                  value={editOrder.customerPhone}
                  onChange={(e) => setEditOrder({ ...editOrder, customerPhone: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">WO Type</label>
                <input
                  type="text"
                  value={editOrder.serviceType}
                  onChange={(e) => setEditOrder({ ...editOrder, serviceType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g., ACTIVATION, MODIFICATION"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Sales/Modi Type</label>
                <input
                  type="text"
                  value={editOrder.salesModiType}
                  onChange={(e) => setEditOrder({ ...editOrder, salesModiType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g., New Sales, Outdoor relocation"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Address</label>
                <input
                  type="text"
                  value={editOrder.address}
                  onChange={(e) => setEditOrder({ ...editOrder, address: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Appointment Date</label>
                <input
                  type="date"
                  value={editOrder.appointmentDate}
                  onChange={(e) => setEditOrder({ ...editOrder, appointmentDate: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Appointment Time</label>
                <input
                  type="time"
                  value={editOrder.appointmentTime}
                  onChange={(e) => setEditOrder({ ...editOrder, appointmentTime: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Building Name</label>
                <input
                  type="text"
                  value={editOrder.buildingName}
                  onChange={(e) => setEditOrder({ ...editOrder, buildingName: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g., Menara ABC Tower"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={editOrder.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setEditOrder({ ...editOrder, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={editOrder.notes}
                  onChange={(e) => setEditOrder({ ...editOrder, notes: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateOrder.isPending}>
              {updateOrder.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Orders Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Orders?</DialogTitle>
            <DialogDescription>
              This will permanently delete all {orders.length} orders and their assignments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearAll}
              disabled={clearAllOrders.isPending}
            >
              {clearAllOrders.isPending ? "Clearing..." : "Clear All Orders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Bulk operations handlers added
