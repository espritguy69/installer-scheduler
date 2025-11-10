import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { BookOpen, Download, Loader2, Plus, Search } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Notes() {
  const { user, logout } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    serviceNumber: "",
    orderNumber: "",
    customerName: "",
    noteType: "general" as "general" | "reschedule" | "follow_up" | "incident" | "complaint",
    title: "",
    content: "",
    priority: "medium" as "low" | "medium" | "high",
    status: "open" as "open" | "in_progress" | "resolved" | "closed",
  });
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<string>("");
  const [serviceNumberFilter, setServiceNumberFilter] = useState<string>("");
  const [noteTypeFilter, setNoteTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: allNotes = [], isLoading } = trpc.notes.list.useQuery();
  const createNote = trpc.notes.create.useMutation();
  const updateNote = trpc.notes.update.useMutation();
  const deleteNote = trpc.notes.delete.useMutation();
  const utils = trpc.useUtils();
  
  // Apply filters
  const notes = allNotes.filter(note => {
    if (dateFilter && note.date !== dateFilter) return false;
    if (serviceNumberFilter && !note.serviceNumber?.toLowerCase().includes(serviceNumberFilter.toLowerCase())) return false;
    if (noteTypeFilter !== "all" && note.noteType !== noteTypeFilter) return false;
    if (statusFilter !== "all" && note.status !== statusFilter) return false;
    return true;
  });
  
  const getNoteTypeBadgeColor = (type: string) => {
    switch (type) {
      case "reschedule":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "follow_up":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "incident":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "complaint":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
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
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };
  
  const handleExport = () => {
    if (notes.length === 0) {
      toast.error("No notes to export");
      return;
    }
    
    // Create CSV content
    const headers = ["Date", "Note Type", "Priority", "Status", "Service No.", "Order No.", "Customer", "Title", "Content", "Created By", "Created At"];
    const rows = notes.map(note => [
      note.date,
      note.noteType,
      note.priority,
      note.status,
      note.serviceNumber || "",
      note.orderNumber || "",
      note.customerName || "",
      note.title,
      note.content.replace(/\n/g, " ").replace(/"/g, '""'), // Escape quotes and remove newlines
      note.createdBy,
      new Date(note.createdAt).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `notes_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${notes.length} notes to CSV`);
  };
  
  const applyTemplate = (templateType: string) => {
    const templates: Record<string, { noteType: typeof formData.noteType; priority: typeof formData.priority; title: string; content: string }> = {
      customer_not_home: {
        noteType: "reschedule",
        priority: "medium",
        title: "Customer not available at location",
        content: "Arrived at customer location but customer was not home. Attempted to contact via phone but no answer. Need to reschedule appointment."
      },
      wrong_address: {
        noteType: "incident",
        priority: "high",
        title: "Incorrect address provided",
        content: "The address provided in the order does not match the actual location. Customer confirmed correct address. Need to update order details and reschedule."
      },
      equipment_issue: {
        noteType: "incident",
        priority: "high",
        title: "Equipment malfunction or missing parts",
        content: "Encountered equipment issue during installation. Missing required parts or equipment malfunction. Need to order replacement parts and reschedule completion."
      },
      reschedule_request: {
        noteType: "reschedule",
        priority: "medium",
        title: "Customer requested reschedule",
        content: "Customer contacted to request rescheduling of appointment. Reason: [Add customer's reason here]. Proposed new date: [Add date]."
      },
      service_complaint: {
        noteType: "complaint",
        priority: "high",
        title: "Customer complaint received",
        content: "Customer expressed dissatisfaction with service. Issue: [Describe the complaint]. Action taken: [Describe resolution steps]. Follow-up required."
      }
    };
    
    const template = templates[templateType];
    if (template) {
      setFormData(prev => ({
        ...prev,
        noteType: template.noteType,
        priority: template.priority,
        title: template.title,
        content: template.content
      }));
      toast.success("Template applied");
    }
  };
  
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      serviceNumber: "",
      orderNumber: "",
      customerName: "",
      noteType: "general",
      title: "",
      content: "",
      priority: "medium",
      status: "open",
    });
  };
  
  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Please provide title and content");
      return;
    }
    
    try {
      await createNote.mutateAsync(formData);
      await utils.notes.list.invalidate();
      toast.success("Note created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create note");
      console.error(error);
    }
  };
  
  const handleEdit = (note: any) => {
    setSelectedNote(note);
    setFormData({
      date: note.date,
      serviceNumber: note.serviceNumber || "",
      orderNumber: note.orderNumber || "",
      customerName: note.customerName || "",
      noteType: note.noteType,
      title: note.title,
      content: note.content,
      priority: note.priority,
      status: note.status,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdate = async () => {
    if (!selectedNote) return;
    
    try {
      await updateNote.mutateAsync({
        id: selectedNote.id,
        ...formData,
      });
      await utils.notes.list.invalidate();
      toast.success("Note updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedNote(null);
    } catch (error) {
      toast.error("Failed to update note");
      console.error(error);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    try {
      await deleteNote.mutateAsync({ id });
      await utils.notes.list.invalidate();
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Main Content */}
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Daily Notes & Remarks</h1>
          <p className="text-muted-foreground">
            Record reschedules, follow-ups, incidents, and complaints for historical tracking
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  All Notes
                </CardTitle>
                <CardDescription>
                  Total: {notes.length} notes
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Service Number</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by service no..."
                    value={serviceNumberFilter}
                    onChange={(e) => setServiceNumberFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Note Type</label>
                <Select value={noteTypeFilter} onValueChange={setNoteTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="reschedule">Reschedule</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No notes found. Click "Add Note" to create your first note.
                </div>
              ) : (
                notes.map((note) => (
                  <Card key={note.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{note.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNoteTypeBadgeColor(note.noteType)}`}>
                              {note.noteType.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(note.priority)}`}>
                              {note.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(note.status)}`}>
                              {note.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>📅 {note.date}</span>
                            {note.serviceNumber && <span>🔧 Service: {note.serviceNumber}</span>}
                            {note.orderNumber && <span>📋 Order: {note.orderNumber}</span>}
                            {note.customerName && <span>👤 {note.customerName}</span>}
                            <span>✍️ {note.createdBy}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(note)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(note.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Record a remark, incident, complaint, or follow-up task
            </DialogDescription>
          </DialogHeader>
          
          {/* Quick Templates */}
          <div className="border-b pb-4 mb-4">
            <label className="text-sm font-medium mb-2 block">Quick Templates</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate("customer_not_home")}
              >
                Customer Not Home
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate("wrong_address")}
              >
                Wrong Address
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate("equipment_issue")}
              >
                Equipment Issue
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate("reschedule_request")}
              >
                Reschedule Request
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate("service_complaint")}
              >
                Service Complaint
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Note Type *</label>
              <Select value={formData.noteType} onValueChange={(value: any) => setFormData({ ...formData, noteType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="reschedule">Reschedule</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Service Number</label>
              <Input
                placeholder="SVC-001"
                value={formData.serviceNumber}
                onChange={(e) => setFormData({ ...formData, serviceNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Order Number</label>
              <Input
                placeholder="WO-001"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Customer Name</label>
              <Input
                placeholder="John Doe"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Priority *</label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
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
            <div className="col-span-2">
              <label className="text-sm font-medium mb-2 block">Title *</label>
              <Input
                placeholder="Brief summary of the note"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-2 block">Content *</label>
              <Textarea
                placeholder="Detailed description..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createNote.isPending}>
              {createNote.isPending ? "Creating..." : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update note details and status
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Note Type *</label>
              <Select value={formData.noteType} onValueChange={(value: any) => setFormData({ ...formData, noteType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="reschedule">Reschedule</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Service Number</label>
              <Input
                placeholder="SVC-001"
                value={formData.serviceNumber}
                onChange={(e) => setFormData({ ...formData, serviceNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Order Number</label>
              <Input
                placeholder="WO-001"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Customer Name</label>
              <Input
                placeholder="John Doe"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Priority *</label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
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
            <div className="col-span-2">
              <label className="text-sm font-medium mb-2 block">Status *</label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-2 block">Title *</label>
              <Input
                placeholder="Brief summary of the note"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-2 block">Content *</label>
              <Textarea
                placeholder="Detailed description..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); setSelectedNote(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateNote.isPending}>
              {updateNote.isPending ? "Updating..." : "Update Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
