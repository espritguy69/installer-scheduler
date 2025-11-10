import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Upload as UploadIcon, FileSpreadsheet, User } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">{APP_TITLE}</CardTitle>
            <CardDescription className="text-base">
              Efficiently manage and assign service orders to installers with drag-and-drop scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Navigation />

      {/* Main Content */}
      <main className="container py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Welcome to Service Scheduler</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Streamline your service installation workflow with our intuitive scheduling tool. Upload orders, assign them to installers, and export schedules with ease.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <UploadIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Upload Data</CardTitle>
              <CardDescription>
                Import service orders and installer information from Excel or CSV files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/upload">Go to Upload</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Schedule Tasks</CardTitle>
              <CardDescription>
                Drag and drop orders onto the calendar to assign them to installers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/schedule">Go to Schedule</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Export Schedule</CardTitle>
              <CardDescription>
                Download daily or weekly schedules as Excel files for easy distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link href="/schedule">View Schedule</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Installer View</CardTitle>
              <CardDescription>
                Mobile-friendly view for installers to manage their daily tasks and update order status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/installer">Open Installer Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
