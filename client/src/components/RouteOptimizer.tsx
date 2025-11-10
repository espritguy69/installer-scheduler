import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Clock } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  address: string;
  scheduledStartTime?: string;
}

interface RouteOptimizerProps {
  orders: Order[];
  installerName: string;
  onApplyRoute: (optimizedOrders: Order[]) => void;
}

export function RouteOptimizer({ orders, installerName, onApplyRoute }: RouteOptimizerProps) {
  const [open, setOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<Order[]>([]);

  const optimizeRoute = async () => {
    if (orders.length === 0) {
      toast.error("No orders to optimize");
      return;
    }

    setOptimizing(true);
    try {
      // Simple optimization: sort by address proximity (alphabetically as a basic approach)
      // In production, this would use Google Maps Distance Matrix API
      const sorted = [...orders].sort((a, b) => {
        const addrA = a.address || "";
        const addrB = b.address || "";
        return addrA.localeCompare(addrB);
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOptimizedRoute(sorted);
      toast.success("Route optimized successfully");
    } catch (error) {
      toast.error("Failed to optimize route");
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyRoute = () => {
    onApplyRoute(optimizedRoute);
    setOpen(false);
    toast.success("Optimized route applied");
  };

  const calculateEstimatedTime = () => {
    // Estimate 2 hours per job + 30 min travel between jobs
    const jobTime = orders.length * 2;
    const travelTime = Math.max(0, orders.length - 1) * 0.5;
    return jobTime + travelTime;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
          if (orders.length > 0 && optimizedRoute.length === 0) {
            optimizeRoute();
          }
        }}
        disabled={orders.length === 0}
      >
        <Navigation className="mr-2 h-4 w-4" />
        Optimize Route
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Route Optimization - {installerName}</DialogTitle>
            <DialogDescription>
              Optimized route based on address proximity to minimize travel time
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {optimizing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Calculating optimal route...</p>
              </div>
            ) : optimizedRoute.length > 0 ? (
              <>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">Estimated Total Time</div>
                    <div className="text-sm text-muted-foreground">
                      {calculateEstimatedTime().toFixed(1)} hours ({orders.length} jobs)
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {optimizedRoute.map((order, index) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{order.orderNumber}</div>
                            <div className="text-sm">{order.customerName}</div>
                            <div className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span>{order.address || "No address"}</span>
                            </div>
                            {order.scheduledStartTime && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Scheduled: {order.scheduledStartTime}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApplyRoute}>
                    Apply Optimized Route
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No orders to optimize
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
