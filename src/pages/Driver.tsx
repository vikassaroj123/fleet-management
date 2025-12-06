import { useState, useMemo } from 'react';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { Search, Printer, Download, Eye, Truck, ClipboardList, Wrench, MapPin, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { branches } from '@/data/mockData';
import { exportToCSV, exportToExcel, printPage } from '@/lib/exportUtils';
import { format } from 'date-fns';
import type { Driver } from '@/data/mockData';

export default function Driver() {
  const { drivers, vehicles, getDriverHistory, jobCards, serviceHistory } = useFleet();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Safety check
  if (!drivers || !Array.isArray(drivers)) {
    return (
      <div className="animate-fade-in min-h-full w-full">
        <PageHeader 
          title="Drivers" 
          description="Manage and track fleet drivers"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading drivers data...</p>
        </div>
      </div>
    );
  }

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = 
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone.includes(searchTerm);
      const matchesBranch = !filterBranch || driver.branch === filterBranch;
      return matchesSearch && matchesBranch;
    });
  }, [drivers, searchTerm, filterBranch]);

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const handlePrint = () => {
    printPage('drivers-table');
  };

  const handleExport = () => {
    const exportData = filteredDrivers.map(d => ({
      'Name': d.name,
      'Phone': d.phone,
      'License Number': d.licenseNumber,
      'Branch': d.branch,
      'Sub Branch': d.subBranch,
      'Assigned Vehicle': vehicles?.find(v => v.driverId === d.id)?.vehicleNumber || 'N/A',
    }));
    exportToExcel(exportData, `drivers_${new Date().toISOString().split('T')[0]}`);
    toast.success('Drivers data exported successfully');
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      className: 'font-medium',
    },
    {
      key: 'phone',
      header: 'Phone',
    },
    {
      key: 'licenseNumber',
      header: 'License Number',
    },
    {
      key: 'branch',
      header: 'Branch',
    },
    {
      key: 'subBranch',
      header: 'Sub Branch',
    },
    {
      key: 'vehicle',
      header: 'Assigned Vehicle',
      render: (driver: Driver) => {
        const vehicle = vehicles?.find(v => v.driverId === driver.id);
        return vehicle ? vehicle.vehicleNumber : 'N/A';
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (driver: Driver) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(driver);
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in min-h-full w-full" id="drivers-page">
      <PageHeader 
        title="Drivers" 
        description="Manage and track fleet drivers"
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

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterBranch || 'all'} onValueChange={(v) => setFilterBranch(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div id="drivers-table">
        <DataTable
          data={filteredDrivers}
          columns={columns}
          emptyMessage="No drivers found"
        />
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Details & Complete History</DialogTitle>
          </DialogHeader>
          {selectedDriver && (() => {
            const history = getDriverHistory(selectedDriver.id);
            const currentVehicle = vehicles?.find(v => v.driverId === selectedDriver.id);
            
            return (
              <div className="space-y-6">
                {/* Driver Basic Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Driver Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedDriver.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedDriver.phone}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">License Number</Label>
                      <p className="font-medium">{selectedDriver.licenseNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Branch</Label>
                      <p className="font-medium">{selectedDriver.branch}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Sub Branch</Label>
                      <p className="font-medium">{selectedDriver.subBranch}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current Vehicle</Label>
                      <p className="font-medium">
                        {currentVehicle?.vehicleNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* History Tabs */}
                <Tabs defaultValue="vehicles" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="vehicles">
                      <Truck className="w-4 h-4 mr-2" />
                      Vehicles ({history.vehicles.length})
                    </TabsTrigger>
                    <TabsTrigger value="jobcards">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Job Cards ({history.jobCards.length})
                    </TabsTrigger>
                    <TabsTrigger value="services">
                      <Wrench className="w-4 h-4 mr-2" />
                      Services ({history.serviceHistory.length})
                    </TabsTrigger>
                    <TabsTrigger value="summary">
                      <Calendar className="w-4 h-4 mr-2" />
                      Summary
                    </TabsTrigger>
                  </TabsList>

                  {/* Vehicle Assignment History */}
                  <TabsContent value="vehicles" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {history.vehicles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No vehicle assignment history</p>
                        </div>
                      ) : (
                        history.vehicles.map((assignment) => {
                          const vehicle = vehicles?.find(v => v.id === assignment.vehicleId);
                          return (
                            <div key={assignment.id} className="border border-border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Truck className="w-5 h-5 text-primary" />
                                    <div>
                                      <p className="font-semibold">{assignment.vehicleNumber}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {vehicle?.model || 'Unknown Model'}
                                      </p>
                                    </div>
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
                                        <StatusBadge status="Active" variant="success" />
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
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>

                  {/* Job Cards History */}
                  <TabsContent value="jobcards" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {history.jobCards.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No job cards found</p>
                        </div>
                      ) : (
                        history.jobCards.map((jobCard) => (
                          <div key={jobCard.id} className="border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{jobCard.id}</p>
                                <p className="text-sm text-muted-foreground">{jobCard.vehicleNumber}</p>
                              </div>
                              <StatusBadge status={jobCard.status} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Date:</span>
                                <p className="font-medium">{format(new Date(jobCard.jobDate), 'MMM dd, yyyy')}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Time:</span>
                                <p className="font-medium">{jobCard.startTime} - {jobCard.endTime}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">KM:</span>
                                <p className="font-medium">{jobCard.totalKM.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cost:</span>
                                <p className="font-medium">SAR {jobCard.totalCost.toLocaleString()}</p>
                              </div>
                            </div>
                            {jobCard.servicesDone.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm text-muted-foreground">Services: </span>
                                <span className="text-sm font-medium">
                                  {jobCard.servicesDone.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Service History */}
                  <TabsContent value="services" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {history.serviceHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No service history found</p>
                        </div>
                      ) : (
                        history.serviceHistory.map((service) => {
                          const vehicle = vehicles?.find(v => v.id === service.vehicleId);
                          return (
                            <div key={service.id} className="border border-border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold">{service.serviceType}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {vehicle?.vehicleNumber || 'Unknown Vehicle'}
                                  </p>
                                </div>
                                <p className="font-semibold text-primary">
                                  SAR {service.cost.toLocaleString()}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Date:</span>
                                  <p className="font-medium">
                                    {format(new Date(service.serviceDate), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                {service.jobCardId && (
                                  <div>
                                    <span className="text-muted-foreground">Job Card:</span>
                                    <p className="font-medium">{service.jobCardId}</p>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2">
                                <span className="text-sm text-muted-foreground">Work Done:</span>
                                <p className="text-sm font-medium mt-1">{service.workDone}</p>
                              </div>
                              {service.partsUsed.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-sm text-muted-foreground">Parts Used: </span>
                                  <span className="text-sm font-medium">
                                    {service.partsUsed.map(p => `${p.itemName} (${p.quantity})`).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>

                  {/* Summary */}
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Vehicles</p>
                        <p className="text-2xl font-bold">{history.vehicles.length}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Job Cards</p>
                        <p className="text-2xl font-bold">{history.jobCards.length}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Services</p>
                        <p className="text-2xl font-bold">{history.serviceHistory.length}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Service Cost</p>
                        <p className="text-2xl font-bold">
                          SAR {history.serviceHistory.reduce((sum, s) => sum + s.cost, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {currentVehicle && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Current Vehicle Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Vehicle:</span>
                            <p className="font-medium">{currentVehicle.vehicleNumber}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Model:</span>
                            <p className="font-medium">{currentVehicle.model}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current KM:</span>
                            <p className="font-medium">{currentVehicle.currentKM.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Hours:</span>
                            <p className="font-medium">{currentVehicle.totalHours.toLocaleString()}</p>
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

