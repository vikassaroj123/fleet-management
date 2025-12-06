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
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Upload, X, AlertCircle, CheckCircle, Printer, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { categories, serviceTypes, branches, subBranches } from '@/data/mockData';
import type { JobCardPart, Vehicle, ScheduledService } from '@/data/mockData';

export default function JobCard() {
  const {
    vehicles,
    drivers,
    workers,
    inventory,
    jobCards,
    pendingWork,
    getDriver,
    getLastJobCard,
    getVehiclePendingWork,
    getDueServices,
    createJobCard,
    updateVehicle,
  } = useFleet();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<typeof jobCards[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [jobDate, setJobDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [totalKM, setTotalKM] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerBranchFilter, setWorkerBranchFilter] = useState('');
  const [partsUsed, setPartsUsed] = useState<JobCardPart[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  const [photoProofs, setPhotoProofs] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  
  // Parts selection state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [partQuantity, setPartQuantity] = useState('1');

  // Created job card for summary
  const [createdJobCard, setCreatedJobCard] = useState<ReturnType<typeof createJobCard> | null>(null);

  // Computed values
  const lastJobCard = selectedVehicle ? getLastJobCard(selectedVehicle.id) : null;
  const vehiclePendingWork = selectedVehicle ? getVehiclePendingWork(selectedVehicle.id) : [];
  const dueServices = selectedVehicle && totalKM && totalHours 
    ? getDueServices(selectedVehicle.id, parseInt(totalKM), parseInt(totalHours))
    : [];

  // Filtered job cards
  const filteredJobCards = useMemo(() => {
    return jobCards.filter(jc => {
      const matchesSearch = jc.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           jc.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || jc.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [jobCards, searchTerm, filterStatus]);

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(workerSearch.toLowerCase());
      const matchesBranch = !workerBranchFilter || w.branch === workerBranchFilter;
      return matchesSearch && matchesBranch;
    });
  }, [workers, workerSearch, workerBranchFilter]);

  // Filtered inventory items
  const filteredInventoryItems = useMemo(() => {
    return inventory.filter(item => {
      if (!selectedCategory) return false;
      const matchesCategory = item.category === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || item.subCategory === selectedSubCategory;
      return matchesCategory && matchesSubCategory;
    });
  }, [inventory, selectedCategory, selectedSubCategory]);

  const handleVehicleSelect = (vehicleNumber: string) => {
    const vehicle = vehicles.find(v => v.vehicleNumber === vehicleNumber);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setTotalKM(vehicle.currentKM.toString());
      setTotalHours(vehicle.totalHours.toString());
    }
  };

  const handleAddPart = () => {
    if (!selectedItem || !partQuantity) return;
    
    const item = inventory.find(i => i.id === selectedItem);
    if (!item) return;

    const qty = parseInt(partQuantity);
    if (qty > item.stockAvailable) {
      toast.error(`Insufficient stock. Available: ${item.stockAvailable}`);
      return;
    }

    const existingPartIndex = partsUsed.findIndex(p => p.itemId === item.id);
    if (existingPartIndex >= 0) {
      const updated = [...partsUsed];
      updated[existingPartIndex].quantity += qty;
      updated[existingPartIndex].lineTotal = updated[existingPartIndex].quantity * item.averagePrice;
      setPartsUsed(updated);
    } else {
      setPartsUsed([...partsUsed, {
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        quantity: qty,
        unitPrice: item.averagePrice,
        lineTotal: qty * item.averagePrice,
      }]);
    }

    // Reset selection
    setSelectedItem('');
    setPartQuantity('1');
  };

  const handleRemovePart = (itemId: string) => {
    setPartsUsed(partsUsed.filter(p => p.itemId !== itemId));
  };

  const handleFileUpload = (type: 'photo' | 'document') => {
    // Simulate file upload
    const mockFileName = `${type}_${Date.now()}.${type === 'photo' ? 'jpg' : 'pdf'}`;
    if (type === 'photo') {
      setPhotoProofs([...photoProofs, mockFileName]);
    } else {
      setDocuments([...documents, mockFileName]);
    }
    toast.success(`${type === 'photo' ? 'Photo' : 'Document'} uploaded successfully`);
  };

  const handleSubmit = () => {
    if (!selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }

    if (!totalKM || !totalHours) {
      toast.error('Please enter total KM and total hours');
      return;
    }

    const totalCost = partsUsed.reduce((sum, p) => sum + p.lineTotal, 0);
    
    const newJobCard = createJobCard({
      vehicleId: selectedVehicle.id,
      vehicleNumber: selectedVehicle.vehicleNumber,
      jobDate,
      startTime,
      endTime,
      totalKM: parseInt(totalKM),
      totalHours: parseInt(totalHours),
      workers: selectedWorkers,
      partsUsed,
      servicesDone: selectedServices,
      remarks,
      photoProofs,
      documents,
      totalCost,
      status: 'Completed',
    });

    // Note: Vehicle update, service history creation, and scheduled service updates
    // are now handled automatically in createJobCard function

    setCreatedJobCard(newJobCard);
    setShowCreateModal(false);
    setShowSummaryModal(true);
    toast.success('Job Card created successfully! Service history and scheduled services updated.');
    resetForm();
  };

  const resetForm = () => {
    setSelectedVehicle(null);
    setJobDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime('09:00');
    setEndTime('17:00');
    setTotalKM('');
    setTotalHours('');
    setSelectedWorkers([]);
    setPartsUsed([]);
    setSelectedServices([]);
    setRemarks('');
    setPhotoProofs([]);
    setDocuments([]);
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedItem('');
  };

  const driver = selectedVehicle ? getDriver(selectedVehicle.driverId) : null;
  const totalCost = partsUsed.reduce((sum, p) => sum + p.lineTotal, 0);

  const handlePrint = () => {
    printPage('job-cards-table');
  };

  const handleExport = () => {
    const exportData = filteredJobCards.map(jc => ({
      'ID': jc.id,
      'Vehicle Number': jc.vehicleNumber,
      'Job Date': jc.jobDate,
      'Start Time': jc.startTime,
      'End Time': jc.endTime,
      'Total KM': jc.totalKM,
      'Total Hours': jc.totalHours,
      'Workers': jc.workers.join(', '),
      'Parts Used': jc.partsUsed.map(p => `${p.itemName} (${p.quantity})`).join('; '),
      'Services Done': jc.servicesDone.join(', '),
      'Total Cost (SAR)': jc.totalCost,
      'Status': jc.status,
    }));
    exportToExcel(exportData, `job_cards_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Job cards exported successfully');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Job Cards" 
        description="Create and manage vehicle service job cards"
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
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Job Card
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or vehicle number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job Cards Table */}
      <div id="job-cards-table">
        <DataTable
          data={filteredJobCards}
          columns={[
            { key: 'id', header: 'Job Card ID' },
            { key: 'vehicleNumber', header: 'Vehicle' },
            { key: 'jobDate', header: 'Date' },
            { key: 'startTime', header: 'Start' },
            { key: 'endTime', header: 'End' },
            { 
              key: 'servicesDone', 
              header: 'Services',
              render: (item) => item.servicesDone.join(', ') || '-'
            },
            { 
              key: 'totalCost', 
              header: 'Cost',
              render: (item) => `SAR ${item.totalCost.toLocaleString()}`
            },
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJobCard(item);
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
            setSelectedJobCard(item);
            setShowDetailModal(true);
          }}
          emptyMessage="No job cards found"
        />
      </div>

      {/* Create Job Card Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job Card</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Vehicle Selection */}
            <div className="form-section">
              <h3 className="form-section-title">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Vehicle Number *</Label>
                  <Select onValueChange={handleVehicleSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.vehicleNumber}>
                          {v.vehicleNumber} - {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedVehicle && (
                  <>
                    <div>
                      <Label>Model</Label>
                      <Input value={selectedVehicle.model} disabled />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Input value={selectedVehicle.type} disabled />
                    </div>
                    <div>
                      <Label>Branch / Sub-Branch</Label>
                      <Input value={`${selectedVehicle.branch} / ${selectedVehicle.subBranch}`} disabled />
                    </div>
                    <div>
                      <Label>Driver</Label>
                      <Input value={driver ? `${driver.name} (${driver.phone})` : 'N/A'} disabled />
                    </div>
                    <div>
                      <Label>Next Service</Label>
                      <Input value={`${selectedVehicle.nextServiceKM.toLocaleString()} KM / ${selectedVehicle.nextServiceDate}`} disabled />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Last Job Card Info */}
            {lastJobCard && (
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  Previous Job Card ({lastJobCard.jobDate})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Work Done:</span>
                    <p className="font-medium">{lastJobCard.servicesDone.join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Parts Used:</span>
                    <p className="font-medium">{lastJobCard.partsUsed.length} items</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost:</span>
                    <p className="font-medium">SAR {lastJobCard.totalCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">KM at Service:</span>
                    <p className="font-medium">{lastJobCard.totalKM.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Work for Vehicle */}
            {vehiclePendingWork.length > 0 && (
              <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Pending Work Items ({vehiclePendingWork.length})
                </h4>
                <ul className="space-y-1 text-sm">
                  {vehiclePendingWork.map(pw => (
                    <li key={pw.id} className="flex items-center gap-2">
                      <StatusBadge status={pw.priority} />
                      <span>{pw.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Job Details */}
            <div className="form-section">
              <h3 className="form-section-title">Job Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Job Date *</Label>
                  <Input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} />
                </div>
                <div>
                  <Label>Start Time *</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
                <div>
                  <Label>Total KM *</Label>
                  <Input type="number" value={totalKM} onChange={(e) => setTotalKM(e.target.value)} />
                </div>
                <div>
                  <Label>Total Hours *</Label>
                  <Input type="number" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Due Services Alert */}
            {dueServices.length > 0 && (
              <div className="bg-warning/10 rounded-lg p-4 border border-warning/30">
                <h4 className="font-medium text-warning mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Services Due Based on KM/Hours
                </h4>
                <div className="flex flex-wrap gap-2">
                  {dueServices.map(s => (
                    <span key={s.id} className="bg-warning/20 text-warning px-2 py-1 rounded text-sm">
                      {s.serviceType}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Workers Selection */}
            <div className="form-section">
              <h3 className="form-section-title">Workers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workers..."
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={workerBranchFilter || "all"} onValueChange={(v) => setWorkerBranchFilter(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto mb-4">
                {filteredWorkers.map(worker => (
                  <div key={worker.id} className="flex items-center gap-2">
                    <Checkbox
                      id={worker.id}
                      checked={selectedWorkers.includes(worker.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedWorkers([...selectedWorkers, worker.id]);
                        } else {
                          setSelectedWorkers(selectedWorkers.filter(id => id !== worker.id));
                        }
                      }}
                    />
                    <label htmlFor={worker.id} className="text-sm cursor-pointer">
                      {worker.name} ({worker.role})
                    </label>
                  </div>
                ))}
              </div>

              {/* Selected Workers Table */}
              {selectedWorkers.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 p-2 border-b">
                    <h4 className="font-medium text-sm">Selected Workers ({selectedWorkers.length})</h4>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Branch</th>
                        <th className="text-left p-2">Phone</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWorkers.map(workerId => {
                        const worker = workers.find(w => w.id === workerId);
                        if (!worker) return null;
                        return (
                          <tr key={workerId} className="border-t">
                            <td className="p-2 font-medium">{worker.name}</td>
                            <td className="p-2">{worker.role}</td>
                            <td className="p-2">{worker.branch} / {worker.subBranch}</td>
                            <td className="p-2">{worker.phone}</td>
                            <td className="p-2">
                              <button
                                onClick={() => setSelectedWorkers(selectedWorkers.filter(id => id !== workerId))}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Parts Used */}
            <div className="form-section">
              <h3 className="form-section-title">Parts Used</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedSubCategory(''); setSelectedItem(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSubCategory} onValueChange={(v) => { setSelectedSubCategory(v); setSelectedItem(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sub-Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.find(c => c.name === selectedCategory)?.subCategories.map(sc => (
                      <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Item" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredInventoryItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} (Stock: {item.stockAvailable})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Qty"
                  value={partQuantity}
                  onChange={(e) => setPartQuantity(e.target.value)}
                  min="1"
                />
                <Button onClick={handleAddPart} disabled={!selectedItem}>
                  Add Part
                </Button>
              </div>

              {partsUsed.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-left p-2">Item</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Unit Price</th>
                        <th className="text-right p-2">Total</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {partsUsed.map(part => (
                        <tr key={part.itemId} className="border-t">
                          <td className="p-2">{part.sku}</td>
                          <td className="p-2">{part.itemName}</td>
                          <td className="p-2 text-right">{part.quantity}</td>
                          <td className="p-2 text-right">SAR {part.unitPrice.toLocaleString()}</td>
                          <td className="p-2 text-right font-medium">SAR {part.lineTotal.toLocaleString()}</td>
                          <td className="p-2">
                            <button onClick={() => handleRemovePart(part.itemId)} className="text-destructive hover:text-destructive/80">
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/30">
                        <td colSpan={4} className="p-2 text-right font-semibold">Total Cost:</td>
                        <td className="p-2 text-right font-bold">SAR {totalCost.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Services Done */}
            <div className="form-section">
              <h3 className="form-section-title">Services Performed</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {serviceTypes.map(service => (
                  <div key={service} className="flex items-center gap-2">
                    <Checkbox
                      id={service}
                      checked={selectedServices.includes(service)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServices([...selectedServices, service]);
                        } else {
                          setSelectedServices(selectedServices.filter(s => s !== service));
                        }
                      }}
                    />
                    <label htmlFor={service} className="text-sm cursor-pointer">{service}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploads */}
            <div className="form-section">
              <h3 className="form-section-title">Uploads</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Photo Proofs</Label>
                  <Button variant="outline" onClick={() => handleFileUpload('photo')} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  {photoProofs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {photoProofs.map((p, i) => (
                        <span key={i} className="bg-muted px-2 py-1 rounded text-xs">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block">Documents</Label>
                  <Button variant="outline" onClick={() => handleFileUpload('document')} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                  {documents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {documents.map((d, i) => (
                        <span key={i} className="bg-muted px-2 py-1 rounded text-xs">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="form-section">
              <h3 className="form-section-title">Remarks</h3>
              <Textarea
                placeholder="Enter any additional remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Job Card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Card Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              Job Card Created Successfully
            </DialogTitle>
          </DialogHeader>
          
          {createdJobCard && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Job Card ID:</span>
                    <p className="font-semibold">{createdJobCard.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>
                    <p className="font-semibold">{createdJobCard.vehicleNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-semibold">{createdJobCard.jobDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <p className="font-semibold">{createdJobCard.startTime} - {createdJobCard.endTime}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total KM:</span>
                    <p className="font-semibold">{createdJobCard.totalKM.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Hours:</span>
                    <p className="font-semibold">{createdJobCard.totalHours.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Services Performed:</h4>
                <div className="flex flex-wrap gap-2">
                  {createdJobCard.servicesDone.map(s => (
                    <span key={s} className="bg-success/10 text-success px-2 py-1 rounded text-sm">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Parts Used ({createdJobCard.partsUsed.length}):</h4>
                <ul className="text-sm space-y-1">
                  {createdJobCard.partsUsed.map(p => (
                    <li key={p.itemId} className="flex justify-between">
                      <span>{p.itemName} x{p.quantity}</span>
                      <span className="font-medium">SAR {p.lineTotal.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Cost:</span>
                  <span>SAR {createdJobCard.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <Button onClick={() => setShowSummaryModal(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Card Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Card Details - {selectedJobCard?.id}</DialogTitle>
          </DialogHeader>
          {selectedJobCard && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Job Card ID</Label>
                  <p className="font-medium">{selectedJobCard.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle Number</Label>
                  <p className="font-medium">{selectedJobCard.vehicleNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Job Date</Label>
                  <p className="font-medium">{format(new Date(selectedJobCard.jobDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Time</Label>
                  <p className="font-medium">{selectedJobCard.startTime} - {selectedJobCard.endTime}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total KM</Label>
                  <p className="font-medium">{selectedJobCard.totalKM?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Hours</Label>
                  <p className="font-medium">{selectedJobCard.totalHours || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <StatusBadge status={selectedJobCard.status} />
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Cost</Label>
                  <p className="font-medium text-lg">SAR {selectedJobCard.totalCost.toLocaleString()}</p>
                </div>
              </div>

              {selectedJobCard.servicesDone && selectedJobCard.servicesDone.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Services Done</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobCard.servicesDone.map((service, index) => (
                      <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJobCard.partsUsed && selectedJobCard.partsUsed.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Parts Used ({selectedJobCard.partsUsed.length})</Label>
                  <div className="space-y-2">
                    {selectedJobCard.partsUsed.map((part, index) => (
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

              {selectedJobCard.workers && selectedJobCard.workers.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Workers ({selectedJobCard.workers.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobCard.workers.map((workerId, index) => {
                      const worker = workers.find(w => w.id === workerId);
                      return worker ? (
                        <span key={index} className="px-3 py-1 bg-info/10 text-info rounded-full text-sm">
                          {worker.name} ({worker.branch})
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {selectedJobCard.remarks && (
                <div>
                  <Label className="text-muted-foreground">Remarks</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{selectedJobCard.remarks}</p>
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
