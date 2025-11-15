import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { normalizeTimeFormat, parseAppointmentDate, generateTimeSlots, formatTimeSlot } from "@shared/timeUtils";
import { APP_TITLE } from "@/const";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, FileText, Loader2, Upload, X } from "lucide-react";
import * as XLSX from 'xlsx';
import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Orders() {
  const { user, logout } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [rescheduleReason, setRescheduleReason] = useState<string>("");
  const [rescheduledDate, setRescheduledDate] = useState<string>("");
  const [rescheduledTime, setRescheduledTime] = useState<string>("");

  // Export to Excel function
  const handleExportToExcel = () => {
    // Get the current filtered and sorted orders
    const currentOrders = orders || [];
    
    if (currentOrders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    // Prepare data for export
    const exportData = currentOrders.map((order: any) => ({
      "WO No.": order.orderNumber || (order.serviceNumber ? `SN: ${order.serviceNumber}` : "-"),
      "Ticket No.": order.ticketNumber || "-",
      "Service No.": order.serviceNumber || "-",
      "Customer": order.customerName || "-",
      "Phone": order.customerPhone || "-",
      "Address": order.address || "-",
      "WO Type": order.woType || "-",
      "Priority": order.priority || "-",
      "Status": order.status || "-",
      "Appointment Date": order.appointmentDate ? (parseAppointmentDate(order.appointmentDate)?.toLocaleDateString() || order.appointmentDate) : "-",
      "Appointment Time": order.appointmentTime || "-",
      "Installer": getInstallerName(order.id),
      "Docket Status": order.docketStatus || "-",
      "Notes": order.notes || "-",
      "Reschedule Reason": order.rescheduleReason || "-",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // WO No.
      { wch: 12 }, // Ticket No.
      { wch: 15 }, // Service No.
      { wch: 25 }, // Customer
      { wch: 15 }, // Phone
      { wch: 30 }, // Address
      { wch: 20 }, // WO Type
      { wch: 10 }, // Priority
      { wch: 15 }, // Status
      { wch: 15 }, // Appointment Date
      { wch: 15 }, // Appointment Time
      { wch: 20 }, // Installer
      { wch: 15 }, // Docket Status
      { wch: 30 }, // Notes
      { wch: 20 }, // Reschedule Reason
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Orders_Export_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
    toast.success(`Exported ${currentOrders.length} orders to ${filename}`);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDocketUploadOpen, setIsDocketUploadOpen] = useState(false);
  const [docketUploadOrder, setDocketUploadOrder] = useState<{ id: number; status: string; orderNumber: string } | null>(null);
  const [docketFile, setDocketFile] = useState<File | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rescheduleReasonFilter, setRescheduleReasonFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Date filter mode: 'single' or 'range'
  const [dateFilterMode, setDateFilterMode] = useState<'single' | 'range'>('single');
  
  // Default to today's date for multi-user collaboration
  const [dateFilter, setDateFilter] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  
  // Date range filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Always reset to today's date when component mounts or becomes visible
  useEffect(() => {
    const updateToToday = () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setDateFilter(todayStr);
    };
    
    // Update on mount
    updateToToday();
    
    // Update when page becomes visible (tab switch)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateToToday();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Bulk operations
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  
  // Clear all orders
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  // Add order dialog
  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    orderNumber: "",
    customerName: "",
    serviceNumber: "",
    ticketNumber: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    buildingName: "",
    appointmentDate: "",
    appointmentTime: "",
    serviceType: "",
    salesModiType: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
  });
  
  // Edit order dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);
  
  // Delete order dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);

  const { data: allOrders = [], isLoading } = trpc.orders.list.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const { data: assignments = [] } = trpc.assignments.list.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const { data: installers = [] } = trpc.installers.list.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Apply filters
  const filteredOrders = allOrders.filter(order => {
    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    
    // Reschedule reason filter
    if (rescheduleReasonFilter !== "all" && order.rescheduleReason !== rescheduleReasonFilter) return false;
    
    // Date filter - single date or range
    if (order.appointmentDate) {
      const orderDate = parseAppointmentDate(order.appointmentDate);
      if (!orderDate) return false;
      
      if (dateFilterMode === 'single' && dateFilter) {
        // Single date filter
        const filterDate = new Date(dateFilter);
        if (orderDate.toDateString() !== filterDate.toDateString()) return false;
      } else if (dateFilterMode === 'range' && (startDate || endDate)) {
        // Date range filter
        const orderTime = orderDate.getTime();
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (orderTime < start.getTime()) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderTime > end.getTime()) return false;
        }
      }
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (order.orderNumber || "").toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.serviceNumber && order.serviceNumber.toLowerCase().includes(query)) ||
        (order.ticketNumber && order.ticketNumber.toLowerCase().includes(query)) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Apply sorting
  const orders = [...filteredOrders].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue: any;
    let bValue: any;
    
    switch (sortColumn) {
      case "ticketNumber":
        aValue = (a.ticketNumber || "").toLowerCase();
        bValue = (b.ticketNumber || "").toLowerCase();
        break;
      case "serviceNumber":
        aValue = (a.serviceNumber || "").toLowerCase();
        bValue = (b.serviceNumber || "").toLowerCase();
        break;
      case "status":
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case "installer":
        // Get installer name from assignment
        const assignmentA = assignments.find(asn => asn.orderId === a.id);
        const assignmentB = assignments.find(asn => asn.orderId === b.id);
        const installerA = assignmentA ? installers.find(inst => inst.id === assignmentA.installerId) : null;
        const installerB = assignmentB ? installers.find(inst => inst.id === assignmentB.installerId) : null;
        aValue = (installerA?.name || "Unassigned").toLowerCase();
        bValue = (installerB?.name || "Unassigned").toLowerCase();
        break;
      case "appointmentDate":
        aValue = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
        bValue = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
  const updateOrder = trpc.orders.update.useMutation();
  const uploadDocketFile = trpc.orders.uploadDocketFile.useMutation();
  const clearAllOrders = trpc.orders.clearAll.useMutation();
  const createOrder = trpc.orders.create.useMutation();
  const deleteOrder = trpc.orders.delete.useMutation();
  const utils = trpc.useUtils();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "on_the_way":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "met_customer":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "order_completed":
        return "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200";
      case "docket_received":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "docket_uploaded":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      case "ready_to_invoice":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "invoiced":
        return "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200";
      case "completed":
        return "bg-green-600 text-white dark:bg-green-700 dark:text-white";
      case "customer_issue":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "building_issue":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "network_issue":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "rescheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
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

  const getInstallerName = (orderId: number) => {
    const assignment = assignments.find(a => a.orderId === orderId);
    if (!assignment) return "Unassigned";
    const installer = installers.find(i => i.id === assignment.installerId);
    return installer?.name || "Unknown";
  };

  const handleStatusChange = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setRescheduleReason("");
    setRescheduledDate("");
    setRescheduledTime("");
    setIsDialogOpen(true);
  };
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
  
  const handleQuickStatusUpdate = async (orderId: number, newStatus: string) => {
    // If status is docket_received or docket_uploaded, show file upload dialog
    if (newStatus === "docket_received" || newStatus === "docket_uploaded") {
      const order = orders?.find(o => o.id === orderId);
      if (order) {
        setDocketUploadOrder({ id: orderId, status: newStatus, orderNumber: order.orderNumber || "" });
        setIsDocketUploadOpen(true);
      }
      return;
    }
    
    try {
      await updateOrder.mutateAsync({
        id: orderId,
        status: newStatus as any,
      });
      await utils.orders.list.invalidate();
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
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
    if (!editOrder.serviceNumber || !editOrder.customerName) {
      toast.error("Service number and customer name are required");
      return;
    }
    
    try {
      // Normalize appointment time before saving
      const normalizedOrder = {
        ...editOrder,
        appointmentTime: editOrder.appointmentTime ? (normalizeTimeFormat(editOrder.appointmentTime) || editOrder.appointmentTime) : editOrder.appointmentTime
      };
      await updateOrder.mutateAsync(normalizedOrder);
      await utils.orders.list.invalidate();
      toast.success("Order updated successfully");
      setIsEditDialogOpen(false);
      setEditOrder(null);
    } catch (error) {
      toast.error("Failed to update order");
      console.error(error);
    }
  };
  
  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;
    
    try {
      await deleteOrder.mutateAsync({ id: deleteOrderId });
      await utils.orders.list.invalidate();
      toast.success("Order deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteOrderId(null);
    } catch (error) {
      toast.error("Failed to delete order");
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
  
  const handleAddOrder = async () => {
    // Validate: Service Number OR WO Number (at least one) + Customer Name
    if (!newOrderData.serviceNumber && !newOrderData.orderNumber) {
      toast.error("Service Number or WO Number is required");
      return;
    }
    if (!newOrderData.customerName) {
      toast.error("Customer name is required");
      return;
    }
    
    try {
      await createOrder.mutateAsync(newOrderData);
      await utils.orders.list.invalidate();
      toast.success("Order created successfully");
      setIsAddOrderDialogOpen(false);
      // Reset form
      setNewOrderData({
        orderNumber: "",
        customerName: "",
        serviceNumber: "",
        ticketNumber: "",
        customerPhone: "",
        customerEmail: "",
        address: "",
        buildingName: "",
        appointmentDate: "",
        appointmentTime: "",
        serviceType: "",
        salesModiType: "",
        priority: "medium",
        notes: "",
      });
    } catch (error) {
      toast.error("Failed to create order");
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
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  onClick={() => setIsAddOrderDialogOpen(true)}
                >
                  Add Order
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportToExcel}
                  disabled={orders.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
                {user?.email === "espritguy69@gmail.com" && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsClearDialogOpen(true)}
                    disabled={orders.length === 0}
                  >
                    Clear All Orders
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by WO No., Ticket No., Customer, Service No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Clear search"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
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
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Appointment Date
                    {dateFilterMode === 'single' && dateFilter && new Date(dateFilter).toDateString() === new Date().toDateString() && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">(Today's orders)</span>
                    )}
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant={dateFilterMode === 'single' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateFilterMode('single')}
                      className="text-xs h-7"
                    >
                      Single Date
                    </Button>
                    <Button
                      variant={dateFilterMode === 'range' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateFilterMode('range')}
                      className="text-xs h-7"
                    >
                      Date Range
                    </Button>
                  </div>
                </div>
                
                {dateFilterMode === 'single' ? (
                  <>
                    {/* Quick date shortcuts */}
                    <div className="flex gap-2 mb-2">
                      <Button
                        variant={(() => {
                          if (!dateFilter) return "outline";
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          return new Date(dateFilter).toDateString() === yesterday.toDateString() ? "default" : "outline";
                        })()}
                        size="sm"
                        onClick={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          setDateFilter(yesterday.toISOString().split('T')[0]);
                        }}
                        className="text-xs"
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant={dateFilter && new Date(dateFilter).toDateString() === new Date().toDateString() ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setDateFilter(today.toISOString().split('T')[0]);
                        }}
                        className="text-xs"
                      >
                        Today
                      </Button>
                      <Button
                        variant={(() => {
                          if (!dateFilter) return "outline";
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return new Date(dateFilter).toDateString() === tomorrow.toDateString() ? "default" : "outline";
                        })()}
                        size="sm"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setDateFilter(tomorrow.toISOString().split('T')[0]);
                        }}
                        className="text-xs"
                      >
                        Tomorrow
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        placeholder="Select date"
                      />
                      {dateFilter && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDateFilter("")}
                          title="Clear date filter to show all orders"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Quick range presets */}
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const weekStart = new Date(today);
                          weekStart.setDate(today.getDate() - today.getDay());
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekStart.getDate() + 6);
                          setStartDate(weekStart.toISOString().split('T')[0]);
                          setEndDate(weekEnd.toISOString().split('T')[0]);
                        }}
                        className="text-xs"
                      >
                        This Week
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const last7Days = new Date(today);
                          last7Days.setDate(today.getDate() - 6);
                          setStartDate(last7Days.toISOString().split('T')[0]);
                          setEndDate(today.toISOString().split('T')[0]);
                        }}
                        className="text-xs"
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                          setStartDate(monthStart.toISOString().split('T')[0]);
                          setEndDate(monthEnd.toISOString().split('T')[0]);
                        }}
                        className="text-xs"
                      >
                        This Month
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          placeholder="Start date"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          placeholder="End date"
                        />
                      </div>
                    </div>
                    {(startDate || endDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="text-xs mt-2 w-full"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear Date Range
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground mb-4">
              Showing {orders.length} of {allOrders.length} orders
            </div>
            
            <div className="w-full">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[85px] text-xs">WO No.</TableHead>
                    <TableHead className="w-[80px]">
                      <button
                        onClick={() => handleSort("ticketNumber")}
                        className="flex items-center gap-1 hover:text-primary transition-colors text-xs"
                      >
                        <span>Ticket No.</span>
                        {sortColumn === "ticketNumber" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[95px]">
                      <button
                        onClick={() => handleSort("serviceNumber")}
                        className="flex items-center gap-1 hover:text-primary transition-colors text-xs"
                      >
                        <span>Service No.</span>
                        {sortColumn === "serviceNumber" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[125px] text-xs">Customer</TableHead>
                    <TableHead className="w-[100px] text-xs">WO Type</TableHead>
                    <TableHead className="w-[70px] text-xs">Priority</TableHead>
                    <TableHead className="w-[100px]">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-1 hover:text-primary transition-colors text-xs"
                      >
                        <span>Status</span>
                        {sortColumn === "status" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[110px]">
                      <button
                        onClick={() => handleSort("installer")}
                        className="flex items-center gap-1 hover:text-primary transition-colors text-xs"
                      >
                        <span>Installer</span>
                        {sortColumn === "installer" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[95px]">
                      <button
                        onClick={() => handleSort("appointmentDate")}
                        className="flex items-center gap-1 hover:text-primary transition-colors text-xs"
                      >
                        <span>Assignment</span>
                        {sortColumn === "appointmentDate" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[75px] text-xs">Docket</TableHead>
                    <TableHead className="w-[60px] text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No orders found. Upload orders to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => {
                      const assignment = getAssignmentInfo(order.id);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium text-xs">
                            {order.orderNumber ? (
                              <div className="truncate" title={order.orderNumber}>{order.orderNumber}</div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">SN</span>
                                <span className="truncate font-semibold text-blue-600" title={order.serviceNumber || "-"}>{order.serviceNumber || "-"}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="truncate" title={order.ticketNumber || "-"}>{order.ticketNumber || "-"}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="truncate" title={order.serviceNumber || "-"}>{order.serviceNumber || "-"}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="truncate font-medium" title={order.customerName}>{order.customerName}</div>
                            {order.customerPhone && (
                              <div className="text-xs text-muted-foreground truncate" title={order.customerPhone}>{order.customerPhone}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="truncate" title={order.serviceType || "-"}>{order.serviceType || "-"}</div>
                            {order.salesModiType && (
                              <div className="text-xs text-muted-foreground truncate" title={order.salesModiType}>{order.salesModiType}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(order.priority)}`}>
                              {order.priority}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleQuickStatusUpdate(order.id, value)}
                            >
                              <SelectTrigger className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-0 w-auto h-auto gap-1 ${getStatusBadgeColor(order.status)}`}>
                                <SelectValue>{order.status.replace("_", " ")}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    Pending
                                  </span>
                                </SelectItem>
                                <SelectItem value="assigned">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Assigned
                                  </span>
                                </SelectItem>
                                <SelectItem value="on_the_way">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    On the way
                                  </span>
                                </SelectItem>
                                <SelectItem value="met_customer">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Met customer
                                  </span>
                                </SelectItem>
                                <SelectItem value="order_completed">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-lime-500"></span>
                                    Order Completed
                                  </span>
                                </SelectItem>
                                <SelectItem value="completed">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Completed
                                  </span>
                                </SelectItem>
                                <SelectItem value="docket_received">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                    Docket Received
                                  </span>
                                </SelectItem>
                                <SelectItem value="docket_uploaded">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                    Docket Uploaded
                                  </span>
                                </SelectItem>
                                <SelectItem value="ready_to_invoice">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                    Ready to Invoice
                                  </span>
                                </SelectItem>
                                <SelectItem value="invoiced">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                                    Invoiced
                                  </span>
                                </SelectItem>
                                <SelectItem value="customer_issue">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                                    Customer Issue
                                  </span>
                                </SelectItem>
                                <SelectItem value="building_issue">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
                                    Building Issue
                                  </span>
                                </SelectItem>
                                <SelectItem value="network_issue">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                    Network Issue
                                  </span>
                                </SelectItem>
                                <SelectItem value="rescheduled">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                    Rescheduled
                                  </span>
                                </SelectItem>
                                <SelectItem value="withdrawn">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Withdrawn
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="truncate" title={getInstallerName(order.id)}>
                              {getInstallerName(order.id)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {assignment ? (
                              <div className="text-sm">
                                {order.appointmentDate && (
                                  <div className="text-xs font-medium">
                                    {order.appointmentDate}
                                  </div>
                                )}
                                {order.appointmentTime && (
                                  <div className="text-xs text-muted-foreground">
                                    {order.appointmentTime}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm">
                                <div className="text-xs text-muted-foreground">Not assigned</div>
                                {order.appointmentDate && (
                                  <div className="text-xs font-medium">
                                    {order.appointmentDate}
                                  </div>
                                )}
                                {order.appointmentTime && (
                                  <div className="text-xs">
                                    {order.appointmentTime}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.docketFileUrl ? (
                              <a
                                href={order.docketFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                {order.docketFileName || "View File"}
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                            >
                              Edit
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
                  <SelectItem value="order_completed">Order Completed</SelectItem>
                  <SelectItem value="docket_received">Docket Received</SelectItem>
                  <SelectItem value="docket_uploaded">Docket Uploaded</SelectItem>
                  <SelectItem value="ready_to_invoice">Ready to Invoice</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="customer_issue">Customer Issue</SelectItem>
                  <SelectItem value="building_issue">Building Issue</SelectItem>
                  <SelectItem value="network_issue">Network Issue</SelectItem>
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
                <label className="text-sm font-medium">Ticket Number</label>
                <input
                  type="text"
                  value={editOrder.ticketNumber || ""}
                  onChange={(e) => setEditOrder({ ...editOrder, ticketNumber: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g., TTKT202511108600806"
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
                <Select 
                  value={editOrder.appointmentTime} 
                  onValueChange={(value) => setEditOrder({ ...editOrder, appointmentTime: value })}
                >
                  <SelectTrigger>
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
          <DialogFooter className="flex justify-between items-center">
            <Button 
              variant="destructive" 
              onClick={() => {
                setDeleteOrderId(editOrder.id);
                setIsDeleteDialogOpen(true);
                setIsEditDialogOpen(false);
              }}
              className="mr-auto"
            >
              Delete Order
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateOrder.isPending}>
                {updateOrder.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Docket File Upload Dialog */}
      <Dialog open={isDocketUploadOpen} onOpenChange={setIsDocketUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Docket File</DialogTitle>
            <DialogDescription>
              Upload a PDF or image file for order {docketUploadOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Select File</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("File size must be less than 10MB");
                      return;
                    }
                    // Validate file type
                    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
                    if (!validTypes.includes(file.type)) {
                      toast.error("Only PDF, JPG, and PNG files are allowed");
                      return;
                    }
                    setDocketFile(file);
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {docketFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {docketFile.name} ({(docketFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDocketUploadOpen(false);
              setDocketFile(null);
              setDocketUploadOrder(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!docketFile || !docketUploadOrder) return;
                
                try {
                  // Convert file to base64
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const base64 = (reader.result as string).split(",")[1];
                    
                    // Upload file
                    await uploadDocketFile.mutateAsync({
                      orderId: docketUploadOrder.id,
                      fileData: base64,
                      fileName: docketFile.name,
                      fileType: docketFile.type,
                    });
                    
                    // Update order status
                    await updateOrder.mutateAsync({
                      id: docketUploadOrder.id,
                      status: docketUploadOrder.status as any,
                    });
                    
                    await utils.orders.list.invalidate();
                    toast.success("Docket file uploaded successfully");
                    setIsDocketUploadOpen(false);
                    setDocketFile(null);
                    setDocketUploadOrder(null);
                  };
                  reader.readAsDataURL(docketFile);
                } catch (error) {
                  toast.error("Failed to upload docket file");
                  console.error(error);
                }
              }}
              disabled={!docketFile || uploadDocketFile.isPending}
            >
              {uploadDocketFile.isPending ? "Uploading..." : "Upload & Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Order Dialog */}
      <Dialog open={isAddOrderDialogOpen} onOpenChange={setIsAddOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Order</DialogTitle>
            <DialogDescription>
              Create a new service order manually
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderNumber">Order Number *</Label>
                <Input
                  id="orderNumber"
                  value={newOrderData.orderNumber}
                  onChange={(e) => setNewOrderData({...newOrderData, orderNumber: e.target.value})}
                  placeholder="A1234567"
                />
              </div>
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={newOrderData.customerName}
                  onChange={(e) => setNewOrderData({...newOrderData, customerName: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceNumber">Service Number</Label>
                <Input
                  id="serviceNumber"
                  value={newOrderData.serviceNumber}
                  onChange={(e) => setNewOrderData({...newOrderData, serviceNumber: e.target.value})}
                  placeholder="TBBN123456G"
                />
              </div>
              <div>
                <Label htmlFor="ticketNumber">Ticket Number</Label>
                <Input
                  id="ticketNumber"
                  value={newOrderData.ticketNumber}
                  onChange={(e) => setNewOrderData({...newOrderData, ticketNumber: e.target.value})}
                  placeholder="TKT-12345"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={newOrderData.customerPhone}
                  onChange={(e) => setNewOrderData({...newOrderData, customerPhone: e.target.value})}
                  placeholder="012-3456789"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={newOrderData.customerEmail}
                  onChange={(e) => setNewOrderData({...newOrderData, customerEmail: e.target.value})}
                  placeholder="customer@example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newOrderData.address}
                onChange={(e) => setNewOrderData({...newOrderData, address: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <Label htmlFor="buildingName">Building Name</Label>
              <Input
                id="buildingName"
                value={newOrderData.buildingName}
                onChange={(e) => setNewOrderData({...newOrderData, buildingName: e.target.value})}
                placeholder="Tower A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointmentDate">Appointment Date</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={newOrderData.appointmentDate}
                  onChange={(e) => setNewOrderData({...newOrderData, appointmentDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="appointmentTime">Appointment Time</Label>
                <Select 
                  value={newOrderData.appointmentTime} 
                  onValueChange={(value) => setNewOrderData({...newOrderData, appointmentTime: value})}
                >
                  <SelectTrigger id="appointmentTime">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select
                  value={newOrderData.serviceType}
                  onValueChange={(value) => setNewOrderData({...newOrderData, serviceType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVATION">ACTIVATION</SelectItem>
                    <SelectItem value="MODIFICATION">MODIFICATION</SelectItem>
                    <SelectItem value="ASSURANCE">ASSURANCE</SelectItem>
                    <SelectItem value="DIGI/CELCOM">DIGI/CELCOM</SelectItem>
                    <SelectItem value="U-MOBILE">U-MOBILE</SelectItem>
                    <SelectItem value="VALUE ADDED SERVICES">VALUE ADDED SERVICES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salesModiType">Sales/Modi Type</Label>
                <Input
                  id="salesModiType"
                  value={newOrderData.salesModiType}
                  onChange={(e) => setNewOrderData({...newOrderData, salesModiType: e.target.value})}
                  placeholder="New Sales"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={newOrderData.priority} onValueChange={(value: "low" | "medium" | "high") => setNewOrderData({...newOrderData, priority: value})}>
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
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newOrderData.notes}
                onChange={(e) => setNewOrderData({...newOrderData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOrderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOrder} disabled={createOrder.isPending}>
              {createOrder.isPending ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Order Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order?</DialogTitle>
            <DialogDescription>
              This will permanently delete this order and its assignments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteOrder}
              disabled={deleteOrder.isPending}
            >
              {deleteOrder.isPending ? "Deleting..." : "Delete Order"}
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
