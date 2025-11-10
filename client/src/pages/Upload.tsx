import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Upload as UploadIcon, FileSpreadsheet, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Upload() {
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [installersFile, setInstallersFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkCreateOrders = trpc.orders.bulkCreate.useMutation();
  const bulkCreateInstallers = trpc.installers.bulkCreate.useMutation();
  const utils = trpc.useUtils();

  const handleOrdersFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOrdersFile(e.target.files[0]);
    }
  };

  const handleInstallersFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInstallersFile(e.target.files[0]);
    }
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  const handleUploadOrders = async () => {
    if (!ordersFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsProcessing(true);
    try {
      const rawData = await parseExcelFile(ordersFile);
      
      // Map Excel columns to database fields
      // Support both generic format and user's specific format (WO No., Customer Name, etc.)
      const orders = rawData.map((row: any) => {
        // Handle appointment date and time
        let appointmentInfo = "";
        if (row["App Date"] || row["App Time"]) {
          const appDate = row["App Date"] || "";
          const appTime = row["App Time"] || "";
          appointmentInfo = `Appointment: ${appDate} ${appTime}`.trim();
        }

        // Handle Status column (contains installer names like "AFIZ/AMAN")
        const statusValue = row["Status"] || row["SI Name"] || "";
        
        // Combine building name and installer assignment into notes
        let notesText = row.notes || row.Notes || "";
        if (row["Building Name"]) {
          notesText += (notesText ? " | " : "") + `Building: ${row["Building Name"]}`;
        }
        if (statusValue) {
          notesText += (notesText ? " | " : "") + `Assigned SI: ${statusValue}`;
        }
        if (appointmentInfo) {
          notesText += (notesText ? " | " : "") + appointmentInfo;
        }

        return {
          orderNumber: String(
            row["WO No."] || row["WO No"] || 
            row.orderNumber || row.OrderNumber || row.order_number || ""
          ),
          serviceNumber: String(
            row["Service No."] || row["Service No"] || 
            row.serviceNumber || row.ServiceNumber || row.service_number || ""
          ),
          customerName: String(
            row["Customer Name"] || 
            row.customerName || row.CustomerName || row.customer_name || ""
          ),
          customerPhone: 
            row["Contact No"] || row["Contact No."] ||
            row.customerPhone || row.CustomerPhone || row.customer_phone || "",
          customerEmail: row.customerEmail || row.CustomerEmail || row.customer_email || "",
          serviceType: 
            row["WO Type"] ||
            row.serviceType || row.ServiceType || row.service_type || "",
          salesModiType:
            row["Sales/Modi Type"] ||
            row.salesModiType || row.SalesModiType || "",
          address: 
            row["Building Name"] ||
            row.address || row.Address || "",
          estimatedDuration: Number(row.estimatedDuration || row.EstimatedDuration || row.estimated_duration || 60),
          priority: (row.priority || row.Priority || "medium").toLowerCase(),
          notes: notesText,
        };
      });

      // Validate required fields
      const invalidRows = orders.filter(o => !o.orderNumber || !o.customerName);
      if (invalidRows.length > 0) {
        toast.error(`${invalidRows.length} rows are missing required fields (orderNumber, customerName)`);
        setIsProcessing(false);
        return;
      }

      await bulkCreateOrders.mutateAsync(orders);
      await utils.orders.list.invalidate();
      
      toast.success(`Successfully imported ${orders.length} orders`);
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

  const handleInstallersUpload = async () => {
    if (!installersFile) {
      toast.error("Please select a file");
      return;
    }

    setIsProcessing(true);
    try {
      const rawData = await parseExcelFile(installersFile);
      
      // Map Excel columns to database fields
      // Support simple list format (just names) or detailed format
      const installers = rawData.map((row: any) => {
        // Handle simple list format where first column contains names
        const firstColumnValue = Object.values(row)[0];
        const nameValue = row.name || row.Name || row["SI LIST:"] || row["SI Name"] || firstColumnValue || "";
        
        return {
          name: String(nameValue).trim(),
          email: row.email || row.Email || "",
          phone: row.phone || row.Phone || "",
          skills: row.skills || row.Skills || "",
          isActive: row.isActive !== undefined ? Number(row.isActive) : 1,
        };
      });

      // Filter out empty rows and validate
      const validInstallers = installers.filter(i => i.name && i.name !== "SI LIST:");
      
      if (validInstallers.length === 0) {
        toast.error("No valid installer names found in the file");
        return;
      }

      // Upload to server
      const result = await bulkCreateInstallers.mutateAsync(validInstallers);
      
      await utils.installers.list.invalidate();
      toast.success(`Successfully imported ${result.count} installers`);
      setInstallersFile(null);
    } catch (error) {
      console.error("Error uploading installers:", error);
      toast.error("Failed to upload installers. Please check your file format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
            <nav className="flex gap-4">
              <Link href="/">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </a>
              </Link>
              <Link href="/upload">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Upload
                </a>
              </Link>
              <Link href="/orders">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Orders
                </a>
              </Link>
              <Link href="/installers">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Installers
                </a>
              </Link>
              <Link href="/schedule">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Schedule
                </a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

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
              Upload an Excel file containing service orders. Required columns: orderNumber, customerName
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

        {/* Upload Installers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Upload Installers</CardTitle>
            </div>
            <CardDescription>
              Upload an Excel file containing installer information. Required column: name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="installers-file-input" className="text-sm font-medium">
                Select File
              </label>
              <input
                id="installers-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleInstallersFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {installersFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {installersFile.name}
              </div>
            )}
            <Button
              onClick={handleInstallersUpload}
              disabled={!installersFile || isProcessing}
              className="w-full"
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload Installers
            </Button>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Expected columns:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>name (required)</li>
                <li>email</li>
                <li>phone</li>
                <li>skills</li>
                <li>isActive (1 for active, 0 for inactive, default: 1)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
