import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { Calendar, ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Link } from "wouter";

// Custom time slots as specified
const TIME_SLOTS = ["09:00", "10:00", "11:00", "11:30", "13:00", "14:30", "15:00", "16:00", "18:00"];

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 border-green-300 text-green-800";
    case "on_the_way":
    case "met_customer":
      return "bg-yellow-100 border-yellow-300 text-yellow-800";
    case "rescheduled":
      return "bg-red-100 border-red-300 text-red-800";
    case "assigned":
      return "bg-blue-100 border-blue-300 text-blue-800";
    case "pending":
      return "bg-gray-100 border-gray-300 text-gray-800";
    case "withdrawn":
      return "bg-purple-100 border-purple-300 text-purple-800";
    default:
      return "bg-gray-100 border-gray-300 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "on_the_way":
      return "On the way";
    case "met_customer":
      return "Met customer";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export default function ScheduleNew() {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [showAddOrderDialog, setShowAddOrderDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    orderNumber: "",
    serviceNumber: "",
    customerName: "",
    customerPhone: "",
    serviceType: "",
    location: "",
    priority: "medium" as "low" | "medium" | "high",
    estimatedDuration: 60,
  });

  const { data: orders = [], isLoading: ordersLoading } = trpc.orders.list.useQuery();
  const { data: installers = [], isLoading: installersLoading } = trpc.installers.list.useQuery();
  const { data: assignments = [], isLoading: assignmentsLoading } = trpc.assignments.list.useQuery();
  
  const createOrder = trpc.orders.create.useMutation();
  const createAssignment = trpc.assignments.create.useMutation();
  const deleteAssignment = trpc.assignments.delete.useMutation();
  const updateOrder = trpc.orders.update.useMutation();
  const utils = trpc.useUtils();

  // Filter assignments for current date
  const todaysAssignments = useMemo(() => {
    return assignments.filter(a => {
      const assignmentDate = new Date(a.scheduledDate);
      return assignmentDate.toDateString() === currentDate.toDateString();
    });
  }, [assignments, currentDate]);

  // Get orders that have assignments for today, plus all pending orders
  const todaysOrders = useMemo(() => {
    const assignedOrderIds = todaysAssignments.map(a => a.orderId);
    const assignedOrders = orders.filter(order => assignedOrderIds.includes(order.id));
    const pendingOrders = orders.filter(order => order.status === "pending");
    // Combine and remove duplicates
    const allOrders = [...assignedOrders, ...pendingOrders];
    const uniqueOrders = allOrders.filter((order, index, self) => 
      index === self.findIndex((o) => o.id === order.id)
    );
    return uniqueOrders;
  }, [orders, todaysAssignments]);

  // Get assignment for specific installer and order
  const getAssignment = (installerId: number, orderId: number) => {
    return todaysAssignments.find(a => a.installerId === installerId && a.orderId === orderId);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const daysToMove = viewMode === "weekly" ? 7 : 1;
    newDate.setDate(currentDate.getDate() + (direction === "next" ? daysToMove : -daysToMove));
    setCurrentDate(newDate);
  };

  const handleAddOrder = async () => {
    if (!newOrder.serviceNumber || !newOrder.customerName) {
      toast.error("Service number and customer name are required");
      return;
    }

    try {
      await createOrder.mutateAsync({
        ...newOrder,
      });
      await utils.orders.list.invalidate();
      toast.success("Order created successfully");
      setShowAddOrderDialog(false);
      setNewOrder({
        orderNumber: "",
        serviceNumber: "",
        customerName: "",
        customerPhone: "",
        serviceType: "",
        location: "",
        priority: "medium",
        estimatedDuration: 60,
      });
    } catch (error) {
      toast.error("Failed to create order");
    }
  };

  const handleCellClick = async (installerId: number, orderId: number) => {
    const existingAssignment = getAssignment(installerId, orderId);
    
    if (existingAssignment) {
      // Remove assignment
      try {
        await deleteAssignment.mutateAsync({ id: existingAssignment.id });
        await updateOrder.mutateAsync({ id: orderId, status: "pending" });
        await utils.assignments.list.invalidate();
        await utils.orders.list.invalidate();
        toast.success("Assignment removed");
      } catch (error) {
        toast.error("Failed to remove assignment");
      }
    } else {
      // Create assignment
      try {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        await createAssignment.mutateAsync({
          orderId,
          installerId,
          scheduledDate: currentDate,
          scheduledStartTime: "09:00",
          scheduledEndTime: "18:00",
        });
        await updateOrder.mutateAsync({ id: orderId, status: "assigned" });
        await utils.assignments.list.invalidate();
        await utils.orders.list.invalidate();
        toast.success("Order assigned");
      } catch (error) {
        toast.error("Failed to assign order");
      }
    }
  };

  const exportToExcel = () => {
    const exportData = todaysOrders.map(order => {
      const assignment = todaysAssignments.find(a => a.orderId === order.id);
      const installer = assignment ? installers.find(i => i.id === assignment.installerId) : null;
      
      return {
        "WO No.": order.orderNumber,
        "Customer Name": order.customerName,
        "Contact": order.customerPhone,
        "Service Type": order.serviceType,
        "Address": order.address,
        "Assigned To": installer?.name || "Unassigned",
        "Status": order.status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, `schedule_${currentDate.toISOString().split("T")[0]}.xlsx`);
    toast.success("Schedule exported successfully");
  };

  if (ordersLoading || installersLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
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
                <a className="text-sm font-medium text-foreground hover:text-foreground transition-colors">
                  Schedule
                </a>
              </Link>
              <Link href="/performance">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Performance
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
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Schedule</h1>
            <p className="text-muted-foreground">
              Click on cells to assign/unassign orders to installers
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddOrderDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Order
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Navigation and View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-lg font-semibold">
                {viewMode === "daily" 
                  ? currentDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                  : `Week of ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                }
              </span>
            </div>
            <div className="flex gap-1 border rounded-md p-1">
              <Button 
                variant={viewMode === "daily" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("daily")}
              >
                Daily
              </Button>
              <Button 
                variant={viewMode === "weekly" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("weekly")}
              >
                Weekly
              </Button>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Schedule - {todaysOrders.length} Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted font-semibold text-left sticky left-0 z-10 bg-background">
                      Installer
                    </th>
                    {todaysOrders.map(order => (
                      <th key={order.id} className="border p-2 bg-muted min-w-[120px]">
                        <div className="text-sm font-semibold">{order.orderNumber}</div>
                        <div className="text-xs text-muted-foreground">{order.customerName}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {installers.filter(i => i.isActive).map(installer => {
                    const installerAssignments = todaysAssignments.filter(a => a.installerId === installer.id);
                    const workloadCount = installerAssignments.length;
                    
                    return (
                    <tr key={installer.id}>
                      <td className="border p-2 font-medium sticky left-0 z-10 bg-background">
                        <div className="flex items-center justify-between">
                          <span>{installer.name}</span>
                          <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            {workloadCount}
                          </span>
                        </div>
                      </td>
                      {todaysOrders.map(order => {
                        const assignment = getAssignment(installer.id, order.id);
                        const isAssigned = !!assignment;
                        const statusColor = getStatusColor(order.status);
                        
                        return (
                          <td
                            key={order.id}
                            className={`border p-2 cursor-pointer hover:bg-accent transition-colors ${
                              isAssigned ? statusColor : ""
                            }`}
                            onClick={() => handleCellClick(installer.id, order.id)}
                          >
                            {isAssigned && (
                              <div className="text-center">
                                <div className="text-xs font-semibold">✓ Assigned</div>
                                <div className="text-xs mt-1">{getStatusLabel(order.status)}</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {todaysOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No orders for this date. Click "Add Order" to create one.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Order Dialog */}
      <Dialog open={showAddOrderDialog} onOpenChange={setShowAddOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Order</DialogTitle>
            <DialogDescription>
              Create a new order for {currentDate.toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orderNumber">WO Number *</Label>
              <Input
                id="orderNumber"
                value={newOrder.orderNumber}
                onChange={(e) => setNewOrder({ ...newOrder, orderNumber: e.target.value })}
                placeholder="WO-001"
              />
            </div>
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Contact Number</Label>
              <Input
                id="customerPhone"
                value={newOrder.customerPhone}
                onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                placeholder="+60123456789"
              />
            </div>
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={newOrder.serviceType}
                onChange={(e) => setNewOrder({ ...newOrder, serviceType: e.target.value })}
                placeholder="Installation"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newOrder.location}
                onChange={(e) => setNewOrder({ ...newOrder, location: e.target.value })}
                placeholder="Building name or address"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newOrder.priority}
                onValueChange={(value: any) => setNewOrder({ ...newOrder, priority: value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOrderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOrder}>
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
