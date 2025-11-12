/**
 * InstallerScheduleViewExample.tsx
 * 
 * A comprehensive example component demonstrating the installer schedule view
 * with drag-and-drop assignment functionality, time slot organization, and
 * real-time status updates.
 * 
 * This example showcases:
 * - Fetching orders and installers using tRPC
 * - Drag-and-drop assignment interface
 * - Time slot organization
 * - Color-coded order cards based on WO type
 * - Date navigation
 * - Assignment/unassignment with optimistic updates
 * - Installer availability tracking
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Clock,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Type definitions
type OrderStatus =
  | "pending"
  | "assigned"
  | "on_the_way"
  | "met_customer"
  | "completed"
  | "docket_received"
  | "docket_uploaded"
  | "rescheduled"
  | "withdrawn";

type Order = {
  id: number;
  orderNumber: string;
  ticketNumber: string | null;
  customerName: string;
  customerPhone: string | null;
  buildingName: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  status: OrderStatus;
  priority: "low" | "medium" | "high";
  estimatedDuration: number;
};

type Installer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string | null;
  isActive: number;
};

type Assignment = {
  id: number;
  orderId: number;
  installerId: number;
  assignedAt: Date;
  status: string;
};

export default function InstallerScheduleViewExample() {
  // State management
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [draggedInstaller, setDraggedInstaller] = useState<Installer | null>(null);

  // Format date for API queries
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  // Fetch data using tRPC
  const { data: orders, isLoading: ordersLoading } = trpc.orders.list.useQuery();
  const { data: installers, isLoading: installersLoading } = trpc.installers.list.useQuery();
  const { data: assignments, isLoading: assignmentsLoading } = trpc.assignments.list.useQuery();
  const { data: timeSlots, isLoading: timeSlotsLoading } = trpc.timeSlots.list.useQuery();

  // Utility functions
  const utils = trpc.useUtils();

  // Mutations with optimistic updates
  const assignMutation = trpc.assignments.assign.useMutation({
    onMutate: async ({ orderId, installerId }) => {
      await utils.assignments.list.cancel();
      const previousAssignments = utils.assignments.list.getData();

      // Optimistically add assignment
      utils.assignments.list.setData(undefined, (old) => [
        ...(old || []),
        {
          id: Date.now(), // Temporary ID
          orderId,
          installerId,
          assignedAt: new Date(),
          status: "pending",
        } as Assignment,
      ]);

      // Update order status
      utils.orders.list.setData(undefined, (old) =>
        old?.map((order) =>
          order.id === orderId ? { ...order, status: "assigned" as OrderStatus } : order
        )
      );

      return { previousAssignments };
    },
    onError: (err, variables, context) => {
      utils.assignments.list.setData(undefined, context?.previousAssignments);
      toast.error("Failed to assign order: " + err.message);
    },
    onSuccess: (data, variables) => {
      const installer = installers?.find((i) => i.id === variables.installerId);
      toast.success(`Order assigned to ${installer?.name}`);
    },
    onSettled: () => {
      utils.assignments.list.invalidate();
      utils.orders.list.invalidate();
    },
  });

  const unassignMutation = trpc.assignments.unassign.useMutation({
    onMutate: async ({ orderId }) => {
      await utils.assignments.list.cancel();
      const previousAssignments = utils.assignments.list.getData();

      // Optimistically remove assignment
      utils.assignments.list.setData(undefined, (old) =>
        old?.filter((a) => a.orderId !== orderId)
      );

      // Update order status
      utils.orders.list.setData(undefined, (old) =>
        old?.map((order) =>
          order.id === orderId ? { ...order, status: "pending" as OrderStatus } : order
        )
      );

      return { previousAssignments };
    },
    onError: (err, variables, context) => {
      utils.assignments.list.setData(undefined, context?.previousAssignments);
      toast.error("Failed to unassign order: " + err.message);
    },
    onSuccess: () => {
      toast.success("Order unassigned");
    },
    onSettled: () => {
      utils.assignments.list.invalidate();
      utils.orders.list.invalidate();
    },
  });

  // Filter orders for selected date
  const ordersForDate = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => order.appointmentDate === formattedDate);
  }, [orders, formattedDate]);

  // Get active time slots
  const activeTimeSlots = useMemo(() => {
    if (!timeSlots) return [];
    return timeSlots
      .filter((slot) => slot.isActive === 1)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [timeSlots]);

  // Group orders by time slot
  const ordersByTimeSlot = useMemo(() => {
    const grouped: Record<string, Order[]> = {};

    activeTimeSlots.forEach((slot) => {
      grouped[slot.time] = ordersForDate.filter((order) =>
        order.appointmentTime?.startsWith(slot.time)
      );
    });

    return grouped;
  }, [ordersForDate, activeTimeSlots]);

  // Get assignment for order
  const getAssignmentForOrder = (orderId: number) => {
    return assignments?.find((a) => a.orderId === orderId);
  };

  // Get installer for order
  const getInstallerForOrder = (orderId: number) => {
    const assignment = getAssignmentForOrder(orderId);
    if (!assignment) return null;
    return installers?.find((i) => i.id === assignment.installerId);
  };

  // Get orders count for installer on selected date
  const getInstallerOrderCount = (installerId: number) => {
    return ordersForDate.filter((order) => {
      const assignment = getAssignmentForOrder(order.id);
      return assignment?.installerId === installerId;
    }).length;
  };

  // Determine order card color based on WO type and status
  const getOrderCardColor = (order: Order) => {
    if (order.status === "pending") return "bg-gray-100 border-gray-300";

    // AWO orders - Cyan/Teal
    if (order.orderNumber.startsWith("AWO")) {
      return "bg-cyan-50 border-cyan-300";
    }

    // No WO number - Pink/Rose
    if (!order.orderNumber || order.orderNumber === "-") {
      return "bg-pink-50 border-pink-300";
    }

    // Regular orders - Blue
    return "bg-blue-50 border-blue-300";
  };

  // Handle drag events
  const handleDragStart = (installer: Installer) => {
    setDraggedInstaller(installer);
  };

  const handleDragEnd = () => {
    setDraggedInstaller(null);
  };

  const handleDrop = (orderId: number) => {
    if (!draggedInstaller) return;

    const existingAssignment = getAssignmentForOrder(orderId);
    if (existingAssignment) {
      toast.error("Order is already assigned. Unassign first to reassign.");
      return;
    }

    assignMutation.mutate({
      orderId,
      installerId: draggedInstaller.id,
    });

    setDraggedInstaller(null);
  };

  const handleUnassign = (orderId: number) => {
    unassignMutation.mutate({ orderId });
  };

  // Navigate dates
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Loading state
  const isLoading =
    ordersLoading || installersLoading || assignmentsLoading || timeSlotsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex gap-6">
        {/* Installers Sidebar */}
        <Card className="w-80 h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Installers</CardTitle>
            <p className="text-sm text-muted-foreground">
              Drag installer badges to assign orders
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {installers
              ?.filter((installer) => installer.isActive === 1)
              .map((installer) => {
                const orderCount = getInstallerOrderCount(installer.id);
                return (
                  <div
                    key={installer.id}
                    draggable
                    onDragStart={() => handleDragStart(installer)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border-2 cursor-move transition-all",
                      draggedInstaller?.id === installer.id
                        ? "border-primary bg-primary/10 opacity-50"
                        : "border-gray-200 hover:border-primary hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {installer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{installer.name}</p>
                        {installer.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {installer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={orderCount > 0 ? "default" : "secondary"}>
                      {orderCount}
                    </Badge>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Schedule View */}
        <div className="flex-1">
          {/* Date Navigation */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="icon" onClick={goToNextDay}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={goToToday}>
                    Today
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {ordersForDate.length} orders scheduled
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <div className="space-y-6">
            {activeTimeSlots.map((timeSlot) => {
              const orders = ordersByTimeSlot[timeSlot.time] || [];
              return (
                <Card key={timeSlot.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-xl">{timeSlot.time}</CardTitle>
                      </div>
                      <Badge variant="outline">{orders.length} orders</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No orders for this time slot
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orders.map((order) => {
                          const installer = getInstallerForOrder(order.id);
                          return (
                            <div
                              key={order.id}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDrop(order.id)}
                              className={cn(
                                "p-4 rounded-lg border-2 transition-all",
                                getOrderCardColor(order),
                                draggedInstaller && !installer
                                  ? "ring-2 ring-primary ring-offset-2"
                                  : ""
                              )}
                            >
                              {/* Order Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-sm">
                                    {order.orderNumber}
                                  </p>
                                  {order.ticketNumber && (
                                    <p className="text-xs text-muted-foreground">
                                      {order.ticketNumber}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  variant={
                                    order.priority === "high"
                                      ? "destructive"
                                      : order.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {order.priority}
                                </Badge>
                              </div>

                              {/* Customer Info */}
                              <div className="space-y-2 mb-3">
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {order.customerName}
                                    </p>
                                    {order.customerPhone && (
                                      <p className="text-xs text-muted-foreground">
                                        {order.customerPhone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {order.buildingName && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <p className="text-xs text-muted-foreground truncate">
                                      {order.buildingName}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Assignment Status */}
                              {installer ? (
                                <div className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                        {installer.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium">
                                      {installer.name}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleUnassign(order.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center py-2 text-xs text-muted-foreground border-2 border-dashed rounded">
                                  Drag installer here to assign
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
