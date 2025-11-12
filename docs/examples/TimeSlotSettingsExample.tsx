/**
 * TimeSlotSettingsExample.tsx
 * 
 * A comprehensive example component for managing time slot settings
 * with drag-and-drop reordering, CRUD operations, and admin controls.
 * 
 * This example showcases:
 * - Fetching time slots with tRPC
 * - Create, update, delete operations
 * - Drag-and-drop reordering with @dnd-kit
 * - Toggle active/inactive status
 * - Input validation
 * - Optimistic updates
 * - Seeding default time slots
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, GripVertical, Trash2, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Type definitions
type TimeSlot = {
  id: number;
  time: string;
  sortOrder: number;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
};

// Sortable Time Slot Item Component
function SortableTimeSlotItem({
  timeSlot,
  onToggle,
  onDelete,
}: {
  timeSlot: TimeSlot;
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: timeSlot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:bg-gray-50"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Time Display */}
      <div className="flex items-center gap-2 flex-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{timeSlot.time}</span>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-2">
        <Label htmlFor={`active-${timeSlot.id}`} className="text-sm">
          Active
        </Label>
        <Switch
          id={`active-${timeSlot.id}`}
          checked={timeSlot.isActive === 1}
          onCheckedChange={(checked) => onToggle(timeSlot.id, checked)}
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(timeSlot.id)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function TimeSlotSettingsExample() {
  // State management
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Fetch time slots
  const { data: timeSlots, isLoading } = trpc.timeSlots.list.useQuery();

  // Utility functions
  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.timeSlots.create.useMutation({
    onSuccess: () => {
      toast.success("Time slot created");
      setIsAddDialogOpen(false);
      setNewTimeSlot("");
      utils.timeSlots.list.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to create time slot: " + err.message);
    },
  });

  const updateMutation = trpc.timeSlots.update.useMutation({
    onMutate: async (updatedSlot) => {
      await utils.timeSlots.list.cancel();
      const previousSlots = utils.timeSlots.list.getData();

      // Optimistically update
      utils.timeSlots.list.setData(undefined, (old) =>
        old?.map((slot) =>
          slot.id === updatedSlot.id ? { ...slot, ...updatedSlot } : slot
        )
      );

      return { previousSlots };
    },
    onError: (err, variables, context) => {
      utils.timeSlots.list.setData(undefined, context?.previousSlots);
      toast.error("Failed to update time slot: " + err.message);
    },
    onSuccess: () => {
      toast.success("Time slot updated");
    },
    onSettled: () => {
      utils.timeSlots.list.invalidate();
    },
  });

  const deleteMutation = trpc.timeSlots.delete.useMutation({
    onSuccess: () => {
      toast.success("Time slot deleted");
      setDeleteConfirmId(null);
      utils.timeSlots.list.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to delete time slot: " + err.message);
    },
  });

  const reorderMutation = trpc.timeSlots.reorder.useMutation({
    onSuccess: () => {
      toast.success("Time slots reordered");
      utils.timeSlots.list.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to reorder time slots: " + err.message);
    },
  });

  const seedDefaultsMutation = trpc.timeSlots.seedDefaults.useMutation({
    onSuccess: (data) => {
      toast.success(`Created ${data.count} default time slots`);
      utils.timeSlots.list.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to seed defaults: " + err.message);
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !timeSlots) return;

    const oldIndex = timeSlots.findIndex((slot) => slot.id === active.id);
    const newIndex = timeSlots.findIndex((slot) => slot.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically reorder in UI
    const reorderedSlots = arrayMove(timeSlots, oldIndex, newIndex);
    utils.timeSlots.list.setData(undefined, reorderedSlots);

    // Send reorder request
    const timeSlotIds = reorderedSlots.map((slot) => slot.id);
    reorderMutation.mutate({ timeSlotIds });
  };

  // Handle toggle active status
  const handleToggleActive = (id: number, isActive: boolean) => {
    updateMutation.mutate({
      id,
      isActive: isActive ? 1 : 0,
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate({ id: deleteConfirmId });
    }
  };

  // Handle create
  const handleCreate = () => {
    if (!newTimeSlot.trim()) {
      toast.error("Please enter a time");
      return;
    }

    // Validate time format (basic check)
    const timePattern = /^\d{1,2}:\d{2}\s?(AM|PM)$/i;
    if (!timePattern.test(newTimeSlot.trim())) {
      toast.error("Invalid time format. Use format like '9:00 AM' or '2:30 PM'");
      return;
    }

    // Check for duplicates
    if (timeSlots?.some((slot) => slot.time === newTimeSlot.trim())) {
      toast.error("This time slot already exists");
      return;
    }

    const nextSortOrder = timeSlots ? Math.max(...timeSlots.map((s) => s.sortOrder)) + 1 : 0;

    createMutation.mutate({
      time: newTimeSlot.trim(),
      sortOrder: nextSortOrder,
      isActive: 1,
    });
  };

  // Handle seed defaults
  const handleSeedDefaults = () => {
    if (timeSlots && timeSlots.length > 0) {
      toast.error("Time slots already exist. Delete existing slots first.");
      return;
    }
    seedDefaultsMutation.mutate();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading time slots...</p>
        </div>
      </div>
    );
  }

  const sortedTimeSlots = timeSlots
    ? [...timeSlots].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Time Slot Settings</CardTitle>
              <CardDescription>
                Manage available appointment time slots. Drag to reorder.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(!timeSlots || timeSlots.length === 0) && (
                <Button
                  variant="outline"
                  onClick={handleSeedDefaults}
                  disabled={seedDefaultsMutation.isPending}
                >
                  {seedDefaultsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    "Seed Defaults"
                  )}
                </Button>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Time Slot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Time Slot</DialogTitle>
                    <DialogDescription>
                      Enter a time in 12-hour format (e.g., "9:00 AM", "2:30 PM")
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        placeholder="e.g., 9:00 AM"
                        value={newTimeSlot}
                        onChange={(e) => setNewTimeSlot(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCreate();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!timeSlots || timeSlots.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">No Time Slots</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first time slot or seeding defaults
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleSeedDefaults}>
                  Seed Defaults
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedTimeSlots.map((slot) => slot.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sortedTimeSlots.map((timeSlot) => (
                    <SortableTimeSlotItem
                      key={timeSlot.id}
                      timeSlot={timeSlot}
                      onToggle={handleToggleActive}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the time slot
              and it will no longer appear in the schedule view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
