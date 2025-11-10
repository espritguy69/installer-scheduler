import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

type ViewMode = "daily" | "weekly";

export default function Schedule() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedOrder, setDraggedOrder] = useState<any>(null);

  const { data: orders = [], isLoading: ordersLoading } = trpc.orders.list.useQuery();
  const { data: installers = [], isLoading: installersLoading } = trpc.installers.list.useQuery();
  const { data: assignments = [], isLoading: assignmentsLoading } = trpc.assignments.list.useQuery();
  
  const createAssignment = trpc.assignments.create.useMutation();
  const updateAssignment = trpc.assignments.update.useMutation();
  const deleteAssignment = trpc.assignments.delete.useMutation();
  const updateOrder = trpc.orders.update.useMutation();
  const utils = trpc.useUtils();

  // Filter unassigned orders
  const unassignedOrders = useMemo(() => {
    const assignedOrderIds = new Set(assignments.map(a => a.orderId));
    return orders.filter(o => !assignedOrderIds.has(o.id) && o.status === "pending");
  }, [orders, assignments]);

  // Time slots for daily view (8 AM to 6 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  }, []);

  // Get week dates for weekly view
  const weekDates = useMemo(() => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  // Filter assignments by current view
  const filteredAssignments = useMemo(() => {
    if (viewMode === "daily") {
      return assignments.filter(a => {
        const assignmentDate = new Date(a.scheduledDate);
        return assignmentDate.toDateString() === currentDate.toDateString();
      });
    } else {
      return assignments.filter(a => {
        const assignmentDate = new Date(a.scheduledDate);
        return weekDates.some(d => d.toDateString() === assignmentDate.toDateString());
      });
    }
  }, [assignments, currentDate, weekDates, viewMode]);

  const handleDragStart = (e: React.DragEvent, order: any) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, installerId: number, date: Date, timeSlot: string) => {
    e.preventDefault();
    
    if (!draggedOrder) return;

    try {
      const [hours, minutes] = timeSlot.split(":").map(Number);
      const endHour = hours + Math.floor(draggedOrder.estimatedDuration / 60);
      const endMinute = minutes + (draggedOrder.estimatedDuration % 60);
      
      const scheduledDate = new Date(date);
      scheduledDate.setHours(0, 0, 0, 0);

      await createAssignment.mutateAsync({
        orderId: draggedOrder.id,
        installerId,
        scheduledDate,
        scheduledStartTime: timeSlot,
        scheduledEndTime: `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`,
      });

      // Update order status to 'assigned'
      await updateOrder.mutateAsync({
        id: draggedOrder.id,
        status: "assigned",
      });

      await utils.assignments.list.invalidate();
      await utils.orders.list.invalidate();
      
      toast.success("Order assigned successfully");
      setDraggedOrder(null);
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to assign order");
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      await deleteAssignment.mutateAsync({ id: assignmentId });
      await utils.assignments.list.invalidate();
      await utils.orders.list.invalidate();
      toast.success("Assignment removed");
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("Failed to remove assignment");
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "daily") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredAssignments.map(assignment => {
        const order = orders.find(o => o.id === assignment.orderId);
        const installer = installers.find(i => i.id === assignment.installerId);
        
        return {
          Date: new Date(assignment.scheduledDate).toLocaleDateString(),
          "Start Time": assignment.scheduledStartTime,
          "End Time": assignment.scheduledEndTime,
          Installer: installer?.name || "Unknown",
          "Order Number": order?.orderNumber || "",
          Customer: order?.customerName || "",
          "Service Type": order?.serviceType || "",
          Address: order?.address || "",
          Priority: order?.priority || "",
          Status: assignment.status,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
      
      const fileName = viewMode === "daily" 
        ? `schedule-${currentDate.toISOString().split("T")[0]}.xlsx`
        : `schedule-week-${weekDates[0].toISOString().split("T")[0]}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      toast.success("Schedule exported successfully");
    } catch (error) {
      console.error("Error exporting schedule:", error);
      toast.error("Failed to export schedule");
    }
  };

  const getAssignmentForSlot = (installerId: number, date: Date, timeSlot: string) => {
    return filteredAssignments.find(a => {
      const assignmentDate = new Date(a.scheduledDate);
      return (
        a.installerId === installerId &&
        assignmentDate.toDateString() === date.toDateString() &&
        a.scheduledStartTime === timeSlot
      );
    });
  };

  const { user, logout } = useAuth();

  if (ordersLoading || installersLoading || assignmentsLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading...</div>
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
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Schedule</h1>
          <p className="text-muted-foreground">
            Drag and drop orders to assign them to installers
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "daily" ? "default" : "outline"}
            onClick={() => setViewMode("daily")}
          >
            Daily
          </Button>
          <Button
            variant={viewMode === "weekly" ? "default" : "outline"}
            onClick={() => setViewMode("weekly")}
          >
            Weekly
          </Button>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span className="text-lg font-semibold">
            {viewMode === "daily"
              ? currentDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
              : `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </span>
        </div>
        <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Unassigned Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Orders</CardTitle>
            <CardDescription>{unassignedOrders.length} pending orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassignedOrders.map(order => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, order)}
                  className="p-3 border rounded-lg cursor-move hover:bg-accent hover:border-primary transition-colors"
                >
                  <div className="font-semibold text-sm">{order.orderNumber}</div>
                  <div className="text-xs text-muted-foreground">{order.customerName}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {order.estimatedDuration} min • {order.priority}
                  </div>
                </div>
              ))}
              {unassignedOrders.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No unassigned orders
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === "daily" ? "Daily Schedule" : "Weekly Schedule"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `100px repeat(${viewMode === "daily" ? installers.length : 7}, 1fr)` }}>
                  <div className="font-semibold text-sm p-2">Time</div>
                  {viewMode === "daily" ? (
                    installers.map(installer => (
                      <div key={installer.id} className="font-semibold text-sm p-2 text-center border rounded">
                        {installer.name}
                      </div>
                    ))
                  ) : (
                    weekDates.map(date => (
                      <div key={date.toISOString()} className="font-semibold text-sm p-2 text-center border rounded">
                        {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                    ))
                  )}
                </div>

                {/* Time Slots */}
                {timeSlots.map(timeSlot => (
                  <div key={timeSlot} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `100px repeat(${viewMode === "daily" ? installers.length : 7}, 1fr)` }}>
                    <div className="text-sm p-2 font-medium">{timeSlot}</div>
                    {viewMode === "daily" ? (
                      installers.map(installer => {
                        const assignment = getAssignmentForSlot(installer.id, currentDate, timeSlot);
                        const order = assignment ? orders.find(o => o.id === assignment.orderId) : null;
                        
                        return (
                          <div
                            key={installer.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, installer.id, currentDate, timeSlot)}
                            className="min-h-[60px] border rounded p-2 hover:bg-accent/50 transition-colors"
                          >
                            {assignment && order && (
                              <div className="bg-primary text-primary-foreground rounded p-2 text-xs relative group">
                                <button
                                  onClick={() => handleRemoveAssignment(assignment.id)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                                <div className="font-semibold">{order.orderNumber}</div>
                                <div className="text-xs opacity-90">{order.customerName}</div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      weekDates.map(date => (
                        <div
                          key={date.toISOString()}
                          className="min-h-[60px] border rounded p-1 text-xs"
                        >
                          {installers.map(installer => {
                            const assignment = getAssignmentForSlot(installer.id, date, timeSlot);
                            const order = assignment ? orders.find(o => o.id === assignment.orderId) : null;
                            
                            if (assignment && order) {
                              return (
                                <div key={assignment.id} className="bg-primary text-primary-foreground rounded p-1 mb-1 text-xs">
                                  <div className="font-semibold truncate">{installer.name}</div>
                                  <div className="truncate opacity-90">{order.orderNumber}</div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
