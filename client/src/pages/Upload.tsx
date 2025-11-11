import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Upload as UploadIcon, FileSpreadsheet } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

// Helper function to convert Excel date serial number to readable format
function excelDateToReadable(excelDate: any): string {
  if (!excelDate && excelDate !== 0) return "";
  
  // If it's already a string, return it
  if (typeof excelDate === 'string') return excelDate;
  
  // Convert Excel serial date to JavaScript Date
  // Excel dates are days since 1900-01-01 (with 1900-01-01 being day 1)
  // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
  const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
  const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
  
  // Format as "MMM DD, YYYY" to match Assurance format
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[jsDate.getMonth()]} ${jsDate.getDate()}, ${jsDate.getFullYear()}`;
}

// Helper function to convert Excel time decimal to readable format
function excelTimeToReadable(excelTime: any): string {
  if (!excelTime && excelTime !== 0) return "";
  
  // If it's already a string, return it
  if (typeof excelTime === 'string') return excelTime;
  
  // Convert Excel decimal time to hours and minutes
  const totalMinutes = Math.round(excelTime * 24 * 60);
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for midnight
  
  // Format as HH:MM AM/PM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export default function Upload() {
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const bulkCreateOrders = trpc.orders.bulkCreate.useMutation();
  const { data: existingOrders = [] } = trpc.orders.list.useQuery();
  const utils = trpc.useUtils();

  const handleOrdersFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOrdersFile(e.target.files[0]);
    }
  };



  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          
          // Read ALL sheets and combine data
          const allData: any[] = [];
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            // Add sheet name to each row for date reference
            jsonData.forEach((row: any) => {
              row._sheetName = sheetName;
            });
            allData.push(...jsonData);
          });
          
          resolve(allData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  // Helper function to parse sheet name as date (e.g., "11 NOV" → "Nov 11, 2025")
  const parseSheetNameAsDate = (sheetName: string): string => {
    if (!sheetName) return "";
    
    // Match patterns like "1 NOV", "11 NOV", "3 NOV"
    const match = sheetName.match(/(\d{1,2})\s*([A-Z]{3})/i);
    if (match) {
      const day = match[1];
      const monthAbbr = match[2].toUpperCase();
      const monthMap: Record<string, string> = {
        "JAN": "Jan", "FEB": "Feb", "MAR": "Mar", "APR": "Apr",
        "MAY": "May", "JUN": "Jun", "JUL": "Jul", "AUG": "Aug",
        "SEP": "Sep", "OCT": "Oct", "NOV": "Nov", "DEC": "Dec"
      };
      const month = monthMap[monthAbbr];
      if (month) {
        // Use current year (2025)
        return `${month} ${day}, 2025`;
      }
    }
    return "";
  };

  // Helper function to parse date-time string like "Nov 11, 2025 1:00 PM"
  const parseAppointmentDateTime = (dateTimeStr: string): { date: string, time: string } => {
    if (!dateTimeStr) return { date: "", time: "" };
    
    try {
      // Parse "Nov 11, 2025 1:00 PM" format
      const match = dateTimeStr.match(/(\w+ \d+, \d{4}) (\d{1,2}:\d{2} [AP]M)/);
      if (match) {
        return { date: match[1], time: match[2] };
      }
      return { date: dateTimeStr, time: "" };
    } catch {
      return { date: dateTimeStr, time: "" };
    }
  };

  const handleUploadOrders = async () => {
    if (!ordersFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsProcessing(true);
    try {
      const rawData = await parseExcelFile(ordersFile);
      
      // Detect file format by checking headers
      const firstRow = rawData[0] || {};
      const isAssuranceFormat = 'TBBN NO.' in firstRow || 'Ticket Number' in firstRow || 'AWO NO.' in firstRow;
      
      console.log('Detected format:', isAssuranceFormat ? 'Assurance' : 'Standard');
      console.log('First row data:', firstRow);
      console.log('Raw data length:', rawData.length);
      
      // Map Excel columns to database fields based on detected format
      const orders = rawData.map((row: any) => {
        if (isAssuranceFormat) {
          // Assurance format mapping
          const appointmentDateTime = parseAppointmentDateTime(row["Appointment Date"] || "");
          
          return {
            orderNumber: String(row["AWO NO."] || ""),
            ticketNumber: String(row["Ticket Number"] || ""),
            serviceNumber: String(row["TBBN NO."] || ""),
            customerName: String(row["Name"] || ""),
            customerPhone: String(row["Contact No"] || ""),
            customerEmail: "",
            serviceType: "",
            salesModiType: "",
            address: "",
            appointmentDate: appointmentDateTime.date,
            appointmentTime: appointmentDateTime.time,
            buildingName: String(row["Building"] || ""),
            estimatedDuration: 120,
            priority: "medium" as "low" | "medium" | "high",
            notes: String(row["Remarks"] || ""),
          };
        } else {
          // Standard format mapping
          const notesText = row.notes || row.Notes || "";
          
          return {
            orderNumber: String(
              row["WO No."] || row["WO No"] || 
              row.orderNumber || row.OrderNumber || row.order_number || ""
            ),
            ticketNumber: String(
              row["Ticket Number"] || row["Ticket No"] ||
              row.ticketNumber || row.TicketNumber || ""
            ),
            serviceNumber: String(
              row["Service No."] || row["Service No"] || 
              row.serviceNumber || row.ServiceNumber || row.service_number || ""
            ),
            customerName: String(
              row["Customer Name"] || 
              row.customerName || row.CustomerName || row.customer_name || ""
            ),
            customerPhone: String(
              row["Contact No"] || row["Contact No."] ||
              row.customerPhone || row.CustomerPhone || row.customer_phone || ""
            ),
            customerEmail: row.customerEmail || row.CustomerEmail || row.customer_email || "",
            serviceType: 
              row["WO Type"] ||
              row.serviceType || row.ServiceType || row.service_type || "",
            salesModiType:
              row["Sales/Modi Type"] ||
              row.salesModiType || row.SalesModiType || "",
            address: 
              row.address || row.Address || "",
            appointmentDate: (() => {
              const appDate = row["App Date"] || row["Appointment Date"] ||
                row.appointmentDate || row.AppointmentDate || "";
              
              // If App Date is missing or looks like a serial number, use sheet name
              if (!appDate || (typeof appDate === 'number' && appDate > 40000)) {
                const sheetDate = parseSheetNameAsDate(row._sheetName || "");
                if (sheetDate) return sheetDate;
              }
              
              return excelDateToReadable(appDate);
            })(),
            appointmentTime: excelTimeToReadable(
              row["App Time"] || row["Appointment Time"] ||
              row.appointmentTime || row.AppointmentTime || ""
            ),
            buildingName: String(
              row["Building Name"] ||
              row.buildingName || row.BuildingName || ""
            ),
            estimatedDuration: Number(row.estimatedDuration || row.EstimatedDuration || row.estimated_duration || 120),
            priority: (row.priority || row.Priority || "medium").toLowerCase(),
            notes: notesText,
          };
        }
      });

      console.log('First mapped order:', orders[0]);
      console.log('Total mapped orders:', orders.length);
      
      // Filter out completely empty rows (where all key fields are empty)
      const validOrders = orders.filter(o => 
        o.orderNumber || o.customerName || o.serviceNumber || o.serviceType
      );
      
      console.log('Valid orders after filter:', validOrders.length);

      if (validOrders.length === 0) {
        toast.error("No valid order data found in the file");
        setIsProcessing(false);
        return;
      }

      // Check for duplicates
      const existingOrderNumbers = new Set(existingOrders.map(o => o.orderNumber));
      const duplicateOrders = validOrders.filter(o => existingOrderNumbers.has(o.orderNumber));
      const uniqueOrders = validOrders.filter(o => !existingOrderNumbers.has(o.orderNumber));

      if (duplicateOrders.length > 0) {
        // Show duplicate dialog
        setDuplicates(duplicateOrders);
        setNewOrders(uniqueOrders);
        setShowDuplicateDialog(true);
        setIsProcessing(false);
        return;
      }

      // No duplicates, proceed with import
      await bulkCreateOrders.mutateAsync(uniqueOrders);
      await utils.orders.list.invalidate();
      
      toast.success(`Successfully imported ${uniqueOrders.length} orders`, {
        action: {
          label: "View Schedule",
          onClick: () => window.location.href = "/schedule"
        }
      });
      setOrdersFile(null);
      // Reset file input
      const fileInput = document.getElementById("orders-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error uploading orders:", error);
      toast.error("Failed to upload orders. Please check the file format.");
    } finally {
      setIsProcessing(false);
    }
  };



  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Navigation />

      <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Data</h1>
        <p className="text-muted-foreground">
          Import service orders and installer information from Excel or CSV files
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              <CardTitle>Upload Orders</CardTitle>
            </div>
            <CardDescription>
              Upload an Excel file containing service orders. Expected columns: WO No., WO Type, Sales/Modi Type, Service No., Customer Name, Contact No, App Date, App Time, Building Name, Status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="orders-file-input" className="text-sm font-medium">
                Select File
              </label>
              <input
                id="orders-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleOrdersFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {ordersFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {ordersFile.name}
              </div>
            )}
            <Button
              onClick={handleUploadOrders}
              disabled={!ordersFile || isProcessing}
              className="w-full"
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload Orders
            </Button>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Supported column formats:</p>
              <p className="mt-2 font-medium">Standard format:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>orderNumber (required)</li>
                <li>customerName (required)</li>
                <li>customerPhone, serviceType, address, priority, notes</li>
              </ul>
              <p className="mt-2 font-medium">Work Order format:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>WO No. (required)</li>
                <li>Customer Name (required)</li>
                <li>Contact No, WO Type, Sales/Modi Type</li>
                <li>App Date, App Time, Building Name, SI Name</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Warning Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duplicate Orders Detected</DialogTitle>
            <DialogDescription>
              Found {duplicates.length} duplicate order(s) and {newOrders.length} new order(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Duplicate Orders:</h4>
              <ul className="space-y-1 text-sm">
                {duplicates.map((order, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    {order.orderNumber} - {order.customerName}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  // Import only new orders (skip duplicates)
                  if (newOrders.length > 0) {
                    await bulkCreateOrders.mutateAsync(newOrders);
                    await utils.orders.list.invalidate();
                    toast.success(`Imported ${newOrders.length} new orders. Skipped ${duplicates.length} duplicates.`, {
                      action: {
                        label: "View Schedule",
                        onClick: () => window.location.href = "/schedule"
                      }
                    });
                  } else {
                    toast.info("No new orders to import.");
                  }
                  setShowDuplicateDialog(false);
                  setOrdersFile(null);
                  const fileInput = document.getElementById("orders-file-input") as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
              >
                Skip Duplicates ({duplicates.length})
              </Button>
              <Button
                onClick={async () => {
                  // Import all orders (including duplicates as updates)
                  const allOrders = [...newOrders, ...duplicates];
                  await bulkCreateOrders.mutateAsync(allOrders);
                  await utils.orders.list.invalidate();
                  toast.success(`Imported ${newOrders.length} new orders and updated ${duplicates.length} existing orders.`, {
                    action: {
                      label: "View Schedule",
                      onClick: () => window.location.href = "/schedule"
                    }
                  });
                  setShowDuplicateDialog(false);
                  setOrdersFile(null);
                  const fileInput = document.getElementById("orders-file-input") as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
              >
                Update Existing ({duplicates.length})
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setOrdersFile(null);
                  const fileInput = document.getElementById("orders-file-input") as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
