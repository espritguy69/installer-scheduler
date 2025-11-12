/**
 * OrdersListExample.tsx
 * 
 * A comprehensive example component demonstrating how to use the orders.list API endpoint
 * with filtering, sorting, search, pagination, and Excel export functionality.
 * 
 * This example showcases:
 * - tRPC query usage with the orders.list endpoint
 * - Client-side filtering and search
 * - Table sorting
 * - Status badge rendering
 * - Excel export functionality
 * - Responsive design with shadcn/ui components
 * - Loading and error states
 * - Optimistic updates for status changes
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, Loader2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Type definition for Order (from API documentation)
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
  serviceNumber: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceType: string | null;
  salesModiType: string | null;
  address: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  buildingName: string | null;
  estimatedDuration: number;
  priority: "low" | "medium" | "high";
  status: OrderStatus;
  rescheduleReason: "customer_issue" | "building_issue" | "network_issue" | null;
  rescheduledDate: Date | null;
  rescheduledTime: string | null;
  notes: string | null;
  docketFileUrl: string | null;
  docketFileName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function OrdersListExample() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortField, setSortField] = useState<keyof Order>("appointmentDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch orders using tRPC query
  const { data: orders, isLoading, error, refetch } = trpc.orders.list.useQuery();

  // Utility functions for tRPC mutations (for optimistic updates)
  const utils = trpc.useUtils();

  // Update order mutation with optimistic updates
  const updateOrderMutation = trpc.orders.update.useMutation({
    onMutate: async (updatedOrder) => {
      // Cancel outgoing refetches
      await utils.orders.list.cancel();

      // Snapshot the previous value
      const previousOrders = utils.orders.list.getData();

      // Optimistically update to the new value
      utils.orders.list.setData(undefined, (old) =>
        old?.map((order) =>
          order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
        )
      );

      return { previousOrders };
    },
    onError: (err, updatedOrder, context) => {
      // Rollback to previous value on error
      utils.orders.list.setData(undefined, context?.previousOrders);
      toast.error("Failed to update order: " + err.message);
    },
    onSuccess: () => {
      toast.success("Order updated successfully");
    },
    onSettled: () => {
      // Refetch to ensure data consistency
      utils.orders.list.invalidate();
    },
  });

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = orders;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.ticketNumber?.toLowerCase().includes(query) ||
          order.buildingName?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [orders, searchQuery, statusFilter, sortField, sortDirection]);

  // Export to Excel
  const handleExportToExcel = () => {
    if (!filteredAndSortedOrders.length) {
      toast.error("No orders to export");
      return;
    }

    // Prepare data for export
    const exportData = filteredAndSortedOrders.map((order) => ({
      "Order Number": order.orderNumber,
      "Ticket Number": order.ticketNumber || "-",
      "Service Number": order.serviceNumber || "-",
      "Customer Name": order.customerName,
      "Customer Phone": order.customerPhone || "-",
      "Building Name": order.buildingName || "-",
      "Appointment Date": order.appointmentDate || "-",
      "Appointment Time": order.appointmentTime || "-",
      "Priority": order.priority.toUpperCase(),
      "Status": order.status.replace(/_/g, " ").toUpperCase(),
      "Notes": order.notes || "-",
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Orders_Export_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
    toast.success(`Exported ${filteredAndSortedOrders.length} orders to ${filename}`);
  };

  // Handle sort column click
  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle status change
  const handleStatusChange = (orderId: number, newStatus: OrderStatus) => {
    updateOrderMutation.mutate({
      id: orderId,
      status: newStatus,
    });
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: OrderStatus) => {
    const statusColors: Record<OrderStatus, string> = {
      pending: "bg-gray-500",
      assigned: "bg-blue-500",
      on_the_way: "bg-yellow-500",
      met_customer: "bg-purple-500",
      completed: "bg-green-500",
      docket_received: "bg-teal-500",
      docket_uploaded: "bg-indigo-500",
      rescheduled: "bg-orange-500",
      withdrawn: "bg-red-500",
    };

    return (
      <Badge className={statusColors[status]}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  // Render priority badge
  const renderPriorityBadge = (priority: "low" | "medium" | "high") => {
    const priorityColors = {
      low: "bg-gray-400",
      medium: "bg-blue-400",
      high: "bg-red-500",
    };

    return (
      <Badge className={priorityColors[priority]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Orders</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Orders List</CardTitle>
              <CardDescription>
                Showing {filteredAndSortedOrders.length} of {orders?.length || 0} orders
              </CardDescription>
            </div>
            <Button onClick={handleExportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, customer, or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
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

          {/* Orders Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("orderNumber")}
                      className="gap-2"
                    >
                      Order Number
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("customerName")}
                      className="gap-2"
                    >
                      Customer
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("appointmentDate")}
                      className="gap-2"
                    >
                      Appointment
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                        {order.ticketNumber && (
                          <div className="text-xs text-muted-foreground">
                            {order.ticketNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.customerName}
                        {order.customerPhone && (
                          <div className="text-xs text-muted-foreground">
                            {order.customerPhone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{order.buildingName || "-"}</TableCell>
                      <TableCell>
                        {order.appointmentDate || "-"}
                        {order.appointmentTime && (
                          <div className="text-xs text-muted-foreground">
                            {order.appointmentTime}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{renderPriorityBadge(order.priority)}</TableCell>
                      <TableCell>{renderStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            handleStatusChange(order.id, value as OrderStatus)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="on_the_way">On the Way</SelectItem>
                            <SelectItem value="met_customer">Met Customer</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rescheduled">Rescheduled</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
