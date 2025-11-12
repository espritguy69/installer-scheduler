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

// Import shared time utilities for consistent formatting
import { excelTimeToReadable, isValidTimeFormat } from "@shared/timeUtils";

export default function Upload() {
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Map<number, string>>(new Map());

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
            ) || undefined,
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

      console.log('=== UPLOAD DEBUG ===');
      console.log('First mapped order:', JSON.stringify(orders[0], null, 2));
      console.log('Total mapped orders:', orders.length);
      console.log('Last 3 mapped orders:');
      orders.slice(-3).forEach((o: any, idx: number) => {
        console.log(`  Order ${orders.length - 2 + idx}: WO="${o.orderNumber}" Service="${o.serviceNumber}" Customer="${o.customerName}"`);
      });
      
      // Filter out completely empty rows (where all key fields are empty)
      const validOrders = orders.filter(o => {
        // Check if at least one key field has actual content (not just empty string)
        const hasOrderNumber = o.orderNumber && o.orderNumber.trim() !== "";
        const hasCustomerName = o.customerName && o.customerName.trim() !== "";
        const hasServiceNumber = o.serviceNumber && o.serviceNumber.trim() !== "";
        const hasServiceType = o.serviceType && o.serviceType.trim() !== "";
        
        return hasOrderNumber || hasCustomerName || hasServiceNumber || hasServiceType;
      });
      
      console.log('Valid orders after filter:', validOrders.length);

      if (validOrders.length === 0) {
        toast.error("No valid order data found in the file");
        setIsProcessing(false);
        return;
      }

      // Validate required fields and formats
      const errors = new Map<number, string>();
      validOrders.forEach((order, index) => {
        // Service Number is required
        if (!order.serviceNumber || order.serviceNumber.trim() === "") {
          errors.set(index, `Service Number is required`);
        }
        // Validate time format if provided
        else if (order.appointmentTime && !isValidTimeFormat(order.appointmentTime)) {
          errors.set(index, `Invalid time format: "${order.appointmentTime}". Expected format: "2:30 PM" or "02:30 PM"`);
        }
      });

      // Show preview dialog with validation results
      setPreviewData(validOrders);
      setValidationErrors(errors);
      setShowPreviewDialog(true);
      setIsProcessing(false);
    } catch (error) {
      console.error("=== UPLOAD ERROR ===");
      console.error("Error uploading orders:", error);
      console.error("Error stack:", (error as any).stack);
      toast.error("Failed to upload orders. Please check the file format.");
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (validationErrors.size > 0) {
      toast.error("Please fix all validation errors before importing");
      return;
    }

    setIsProcessing(true);
    try {
      // Check for duplicates
      const existingOrderNumbers = new Set(existingOrders.map(o => o.orderNumber));
      const duplicateOrders = previewData.filter(o => existingOrderNumbers.has(o.orderNumber));
      const uniqueOrders = previewData.filter(o => !existingOrderNumbers.has(o.orderNumber));

      if (duplicateOrders.length > 0) {
        // Show duplicate dialog
        setDuplicates(duplicateOrders);
        setNewOrders(uniqueOrders);
        setShowDuplicateDialog(true);
        setIsProcessing(false);
        return;
      }

      // No duplicates, proceed with import
      console.log('Calling bulkCreateOrders.mutateAsync with', uniqueOrders.length, 'orders');
      console.log('First order to be created:', JSON.stringify(uniqueOrders[0], null, 2));
      
      const result = await bulkCreateOrders.mutateAsync(uniqueOrders);
      console.log('bulkCreateOrders result:', result);
      await utils.orders.list.invalidate();
      
      toast.success(`Successfully imported ${uniqueOrders.length} orders`, {
        action: {
          label: "View Schedule",
          onClick: () => window.location.href = "/schedule"
        }
      });
      setOrdersFile(null);
      setShowPreviewDialog(false);
      setPreviewData([]);
      setValidationErrors(new Map());
      // Reset file input
      const fileInput = document.getElementById("orders-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("=== IMPORT ERROR ===");
      console.error("Error importing orders:", error);
      console.error("Error stack:", (error as any).stack);
      toast.error("Failed to import orders. Please try again.");
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

      {/* Preview & Validation Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Preview Orders - {previewData.length} rows found
            </DialogTitle>
            <DialogDescription>
              {validationErrors.size === 0 ? (
                <span className="text-green-600 font-medium">✓ All rows validated successfully</span>
              ) : (
                <span className="text-red-600 font-medium">⚠ {validationErrors.size} validation error(s) found - please fix before importing</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">#</th>
                  <th className="px-2 py-2 text-left font-medium">Order No.</th>
                  <th className="px-2 py-2 text-left font-medium">Customer</th>
                  <th className="px-2 py-2 text-left font-medium">App Date</th>
                  <th className="px-2 py-2 text-left font-medium">App Time</th>
                  <th className="px-2 py-2 text-left font-medium">Building</th>
                  <th className="px-2 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((order, index) => {
                  const hasError = validationErrors.has(index);
                  return (
                    <tr key={index} className={hasError ? "bg-red-50" : index % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                      <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-2 py-2 font-mono text-xs">{order.orderNumber || "-"}</td>
                      <td className="px-2 py-2">{order.customerName || "-"}</td>
                      <td className="px-2 py-2">{order.appointmentDate || "-"}</td>
                      <td className={`px-2 py-2 ${hasError ? "text-red-600 font-semibold" : ""}`}>
                        {order.appointmentTime || "-"}
                        {hasError && (
                          <div className="text-xs text-red-600 mt-1">
                            {validationErrors.get(index)}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">{order.buildingName || "-"}</td>
                      <td className="px-2 py-2">
                        {hasError ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Valid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleConfirmImport}
              disabled={validationErrors.size > 0 || isProcessing}
              className="flex-1"
            >
              {isProcessing ? "Importing..." : `Import ${previewData.length} Orders`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowPreviewDialog(false);
                setPreviewData([]);
                setValidationErrors(new Map());
                setOrdersFile(null);
                const fileInput = document.getElementById("orders-file-input") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
              }}
            >
              Cancel & Fix File
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
