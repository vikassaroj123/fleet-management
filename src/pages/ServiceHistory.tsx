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
import { Search, Calendar, DollarSign, Wrench, Clock, Printer, Download, Eye, User, Truck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Label } from '@/components/ui/label';
import { serviceTypes } from '@/data/mockData';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Vehicle, ServiceHistory as ServiceHistoryType } from '@/data/mockData';

export default function ServiceHistory() {
  const { vehicles, serviceHistory, getVehicleServiceHistory, drivers, driverAssignmentHistory, jobCards } = useFleet();

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

  // Helper function to get driver at time of service
  const getDriverAtServiceTime = (vehicleId: string, serviceDate: string) => {
    // Find the driver assignment that was active at the time of service
    const assignments = driverAssignmentHistory
      .filter(dah => dah.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    
    const serviceDateTime = new Date(serviceDate);
    
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assignedAt);
      const unassignedAt = assignment.unassignedAt ? new Date(assignment.unassignedAt) : new Date();
      
      if (serviceDateTime >= assignedAt && serviceDateTime <= unassignedAt) {
        return drivers?.find(d => d.id === assignment.driverId);
      }
    }
    
    // Fallback to current driver if no historical match
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle?.driverId) {
      return drivers?.find(d => d.id === vehicle.driverId);
    }
    
    return null;
  };

  // Calculate time between services
  const getTimeBetweenServices = (currentServiceDate: string, previousServiceDate?: string) => {
    if (!previousServiceDate) return null;
    
    const current = new Date(currentServiceDate);
    const previous = new Date(previousServiceDate);
    const diffTime = Math.abs(current.getTime() - previous.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return days > 0 ? `${months} months ${days} days` : `${months} months`;
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return months > 0 ? `${years} years ${months} months` : `${years} years`;
    }
  };

  // Aggregate service history with vehicle info and driver info
  const aggregatedHistory = useMemo(() => {
    return serviceHistory.map((sh, index) => {
      const vehicle = vehicles.find(v => v.id === sh.vehicleId);
      const sortedHistory = [...serviceHistory]
        .filter(s => s.vehicleId === sh.vehicleId)
        .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
      
      const currentIndex = sortedHistory.findIndex(s => s.id === sh.id);
      const previousService = currentIndex > 0 ? sortedHistory[currentIndex - 1] : undefined;
      const timeBetween = getTimeBetweenServices(sh.serviceDate, previousService?.serviceDate);
      const driverAtService = getDriverAtServiceTime(sh.vehicleId, sh.serviceDate);
      const jobCard = jobCards.find(jc => jc.id === sh.jobCardId);
      
      return {
        ...sh,
        vehicleNumber: vehicle?.vehicleNumber || 'Unknown',
        vehicleModel: vehicle?.model || 'Unknown',
        driverAtService: driverAtService,
        timeBetweenServices: timeBetween,
        jobCard: jobCard,
        id: sh.id,
      };
    });
  }, [serviceHistory, vehicles, drivers, driverAssignmentHistory, jobCards]);

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
            { 
              key: 'driver', 
              header: 'Driver',
              render: (item: typeof aggregatedHistory[0]) => {
                const driver = item.driverAtService;
                return driver ? driver.name : 'N/A';
              }
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Complete Service History - {selectedVehicle?.vehicleNumber} ({selectedVehicle?.model})
            </DialogTitle>
          </DialogHeader>

          {selectedVehicle && (() => {
            const vehicleDriverHistory = driverAssignmentHistory
              .filter(dah => dah.vehicleId === selectedVehicle.id)
              .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
            const currentDriver = drivers?.find(d => d.id === selectedVehicle.driverId);
            
            return (
              <div className="space-y-6 py-4">
                <Tabs defaultValue="services" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="services">Service History</TabsTrigger>
                    <TabsTrigger value="driver">Driver History</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>

                  {/* Service History */}
                  <TabsContent value="services" className="space-y-4 mt-4">
                    {/* Vehicle Summary */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                        {vehicleHistory.map((sh, index) => {
                          const driverAtService = getDriverAtServiceTime(sh.vehicleId, sh.serviceDate);
                          const previousService = index > 0 ? vehicleHistory[index - 1] : undefined;
                          const timeBetween = getTimeBetweenServices(sh.serviceDate, previousService?.serviceDate);
                          
                          return (
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
                                    <div>
                                      <h4 className="font-medium">{sh.serviceType}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(sh.serviceDate), 'MMM dd, yyyy')}
                                        {timeBetween && (
                                          <span className="ml-2 text-primary">• {timeBetween} since last</span>
                                        )}
                                      </p>
                                    </div>
                                    <span className="font-semibold text-primary">SAR {sh.cost.toLocaleString()}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{sh.workDone}</p>
                                  <div className="flex justify-between items-center flex-wrap gap-2">
                                    <div className="flex items-center gap-4 text-sm">
                                      <span>
                                        Parts: {sh.partsUsed.length > 0 
                                          ? sh.partsUsed.map(p => p.itemName).join(', ')
                                          : 'None'}
                                      </span>
                                      {driverAtService && (
                                        <span className="text-muted-foreground">
                                          Driver: <span className="font-medium">{driverAtService.name}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                  </TabsContent>

                  {/* Driver History */}
                  <TabsContent value="driver" className="space-y-4 mt-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Current Driver</h4>
                      {currentDriver ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <p className="font-medium">{currentDriver.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-medium">{currentDriver.phone}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">License:</span>
                            <p className="font-medium">{currentDriver.licenseNumber}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Branch:</span>
                            <p className="font-medium">{currentDriver.branch}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No driver currently assigned</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Driver Assignment History</h4>
                      <div className="space-y-3">
                        {vehicleDriverHistory.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No driver assignment history found</p>
                          </div>
                        ) : (
                          vehicleDriverHistory.map((assignment) => {
                            const driver = drivers?.find(d => d.id === assignment.driverId);
                            return (
                              <div key={assignment.id} className="border border-border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-semibold">{driver?.name || 'Unknown Driver'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {driver?.licenseNumber || 'N/A'}
                                    </p>
                                  </div>
                                  {!assignment.unassignedAt && (
                                    <StatusBadge status="Active" variant="success" />
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Assigned:</span>
                                    <p className="font-medium">
                                      {format(new Date(assignment.assignedAt), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                  </div>
                                  {assignment.unassignedAt ? (
                                    <div>
                                      <span className="text-muted-foreground">Unassigned:</span>
                                      <p className="font-medium">
                                        {format(new Date(assignment.unassignedAt), 'MMM dd, yyyy HH:mm')}
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="text-muted-foreground">Status:</span>
                                      <p className="font-medium text-success">Currently Assigned</p>
                                    </div>
                                  )}
                                  {assignment.assignedBy && (
                                    <div>
                                      <span className="text-muted-foreground">Assigned By:</span>
                                      <p className="font-medium">{assignment.assignedBy}</p>
                                    </div>
                                  )}
                                  {assignment.reason && (
                                    <div>
                                      <span className="text-muted-foreground">Reason:</span>
                                      <p className="font-medium">{assignment.reason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Summary */}
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Services</p>
                        <p className="text-2xl font-bold">{vehicleHistory.length}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold">
                          SAR {vehicleHistory.reduce((s, h) => s + h.cost, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Driver Assignments</p>
                        <p className="text-2xl font-bold">{vehicleDriverHistory.length}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Current KM</p>
                        <p className="text-2xl font-bold">{selectedVehicle.currentKM.toLocaleString()}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Service Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Service History Details</DialogTitle>
          </DialogHeader>
          {selectedService && (() => {
            const serviceWithDetails = aggregatedHistory.find(s => s.id === selectedService.id);
            const vehicle = vehicles.find(v => v.id === selectedService.vehicleId);
            const partsTotal = serviceWithDetails?.partsUsed.reduce((sum, p) => sum + (p.lineTotal || 0), 0) || 0;
            const laborCost = serviceWithDetails ? serviceWithDetails.cost - partsTotal : 0;
            
            return (
              <div className="space-y-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Service Details</TabsTrigger>
                    <TabsTrigger value="cost">Cost Breakdown</TabsTrigger>
                    <TabsTrigger value="driver">Driver & Vehicle</TabsTrigger>
                  </TabsList>

                  {/* Service Details */}
                  <TabsContent value="details" className="space-y-4 mt-4">
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
                        <Label className="text-muted-foreground">Service Date</Label>
                        <p className="font-medium">{format(new Date(selectedService.serviceDate), 'MMM dd, yyyy')}</p>
                      </div>
                      {serviceWithDetails?.timeBetweenServices && (
                        <div>
                          <Label className="text-muted-foreground">Time Since Last Service</Label>
                          <p className="font-medium text-primary">{serviceWithDetails.timeBetweenServices}</p>
                        </div>
                      )}
                      {selectedService.jobCardId && (
                        <div>
                          <Label className="text-muted-foreground">Job Card ID</Label>
                          <p className="font-medium">{selectedService.jobCardId}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Work Done</Label>
                      <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm whitespace-pre-line">{selectedService.workDone}</p>
                      </div>
                    </div>
                    {serviceWithDetails?.jobCard && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Job Card Information</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <p className="font-medium">{format(new Date(serviceWithDetails.jobCard.jobDate), 'MMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <p className="font-medium">{serviceWithDetails.jobCard.startTime} - {serviceWithDetails.jobCard.endTime}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">KM:</span>
                            <p className="font-medium">{serviceWithDetails.jobCard.totalKM.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Hours:</span>
                            <p className="font-medium">{serviceWithDetails.jobCard.totalHours.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Cost Breakdown */}
                  <TabsContent value="cost" className="space-y-4 mt-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold">Total Service Cost</h4>
                        <p className="text-2xl font-bold text-primary">SAR {selectedService.cost.toLocaleString()}</p>
                      </div>
                      <div className="space-y-3">
                        {serviceWithDetails?.partsUsed && serviceWithDetails.partsUsed.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Parts Cost: SAR {partsTotal.toLocaleString()}</h5>
                            <div className="space-y-2">
                              {serviceWithDetails.partsUsed.map((part, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium">{part.itemName}</p>
                                    <p className="text-sm text-muted-foreground">SKU: {part.itemId}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">Qty: {part.quantity}</p>
                                    {part.unitPrice && (
                                      <p className="text-sm text-muted-foreground">
                                        @ SAR {part.unitPrice.toLocaleString()}/unit
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="font-semibold">SAR {part.lineTotal.toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {laborCost > 0 && (
                          <div className="flex justify-between items-center p-3 bg-card border border-border rounded-lg">
                            <div>
                              <p className="font-medium">Labor Cost</p>
                              <p className="text-sm text-muted-foreground">Service and labor charges</p>
                            </div>
                            <p className="font-semibold text-lg">SAR {laborCost.toLocaleString()}</p>
                          </div>
                        )}
                        <div className="border-t pt-3 flex justify-between items-center">
                          <p className="font-semibold text-lg">Grand Total</p>
                          <p className="font-bold text-xl text-primary">SAR {selectedService.cost.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Driver & Vehicle */}
                  <TabsContent value="driver" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Driver at Time of Service
                        </h4>
                        {serviceWithDetails?.driverAtService ? (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-muted-foreground">Name</Label>
                              <p className="font-medium">{serviceWithDetails.driverAtService.name}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Phone</Label>
                              <p className="font-medium">{serviceWithDetails.driverAtService.phone}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">License Number</Label>
                              <p className="font-medium">{serviceWithDetails.driverAtService.licenseNumber}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Branch</Label>
                              <p className="font-medium">{serviceWithDetails.driverAtService.branch}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No driver assigned at time of service</p>
                        )}
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Vehicle Information
                        </h4>
                        {vehicle && (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-muted-foreground">Vehicle Number</Label>
                              <p className="font-medium">{vehicle.vehicleNumber}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Model</Label>
                              <p className="font-medium">{vehicle.model}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Type</Label>
                              <p className="font-medium">{vehicle.type}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Branch</Label>
                              <p className="font-medium">{vehicle.branch} / {vehicle.subBranch}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Current Status</Label>
                              <StatusBadge 
                                status={vehicle.status} 
                                variant={
                                  vehicle.status === 'Active' ? 'success' :
                                  vehicle.status === 'In Service' ? 'warning' : 'danger'
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {vehicle && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Current Vehicle Status</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Current KM:</span>
                            <p className="font-medium">{vehicle.currentKM.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Hours:</span>
                            <p className="font-medium">{vehicle.totalHours.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Next Service KM:</span>
                            <p className="font-medium">{vehicle.nextServiceKM.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Next Service Date:</span>
                            <p className="font-medium">{format(new Date(vehicle.nextServiceDate), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
