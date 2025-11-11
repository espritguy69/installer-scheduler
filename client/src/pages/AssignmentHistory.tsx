import { useAuth } from "@/_core/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Download, FileText, Filter, History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AssignmentHistory() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedInstaller, setSelectedInstaller] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [searchOrder, setSearchOrder] = useState("");

  // Fetch installers for filter
  const { data: installers = [] } = trpc.installers.list.useQuery();

  // Fetch assignment history with filters
  const { data: history = [], isLoading, refetch } = trpc.assignmentHistory.list.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    installerId: selectedInstaller && selectedInstaller !== "all" ? parseInt(selectedInstaller) : undefined,
    action: selectedAction && selectedAction !== "all" ? selectedAction as any : undefined,
  });

  // Filter by order number on client side
  const filteredHistory = searchOrder
    ? history.filter(h => h.orderNumber?.toLowerCase().includes(searchOrder.toLowerCase()))
    : history;

  const handleExport = () => {
    if (filteredHistory.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content
    const headers = ["Date & Time", "Action", "Order Number", "Installer", "Scheduled Date", "Time Slot", "Assigned By"];
    const rows = filteredHistory.map(h => [
      new Date(h.createdAt).toLocaleString(),
      h.action.toUpperCase(),
      h.orderNumber || "-",
      h.installerName || "-",
      h.scheduledDate || "-",
      h.scheduledStartTime && h.scheduledEndTime ? `${h.scheduledStartTime} - ${h.scheduledEndTime}` : "-",
      h.assignedByName || "System",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assignment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("History exported successfully");
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedInstaller("all");
    setSelectedAction("all");
    setSearchOrder("");
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-800";
      case "updated":
        return "bg-blue-100 text-blue-800";
      case "reassigned":
        return "bg-orange-100 text-orange-800";
      case "deleted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to view assignment history.
            </p>
            <Button onClick={() => window.location.href = "/api/oauth/login"}>
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8" />
              Assignment History
            </h1>
            <p className="text-muted-foreground mt-2">
              Track all assignment actions and changes
            </p>
          </div>
          <Button onClick={handleExport} disabled={filteredHistory.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="installer">Installer</Label>
              <Select value={selectedInstaller} onValueChange={setSelectedInstaller}>
                <SelectTrigger>
                  <SelectValue placeholder="All installers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All installers</SelectItem>
                  {installers.map((installer) => (
                    <SelectItem key={installer.id} value={installer.id.toString()}>
                      {installer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="action">Action Type</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="reassigned">Reassigned</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="searchOrder">Order Number</Label>
              <Input
                id="searchOrder"
                type="text"
                placeholder="Search order..."
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button onClick={() => refetch()}>
              Apply Filters
            </Button>
          </div>
        </Card>

        {/* History Table */}
        <Card>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No History Found</h3>
                <p className="text-muted-foreground">
                  {history.length === 0
                    ? "No assignment actions have been recorded yet."
                    : "No results match your current filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Installer</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(entry.action)}`}>
                            {entry.action.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{entry.orderNumber || "-"}</TableCell>
                        <TableCell>{entry.installerName || "-"}</TableCell>
                        <TableCell>{entry.scheduledDate || "-"}</TableCell>
                        <TableCell>
                          {entry.scheduledStartTime && entry.scheduledEndTime
                            ? `${entry.scheduledStartTime} - ${entry.scheduledEndTime}`
                            : "-"}
                        </TableCell>
                        <TableCell>{entry.assignedByName || "System"}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

        {/* Summary */}
        {filteredHistory.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredHistory.length} {filteredHistory.length === 1 ? "entry" : "entries"}
          </div>
        )}
      </div>
    </div>
  );
}
