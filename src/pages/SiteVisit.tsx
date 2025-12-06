import { useState, useMemo } from 'react';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, Plus, MapPin, Calendar, User, Camera, FileText, Printer, Download, Eye, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { branches } from '@/data/mockData';

interface SiteVisit {
  id: string;
  visitDate: string;
  visitTime: string;
  siteName: string;
  siteLocation: string;
  branch: string;
  subBranch: string;
  visitType: 'Inspection' | 'Maintenance' | 'Delivery' | 'Installation' | 'Other';
  visitedBy: string;
  vehicleId?: string;
  vehicleNumber?: string;
  purpose: string;
  findings: string;
  recommendations: string;
  photos: string[];
  documents: string[];
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  nextFollowUp?: string;
  createdAt: string;
}

const initialSiteVisits: SiteVisit[] = [
  { id: 'SV001', visitDate: '2025-01-15', visitTime: '10:00', siteName: 'Construction Site - Tabuk', siteLocation: 'Tabuk Industrial Area', branch: 'Northern Province', subBranch: 'Tabuk', visitType: 'Inspection', visitedBy: 'W009', vehicleId: 'V007', vehicleNumber: 'KSA-6789-MN', purpose: 'Routine vehicle inspection at construction site', findings: 'All vehicles operational. Minor maintenance needed on excavator 7925.', recommendations: 'Schedule service for excavator 7925 next week', photos: [], documents: [], status: 'Completed', nextFollowUp: '2025-01-22', createdAt: '2025-01-10T08:00:00' },
  { id: 'SV002', visitDate: '2025-01-18', visitTime: '14:00', siteName: 'Warehouse - Dammam', siteLocation: 'Dammam Port Area', branch: 'Eastern Province', subBranch: 'Dammam', visitType: 'Delivery', visitedBy: 'W003', vehicleId: 'V002', vehicleNumber: 'KSA-5678-CD', purpose: 'Deliver spare parts to warehouse', findings: 'Delivery completed successfully. Warehouse inventory updated.', recommendations: 'Schedule next delivery in 2 weeks', photos: [], documents: [], status: 'Completed', createdAt: '2025-01-15T10:00:00' },
  { id: 'SV003', visitDate: '2025-01-20', visitTime: '09:00', siteName: 'Service Center - Riyadh', siteLocation: 'Riyadh Service Center', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Service Center', visitType: 'Maintenance', visitedBy: 'W001', purpose: 'Quarterly maintenance check', findings: 'All equipment functioning properly. No issues found.', recommendations: 'Continue regular maintenance schedule', photos: [], documents: [], status: 'Scheduled', createdAt: '2025-01-18T12:00:00' },
];

export default function SiteVisit() {
  const { vehicles, workers, drivers } = useFleet();
  
  // Safety check
  if (!vehicles || !Array.isArray(vehicles) || !workers || !Array.isArray(workers)) {
    return (
      <div className="animate-fade-in min-h-full">
        <PageHeader 
          title="Site Visits" 
          description="Track and manage site visits, inspections, and field operations"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading site visits...</p>
        </div>
      </div>
    );
  }
  
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(initialSiteVisits);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);

  // Form state
  const [visitDate, setVisitDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [visitTime, setVisitTime] = useState('09:00');
  const [siteName, setSiteName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [branch, setBranch] = useState('');
  const [subBranch, setSubBranch] = useState('');
  const [visitType, setVisitType] = useState<'Inspection' | 'Maintenance' | 'Delivery' | 'Installation' | 'Other'>('Inspection');
  const [visitedBy, setVisitedBy] = useState('');
  const [vehicleId, setVehicleId] = useState('none');
  const [purpose, setPurpose] = useState('');
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const filteredVisits = useMemo(() => {
    return siteVisits.filter(visit => {
      const matchesSearch = 
        visit.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.siteLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.visitedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = !filterBranch || visit.branch === filterBranch;
      const matchesStatus = !filterStatus || visit.status === filterStatus;
      const matchesType = !filterType || visit.visitType === filterType;
      return matchesSearch && matchesBranch && matchesStatus && matchesType;
    });
  }, [siteVisits, searchTerm, filterBranch, filterStatus, filterType]);

  const handleAddVisit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validation - check required fields
    if (!siteName || !siteName.trim()) {
      toast.error('Please enter Site Name');
      return;
    }

    if (!siteLocation || !siteLocation.trim()) {
      toast.error('Please enter Site Location');
      return;
    }

    if (!branch || !branch.trim()) {
      toast.error('Please select Branch');
      return;
    }

    if (!visitedBy || !visitedBy.trim()) {
      toast.error('Please select a worker (Visited By)');
      return;
    }

    if (!purpose || !purpose.trim()) {
      toast.error('Please enter Purpose');
      return;
    }

    if (!visitDate) {
      toast.error('Please select Visit Date');
      return;
    }

    if (!visitTime) {
      toast.error('Please select Visit Time');
      return;
    }

    // Check if workers array exists and has items
    if (!workers || workers.length === 0) {
      toast.error('No workers available. Please ensure workers are loaded.');
      return;
    }

    // Check if worker exists
    const worker = workers.find(w => w.id === visitedBy);
    if (!worker) {
      toast.error('Please select a valid worker');
      return;
    }

    // Handle vehicle selection (empty string or "none" means no vehicle)
    const vehicle = vehicleId && vehicleId !== '' && vehicleId !== 'none' && vehicles ? vehicles.find(v => v.id === vehicleId) : undefined;

    const newVisit: SiteVisit = {
      id: `SV${String(siteVisits.length + 1).padStart(3, '0')}`,
      visitDate,
      visitTime,
      siteName: siteName.trim(),
      siteLocation: siteLocation.trim(),
      branch,
      subBranch: subBranch.trim() || branch, // Use branch as fallback if subBranch is empty
      visitType,
      visitedBy: worker.name,
      vehicleId: vehicle?.id,
      vehicleNumber: vehicle?.vehicleNumber,
      purpose: purpose.trim(),
      findings: findings.trim(),
      recommendations: recommendations.trim(),
      photos: [],
      documents: [],
      status: 'Scheduled',
      nextFollowUp: nextFollowUp || undefined,
      createdAt: new Date().toISOString(),
    };

    setSiteVisits(prev => [...prev, newVisit]);
    toast.success('Site visit scheduled successfully!');
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdateStatus = (visit: SiteVisit, newStatus: SiteVisit['status']) => {
    setSiteVisits(prev => prev.map(v => 
      v.id === visit.id ? { ...v, status: newStatus } : v
    ));
    toast.success(`Visit status updated to ${newStatus}`);
  };

  const resetForm = () => {
    setVisitDate(format(new Date(), 'yyyy-MM-dd'));
    setVisitTime('09:00');
    setSiteName('');
    setSiteLocation('');
    setBranch('');
    setSubBranch('');
    setVisitType('Inspection');
    setVisitedBy('');
    setVehicleId('none');
    setPurpose('');
    setFindings('');
    setRecommendations('');
    setNextFollowUp('');
  };

  const handleViewDetails = (visit: SiteVisit) => {
    setSelectedVisit(visit);
    setShowDetailsModal(true);
  };

  const handlePrint = () => {
    printPage('site-visits-table');
  };

  const handleExport = () => {
    const exportData = filteredVisits.map(v => ({
      'Visit ID': v.id,
      'Visit Date': v.visitDate,
      'Visit Time': v.visitTime,
      'Site Name': v.siteName,
      'Site Location': v.siteLocation,
      'Branch': v.branch,
      'Sub Branch': v.subBranch,
      'Visit Type': v.visitType,
      'Visited By': v.visitedBy,
      'Vehicle': v.vehicleNumber || 'N/A',
      'Purpose': v.purpose,
      'Status': v.status,
      'Next Follow Up': v.nextFollowUp || 'N/A',
    }));
    exportToExcel(exportData, `site_visits_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Site visits exported successfully');
  };

  const columns = [
    { key: 'id', header: 'ID', className: 'font-medium' },
    { key: 'visitDate', header: 'Date', render: (visit: SiteVisit) => format(new Date(visit.visitDate), 'MMM dd, yyyy') },
    { key: 'siteName', header: 'Site Name' },
    { key: 'siteLocation', header: 'Location' },
    { key: 'branch', header: 'Branch' },
    { key: 'visitType', header: 'Type' },
    { key: 'visitedBy', header: 'Visited By' },
    { key: 'status', header: 'Status', render: (visit: SiteVisit) => (
      <StatusBadge 
        status={visit.status} 
        variant={
          visit.status === 'Completed' ? 'success' :
          visit.status === 'In Progress' ? 'warning' :
          visit.status === 'Cancelled' ? 'danger' : 'info'
        }
      />
    )},
    { key: 'actions', header: 'Actions', className: 'text-right', render: (visit: SiteVisit) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(visit)}>
          <Eye className="w-4 h-4" />
        </Button>
        {visit.status === 'Scheduled' && (
          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(visit, 'In Progress')}>
            Start
          </Button>
        )}
        {visit.status === 'In Progress' && (
          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(visit, 'Completed')}>
            Complete
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in min-h-full w-full">
      <PageHeader 
        title="Site Visits" 
        description="Track and manage site visits, inspections, and field operations"
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
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Visit
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <Calendar className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold">{siteVisits.filter(v => v.status === 'Scheduled').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <MapPin className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{siteVisits.filter(v => v.status === 'In Progress').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{siteVisits.filter(v => v.status === 'Completed').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Visits</p>
              <p className="text-2xl font-bold">{siteVisits.length}</p>
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
              placeholder="Search site visits..."
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
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Inspection">Inspection</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Delivery">Delivery</SelectItem>
              <SelectItem value="Installation">Installation</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div id="site-visits-table">
        <DataTable
          data={filteredVisits}
          columns={columns}
          emptyMessage="No site visits found"
        />
      </div>

      {/* Add Visit Modal */}
      <Dialog 
        open={showAddModal} 
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Site Visit</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule a new site visit
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAddVisit(e);
              }} 
              className="space-y-4"
            >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Visit Date *</Label>
                <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
              </div>
              <div>
                <Label>Visit Time *</Label>
                <Input type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Site Name *</Label>
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Site Location *</Label>
                <Input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} />
              </div>
              <div>
                <Label>Branch *</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub Branch (Optional)</Label>
                <Input 
                  value={subBranch} 
                  onChange={(e) => setSubBranch(e.target.value)}
                  placeholder="Enter sub-branch name"
                />
              </div>
              <div>
                <Label>Visit Type *</Label>
                <Select value={visitType} onValueChange={(v) => setVisitType(v as SiteVisit['visitType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                    <SelectItem value="Installation">Installation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visited By *</Label>
                <Select value={visitedBy} onValueChange={setVisitedBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers && workers.length > 0 ? (
                      workers.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name} - {w.role}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-workers" disabled>No workers available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle (Optional)</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vehicle (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vehicles && vehicles.length > 0 ? (
                      vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.vehicleNumber} - {v.model}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-vehicles" disabled>No vehicles available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Next Follow Up</Label>
                <Input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} />
              </div>
              {/* Vehicle Details Panel */}
              {vehicleId && vehicleId !== "" && vehicleId !== "none" && (() => {
                const selectedVehicle = vehicles?.find(v => v.id === vehicleId);
                if (!selectedVehicle) return null;
                const driver = drivers?.find(d => d.id === selectedVehicle.driverId);
                return (
                  <div key={`vehicle-details-${vehicleId}`} className="col-span-2 bg-muted/50 rounded-lg p-4 border border-border mt-2">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Vehicle Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Vehicle Number:</span>
                        <p className="font-medium">{selectedVehicle.vehicleNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <p className="font-medium">{selectedVehicle.model}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium">{selectedVehicle.type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <StatusBadge 
                          status={selectedVehicle.status} 
                          variant={
                            selectedVehicle.status === 'Active' ? 'success' :
                            selectedVehicle.status === 'In Service' ? 'warning' : 'danger'
                          }
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current KM:</span>
                        <p className="font-medium">{selectedVehicle.currentKM.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Hours:</span>
                        <p className="font-medium">{selectedVehicle.totalHours.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Branch:</span>
                        <p className="font-medium">{selectedVehicle.branch}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sub Branch:</span>
                        <p className="font-medium">{selectedVehicle.subBranch}</p>
                      </div>
                      {driver && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Driver:</span>
                          <p className="font-medium">{driver.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="col-span-2">
                <Label>Purpose *</Label>
                <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} />
              </div>
              <div className="col-span-2">
                <Label>Findings</Label>
                <Textarea value={findings} onChange={(e) => setFindings(e.target.value)} rows={3} />
              </div>
              <div className="col-span-2">
                <Label>Recommendations</Label>
                <Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Visit
              </Button>
            </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Site Visit Details</DialogTitle>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Visit ID</Label>
                  <p className="font-medium">{selectedVisit.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <StatusBadge 
                    status={selectedVisit.status} 
                    variant={
                      selectedVisit.status === 'Completed' ? 'success' :
                      selectedVisit.status === 'In Progress' ? 'warning' :
                      selectedVisit.status === 'Cancelled' ? 'danger' : 'info'
                    }
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Visit Date</Label>
                  <p className="font-medium">{format(new Date(selectedVisit.visitDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Visit Time</Label>
                  <p className="font-medium">{selectedVisit.visitTime}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Site Name</Label>
                  <p className="font-medium">{selectedVisit.siteName}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Site Location</Label>
                  <p className="font-medium">{selectedVisit.siteLocation}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Branch</Label>
                  <p className="font-medium">{selectedVisit.branch}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sub Branch</Label>
                  <p className="font-medium">{selectedVisit.subBranch}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Visit Type</Label>
                  <p className="font-medium">{selectedVisit.visitType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Visited By</Label>
                  <p className="font-medium">{selectedVisit.visitedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">{selectedVisit.vehicleNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Next Follow Up</Label>
                  <p className="font-medium">{selectedVisit.nextFollowUp ? format(new Date(selectedVisit.nextFollowUp), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Purpose</Label>
                  <p className="font-medium">{selectedVisit.purpose}</p>
                </div>
                {selectedVisit.findings && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Findings</Label>
                    <p className="font-medium whitespace-pre-line">{selectedVisit.findings}</p>
                  </div>
                )}
                {selectedVisit.recommendations && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Recommendations</Label>
                    <p className="font-medium whitespace-pre-line">{selectedVisit.recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

