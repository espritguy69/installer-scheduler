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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { Loader2, Pencil, Trash2, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Installers() {
  const { user, logout } = useAuth();
  const [selectedInstaller, setSelectedInstaller] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: installers = [], isLoading } = trpc.installers.list.useQuery();
  const createInstaller = trpc.installers.create.useMutation();
  const updateInstaller = trpc.installers.update.useMutation();
  const deleteInstaller = trpc.installers.delete.useMutation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    isActive: 1,
  });

  const filteredInstallers = installers.filter(installer =>
    installer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    installer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    installer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      skills: "",
      isActive: 1,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (installer: any) => {
    setSelectedInstaller(installer);
    setFormData({
      name: installer.name,
      email: installer.email || "",
      phone: installer.phone || "",
      skills: installer.skills || "",
      isActive: installer.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (installer: any) => {
    setSelectedInstaller(installer);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateInstaller = async () => {
    if (!formData.name.trim()) {
      toast.error("Installer name is required");
      return;
    }

    try {
      await createInstaller.mutateAsync(formData);
      await utils.installers.list.invalidate();
      toast.success("Installer created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        skills: "",
        isActive: 1,
      });
    } catch (error) {
      console.error("Error creating installer:", error);
      toast.error("Failed to create installer");
    }
  };

  const handleUpdateInstaller = async () => {
    if (!selectedInstaller) return;

    try {
      await updateInstaller.mutateAsync({
        id: selectedInstaller.id,
        ...formData,
      });

      await utils.installers.list.invalidate();
      toast.success("Installer updated successfully");
      setIsEditDialogOpen(false);
      setSelectedInstaller(null);
    } catch (error) {
      console.error("Error updating installer:", error);
      toast.error("Failed to update installer");
    }
  };

  const handleDeleteInstaller = async () => {
    if (!selectedInstaller) return;

    try {
      await deleteInstaller.mutateAsync({ id: selectedInstaller.id });
      await utils.installers.list.invalidate();
      toast.success("Installer deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedInstaller(null);
    } catch (error) {
      console.error("Error deleting installer:", error);
      toast.error("Failed to delete installer");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading installers...</p>
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
          <h1 className="text-3xl font-bold mb-2">Installers Management</h1>
          <p className="text-muted-foreground">
            View and manage your service installers
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Installers
                </CardTitle>
                <CardDescription>
                  Total: {installers.length} installers ({installers.filter(i => i.isActive).length} active)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search installers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button onClick={handleCreate}>
                  Add Installer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No installers found matching your search." : "No installers found. Upload installers to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInstallers.map((installer) => (
                      <TableRow key={installer.id}>
                        <TableCell className="font-medium">{installer.name}</TableCell>
                        <TableCell>{installer.email || "-"}</TableCell>
                        <TableCell>{installer.phone || "-"}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={installer.skills || ""}>
                            {installer.skills || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            installer.isActive 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}>
                            {installer.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(installer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(installer)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Create Installer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Installer</DialogTitle>
            <DialogDescription>
              Create a new installer profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Installer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Phone</Label>
              <Input
                id="create-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-skills">Skills</Label>
              <Input
                id="create-skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Comma-separated skills"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-isActive">Status</Label>
              <select
                id="create-isActive"
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: Number(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInstaller} disabled={!formData.name.trim()}>
              Create Installer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Installer</DialogTitle>
            <DialogDescription>
              Update installer information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Installer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Comma-separated skills"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <select
                id="isActive"
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: Number(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInstaller} disabled={!formData.name}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Installer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedInstaller?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInstaller}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
