import { useAuth } from "@/_core/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from "sonner";

interface TimeSlot {
  id: number;
  time: string;
  sortOrder: number;
  isActive: number;
}

function SortableTimeSlotItem({ timeSlot, onToggle, onDelete }: { 
  timeSlot: TimeSlot; 
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: timeSlot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="flex-1 font-medium">{timeSlot.time}</div>
      
      <div className="flex items-center gap-2">
        <Label htmlFor={`active-${timeSlot.id}`} className="text-sm">Active</Label>
        <Switch
          id={`active-${timeSlot.id}`}
          checked={timeSlot.isActive === 1}
          onCheckedChange={(checked) => onToggle(timeSlot.id, checked)}
        />
      </div>
      
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

export default function Settings() {
  const { user, loading } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: timeSlotsData, refetch } = trpc.timeSlots.list.useQuery();
  const seedDefaultsMutation = trpc.timeSlots.seedDefaults.useMutation();
  const createMutation = trpc.timeSlots.create.useMutation();
  const updateMutation = trpc.timeSlots.update.useMutation();
  const deleteMutation = trpc.timeSlots.delete.useMutation();
  const reorderMutation = trpc.timeSlots.reorder.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (timeSlotsData) {
      setTimeSlots(timeSlotsData as TimeSlot[]);
    }
  }, [timeSlotsData]);

  // Seed defaults if no time slots exist
  useEffect(() => {
    if (timeSlotsData && timeSlotsData.length === 0) {
      seedDefaultsMutation.mutate(undefined, {
        onSuccess: () => {
          refetch();
          toast.success("Default time slots created");
        },
      });
    }
  }, [timeSlotsData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTimeSlots((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update sortOrder and save to database
        const timeSlotIds = newItems.map((item: TimeSlot) => item.id);
        reorderMutation.mutate({ timeSlotIds }, {
          onSuccess: () => {
            toast.success("Time slots reordered");
            refetch();
          },
        });
        
        return newItems;
      });
    }
  };

  const handleAddTimeSlot = () => {
    if (!newTimeSlot.trim()) {
      toast.error("Please enter a time");
      return;
    }

    const nextSortOrder = Math.max(...timeSlots.map(t => t.sortOrder), -1) + 1;

    createMutation.mutate(
      { time: newTimeSlot, sortOrder: nextSortOrder, isActive: 1 },
      {
        onSuccess: () => {
          toast.success("Time slot added");
          setNewTimeSlot("");
          setIsAddDialogOpen(false);
          refetch();
        },
        onError: (error) => {
          toast.error("Failed to add time slot: " + error.message);
        },
      }
    );
  };

  const handleToggleActive = (id: number, isActive: boolean) => {
    updateMutation.mutate(
      { id, isActive: isActive ? 1 : 0 },
      {
        onSuccess: () => {
          toast.success(isActive ? "Time slot enabled" : "Time slot disabled");
          refetch();
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId === null) return;

    deleteMutation.mutate(
      { id: deleteConfirmId },
      {
        onSuccess: () => {
          toast.success("Time slot deleted");
          setDeleteConfirmId(null);
          refetch();
        },
        onError: (error) => {
          toast.error("Failed to delete: " + error.message);
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Please log in to access settings</div>
      </div>
    );
  }

  // Admin-only access
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need administrator privileges to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Time Slot Settings</CardTitle>
                <CardDescription>
                  Manage available time slots for the schedule view. Drag to reorder, toggle to enable/disable.
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {timeSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No time slots configured. Click "Add Time Slot" to get started.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={timeSlots.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {timeSlots.map((timeSlot) => (
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
      </div>

      {/* Add Time Slot Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Slot</DialogTitle>
            <DialogDescription>
              Enter a time in 12-hour format (e.g., "9:00 AM", "2:30 PM")
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                placeholder="e.g., 9:00 AM"
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTimeSlot}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Slot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this time slot? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
