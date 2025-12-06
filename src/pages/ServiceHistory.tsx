import { useState, useMemo } from 'react';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Calendar, DollarSign, Wrench, Clock, Printer, Download, Eye } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { serviceTypes } from '@/data/mockData';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Vehicle, ServiceHistory as ServiceHistoryType } from '@/data/mockData';

export default function ServiceHistory() {
  const { vehicles, serviceHistory, getVehicleServiceHistory } = useFleet();

  // Safety checks
  if (!vehicles || !Array.isArray(vehicles) || !serviceHistory || !Array.isArray(serviceHistory)) {
    return (
      <div className="animate-fade-in min-h-full">
        <PageHeader 
          title="Vehicle Service History" 
          description="View complete service records for all vehicles"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading service history...</p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filterServiceType, setFilterServiceType] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleHistory, setShowVehicleHistory] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceHistoryType & { vehicleNumber?: string; vehicleModel?: string } | null>(null);

  // Filter by date period
  const filterByPeriod = (dateStr: string) => {
    if (filterPeriod === 'all') return true;
    
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterPeriod) {
      case 'today':
        return date >= today;
      case 'weekly':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      case 'monthly':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      case 'yearly':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return date >= yearAgo;
      default:
        return true;
    }
  };

  // Aggregate service history with vehicle info
  const aggregatedHistory = useMemo(() => {
    return serviceHistory.map(sh => {
      const vehicle = vehicles.find(v => v.id === sh.vehicleId);
      return {
        ...sh,
        vehicleNumber: vehicle?.vehicleNumber || 'Unknown',
        vehicleModel: vehicle?.model || 'Unknown',
        id: sh.id,
      };
    });
  }, [serviceHistory, vehicles]);

  const filteredHistory = useMemo(() => {
    return aggregatedHistory.filter(sh => {
      const matchesSearch = sh.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sh.workDone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesServiceType = !filterServiceType || sh.serviceType === filterServiceType;
      const matchesPeriod = filterByPeriod(sh.serviceDate);
      return matchesSearch && matchesServiceType && matchesPeriod;
    });
  }, [aggregatedHistory, searchTerm, filterServiceType, filterPeriod]);

  // Stats
  const totalServiceCost = filteredHistory.reduce((sum, sh) => sum + sh.cost, 0);
  const uniqueVehicles = new Set(filteredHistory.map(sh => sh.vehicleId)).size;

  const handleViewVehicleHistory = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setShowVehicleHistory(true);
    }
  };

  const vehicleHistory = selectedVehicle ? getVehicleServiceHistory(selectedVehicle.id) : [];

  // Group history by service type
  const groupedHistory = useMemo(() => {
    const groups: Record<string, ServiceHistoryType[]> = {};
    vehicleHistory.forEach(sh => {
      if (!groups[sh.serviceType]) {
        groups[sh.serviceType] = [];
      }
      groups[sh.serviceType].push(sh);
    });
    return groups;
  }, [vehicleHistory]);

  const handlePrint = () => {
    printPage('service-history-table');
  };

  const handleExport = () => {
    const exportData = filteredHistory.map(sh => ({
      'Vehicle Number': sh.vehicleNumber,
      'Vehicle Model': sh.vehicleModel,
      'Service Type': sh.serviceType,
      'Service Date': sh.serviceDate,
      'Work Done': sh.workDone,
      'Parts Used': sh.partsUsed.map(p => `${p.itemName} (${p.quantity})`).join('; '),
      'Cost (SAR)': sh.cost,
      'Job Card ID': sh.jobCardId || 'N/A',
    }));
    exportToExcel(exportData, `service_history_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Service history exported successfully');
  };

  return (
    <div className="animate-fade-in min-h-full w-full" style={{ minHeight: '100vh' }}>
      <PageHeader 
        title="Vehicle Service History" 
        description="View complete service records for all vehicles"
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
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-2xl font-bold">{filteredHistory.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold">SAR {totalServiceCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <Calendar className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vehicles Serviced</p>
              <p className="text-2xl font-bold">{uniqueVehicles}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Cost/Service</p>
              <p className="text-2xl font-bold">
                SAR {filteredHistory.length > 0 ? Math.round(totalServiceCost / filteredHistory.length).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle or work description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterServiceType || "all"} onValueChange={(v) => setFilterServiceType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Service Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Service Types</SelectItem>
            {serviceTypes.map(st => (
              <SelectItem key={st} value={st}>{st}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="yearly">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service History Table */}
      <div id="service-history-table">
        <DataTable
          data={filteredHistory}
          columns={[
            { 
              key: 'vehicleNumber', 
              header: 'Vehicle',
              render: (item) => (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewVehicleHistory(item.vehicleId);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {item.vehicleNumber}
                </button>
              )
            },
            { key: 'serviceType', header: 'Service Type' },
            { key: 'serviceDate', header: 'Date' },
            { key: 'workDone', header: 'Work Done', className: 'max-w-[250px] truncate' },
            { 
              key: 'partsUsed', 
              header: 'Parts Used',
              render: (item) => `${item.partsUsed.length} items`
            },
            { 
              key: 'cost', 
              header: 'Cost',
              render: (item) => `SAR ${item.cost.toLocaleString()}`
            },
            { key: 'jobCardId', header: 'Job Card' },
            {
              key: 'actions',
              header: 'Actions',
              className: 'text-right',
              render: (item) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedService(item);
                    setShowDetailModal(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              ),
            },
          ]}
          onRowClick={(item) => {
            setSelectedService(item);
            setShowDetailModal(true);
          }}
          emptyMessage="No service history found"
        />
      </div>

      {/* Vehicle History Modal */}
      <Dialog open={showVehicleHistory} onOpenChange={setShowVehicleHistory}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Service History - {selectedVehicle?.vehicleNumber} ({selectedVehicle?.model})
            </DialogTitle>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-6 py-4">
              {/* Vehicle Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Services:</span>
                    <p className="font-semibold">{vehicleHistory.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Cost:</span>
                    <p className="font-semibold">SAR {vehicleHistory.reduce((s, h) => s + h.cost, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current KM:</span>
                    <p className="font-semibold">{selectedVehicle.currentKM.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next Service:</span>
                    <p className="font-semibold">{selectedVehicle.nextServiceKM.toLocaleString()} KM</p>
                  </div>
                </div>
              </div>

              {/* Timeline View */}
              <div>
                <h3 className="font-semibold mb-4">Service Timeline</h3>
                <div className="space-y-4">
                  {vehicleHistory.map((sh, index) => (
                    <div key={sh.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        {index < vehicleHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-border flex-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-card border border-border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{sh.serviceType}</h4>
                            <span className="text-sm text-muted-foreground">{sh.serviceDate}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{sh.workDone}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">
                              Parts: {sh.partsUsed.length > 0 
                                ? sh.partsUsed.map(p => p.itemName).join(', ')
                                : 'None'}
                            </span>
                            <span className="font-semibold">SAR {sh.cost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grouped by Service Type */}
              <div>
                <h3 className="font-semibold mb-4">By Service Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(groupedHistory).map(([type, history]) => (
                    <div key={type} className="bg-card border border-border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{type}</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Count: {history.length}</p>
                        <p>Total Cost: SAR {history.reduce((s, h) => s + h.cost, 0).toLocaleString()}</p>
                        <p>Last: {history[0]?.serviceDate || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => setShowVehicleHistory(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service History Details</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Vehicle Number</Label>
                  <p className="font-medium">{selectedService.vehicleNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Service Type</Label>
                  <p className="font-medium">{selectedService.serviceType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Service Date</Label>
                  <p className="font-medium">{format(new Date(selectedService.serviceDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cost</Label>
                  <p className="font-medium text-lg">SAR {selectedService.cost.toLocaleString()}</p>
                </div>
                {selectedService.jobCardId && (
                  <div>
                    <Label className="text-muted-foreground">Job Card ID</Label>
                    <p className="font-medium">{selectedService.jobCardId}</p>
                  </div>
                )}
                {selectedService.mechanicName && (
                  <div>
                    <Label className="text-muted-foreground">Mechanic</Label>
                    <p className="font-medium">{selectedService.mechanicName}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Work Done</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-line">{selectedService.workDone}</p>
                </div>
              </div>
              {selectedService.partsUsed && selectedService.partsUsed.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Parts Used ({selectedService.partsUsed.length})</Label>
                  <div className="space-y-2">
                    {selectedService.partsUsed.map((part, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{part.itemName}</p>
                          <p className="text-sm text-muted-foreground">SKU: {part.itemId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {part.quantity}</p>
                          {part.unitPrice && (
                            <p className="text-sm text-muted-foreground">
                              SAR {(part.unitPrice * part.quantity).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
