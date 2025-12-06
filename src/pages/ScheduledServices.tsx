import { useState, useMemo } from 'react';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, Gauge, Clock, Printer, Download, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { serviceTypes } from '@/data/mockData';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ScheduledService } from '@/data/mockData';

export default function ScheduledServices() {
  const { scheduledServices, vehicles, updateScheduledService, getVehicle } = useFleet();

  // Safety checks
  if (!scheduledServices || !Array.isArray(scheduledServices) || !vehicles || !Array.isArray(vehicles)) {
    return (
      <div className="animate-fade-in min-h-full">
        <PageHeader 
          title="Scheduled Services" 
          description="Track and manage scheduled vehicle maintenance"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading scheduled services...</p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTriggerType, setFilterTriggerType] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState<(ScheduledService & { vehicleNumber?: string; vehicleModel?: string; currentKM?: number }) | null>(null);

  // Aggregate with vehicle info
  const aggregatedServices = useMemo(() => {
    return scheduledServices.map(ss => {
      const vehicle = vehicles.find(v => v.id === ss.vehicleId);
      return {
        ...ss,
        vehicleNumber: vehicle?.vehicleNumber || 'Unknown',
        vehicleModel: vehicle?.model || 'Unknown',
        currentKM: vehicle?.currentKM || 0,
        id: ss.id,
      };
    });
  }, [scheduledServices, vehicles]);

  const filteredServices = useMemo(() => {
    return aggregatedServices.filter(ss => {
      const matchesSearch = ss.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ss.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || ss.status === filterStatus;
      const matchesTrigger = !filterTriggerType || ss.triggerType === filterTriggerType;
      return matchesSearch && matchesStatus && matchesTrigger;
    });
  }, [aggregatedServices, searchTerm, filterStatus, filterTriggerType]);

  // Stats
  const dueCount = scheduledServices.filter(s => s.status === 'Due').length;
  const upcomingCount = scheduledServices.filter(s => s.status === 'Upcoming').length;
  const kmBasedCount = scheduledServices.filter(s => s.triggerType === 'KM').length;
  const hoursBasedCount = scheduledServices.filter(s => s.triggerType === 'Hours').length;

  const handlePrint = () => {
    printPage('scheduled-services-table');
  };

  const handleExport = () => {
    const exportData = filteredServices.map(ss => ({
      'Vehicle Number': ss.vehicleNumber,
      'Vehicle Model': ss.vehicleModel,
      'Service Type': ss.serviceType,
      'Trigger Type': ss.triggerType,
      'Trigger Value': ss.triggerValue,
      'Current KM': ss.currentKM,
      'Last Service Date': ss.lastServiceDate || 'N/A',
      'Last Service KM': ss.lastServiceKM || 'N/A',
      'Next Due KM': ss.nextDueKM || 'N/A',
      'Next Due Date': ss.nextDueDate || 'N/A',
      'Status': ss.status,
    }));
    exportToExcel(exportData, `scheduled_services_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Scheduled services exported successfully');
  };

  const handleViewDetails = (service: typeof aggregatedServices[0]) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };

  const handleMarkAsCompleted = (service: typeof aggregatedServices[0]) => {
    const vehicle = getVehicle(service.vehicleId);
    if (!vehicle) {
      toast.error('Vehicle not found');
      return;
    }

    // Calculate next due date based on trigger type
    let nextDueKM: number | undefined;
    let nextDueDate: string | undefined;
    
    if (service.triggerType === 'KM' && typeof service.triggerValue === 'number') {
      nextDueKM = vehicle.currentKM + service.triggerValue;
    } else if (service.triggerType === 'Hours' && typeof service.triggerValue === 'number') {
      const daysFromNow = Math.ceil(service.triggerValue / 8); // Assuming 8 hours per day
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysFromNow);
      nextDueDate = nextDate.toISOString().split('T')[0];
    } else if (service.triggerType === 'Date') {
      const lastDate = service.nextDueDate ? new Date(service.nextDueDate) : new Date();
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 6); // Default 6 months
      nextDueDate = nextDate.toISOString().split('T')[0];
    }

    updateScheduledService({
      ...service,
      status: 'Completed',
      lastServiceDate: format(new Date(), 'yyyy-MM-dd'),
      lastServiceKM: vehicle.currentKM,
      nextDueKM,
      nextDueDate,
    });

    toast.success('Service marked as completed. Next due date updated.');
    setShowDetailModal(false);
  };

  return (
    <div className="animate-fade-in min-h-full w-full" style={{ minHeight: '100vh' }}>
      <PageHeader 
        title="Scheduled Services" 
        description="Track and manage scheduled vehicle maintenance"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Calendar className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Now</p>
              <p className="text-2xl font-bold text-destructive">{dueCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <Calendar className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-info">{upcomingCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">KM-Based</p>
              <p className="text-2xl font-bold">{kmBasedCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hours-Based</p>
              <p className="text-2xl font-bold">{hoursBasedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Due Services Alert */}
      {dueCount > 0 && (
        <div className="mb-6 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <h3 className="font-semibold text-destructive mb-3">Services Due Immediately</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aggregatedServices.filter(s => s.status === 'Due').map(service => (
              <div key={service.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{service.vehicleNumber}</span>
                  <StatusBadge status="Due" />
                </div>
                <p className="text-sm text-muted-foreground">{service.serviceType}</p>
                <p className="text-sm">
                  {service.triggerType === 'KM' 
                    ? `Due at ${service.nextDueKM?.toLocaleString()} KM (Current: ${service.currentKM.toLocaleString()})`
                    : `Due based on ${service.triggerType}`
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle or service type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Due">Due</SelectItem>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTriggerType || "all"} onValueChange={(v) => setFilterTriggerType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Triggers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            <SelectItem value="KM">KM-Based</SelectItem>
            <SelectItem value="Hours">Hours-Based</SelectItem>
            <SelectItem value="Date">Date-Based</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scheduled Services Table */}
      <div id="scheduled-services-table">
        <DataTable
          data={filteredServices}
          columns={[
            { key: 'vehicleNumber', header: 'Vehicle' },
            { key: 'vehicleModel', header: 'Model' },
            { key: 'serviceType', header: 'Service Type' },
            { key: 'triggerType', header: 'Trigger' },
            { 
              key: 'triggerValue', 
              header: 'Interval',
              render: (item) => (
                item.triggerType === 'KM' 
                  ? `Every ${item.triggerValue.toLocaleString()} KM`
                  : item.triggerType === 'Hours'
                  ? `Every ${item.triggerValue} Hours`
                  : item.triggerValue
              )
            },
            { 
              key: 'currentKM', 
              header: 'Current KM',
              render: (item) => item.currentKM.toLocaleString()
            },
            { 
              key: 'nextDueKM', 
              header: 'Next Due KM',
              render: (item) => item.nextDueKM ? item.nextDueKM.toLocaleString() : '-'
            },
            { key: 'lastServiceDate', header: 'Last Service' },
            { 
              key: 'status', 
              header: 'Status',
              render: (item) => <StatusBadge status={item.status} />
            },
            {
              key: 'actions',
              header: 'Actions',
              className: 'text-right',
              render: (item) => (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(item);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {item.status !== 'Completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsCompleted(item);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          onRowClick={(item) => handleViewDetails(item)}
          emptyMessage="No scheduled services found"
        />
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scheduled Service Details</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Vehicle Number</Label>
                  <p className="font-medium">{selectedService.vehicleNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle Model</Label>
                  <p className="font-medium">{selectedService.vehicleModel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Service Type</Label>
                  <p className="font-medium">{selectedService.serviceType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <StatusBadge status={selectedService.status} />
                </div>
                <div>
                  <Label className="text-muted-foreground">Trigger Type</Label>
                  <p className="font-medium">{selectedService.triggerType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trigger Value</Label>
                  <p className="font-medium">
                    {selectedService.triggerType === 'KM' 
                      ? `${selectedService.triggerValue.toLocaleString()} KM`
                      : selectedService.triggerType === 'Hours'
                      ? `${selectedService.triggerValue} Hours`
                      : selectedService.triggerValue}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Current KM</Label>
                  <p className="font-medium">{selectedService.currentKM?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Next Due KM</Label>
                  <p className="font-medium">{selectedService.nextDueKM ? selectedService.nextDueKM.toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Service Date</Label>
                  <p className="font-medium">
                    {selectedService.lastServiceDate 
                      ? format(new Date(selectedService.lastServiceDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Service KM</Label>
                  <p className="font-medium">{selectedService.lastServiceKM ? selectedService.lastServiceKM.toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Next Due Date</Label>
                  <p className="font-medium">
                    {selectedService.nextDueDate 
                      ? format(new Date(selectedService.nextDueDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {selectedService.status === 'Due' && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    This service is due and requires immediate attention
                  </p>
                </div>
              )}
              {selectedService.status !== 'Completed' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => handleMarkAsCompleted(selectedService)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
