import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FleetProvider } from "@/context/FleetContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import JobCard from "./pages/JobCard";
import Vehicle from "./pages/Vehicle";
import Driver from "./pages/Driver";
import Inventory from "./pages/Inventory";
import PurchaseEntry from "./pages/PurchaseEntry";
import ServiceHistory from "./pages/ServiceHistory";
import Documents from "./pages/Documents";
import SiteVisit from "./pages/SiteVisit";
import BranchManagement from "./pages/BranchManagement";
import Reports from "./pages/Reports";
import ScheduledServices from "./pages/ScheduledServices";
import PendingWork from "./pages/PendingWork";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FleetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/job-card" element={<JobCard />} />
              <Route path="/vehicle" element={<Vehicle />} />
              <Route path="/driver" element={<Driver />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/purchase" element={<PurchaseEntry />} />
              <Route path="/service-history" element={<ServiceHistory />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/site-visit" element={<SiteVisit />} />
              <Route path="/branch-management" element={<BranchManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/scheduled-services" element={<ScheduledServices />} />
              <Route path="/pending-work" element={<PendingWork />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </FleetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
