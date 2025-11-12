/**
 * OrderDetailExample.tsx
 * 
 * A comprehensive example component for viewing and editing a single order
 * with form validation, status management, and history tracking.
 * 
 * This example showcases:
 * - Fetching single order data with tRPC
 * - Form handling with controlled inputs
 * - Input validation
 * - Optimistic updates for better UX
 * - Order history display
 * - Status workflow management
 * - File upload for dockets
 * - Notes management
 */

import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Loader2,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Calendar as CalendarIcon,
  AlertCircle,
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

type HistoryEntry = {
  id: number;
  orderId: number;
  action: string;
  userId: number | null;
  userName: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: Date;
};

export default function OrderDetailExample() {
  // Routing
  const [match, params] = useRoute("/orders/:id");
  const [, navigate] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : null;

  // Form state
  const [formData, setFormData] = useState<Partial<Order>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch order data
  const {
    data: order,
    isLoading,
    error,
  } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId }
  );

  // Fetch order history
  const { data: history } = trpc.orders.getHistory.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  // Initialize form data when order loads
  useEffect(() => {
    if (order) {
      setFormData(order);
    }
  }, [order]);

  // Utility functions
  const utils = trpc.useUtils();

  // Update order mutation
  const updateMutation = trpc.orders.update.useMutation({
    onMutate: async (updatedOrder) => {
      await utils.orders.getById.cancel({ id: orderId! });
      const previousOrder = utils.orders.getById.getData({ id: orderId! });

      // Optimistically update
      utils.orders.getById.setData({ id: orderId! }, (old) =>
        old ? { ...old, ...updatedOrder } : old
      );

      return { previousOrder };
    },
    onError: (err, variables, context) => {
      utils.orders.getById.setData({ id: orderId! }, context?.previousOrder);
      toast.error("Failed to update order: " + err.message);
    },
    onSuccess: () => {
      toast.success("Order updated successfully");
      setHasChanges(false);
    },
    onSettled: () => {
      utils.orders.getById.invalidate({ id: orderId! });
      utils.orders.list.invalidate();
      utils.orders.getHistory.invalidate({ orderId: orderId! });
    },
  });

  // Handle form field changes
  const handleFieldChange = (field: keyof Order, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId) return;

    // Validation
    if (!formData.customerName?.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!formData.orderNumber?.trim()) {
      toast.error("Order number is required");
      return;
    }

    // Submit update
    updateMutation.mutate({
      id: orderId,
      ...formData,
    });
  };

  // Render status badge
  const renderStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<
      OrderStatus,
      { label: string; className: string }
    > = {
      pending: { label: "Pending", className: "bg-gray-500" },
      assigned: { label: "Assigned", className: "bg-blue-500" },
      on_the_way: { label: "On the Way", className: "bg-yellow-500" },
      met_customer: { label: "Met Customer", className: "bg-purple-500" },
      completed: { label: "Completed", className: "bg-green-500" },
      docket_received: { label: "Docket Received", className: "bg-teal-500" },
      docket_uploaded: { label: "Docket Uploaded", className: "bg-indigo-500" },
      rescheduled: { label: "Rescheduled", className: "bg-orange-500" },
      withdrawn: { label: "Withdrawn", className: "bg-red-500" },
    };

    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Order</CardTitle>
            <CardDescription>
              {error?.message || "Order not found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/orders")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Created {format(new Date(order.createdAt), "PPP")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {renderStatusBadge(order.status)}
          <Badge
            variant={
              order.priority === "high"
                ? "destructive"
                : order.priority === "medium"
                ? "default"
                : "secondary"
            }
          >
            {order.priority.toUpperCase()} Priority
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Order Details Tab */}
        <TabsContent value="details">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core order identification details</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">
                    Order Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="orderNumber"
                    value={formData.orderNumber || ""}
                    onChange={(e) => handleFieldChange("orderNumber", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticketNumber">Ticket Number</Label>
                  <Input
                    id="ticketNumber"
                    value={formData.ticketNumber || ""}
                    onChange={(e) => handleFieldChange("ticketNumber", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceNumber">Service Number</Label>
                  <Input
                    id="serviceNumber"
                    value={formData.serviceNumber || ""}
                    onChange={(e) => handleFieldChange("serviceNumber", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Input
                    id="serviceType"
                    value={formData.serviceType || ""}
                    onChange={(e) => handleFieldChange("serviceType", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Contact and location details</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerName"
                      className="pl-10"
                      value={formData.customerName || ""}
                      onChange={(e) => handleFieldChange("customerName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerPhone"
                      className="pl-10"
                      value={formData.customerPhone || ""}
                      onChange={(e) => handleFieldChange("customerPhone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerEmail"
                      type="email"
                      className="pl-10"
                      value={formData.customerEmail || ""}
                      onChange={(e) => handleFieldChange("customerEmail", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildingName">Building Name</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="buildingName"
                      className="pl-10"
                      value={formData.buildingName || ""}
                      onChange={(e) => handleFieldChange("buildingName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
                <CardDescription>Scheduling and timing information</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Appointment Date</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={formData.appointmentDate || ""}
                    onChange={(e) => handleFieldChange("appointmentDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Appointment Time</Label>
                  <Input
                    id="appointmentTime"
                    value={formData.appointmentTime || ""}
                    onChange={(e) => handleFieldChange("appointmentTime", e.target.value)}
                    placeholder="e.g., 9:00 AM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Duration (minutes)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration || 60}
                    onChange={(e) =>
                      handleFieldChange("estimatedDuration", parseInt(e.target.value))
                    }
                    min={15}
                    step={15}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status and Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Status and Priority</CardTitle>
                <CardDescription>Order workflow management</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleFieldChange("status", value as OrderStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="on_the_way">On the Way</SelectItem>
                      <SelectItem value="met_customer">Met Customer</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="docket_received">Docket Received</SelectItem>
                      <SelectItem value="docket_uploaded">Docket Uploaded</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleFieldChange("priority", value as "low" | "medium" | "high")
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

                {formData.status === "rescheduled" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="rescheduleReason">Reschedule Reason</Label>
                      <Select
                        value={formData.rescheduleReason || undefined}
                        onValueChange={(value) =>
                          handleFieldChange(
                            "rescheduleReason",
                            value as "customer_issue" | "building_issue" | "network_issue"
                          )
                        }
                      >
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

                    <div className="space-y-2">
                      <Label htmlFor="rescheduledDate">Rescheduled Date</Label>
                      <Input
                        id="rescheduledDate"
                        type="date"
                        value={
                          formData.rescheduledDate
                            ? format(new Date(formData.rescheduledDate), "yyyy-MM-dd")
                            : ""
                        }
                        onChange={(e) =>
                          handleFieldChange("rescheduledDate", new Date(e.target.value))
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Additional information and comments</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  rows={5}
                  placeholder="Enter any additional notes or comments..."
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/orders")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Timeline of changes and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {!history || history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No history entries found
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry, index) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        {index < history.length - 1 && (
                          <div className="flex-1 w-0.5 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{entry.action}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.userName || "System"}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.timestamp), "PPp")}
                          </p>
                        </div>
                        {(entry.oldValue || entry.newValue) && (
                          <div className="mt-2 text-sm">
                            {entry.oldValue && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">From:</span> {entry.oldValue}
                              </p>
                            )}
                            {entry.newValue && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">To:</span> {entry.newValue}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
