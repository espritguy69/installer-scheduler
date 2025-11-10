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
import { Calendar, ChevronLeft, ChevronRight, Download, Plus, Home as HomeIcon, Upload as UploadIcon, FileText, Users, BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Link } from "wouter";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { RouteOptimizer } from "@/components/RouteOptimizer";

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

interface DraggableOrderProps {
  order: any;
}

const DraggableOrder = ({ order }: DraggableOrderProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ORDER",
    item: { orderId: order.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const statusColor = getStatusColor(order.status);
  // Default duration: 2 hours for most jobs
  const estimatedDuration = "2h";

  return (
    <div
      ref={drag as any}
      className={`p-3 border-2 rounded-lg cursor-move ${statusColor} ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{ minWidth: "150px" }}
    >
      <div className="font-semibold text-sm">{order.orderNumber}</div>
      <div className="text-xs mt-1">{order.customerName}</div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-muted-foreground">{getStatusLabel(order.status)}</span>
        <span className="text-xs font-medium bg-white/50 px-1.5 py-0.5 rounded">{estimatedDuration}</span>
      </div>
    </div>
  );
};

interface TimeSlotCellProps {
  installerId: number;
  timeSlot: string;
  assignment: any;
  onDrop: (orderId: number, installerId: number, timeSlot: string) => void;
  onRemove: (assignmentId: number) => void;
  onReassign: (assignmentId: number, newInstallerId: number, newTimeSlot: string) => void;
}

const TimeSlotCell = ({ installerId, timeSlot, assignment, onDrop, onRemove, onReassign }: TimeSlotCellProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["ORDER", "ASSIGNED_ORDER"],
    drop: (item: { orderId?: number; assignmentId?: number }) => {
      // Handle reassignment from another slot
      if (item.assignmentId) {
        if (assignment) {
          toast.error("This time slot is already occupied. Please choose another slot.");
          return;
        }
        onReassign(item.assignmentId, installerId, timeSlot);
        return;
      }
      // Handle new assignment
      if (item.orderId) {
        if (assignment) {
          toast.error("This time slot is already occupied. Please choose another slot or remove the existing assignment.");
          return;
        }
        onDrop(item.orderId, installerId, timeSlot);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ASSIGNED_ORDER",
    item: assignment ? { assignmentId: assignment.id } : null,
    canDrag: !!assignment,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <td
      ref={drop as any}
      className={`border p-2 min-w-[120px] h-16 ${
        isOver ? "bg-primary/20" : ""
      } ${assignment && assignment.order ? getStatusColor(assignment.order.status) : ""} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {assignment && assignment.order && (
        <div ref={drag as any} className="text-center relative group cursor-move">
          <div className="text-xs font-semibold">{assignment.order.orderNumber}</div>
          <div className="text-xs">{assignment.order.customerName}</div>
          <button
            onClick={() => onRemove(assignment.id)}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      )}
    </td>
  );
};

export default function ScheduleV3() {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [showAddOrderDialog, setShowAddOrderDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    orderNumber: "",
    customerName: "",
    customerPhone: "",
    serviceType: "",
    address: "",
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

  // Get unassigned orders (pending status)
  const unassignedOrders = useMemo(() => {
    return orders.filter(order => order.status === "pending");
  }, [orders]);

  // Get assignments with order details
  const assignmentsWithOrders = useMemo(() => {
    return todaysAssignments.map(assignment => {
      const order = orders.find(o => o.id === assignment.orderId);
      return { ...assignment, order };
    }).filter(a => a.order);
  }, [todaysAssignments, orders]);

  // Get assignment for specific installer and time slot
  const getAssignmentForSlot = (installerId: number, timeSlot: string) => {
    return assignmentsWithOrders.find(
      a => a.installerId === installerId && a.scheduledStartTime === timeSlot
    );
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const daysToMove = viewMode === "weekly" ? 7 : 1;
    newDate.setDate(currentDate.getDate() + (direction === "next" ? daysToMove : -daysToMove));
    setCurrentDate(newDate);
  };

  const handleAddOrder = async () => {
    if (!newOrder.orderNumber || !newOrder.customerName) {
      toast.error("Order number and customer name are required");
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
        customerName: "",
        customerPhone: "",
        serviceType: "",
        address: "",
        priority: "medium",
        estimatedDuration: 60,
      });
    } catch (error) {
      toast.error("Failed to create order");
    }
  };

  const handleDrop = async (orderId: number, installerId: number, timeSlot: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await createAssignment.mutateAsync({
        orderId,
        installerId,
        scheduledDate: currentDate,
        scheduledStartTime: timeSlot,
        scheduledEndTime: "18:00",
      });
      await updateOrder.mutateAsync({ id: orderId, status: "assigned" });
      await utils.assignments.list.invalidate();
      await utils.orders.list.invalidate();
      toast.success("Order assigned");
    } catch (error) {
      toast.error("Failed to assign order");
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        await deleteAssignment.mutateAsync({ id: assignmentId });
        await updateOrder.mutateAsync({ id: assignment.orderId, status: "pending" });
        await utils.assignments.list.invalidate();
        await utils.orders.list.invalidate();
        toast.success("Assignment removed");
      }
    } catch (error) {
      toast.error("Failed to remove assignment");
    }
  };

  const handleReassign = async (assignmentId: number, newInstallerId: number, newTimeSlot: string) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        // Delete old assignment
        await deleteAssignment.mutateAsync({ id: assignmentId });
        // Create new assignment with new installer and time slot
        await createAssignment.mutateAsync({
          orderId: assignment.orderId,
          installerId: newInstallerId,
          scheduledDate: currentDate,
          scheduledStartTime: newTimeSlot,
          scheduledEndTime: "18:00",
        });
        await utils.assignments.list.invalidate();
        await utils.orders.list.invalidate();
        toast.success("Order reassigned successfully");
      }
    } catch (error) {
      toast.error("Failed to reassign order");
    }
  };

  const handleExport = () => {
    const exportData = assignmentsWithOrders.map(assignment => {
      const installer = installers.find(i => i.id === assignment.installerId);
      return {
        "Date": currentDate.toLocaleDateString(),
        "Time": assignment.scheduledStartTime,
        "Installer": installer?.name || "Unknown",
        "WO No.": assignment.order?.orderNumber || "",
        "Customer Name": assignment.order?.customerName || "",
        "Contact": assignment.order?.customerPhone || "",
        "Service Type": assignment.order?.serviceType || "",
        "Address": assignment.order?.address || "",
        "Status": assignment.order?.status || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, `schedule-${currentDate.toISOString().split("T")[0]}.xlsx`);
    toast.success("Schedule exported");
  };

  const handlePrint = () => {
    window.print();
  };

  if (ordersLoading || installersLoading || assignmentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print:hidden { display: none !important; }
          header, nav, button { display: none !important; }
          .draggable-orders { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          @page { margin: 1cm; }
        }
      `}</style>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
              <nav className="flex gap-1">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <HomeIcon className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UploadIcon className="h-4 w-4" />
                    Upload
                  </Button>
                </Link>
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Orders
                  </Button>
                </Link>
                <Link href="/installers">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    Installers
                  </Button>
                </Link>
                <Link href="/schedule">
                  <Button variant="default" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </Button>
                </Link>
                <Link href="/performance">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Performance
                  </Button>
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
        <main className="container mx-auto py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Schedule</h2>
            <p className="text-muted-foreground">Drag and drop orders onto the calendar to assign them to installers</p>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex gap-4">
            <Button onClick={() => setShowAddOrderDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Order
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handlePrint} className="print:hidden">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
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

          {/* Unassigned Orders */}
          <Card className="mb-6 draggable-orders">
            <CardHeader>
              <CardTitle>Unassigned Orders ({unassignedOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {unassignedOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No unassigned orders</p>
                ) : (
                  unassignedOrders.map(order => (
                    <DraggableOrder key={order.id} order={order} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Grid */}
          <Card className="print-area">
            <CardHeader>
              <CardTitle>Daily Schedule - {assignmentsWithOrders.length} Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted sticky left-0 z-10">Installer</th>
                      {TIME_SLOTS.map(slot => (
                        <th key={slot} className="border p-2 bg-muted min-w-[120px]">
                          {slot}
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
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span>{installer.name}</span>
                                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                  {workloadCount}
                                </span>
                              </div>
                              <RouteOptimizer
                                orders={orders.filter((o: any) => {
                                  const assignment = todaysAssignments.find(a => a.orderId === o.id);
                                  return assignment?.installerId === installer.id;
                                }).map((o: any) => ({
                                  id: o.id,
                                  orderNumber: o.orderNumber,
                                  customerName: o.customerName,
                                  address: o.address,
                                  scheduledStartTime: todaysAssignments.find(a => a.orderId === o.id)?.scheduledStartTime || undefined
                                }))}
                                installerName={installer.name}
                                onApplyRoute={(optimizedOrders) => {
                                  toast.info("Route optimization applied. Drag orders to adjust time slots.");
                                }}
                              />
                            </div>
                          </td>
                          {TIME_SLOTS.map(slot => (
                            <TimeSlotCell
                              key={slot}
                              installerId={installer.id}
                              timeSlot={slot}
                              assignment={getAssignmentForSlot(installer.id, slot)}
                              onDrop={handleDrop}
                              onRemove={handleRemoveAssignment}
                              onReassign={handleReassign}
                            />
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Add Order Dialog */}
        <Dialog open={showAddOrderDialog} onOpenChange={setShowAddOrderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Order</DialogTitle>
              <DialogDescription>Create a new service order manually</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="orderNumber">Order Number *</Label>
                <Input
                  id="orderNumber"
                  value={newOrder.orderNumber}
                  onChange={(e) => setNewOrder({ ...newOrder, orderNumber: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={newOrder.customerPhone}
                  onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Input
                  id="serviceType"
                  value={newOrder.serviceType}
                  onChange={(e) => setNewOrder({ ...newOrder, serviceType: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newOrder.address}
                  onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newOrder.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setNewOrder({ ...newOrder, priority: value })
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddOrderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOrder}>Create Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
