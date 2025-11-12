import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OrderHistoryDialogProps {
  orderId: number;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderHistoryDialog({ orderId, orderNumber, open, onOpenChange }: OrderHistoryDialogProps) {
  const { data: history, isLoading } = trpc.orders.getHistory.useQuery(
    { orderId },
    { enabled: open }
  );

  const formatStatusLabel = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600';
      case 'assigned':
        return 'text-blue-600';
      case 'on_the_way':
        return 'text-yellow-600';
      case 'met_customer':
        return 'text-green-600';
      case 'completed':
        return 'text-green-600';
      case 'docket_received':
        return 'text-orange-600';
      case 'docket_uploaded':
        return 'text-orange-600';
      case 'rescheduled':
        return 'text-purple-600';
      case 'withdrawn':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order History - {orderNumber}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No history records found for this order.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={entry.id} className="relative pl-8 pb-4">
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border" />
                )}
                
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                
                {/* Content */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      {entry.action === 'status_changed' && (
                        <div className="font-medium">
                          Status changed from{' '}
                          <span className={getStatusColor(entry.oldValue || '')}>
                            {formatStatusLabel(entry.oldValue || '')}
                          </span>
                          {' '}to{' '}
                          <span className={getStatusColor(entry.newValue || '')}>
                            {formatStatusLabel(entry.newValue || '')}
                          </span>
                        </div>
                      )}
                      {entry.action === 'created' && (
                        <div className="font-medium">Order created</div>
                      )}
                      {entry.action === 'updated' && entry.fieldName !== 'status' && (
                        <div className="font-medium">
                          {formatStatusLabel(entry.fieldName || 'Field')} updated
                          {entry.oldValue && entry.newValue && (
                            <span className="text-sm text-muted-foreground">
                              {' '}from "{entry.oldValue}" to "{entry.newValue}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  {entry.userName && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {entry.userName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
