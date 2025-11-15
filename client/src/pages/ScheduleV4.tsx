import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { APP_TITLE, getLoginUrl } from "@/const";
import { Navigation } from "@/components/Navigation";
import { OrderHistoryDialog } from "@/components/OrderHistoryDialog";
import { trpc } from "@/lib/trpc";
import { normalizeTimeFormat, parseAppointmentDate, generateTimeSlots, formatTimeSlot } from "@shared/timeUtils";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, X, History } from "lucide-react";
import { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useLocation } from "wouter";
import { toast } from "sonner";

// TIME_SLOTS are now fetched dynamically from database

interface Order {
  id: number;
  orderNumber: string | null;
  customerName: string | null;
  buildingName: string | null;
  serviceNumber: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  status: string;
  address: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceType: string | null;
  ticketNumber: string | null;
}

interface Assignment {
  id: number;
  orderId: number;
  installerId: number;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
}

interface Installer {
  id: number;
  name: string;
}

interface DraggableInstallerProps {
  installer: Installer;
}

function DraggableInstaller({ installer }: DraggableInstallerProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "installer",
    item: { installerId: installer.id, installerName: installer.name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`px-3 py-2 bg-primary text-primary-foreground rounded-md cursor-move text-sm font-medium hover:bg-primary/90 transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <User className="h-4 w-4 inline mr-2" />
      {installer.name}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  assignedInstaller: string | null;
  onAssign: (orderId: number, installerId: number, installerName: string) => void;
  onUnassign: (orderId: number) => void;
  onTimeChange: (orderId: number) => void;
  onStatusChange: (orderId: number, newStatus: string) => void;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (orderId: number) => void;
}

function OrderCard({ order, assignedInstaller, onAssign, onUnassign, onTimeChange, onStatusChange, bulkMode, isSelected, onToggleSelection }: OrderCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Card background color based on WO type (4-color scheme)
  const getCardBackgroundColor = (status: string) => {
    const isAWO = order.orderNumber?.startsWith('AWO');
    const hasNoWO = !order.orderNumber || order.orderNumber.trim() === '';
    
    // Pending status always uses gray regardless of WO type
    if (status === 'pending') {
      return 'bg-gray-100';
    }
    
    // For non-pending statuses: AWO = Light Lavender, No-WO = Light Yellow, Regular = Green
    if (isAWO) {
      return 'bg-purple-100';
    } else if (hasNoWO) {
      return 'bg-yellow-100';
    } else {
      return 'bg-green-50';
    }
  };
  
  // Status badge color based on actual status (each status has unique color)
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'on_the_way':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'met_customer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'order_completed':
        return 'bg-lime-100 text-lime-800 border-lime-300';
      case 'docket_received':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'docket_uploaded':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'ready_to_invoice':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'invoiced':
        return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'completed':
        return 'bg-green-600 text-white border-green-700';
      case 'customer_issue':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'building_issue':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'network_issue':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'withdrawn':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "installer",
    drop: (item: { installerId: number; installerName: string }) => {
      onAssign(order.id, item.installerId, item.installerName);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const isAssigned = !!assignedInstaller;

  // Get the background color based on WO type
  const cardBgColor = getCardBackgroundColor(order.status);

  return (
    <div
      ref={drop as any}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`p-3 rounded-lg border-2 transition-all relative ${cardBgColor} ${isOver ? "ring-2 ring-primary ring-offset-2" : ""} ${isHovered ? "shadow-lg scale-105 z-10" : ""} ${isSelected ? "ring-2 ring-blue-500" : ""}`}
    >
      {bulkMode && (
        <div className="absolute top-2 left-2 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection?.(order.id)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="font-semibold text-xs truncate" title={order.serviceNumber || 'N/A'}>
            {order.serviceNumber || 'N/A'}
          </div>
          {order.orderNumber && order.orderNumber.trim() !== '' && (
            <div className="text-xs text-muted-foreground truncate" title={order.orderNumber}>
              {order.orderNumber}
            </div>
          )}
        </div>
        {isAssigned && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0"
            onClick={() => onUnassign(order.id)}
            title="Remove assignment"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="text-xs space-y-1">
        <div className="font-medium">{order.customerName}</div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          {order.appointmentTime}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {order.buildingName}
        </div>
        <div className="mt-1">
          <Select value={order.status} onValueChange={(value) => onStatusChange(order.id, value)}>
            <SelectTrigger className={`h-6 text-xs w-full font-medium border ${getStatusBadgeColor(order.status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="on_the_way">On the Way</SelectItem>
              <SelectItem value="met_customer">Met Customer</SelectItem>
              <SelectItem value="order_completed">Order Completed</SelectItem>
              <SelectItem value="docket_received">Docket Received</SelectItem>
              <SelectItem value="docket_uploaded">Docket Uploaded</SelectItem>
              <SelectItem value="ready_to_invoice">Ready to Invoice</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="customer_issue">Customer Issue</SelectItem>
              <SelectItem value="building_issue">Building Issue</SelectItem>
              <SelectItem value="network_issue">Network Issue</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isAssigned && (
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-900 bg-white/80 px-2 py-1 rounded">
            <User className="h-3 w-3" />
            {assignedInstaller}
          </div>
        </div>
      )}

      <div className="mt-2 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-xs flex-1"
          onClick={() => onTimeChange(order.id)}
        >
          Change Time
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={() => setShowHistory(true)}
          title="View History"
        >
          <History className="h-3 w-3" />
        </Button>
      </div>

      {/* History Dialog */}
      <OrderHistoryDialog
        orderId={order.id}
        orderNumber={order.serviceNumber || order.orderNumber || "N/A"}
        open={showHistory}
        onOpenChange={setShowHistory}
      />

      {/* Expanded details on hover */}
      {isHovered && (
        <div className="absolute left-0 right-0 top-full mt-1 p-3 bg-white border-2 border-primary rounded-lg shadow-xl z-20 text-xs space-y-2">
          <div className="font-semibold text-sm border-b pb-1 mb-2">Additional Details</div>
          
          {order.orderNumber && (
            <div>
              <span className="font-medium">WO No.:</span> {order.orderNumber}
            </div>
          )}
          
          {order.ticketNumber && (
            <div>
              <span className="font-medium">Ticket:</span> {order.ticketNumber}
            </div>
          )}
          
          {order.address && (
            <div>
              <span className="font-medium">Full Address:</span>
              <div className="text-muted-foreground mt-0.5">{order.address}</div>
            </div>
          )}
          
          {order.customerPhone && (
            <div>
              <span className="font-medium">Phone:</span> {order.customerPhone}
            </div>
          )}
          
          {order.customerEmail && (
            <div>
              <span className="font-medium">Email:</span> {order.customerEmail}
            </div>
          )}
          
          {order.serviceType && (
            <div>
              <span className="font-medium">Service Type:</span> {order.serviceType}
            </div>
          )}
          

        </div>
      )}
    </div>
  );
}

export default function ScheduleV4() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAllUnassigned, setShowAllUnassigned] = useState(false);
  const [isScheduleConfirmed, setIsScheduleConfirmed] = useState(false);
  const [timeChangeDialog, setTimeChangeDialog] = useState<{
    open: boolean;
    orderId: number | null;
    currentTime: string;
  }>({
    open: false,
    orderId: null,
    currentTime: "",
  });
  const [newTime, setNewTime] = useState("");
  const [completionConfirmDialog, setCompletionConfirmDialog] = useState<{
    open: boolean;
    orderId: number | null;
    orderNumber: string;
    customerName: string;
  }>({
    open: false,
    orderId: null,
    orderNumber: "",
    customerName: "",
  });
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    orderId: number | null;
    orderNumber: string;
    customerName: string;
    currentDate: string;
    currentTime: string;
  }>({
    open: false,
    orderId: null,
    orderNumber: "",
    customerName: "",
    currentDate: "",
    currentTime: "",
  });
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState<"customer_issue" | "building_issue" | "network_issue">("customer_issue");
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [bulkAssignMode, setBulkAssignMode] = useState(false);

  const { data: orders = [], refetch: refetchOrders } = trpc.orders.list.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const { data: installers = [] } = trpc.installers.list.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const { data: assignments = [], refetch: refetchAssignments } = trpc.assignments.list.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const { data: timeSlotsData = [] } = trpc.timeSlots.listActive.useQuery();
  
  // Convert time slots data to array of time strings
  const TIME_SLOTS = timeSlotsData.map((slot: any) => slot.time);
  const updateOrderMutation = trpc.orders.update.useMutation();
  const createAssignmentMutation = trpc.assignments.create.useMutation();
  const deleteAssignmentMutation = trpc.assignments.delete.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Filter orders for selected date or all unassigned
  const ordersForDate = orders.filter((order) => {
    if (!order.appointmentDate || !order.appointmentTime) return false;
    
    // If showing all unassigned, only show orders without assignments
    if (showAllUnassigned) {
      const isAssigned = assignments.some(a => a.orderId === order.id);
      const statusMatches = !statusFilter || order.status === statusFilter;
      return !isAssigned && statusMatches;
    }
    
    // Parse appointment date using shared utility
    const orderDate = parseAppointmentDate(order.appointmentDate);
    if (!orderDate) return false;
    
    // Compare with selected date (compare year, month, day only)
    const dateMatches = orderDate.getFullYear() === selectedDate.getFullYear() &&
           orderDate.getMonth() === selectedDate.getMonth() &&
           orderDate.getDate() === selectedDate.getDate();
    
    // Apply status filter if set
    const statusMatches = !statusFilter || order.status === statusFilter;
    
    return dateMatches && statusMatches;
  });

  // Create a map of orderId to installer name
  const orderInstallerMap: Record<number, string> = {};
  assignments.forEach((assignment) => {
    const installer = installers.find((i) => i.id === assignment.installerId);
    if (installer) {
      orderInstallerMap[assignment.orderId] = installer.name;
    }
  });

  // Group orders by time slot
  const ordersByTimeSlot: Record<string, Order[]> = {};
  TIME_SLOTS.forEach((slot) => {
    ordersByTimeSlot[slot] = [];
  });

  ordersForDate.forEach((order) => {
    if (order.appointmentTime) {
      // Normalize time format by removing leading zeros for matching
      // e.g., "02:30 PM" becomes "2:30 PM"
      const normalizedOrderTime = order.appointmentTime.replace(/^0(\d)/, '$1');
      
      const timeSlot = TIME_SLOTS.find((slot) => {
        const normalizedSlot = slot.replace(/^0(\d)/, '$1');
        return normalizedOrderTime.startsWith(normalizedSlot);
      });
      
      if (timeSlot) {
        ordersByTimeSlot[timeSlot].push(order);
      }
    }
  });

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleAssign = async (
    orderId: number,
    installerId: number,
    installerName: string
  ) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order || !order.appointmentDate || !order.appointmentTime) {
        toast.error("Order missing appointment details");
        return;
      }

      // Check if order is already assigned to a different installer
      const existingAssignment = assignments.find((a) => a.orderId === orderId);
      if (existingAssignment && existingAssignment.installerId !== installerId) {
        // Delete old assignment
        await deleteAssignmentMutation.mutateAsync({ id: existingAssignment.id });
      } else if (existingAssignment && existingAssignment.installerId === installerId) {
        // Already assigned to this installer
        toast.info("Already assigned to this installer");
        return;
      }

      // Create assignment FIRST (before updating status)
      // Parse appointment date using shared utility (handles DD/MM/YYYY and other formats)
      const scheduledDate = parseAppointmentDate(order.appointmentDate);
      if (!scheduledDate) {
        toast.error("Invalid appointment date format");
        return;
      }
      
      // Parse appointment time and calculate end time
      // Support both 12-hour format ("10:00 AM", "02:30 PM") and 24-hour format ("10:00", "14:30")
      let hours: number;
      let minutes: string;
      
      // Try 12-hour format first
      const time12Match = order.appointmentTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (time12Match) {
        // 12-hour format
        hours = parseInt(time12Match[1]);
        minutes = time12Match[2];
        const period = time12Match[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }
      } else {
        // Try 24-hour format
        const time24Match = order.appointmentTime.match(/(\d{1,2}):(\d{2})/);
        if (time24Match) {
          hours = parseInt(time24Match[1]);
          minutes = time24Match[2];
          
          // Validate 24-hour format
          if (hours < 0 || hours > 23) {
            toast.error("Invalid time format (hours must be 0-23)");
            return;
          }
        } else {
          toast.error("Invalid time format. Use 12-hour (10:00 AM) or 24-hour (14:30) format");
          return;
        }
      }
      
      const scheduledStartTime = `${hours.toString().padStart(2, "0")}:${minutes}`;
      const endHour = (hours + 2) % 24;
      const scheduledEndTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;

      await createAssignmentMutation.mutateAsync({
        orderId,
        installerId,
        scheduledDate,
        scheduledStartTime,
        scheduledEndTime,
      });

      // Update order status ONLY after assignment is successfully created
      await updateOrderMutation.mutateAsync({
        id: orderId,
        status: "assigned",
      });

      toast.success(`Assigned to ${installerName}`);
      await refetchOrders();
      await refetchAssignments();
    } catch (error) {
      console.error("Failed to assign installer:", error);
      toast.error("Failed to assign installer");
    }
  };

  const handleUnassign = async (orderId: number) => {
    try {
      // Find assignment
      const assignment = assignments.find((a) => a.orderId === orderId);
      if (assignment) {
        await deleteAssignmentMutation.mutateAsync({ id: assignment.id });
      }

      await updateOrderMutation.mutateAsync({
        id: orderId,
        status: "pending",
      });

      toast.success("Installer unassigned");
      await refetchOrders();
      await refetchAssignments();
    } catch (error) {
      console.error("Failed to unassign:", error);
      toast.error("Failed to unassign installer");
    }
  };

  const handleTimeChange = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setTimeChangeDialog({
        open: true,
        orderId,
        currentTime: order.appointmentTime || "",
      });
      setNewTime(order.appointmentTime || "");
    }
  };

  const handleTimeChangeSubmit = async () => {
    if (!timeChangeDialog.orderId || !newTime) return;

    try {
      await updateOrderMutation.mutateAsync({
        id: timeChangeDialog.orderId,
        appointmentTime: normalizeTimeFormat(newTime) || newTime,
      });

      toast.success("Appointment time updated");
      setTimeChangeDialog({ open: false, orderId: null, currentTime: "" });
      await refetchOrders();
      await refetchAssignments();
    } catch (error) {
      console.error("Failed to update time:", error);
      toast.error("Failed to update time");
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    // If changing to completed, show confirmation dialog first
    if (newStatus === 'completed') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setCompletionConfirmDialog({
          open: true,
          orderId,
          orderNumber: order.orderNumber || 'N/A',
          customerName: order.customerName || 'Unknown Customer',
        });
      }
      return; // Don't proceed with status change yet
    }

    // If changing to rescheduled, show reschedule dialog first
    if (newStatus === 'rescheduled') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setRescheduleDialog({
          open: true,
          orderId,
          orderNumber: order.orderNumber || order.serviceNumber || 'N/A',
          customerName: order.customerName || 'Unknown Customer',
          currentDate: order.appointmentDate || '',
          currentTime: order.appointmentTime || '',
        });
        // Pre-fill with current date and time
        setRescheduleDate(order.appointmentDate || '');
        setRescheduleTime(order.appointmentTime || '');
      }
      return; // Don't proceed with status change yet
    }

    // For other statuses, proceed normally
    try {
      // Optimistic update
      await utils.orders.list.cancel();
      const previousOrders = utils.orders.list.getData();
      
      utils.orders.list.setData(undefined, (old) => 
        old?.map((order) => 
          order.id === orderId ? { ...order, status: newStatus as typeof order.status } : order
        )
      );

      await updateOrderMutation.mutateAsync({
        id: orderId,
        status: newStatus as "pending" | "assigned" | "on_the_way" | "met_customer" | "order_completed" | "docket_received" | "docket_uploaded" | "ready_to_invoice" | "invoiced" | "completed" | "customer_issue" | "building_issue" | "network_issue" | "rescheduled" | "withdrawn",
      });

      toast.success("Status updated");
      await refetchOrders();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
      // Rollback on error
      await refetchOrders();
    }
  };

  const handleConfirmCompletion = async () => {
    const { orderId } = completionConfirmDialog;
    if (!orderId) return;

    try {
      // Optimistic update
      await utils.orders.list.cancel();
      const previousOrders = utils.orders.list.getData();
      
      utils.orders.list.setData(undefined, (old) => 
        old?.map((order) => 
          order.id === orderId ? { ...order, status: 'completed' as typeof order.status } : order
        )
      );

      await updateOrderMutation.mutateAsync({
        id: orderId,
        status: "completed",
      });

      toast.success("Order marked as completed");
      await refetchOrders();
    } catch (error) {
      toast.error("Failed to mark order as completed");
      await refetchOrders();
    } finally {
      // Close dialog
      setCompletionConfirmDialog({
        open: false,
        orderId: null,
        orderNumber: "",
        customerName: "",
      });
    }
  };

  const handleConfirmReschedule = async () => {
    const { orderId } = rescheduleDialog;
    if (!orderId || !rescheduleDate || !rescheduleTime) {
      toast.error("Please select both date and time");
      return;
    }

    try {
      // Optimistic update
      await utils.orders.list.cancel();
      const previousOrders = utils.orders.list.getData();
      
      utils.orders.list.setData(undefined, (old) => 
        old?.map((order) => 
          order.id === orderId ? { 
            ...order, 
            status: 'rescheduled' as typeof order.status,
            appointmentDate: rescheduleDate,
            appointmentTime: rescheduleTime,
          } : order
        )
      );

      // Convert ISO date string (YYYY-MM-DD) to Date object
      const rescheduleDateObj = new Date(rescheduleDate + 'T00:00:00');
      
      await updateOrderMutation.mutateAsync({
        id: orderId,
        status: "rescheduled",
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
        rescheduledDate: rescheduleDateObj,
        rescheduledTime: rescheduleTime,
        rescheduleReason,
      });

      toast.success("Order rescheduled successfully");
      await refetchOrders();
      await refetchAssignments();
    } catch (error) {
      toast.error("Failed to reschedule order");
      await refetchOrders();
    } finally {
      // Close dialog and reset
      setRescheduleDialog({
        open: false,
        orderId: null,
        orderNumber: "",
        customerName: "",
        currentDate: "",
        currentTime: "",
      });
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("customer_issue");
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleBulkAssignMode = () => {
    setBulkAssignMode(!bulkAssignMode);
    if (bulkAssignMode) {
      // Clear selections when exiting bulk mode
      setSelectedOrders(new Set());
    }
  };

  const handleBulkAssign = async (installerId: number) => {
    if (selectedOrders.size === 0) {
      toast.error("No orders selected");
      return;
    }

    try {
      const selectedOrdersList = Array.from(selectedOrders);
      const installer = installers.find((i) => i.id === installerId);
      
      if (!installer) {
        toast.error("Installer not found");
        return;
      }

      // Assign each selected order
      for (const orderId of selectedOrdersList) {
        const order = orders.find((o) => o.id === orderId);
        if (!order) continue;

        const date = parseAppointmentDate(order.appointmentDate);
        if (!date) continue;

        // Create assignment
        // Calculate end time (assume 2 hours duration)
        const startTime = order.appointmentTime || "09:00";
        const [hours, minutes] = startTime.split(":").map(Number);
        const endHours = hours + 2;
        const scheduledEndTime = `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        
        await createAssignmentMutation.mutateAsync({
          orderId,
          installerId,
          scheduledDate: date,
          scheduledStartTime: startTime,
          scheduledEndTime,
        });

        // Update order status
        await updateOrderMutation.mutateAsync({
          id: orderId,
          status: "assigned",
        });
      }

      toast.success(`Assigned ${selectedOrdersList.length} orders to ${installer.name}`);
      
      // Clear selections and exit bulk mode
      setSelectedOrders(new Set());
      setBulkAssignMode(false);
      
      await refetchOrders();
      await refetchAssignments();
    } catch (error) {
      console.error("Failed to bulk assign:", error);
      toast.error("Failed to assign orders");
      await refetchOrders();
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Calendar Schedule</h1>
                <p className="text-muted-foreground">
                  Drag installers onto orders to assign them
                </p>
              </div>
              <div className="flex items-center gap-4">
                {!isScheduleConfirmed && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                    <span className="font-medium">Draft Mode</span>
                    <span className="text-xs">No notifications sent</span>
                  </div>
                )}
                <Button
                  size="lg"
                  variant={bulkAssignMode ? "default" : "outline"}
                  onClick={toggleBulkAssignMode}
                >
                  {bulkAssignMode ? `Selected: ${selectedOrders.size}` : "Bulk Assign"}
                </Button>
                <Button
                  size="lg"
                  variant={isScheduleConfirmed ? "outline" : "default"}
                  onClick={() => {
                    if (isScheduleConfirmed) {
                      setIsScheduleConfirmed(false);
                      toast.info("Schedule returned to draft mode");
                    } else {
                      // Count assigned orders
                      const assignedCount = assignments.filter(a => 
                        orders.some(o => o.id === a.orderId && o.appointmentDate &&
                          new Date(o.appointmentDate).toDateString() === selectedDate.toDateString())
                      ).length;
                      
                      if (assignedCount === 0) {
                        toast.error("No assignments to confirm");
                        return;
                      }
                      
                      setIsScheduleConfirmed(true);
                      toast.success(`Schedule confirmed! ${assignedCount} assignments ready for notification.`);
                    }
                  }}
                  className={isScheduleConfirmed ? "" : "bg-green-600 hover:bg-green-700"}
                >
                  {isScheduleConfirmed ? "Edit Schedule" : "Confirm Schedule"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Installer Panel */}
            <Card className="w-64 p-4 h-fit sticky top-4">
              <h2 className="font-semibold mb-4">Available Installers</h2>
              <div className="space-y-3">
                {installers.map((installer) => (
                  <div key={installer.id} className="space-y-2">
                    <DraggableInstaller installer={installer} />
                    {bulkAssignMode && selectedOrders.size > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => handleBulkAssign(installer.id)}
                      >
                        Assign {selectedOrders.size} to {installer.name}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Calendar Grid */}
            <div className="flex-1">
              {/* Date Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={handlePreviousDay} disabled={showAllUnassigned}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold">
                  {showAllUnassigned ? "All Unassigned Orders" : selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={handleNextDay} disabled={showAllUnassigned}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* View Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={!showAllUnassigned ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAllUnassigned(false)}
                  className="text-xs"
                >
                  Daily View
                </Button>
                <Button
                  variant={showAllUnassigned ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAllUnassigned(true)}
                  className="text-xs"
                >
                  All Unassigned
                </Button>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={statusFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === "assigned" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("assigned")}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
                >
                  Assigned
                </Button>
                <Button
                  variant={statusFilter === "on_the_way" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("on_the_way")}
                  className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300"
                >
                  On the Way
                </Button>
                <Button
                  variant={statusFilter === "met_customer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("met_customer")}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-700 border-green-300"
                >
                  Met Customer
                </Button>
                <Button
                  variant={statusFilter === "order_completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("order_completed")}
                  className="text-xs bg-lime-100 hover:bg-lime-200 text-lime-700 border-lime-300"
                >
                  Order Completed
                </Button>
                <Button
                  variant={statusFilter === "docket_received" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("docket_received")}
                  className="text-xs bg-teal-100 hover:bg-teal-200 text-teal-700 border-teal-300"
                >
                  Docket Received
                </Button>
                <Button
                  variant={statusFilter === "docket_uploaded" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("docket_uploaded")}
                  className="text-xs bg-cyan-100 hover:bg-cyan-200 text-cyan-700 border-cyan-300"
                >
                  Docket Uploaded
                </Button>
                <Button
                  variant={statusFilter === "ready_to_invoice" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ready_to_invoice")}
                  className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300"
                >
                  Ready to Invoice
                </Button>
                <Button
                  variant={statusFilter === "invoiced" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("invoiced")}
                  className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-700 border-violet-300"
                >
                  Invoiced
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("completed")}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white border-green-700"
                >
                  Completed
                </Button>
                <Button
                  variant={statusFilter === "customer_issue" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("customer_issue")}
                  className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300"
                >
                  Customer Issue
                </Button>
                <Button
                  variant={statusFilter === "building_issue" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("building_issue")}
                  className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300"
                >
                  Building Issue
                </Button>
                <Button
                  variant={statusFilter === "network_issue" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("network_issue")}
                  className="text-xs bg-pink-100 hover:bg-pink-200 text-pink-700 border-pink-300"
                >
                  Network Issue
                </Button>
                <Button
                  variant={statusFilter === "rescheduled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("rescheduled")}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300"
                >
                  Rescheduled
                </Button>
                <Button
                  variant={statusFilter === "withdrawn" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("withdrawn")}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
                >
                  Withdrawn
                </Button>
              </div>

              {/* Time Slots */}
              <div className="space-y-4">
                {TIME_SLOTS.map((timeSlot) => (
                  <Card key={timeSlot} className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 font-semibold text-lg">{timeSlot}</div>
                      <div className="flex-1">
                        {ordersByTimeSlot[timeSlot].length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {ordersByTimeSlot[timeSlot].map((order) => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                assignedInstaller={orderInstallerMap[order.id] || null}
                                onAssign={handleAssign}
                                onUnassign={handleUnassign}
                                onTimeChange={handleTimeChange}
                                onStatusChange={handleStatusChange}
                                bulkMode={bulkAssignMode}
                                isSelected={selectedOrders.has(order.id)}
                                onToggleSelection={toggleOrderSelection}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm italic">
                            No orders for this time slot
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Time Change Dialog */}
        <Dialog
          open={timeChangeDialog.open}
          onOpenChange={(open) =>
            setTimeChangeDialog({ open, orderId: null, currentTime: "" })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Appointment Time</DialogTitle>
              <DialogDescription>
                Select a new time slot for this appointment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newTime">New Time Slot</Label>
                <Select value={newTime} onValueChange={setNewTime}>
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
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setTimeChangeDialog({ open: false, orderId: null, currentTime: "" })
                }
              >
                Cancel
              </Button>
              <Button onClick={handleTimeChangeSubmit}>Update Time</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Completion Confirmation Dialog */}
        <Dialog
          open={completionConfirmDialog.open}
          onOpenChange={(open) =>
            !open &&
            setCompletionConfirmDialog({
              open: false,
              orderId: null,
              orderNumber: "",
              customerName: "",
            })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Order Completion</DialogTitle>
              <DialogDescription>
                Are you sure you want to mark this order as completed?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Order Number:</span>
                <span>{completionConfirmDialog.orderNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Customer:</span>
                <span>{completionConfirmDialog.customerName}</span>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ This action will mark the order as completed. Make sure all work has been finished and documented.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setCompletionConfirmDialog({
                    open: false,
                    orderId: null,
                    orderNumber: "",
                    customerName: "",
                  })
                }
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmCompletion}>
                Confirm Completion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog
          open={rescheduleDialog.open}
          onOpenChange={(open) =>
            !open &&
            setRescheduleDialog({
              open: false,
              orderId: null,
              orderNumber: "",
              customerName: "",
              currentDate: "",
              currentTime: "",
            })
          }
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Order</DialogTitle>
              <DialogDescription>
                Select a new date and time for this order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Order:</span>
                  <span>{rescheduleDialog.orderNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Customer:</span>
                  <span>{rescheduleDialog.customerName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-reason">Reschedule Reason</Label>
                <Select
                  value={rescheduleReason}
                  onValueChange={(value: "customer_issue" | "building_issue" | "network_issue") =>
                    setRescheduleReason(value)
                  }
                >
                  <SelectTrigger id="reschedule-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_issue">Customer Issue</SelectItem>
                    <SelectItem value="building_issue">Building Issue</SelectItem>
                    <SelectItem value="network_issue">Network Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-date">New Date</Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-time">New Time</Label>
                <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                  <SelectTrigger id="reschedule-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {generateTimeSlots(8, 18).map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTimeSlot(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  ℹ️ The order will be rescheduled to the new date and time. The installer assignment will be updated automatically.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRescheduleDialog({
                    open: false,
                    orderId: null,
                    orderNumber: "",
                    customerName: "",
                    currentDate: "",
                    currentTime: "",
                  });
                  setRescheduleDate("");
                  setRescheduleTime("");
                  setRescheduleReason("customer_issue");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmReschedule}>
                Confirm Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
