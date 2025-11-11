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
import { Navigation } from "@/components/Navigation";
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
    case "docket_received":
      return "bg-teal-100 border-teal-300 text-teal-800";
    case "docket_uploaded":
      return "bg-cyan-100 border-cyan-300 text-cyan-800";
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
    case "docket_received":
      return "Docket received";
    case "docket_uploaded":
      return "Docket uploaded";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

interface DraggableOrderProps {
  order: any;
  isSelected: boolean;
  onSelect: (orderId: number, selected: boolean) => void;
}

const DraggableOrder = ({ order, isSelected, onSelect }: DraggableOrderProps) => {
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
      className={`p-2 border-2 rounded-lg cursor-move shadow-sm hover:shadow-md transition-shadow ${statusColor} ${
        isDragging ? "opacity-50" : ""
      } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      style={{ minWidth: "180px", maxWidth: "220px" }}
    >
      <div className="flex items-start gap-2 mb-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(order.id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{order.orderNumber}</div>
        </div>
      </div>
      <div className="space-y-1 ml-6">
        <div className="text-sm truncate">{order.customerName}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {order.appointmentTime && (
            <span>⏰ {order.appointmentTime}</span>
          )}
          {order.appointmentTime && order.buildingName && <span>•</span>}
          {order.buildingName && (
            <span className="truncate">📍 {order.buildingName}</span>
          )}
        </div>
        {order.serviceNumber && (
          <div className="text-xs text-muted-foreground">
            SN: {order.serviceNumber}
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-2 pt-1 border-t border-current/20 ml-6">
        <span className="text-xs font-medium">{getStatusLabel(order.status)}</span>
        <span className="text-xs font-bold bg-white/60 px-1.5 py-0.5 rounded">{estimatedDuration}</span>
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
      className={`border-2 p-1 min-w-[140px] h-24 transition-all ${
        isOver && assignment && assignment.order ? "bg-red-100 border-red-400 border-dashed" :
        isOver ? "bg-blue-100 border-blue-400 border-dashed" : 
        assignment && assignment.order ? "border-solid" : "bg-gray-50 border-gray-200 border-dashed"
      } ${assignment && assignment.order ? getStatusColor(assignment.order.status) : ""} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {assignment && assignment.order ? (
        <div ref={drag as any} className="relative group cursor-move h-full flex flex-col justify-between p-1">
          <div className="space-y-0.5">
            <div className="text-xs font-bold truncate">{assignment.order.orderNumber}</div>
            <div className="text-xs truncate">{assignment.order.customerName}</div>
            {assignment.order.appointmentTime && (
              <div className="text-xs text-muted-foreground">⏰ {assignment.order.appointmentTime}</div>
            )}
            {assignment.order.buildingName && (
              <div className="text-xs text-muted-foreground truncate">📍 {assignment.order.buildingName}</div>
            )}
          </div>
          <button
            onClick={() => onRemove(assignment.id)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Remove assignment"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 text-xs">
          Drop here
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
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [bulkAssignment, setBulkAssignment] = useState<{
    installerId: number | null;
    timeSlot: string | null;
  }>({
    installerId: null,
    timeSlot: null,
  });
  const [newOrder, setNewOrder] = useState({
    orderNumber: "",
    ticketNumber: "",
    serviceNumber: "",
    customerName: "",
    customerPhone: "",
    serviceType: "",
    salesModiType: "",
    address: "",
    appointmentDate: "",
    appointmentTime: "",
    buildingName: "",
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

  const handleOrderSelect = (orderId: number, selected: boolean) => {
    if (selected) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = () => {
    setSelectedOrderIds(unassignedOrders.map(o => o.id));
  };

  const handleClearSelection = () => {
    setSelectedOrderIds([]);
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignment.installerId || !bulkAssignment.timeSlot) {
      toast.error("Please select both installer and time slot");
      return;
    }

    if (selectedOrderIds.length === 0) {
      toast.error("No orders selected");
      return;
    }

    try {
      // Create assignments for all selected orders
      const assignmentPromises = selectedOrderIds.map(orderId => {
        return createAssignment.mutateAsync({
          orderId,
          installerId: bulkAssignment.installerId!,
          scheduledDate: currentDate,
          scheduledStartTime: bulkAssignment.timeSlot!,
          scheduledEndTime: "18:00", // Default end time
        });
      });

      await Promise.all(assignmentPromises);

      // Update all orders to assigned status
      const updatePromises = selectedOrderIds.map(orderId => {
        return updateOrder.mutateAsync({
          id: orderId,
          status: "assigned",
        });
      });

      await Promise.all(updatePromises);

      // Refresh data
      await utils.assignments.list.invalidate();
      await utils.orders.list.invalidate();

      toast.success(`Successfully assigned ${selectedOrderIds.length} orders`);
      
      // Reset state
      setSelectedOrderIds([]);
      setShowBulkAssignDialog(false);
      setBulkAssignment({ installerId: null, timeSlot: null });
    } catch (error) {
      console.error("Bulk assignment error:", error);
      toast.error("Failed to assign orders. Please try again.");
    }
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
        ticketNumber: "",
        serviceNumber: "",
        customerName: "",
        customerPhone: "",
        serviceType: "",
        salesModiType: "",
        address: "",
        appointmentDate: "",
        appointmentTime: "",
        buildingName: "",
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
        <Navigation />

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

          {/* Bulk Action Toolbar */}
          {selectedOrderIds.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-blue-900">
                  {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={selectedOrderIds.length === unassignedOrders.length}
                >
                  Select All ({unassignedOrders.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearSelection}
                >
                  Clear Selection
                </Button>
              </div>
              <Button 
                onClick={() => setShowBulkAssignDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Assign Selected to Installer
              </Button>
            </div>
          )}

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
                    <DraggableOrder 
                      key={order.id} 
                      order={order}
                      isSelected={selectedOrderIds.includes(order.id)}
                      onSelect={handleOrderSelect}
                    />
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
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <th className="border p-2 bg-muted sticky left-0 z-30">Installer</th>
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
                <Label htmlFor="ticketNumber">Ticket Number</Label>
                <Input
                  id="ticketNumber"
                  value={newOrder.ticketNumber}
                  onChange={(e) => setNewOrder({ ...newOrder, ticketNumber: e.target.value })}
                  placeholder="e.g., TTKT202511108600806"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serviceNumber">Service Number</Label>
                <Input
                  id="serviceNumber"
                  value={newOrder.serviceNumber}
                  onChange={(e) => setNewOrder({ ...newOrder, serviceNumber: e.target.value })}
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
                <Label htmlFor="serviceType">Service Type (WO Type)</Label>
                <Input
                  id="serviceType"
                  value={newOrder.serviceType}
                  onChange={(e) => setNewOrder({ ...newOrder, serviceType: e.target.value })}
                  placeholder="e.g., ACTIVATION, MODIFICATION"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salesModiType">Sales/Modi Type</Label>
                <Input
                  id="salesModiType"
                  value={newOrder.salesModiType}
                  onChange={(e) => setNewOrder({ ...newOrder, salesModiType: e.target.value })}
                  placeholder="e.g., New Sales, Outdoor relocation"
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
                <Label htmlFor="appointmentDate">Appointment Date</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={newOrder.appointmentDate}
                  onChange={(e) => setNewOrder({ ...newOrder, appointmentDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="appointmentTime">Appointment Time</Label>
                <Input
                  id="appointmentTime"
                  type="time"
                  value={newOrder.appointmentTime}
                  onChange={(e) => setNewOrder({ ...newOrder, appointmentTime: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="buildingName">Building Name</Label>
                <Input
                  id="buildingName"
                  value={newOrder.buildingName}
                  onChange={(e) => setNewOrder({ ...newOrder, buildingName: e.target.value })}
                  placeholder="e.g., Menara ABC Tower"
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

        {/* Bulk Assignment Dialog */}
        <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Assign Orders</DialogTitle>
              <DialogDescription>
                Assign {selectedOrderIds.length} selected order{selectedOrderIds.length > 1 ? 's' : ''} to an installer
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bulkInstaller">Select Installer *</Label>
                <Select
                  value={bulkAssignment.installerId?.toString() || ""}
                  onValueChange={(value) =>
                    setBulkAssignment({ ...bulkAssignment, installerId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an installer" />
                  </SelectTrigger>
                  <SelectContent>
                    {installers.map((installer) => (
                      <SelectItem key={installer.id} value={installer.id.toString()}>
                        {installer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulkTimeSlot">Select Time Slot *</Label>
                <Select
                  value={bulkAssignment.timeSlot || ""}
                  onValueChange={(value) =>
                    setBulkAssignment({ ...bulkAssignment, timeSlot: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900 font-medium mb-2">Selected Orders:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedOrderIds.map(orderId => {
                    const order = orders.find(o => o.id === orderId);
                    return order ? (
                      <div key={orderId} className="text-xs text-blue-800">
                        • {order.orderNumber} - {order.customerName}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAssign}>Assign All</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
