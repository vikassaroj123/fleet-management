import { useState, useMemo } from 'react';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Search, Plus, Printer, Download, Edit, Eye, UserCheck, History, Users, TrendingUp, AlertCircle, Wrench, ClipboardList, Calendar, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { branches, subBranches } from '@/data/mockData';
import { exportToCSV, exportToExcel, printPage } from '@/lib/exportUtils';
import type { Vehicle } from '@/data/mockData';

interface DriverAssignmentHistory {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  oldDriverId: string;
  oldDriverName: string;
  newDriverId: string;
  newDriverName: string;
  changedBy: string;
  changeDate: string;
  reason?: string;
}

export default function Vehicle() {
  const { vehicles, drivers, updateVehicle, getVehicleServiceHistory, jobCards, serviceHistory, driverAssignmentHistory } = useFleet();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChangeDriverModal, setShowChangeDriverModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [newDriverId, setNewDriverId] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [driverHistory, setDriverHistory] = useState<DriverAssignmentHistory[]>([]);
  const [selectedVehiclesForBulk, setSelectedVehiclesForBulk] = useState<string[]>([]);
  const [bulkDriverId, setBulkDriverId] = useState('');

  // Safety check
  if (!vehicles || !Array.isArray(vehicles)) {
    return (
      <div className="animate-fade-in min-h-full w-full">
        <PageHeader 
          title="Vehicles" 
          description="Manage and track fleet vehicles"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading vehicles data...</p>
        </div>
      </div>
    );
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = 
        vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = !filterBranch || vehicle.branch === filterBranch;
      const matchesStatus = !filterStatus || vehicle.status === filterStatus;
      const matchesType = !filterType || vehicle.type === filterType;
      const matchesDriver = !filterDriver || vehicle.driverId === filterDriver;
      return matchesSearch && matchesBranch && matchesStatus && matchesType && matchesDriver;
    });
  }, [vehicles, searchTerm, filterBranch, filterStatus, filterType, filterDriver]);

  // Analytics
  const vehicleStats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
    const vehiclesWithDrivers = vehicles.filter(v => v.driverId).length;
    const vehiclesWithoutDrivers = totalVehicles - vehiclesWithDrivers;
    const avgKM = vehicles.reduce((sum, v) => sum + v.currentKM, 0) / totalVehicles || 0;
    const avgHours = vehicles.reduce((sum, v) => sum + v.totalHours, 0) / totalVehicles || 0;
    
    return {
      totalVehicles,
      activeVehicles,
      vehiclesWithDrivers,
      vehiclesWithoutDrivers,
      avgKM: Math.round(avgKM),
      avgHours: Math.round(avgHours),
    };
  }, [vehicles]);

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleChangeDriver = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setNewDriverId('');
    setChangeReason('');
    setShowChangeDriverModal(true);
  };

  const handleConfirmDriverChange = () => {
    if (!selectedVehicle || !newDriverId) {
      toast.error('Please select a new driver');
      return;
    }

    const oldDriver = drivers?.find(d => d.id === selectedVehicle.driverId);
    const newDriver = drivers?.find(d => d.id === newDriverId);

    if (!newDriver) {
      toast.error('Selected driver not found');
      return;
    }

    // Check if driver is already assigned to another vehicle
    const driverAlreadyAssigned = vehicles.find(v => 
      v.id !== selectedVehicle.id && v.driverId === newDriverId && v.status === 'Active'
    );

    if (driverAlreadyAssigned) {
      if (!window.confirm(`${newDriver.name} is already assigned to ${driverAlreadyAssigned.vehicleNumber}. Do you want to reassign?`)) {
        return;
      }
    }

    // Update vehicle
    const updatedVehicle: Vehicle = {
      ...selectedVehicle,
      driverId: newDriverId,
    };
    updateVehicle(updatedVehicle);

    // Add to history
    const historyEntry: DriverAssignmentHistory = {
      id: `DH${String(driverHistory.length + 1).padStart(3, '0')}`,
      vehicleId: selectedVehicle.id,
      vehicleNumber: selectedVehicle.vehicleNumber,
      oldDriverId: selectedVehicle.driverId || '',
      oldDriverName: oldDriver?.name || 'Unassigned',
      newDriverId: newDriverId,
      newDriverName: newDriver.name,
      changedBy: 'System Admin', // In real app, this would be current user
      changeDate: new Date().toISOString(),
      reason: changeReason || undefined,
    };
    setDriverHistory(prev => [historyEntry, ...prev]);

    toast.success(`Driver changed from ${oldDriver?.name || 'Unassigned'} to ${newDriver.name}`);
    setShowChangeDriverModal(false);
    setSelectedVehicle(null);
    setNewDriverId('');
    setChangeReason('');
  };

  const handleViewHistory = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    const vehicleHistory = driverHistory.filter(h => h.vehicleId === vehicle.id);
    setShowHistoryModal(true);
  };

  const handleBulkDriverAssign = () => {
    if (selectedVehiclesForBulk.length === 0) {
      toast.error('Please select at least one vehicle');
      return;
    }
    if (!bulkDriverId) {
      toast.error('Please select a driver');
      return;
    }

    const newDriver = drivers?.find(d => d.id === bulkDriverId);
    if (!newDriver) {
      toast.error('Selected driver not found');
      return;
    }

    let changedCount = 0;
    selectedVehiclesForBulk.forEach(vehicleId => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        const oldDriver = drivers?.find(d => d.id === vehicle.driverId);
        updateVehicle({ ...vehicle, driverId: bulkDriverId });
        
        const historyEntry: DriverAssignmentHistory = {
          id: `DH${String(driverHistory.length + changedCount + 1).padStart(3, '0')}`,
          vehicleId: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
          oldDriverId: vehicle.driverId || '',
          oldDriverName: oldDriver?.name || 'Unassigned',
          newDriverId: bulkDriverId,
          newDriverName: newDriver.name,
          changedBy: 'System Admin',
          changeDate: new Date().toISOString(),
          reason: 'Bulk assignment',
        };
        setDriverHistory(prev => [historyEntry, ...prev]);
        changedCount++;
      }
    });

    toast.success(`Driver ${newDriver.name} assigned to ${changedCount} vehicle(s)`);
    setShowBulkAssignModal(false);
    setSelectedVehiclesForBulk([]);
    setBulkDriverId('');
  };

  const handleToggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehiclesForBulk(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handlePrint = () => {
    printPage('vehicles-table');
  };

  const handleExport = () => {
    const exportData = filteredVehicles.map(v => ({
      'Vehicle Number': v.vehicleNumber,
      'Model': v.model,
      'Type': v.type,
      'Branch': v.branch,
      'Sub Branch': v.subBranch,
      'Driver': drivers?.find(d => d.id === v.driverId)?.name || 'N/A',
      'Current KM': v.currentKM,
      'Next Service KM': v.nextServiceKM,
      'Next Service Date': v.nextServiceDate,
      'Total Hours': v.totalHours,
      'Next Service Hours': v.nextServiceHours,
      'Status': v.status,
    }));
    exportToExcel(exportData, `vehicles_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Vehicles data exported successfully');
  };

  const columns = [
    {
      key: 'vehicleNumber',
      header: 'Vehicle Number',
      className: 'font-medium',
    },
    {
      key: 'model',
      header: 'Model',
    },
    {
      key: 'type',
      header: 'Type',
    },
    {
      key: 'branch',
      header: 'Branch',
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (vehicle: Vehicle) => {
        const driver = drivers?.find(d => d.id === vehicle.driverId);
        return driver ? driver.name : 'N/A';
      },
    },
    {
      key: 'currentKM',
      header: 'Current KM',
      render: (vehicle: Vehicle) => vehicle.currentKM.toLocaleString(),
    },
    {
      key: 'totalHours',
      header: 'Total Hours',
      render: (vehicle: Vehicle) => vehicle.totalHours.toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (vehicle: Vehicle) => (
        <StatusBadge 
          status={vehicle.status} 
          variant={
            vehicle.status === 'Active' ? 'success' :
            vehicle.status === 'In Service' ? 'warning' : 'danger'
          }
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (vehicle: Vehicle) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(vehicle);
            }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleChangeDriver(vehicle);
            }}
            title="Change Driver"
          >
            <UserCheck className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewHistory(vehicle);
            }}
            title="Driver History"
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in min-h-full w-full" id="vehicles-page">
      <PageHeader 
        title="Vehicles" 
        description="Manage and track fleet vehicles"
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
            <Button 
              variant="outline" 
              onClick={() => setShowBulkAssignModal(true)}
              disabled={selectedVehiclesForBulk.length === 0}
            >
              <Users className="w-4 h-4 mr-2" />
              Bulk Assign ({selectedVehiclesForBulk.length})
            </Button>
          </div>
        }
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vehicles</p>
              <p className="text-2xl font-bold">{vehicleStats.totalVehicles}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{vehicleStats.activeVehicles}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">With Drivers</p>
              <p className="text-2xl font-bold">{vehicleStats.vehiclesWithDrivers}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unassigned</p>
              <p className="text-2xl font-bold">{vehicleStats.vehiclesWithoutDrivers}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg KM</p>
              <p className="text-2xl font-bold">{vehicleStats.avgKM.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Hours</p>
              <p className="text-2xl font-bold">{vehicleStats.avgHours.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search vehicles..."
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
          <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="In Service">In Service</SelectItem>
              <SelectItem value="Idle">Idle</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Bus">Bus</SelectItem>
              <SelectItem value="Car">Car</SelectItem>
              <SelectItem value="Bike">Bike</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDriver || 'all'} onValueChange={(v) => setFilterDriver(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {drivers?.map(driver => (
                <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Quick Actions:</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const unassigned = vehicles.filter(v => !v.driverId).map(v => v.id);
                setSelectedVehiclesForBulk(unassigned);
                if (unassigned.length > 0) {
                  toast.info(`${unassigned.length} unassigned vehicles selected`);
                } else {
                  toast.info('No unassigned vehicles found');
                }
              }}
            >
              Select Unassigned
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedVehiclesForBulk([])}
            >
              Clear Selection
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedVehiclesForBulk.length} vehicle(s) selected
          </div>
        </div>
      </div>

      {/* Table */}
      <div id="vehicles-table">
        <DataTable
          data={filteredVehicles.map(v => ({
            ...v,
            _selected: selectedVehiclesForBulk.includes(v.id),
          }))}
          columns={[
            {
              key: '_selected',
              header: '',
              className: 'w-12',
              render: (vehicle: Vehicle & { _selected?: boolean }) => (
                <input
                  type="checkbox"
                  checked={selectedVehiclesForBulk.includes(vehicle.id)}
                  onChange={() => handleToggleVehicleSelection(vehicle.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4"
                />
              ),
            },
            ...columns,
          ]}
          emptyMessage="No vehicles found"
        />
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vehicle Details & Complete History</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (() => {
            const vehicleServiceHistory = getVehicleServiceHistory(selectedVehicle.id);
            const vehicleJobCards = jobCards.filter(jc => jc.vehicleId === selectedVehicle.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const vehicleDriverHistory = driverAssignmentHistory.filter(dah => dah.vehicleId === selectedVehicle.id)
              .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
            
            return (
              <div className="space-y-6">
                {/* Vehicle Basic Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Vehicle Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Vehicle Number</Label>
                      <p className="font-medium">{selectedVehicle.vehicleNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Model</Label>
                      <p className="font-medium">{selectedVehicle.model}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="font-medium">{selectedVehicle.type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <StatusBadge 
                        status={selectedVehicle.status} 
                        variant={
                          selectedVehicle.status === 'Active' ? 'success' :
                          selectedVehicle.status === 'In Service' ? 'warning' : 'danger'
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Branch</Label>
                      <p className="font-medium">{selectedVehicle.branch}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Sub Branch</Label>
                      <p className="font-medium">{selectedVehicle.subBranch}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current KM</Label>
                      <p className="font-medium">{selectedVehicle.currentKM.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Hours</Label>
                      <p className="font-medium">{selectedVehicle.totalHours.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Next Service KM</Label>
                      <p className="font-medium">{selectedVehicle.nextServiceKM.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Next Service Date</Label>
                      <p className="font-medium">{format(new Date(selectedVehicle.nextServiceDate), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Next Service Hours</Label>
                      <p className="font-medium">{selectedVehicle.nextServiceHours.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current Driver</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {drivers?.find(d => d.id === selectedVehicle.driverId)?.name || 'N/A'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowDetailsModal(false);
                            handleChangeDriver(selectedVehicle);
                          }}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History Tabs */}
                <Tabs defaultValue="services" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="services">
                      <Wrench className="w-4 h-4 mr-2" />
                      Services ({vehicleServiceHistory.length})
                    </TabsTrigger>
                    <TabsTrigger value="jobcards">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Job Cards ({vehicleJobCards.length})
                    </TabsTrigger>
                    <TabsTrigger value="drivers">
                      <Users className="w-4 h-4 mr-2" />
                      Drivers ({vehicleDriverHistory.length})
                    </TabsTrigger>
                    <TabsTrigger value="summary">
                      <Calendar className="w-4 h-4 mr-2" />
                      Summary
                    </TabsTrigger>
                  </TabsList>

                  {/* Service History */}
                  <TabsContent value="services" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {vehicleServiceHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No service history found</p>
                        </div>
                      ) : (
                        vehicleServiceHistory.map((service) => (
                          <div key={service.id} className="border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{service.serviceType}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(service.serviceDate), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <p className="font-semibold text-primary">
                                SAR {service.cost.toLocaleString()}
                              </p>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground mb-1">Work Done:</p>
                              <p className="text-sm font-medium">{service.workDone}</p>
                            </div>
                            {service.partsUsed.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm text-muted-foreground mb-2">Parts Used:</p>
                                <div className="space-y-1">
                                  {service.partsUsed.map((part, idx) => (
                                    <div key={idx} className="flex justify-between text-sm bg-muted/50 rounded p-2">
                                      <span>{part.itemName} (Qty: {part.quantity})</span>
                                      <span className="font-medium">SAR {part.lineTotal.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {service.jobCardId && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Job Card: </span>
                                <span className="font-medium">{service.jobCardId}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Job Cards */}
                  <TabsContent value="jobcards" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {vehicleJobCards.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No job cards found</p>
                        </div>
                      ) : (
                        vehicleJobCards.map((jobCard) => (
                          <div key={jobCard.id} className="border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{jobCard.id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(jobCard.jobDate), 'MMM dd, yyyy')} • {jobCard.startTime} - {jobCard.endTime}
                                </p>
                              </div>
                              <StatusBadge status={jobCard.status} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">KM:</span>
                                <p className="font-medium">{jobCard.totalKM.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Hours:</span>
                                <p className="font-medium">{jobCard.totalHours.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cost:</span>
                                <p className="font-medium">SAR {jobCard.totalCost.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Created:</span>
                                <p className="font-medium">
                                  {format(new Date(jobCard.createdAt), 'MMM dd, yyyy HH:mm')}
                                </p>
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
                            {jobCard.remarks && (
                              <div className="mt-2">
                                <span className="text-sm text-muted-foreground">Remarks: </span>
                                <p className="text-sm font-medium mt-1">{jobCard.remarks}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Driver History */}
                  <TabsContent value="drivers" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {vehicleDriverHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                  </TabsContent>

                  {/* Summary */}
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Services</p>
                        <p className="text-2xl font-bold">{vehicleServiceHistory.length}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Job Cards</p>
                        <p className="text-2xl font-bold">{vehicleJobCards.length}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Service Cost</p>
                        <p className="text-2xl font-bold">
                          SAR {vehicleServiceHistory.reduce((sum, s) => sum + s.cost, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Driver Assignments</p>
                        <p className="text-2xl font-bold">{vehicleDriverHistory.length}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Change Driver Modal */}
      <Dialog open={showChangeDriverModal} onOpenChange={(open) => {
        setShowChangeDriverModal(open);
        if (!open) {
          setNewDriverId('');
          setChangeReason('');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change Driver Assignment</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">{selectedVehicle.vehicleNumber} - {selectedVehicle.model}</p>
                <p className="text-sm text-muted-foreground mt-2">Current Driver</p>
                <p className="font-medium">
                  {drivers?.find(d => d.id === selectedVehicle.driverId)?.name || 'Unassigned'}
                </p>
              </div>
              <div>
                <Label>New Driver *</Label>
                <Select value={newDriverId} onValueChange={setNewDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers?.filter(d => d.branch === selectedVehicle.branch || d.subBranch === selectedVehicle.subBranch).map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} - {driver.licenseNumber}
                        {vehicles.find(v => v.driverId === driver.id && v.id !== selectedVehicle.id) && (
                          <span className="text-warning ml-2">(Assigned to another vehicle)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newDriverId && vehicles.find(v => v.driverId === newDriverId && v.id !== selectedVehicle.id) && (
                  <p className="text-sm text-warning mt-2">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    This driver is already assigned to another vehicle
                  </p>
                )}
              </div>
              <div>
                <Label>Reason for Change (Optional)</Label>
                <Input 
                  value={changeReason} 
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g., Driver transfer, Leave, etc."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowChangeDriverModal(false);
                  setNewDriverId('');
                  setChangeReason('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmDriverChange}>
                  Change Driver
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Driver History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Assignment History - {selectedVehicle?.vehicleNumber}</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              {driverHistory.filter(h => h.vehicleId === selectedVehicle.id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No driver assignment history found for this vehicle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {driverHistory
                    .filter(h => h.vehicleId === selectedVehicle.id)
                    .map((entry) => (
                      <div key={entry.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{entry.oldDriverName}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium text-primary">{entry.newDriverName}</span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Changed by: {entry.changedBy}</p>
                              <p>Date: {format(new Date(entry.changeDate), 'MMM dd, yyyy HH:mm')}</p>
                              {entry.reason && <p>Reason: {entry.reason}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Driver Modal */}
      <Dialog open={showBulkAssignModal} onOpenChange={(open) => {
        setShowBulkAssignModal(open);
        if (!open) {
          setBulkDriverId('');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Assign Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Selected Vehicles</p>
              <p className="font-medium">{selectedVehiclesForBulk.length} vehicle(s)</p>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {selectedVehiclesForBulk.map(vehicleId => {
                  const vehicle = vehicles.find(v => v.id === vehicleId);
                  return vehicle ? (
                    <div key={vehicleId} className="text-sm py-1">
                      • {vehicle.vehicleNumber} - {vehicle.model}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div>
              <Label>Assign Driver *</Label>
              <Select value={bulkDriverId} onValueChange={setBulkDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} - {driver.licenseNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-sm text-warning flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This will assign the selected driver to all {selectedVehiclesForBulk.length} vehicle(s). 
                Any existing driver assignments will be replaced.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowBulkAssignModal(false);
                setBulkDriverId('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleBulkDriverAssign}>
                Assign Driver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

