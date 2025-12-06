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
import { Search, Plus, AlertTriangle, CheckCircle, Clock, Wrench, Printer, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import type { PendingWork as PendingWorkType } from '@/data/mockData';

export default function PendingWork() {
  const { pendingWork, vehicles, addPendingWork, updatePendingWork } = useFleet();

  // Safety checks
  if (!pendingWork || !Array.isArray(pendingWork) || !vehicles || !Array.isArray(vehicles)) {
    return (
      <div className="animate-fade-in min-h-full">
        <PageHeader 
          title="Pending Work" 
          description="Track and manage pending vehicle maintenance tasks"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading pending work...</p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState<PendingWorkType | null>(null);
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<PendingWorkType | null>(null);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const filteredWork = useMemo(() => {
    return pendingWork.filter(pw => {
      const matchesSearch = pw.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pw.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || pw.status === filterStatus;
      const matchesPriority = !filterPriority || pw.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [pendingWork, searchTerm, filterStatus, filterPriority]);

  // Stats
  const pendingCount = pendingWork.filter(p => p.status === 'Pending').length;
  const inProgressCount = pendingWork.filter(p => p.status === 'In Progress').length;
  const highPriorityCount = pendingWork.filter(p => p.priority === 'High' && p.status !== 'Completed').length;

  const handleAddWork = () => {
    if (!selectedVehicle || !description) {
      toast.error('Please fill all required fields');
      return;
    }

    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    if (!vehicle) return;

    addPendingWork({
      vehicleId: selectedVehicle,
      vehicleNumber: vehicle.vehicleNumber,
      description,
      priority,
      createdDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'Pending',
    });

    toast.success('Pending work added successfully!');
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedVehicle('');
    setDescription('');
    setPriority('Medium');
  };

  const handleStatusUpdate = (work: PendingWorkType, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    updatePendingWork({ ...work, status: newStatus });
    toast.success(`Work marked as ${newStatus}`);
    setSelectedWork(null);
  };

  const handlePrint = () => {
    printPage('pending-work-table');
  };

  const handleExport = () => {
    const exportData = filteredWork.map(pw => ({
      'Vehicle Number': pw.vehicleNumber,
      'Description': pw.description,
      'Priority': pw.priority,
      'Status': pw.status,
      'Created Date': pw.createdDate,
      'Due Date': pw.dueDate || 'N/A',
    }));
    exportToExcel(exportData, `pending_work_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Pending work exported successfully');
  };

  return (
    <div className="animate-fade-in min-h-full w-full" style={{ minHeight: '100vh' }}>
      <PageHeader 
        title="Pending Work" 
        description="Track and manage pending vehicle maintenance tasks"
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
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pending Work
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <Wrench className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-info">{inProgressCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold text-destructive">{highPriorityCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{pendingWork.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle or description..."
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
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority || "all"} onValueChange={(v) => setFilterPriority(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Work Table */}
      <div id="pending-work-table">
        <DataTable
          data={filteredWork}
        columns={[
          { key: 'vehicleNumber', header: 'Vehicle' },
          { key: 'description', header: 'Description', className: 'max-w-[300px]' },
          { 
            key: 'priority', 
            header: 'Priority',
            render: (item) => <StatusBadge status={item.priority} />
          },
          { key: 'createdDate', header: 'Created' },
          { 
            key: 'status', 
            header: 'Status',
            render: (item) => <StatusBadge status={item.status} />
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (item) => (
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkForDetail(item);
                    setShowDetailModal(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWork(item);
                  }}
                >
                  Update
                </Button>
              </div>
            )
          }
        ]}
        onRowClick={(item) => {
          setSelectedWorkForDetail(item);
          setShowDetailModal(true);
        }}
        emptyMessage="No pending work found"
      />
      </div>

      {/* High Priority Alert */}
      {highPriorityCount > 0 && (
        <div className="mt-6 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            High Priority Items Requiring Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingWork.filter(p => p.priority === 'High' && p.status !== 'Completed').map(work => (
              <div key={work.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{work.vehicleNumber}</span>
                  <StatusBadge status={work.status} />
                </div>
                <p className="text-sm text-muted-foreground">{work.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Created: {work.createdDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Pending Work Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Pending Work</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Vehicle *</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicleNumber} - {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the work needed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Priority *</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as 'High' | 'Medium' | 'Low')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddWork}>
                <Plus className="w-4 h-4 mr-2" />
                Add Work
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={!!selectedWork} onOpenChange={() => setSelectedWork(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Work Status</DialogTitle>
          </DialogHeader>

          {selectedWork && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-medium">{selectedWork.vehicleNumber}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedWork.description}</p>
                <div className="flex gap-2 mt-2">
                  <StatusBadge status={selectedWork.priority} />
                  <StatusBadge status={selectedWork.status} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Update Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={selectedWork.status === 'Pending' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate(selectedWork, 'Pending')}
                    className="w-full"
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={selectedWork.status === 'In Progress' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate(selectedWork, 'In Progress')}
                    className="w-full"
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant={selectedWork.status === 'Completed' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate(selectedWork, 'Completed')}
                    className="w-full"
                  >
                    Completed
                  </Button>
                </div>
              </div>

              <Button variant="outline" onClick={() => setSelectedWork(null)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Work Details</DialogTitle>
          </DialogHeader>
          {selectedWorkForDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Vehicle Number</Label>
                  <p className="font-medium">{selectedWorkForDetail.vehicleNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <StatusBadge status={selectedWorkForDetail.status} />
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <StatusBadge status={selectedWorkForDetail.priority} />
                </div>
                <div>
                  <Label className="text-muted-foreground">Created Date</Label>
                  <p className="font-medium">{format(new Date(selectedWorkForDetail.createdDate), 'MMM dd, yyyy')}</p>
                </div>
                {selectedWorkForDetail.dueDate && (
                  <div>
                    <Label className="text-muted-foreground">Due Date</Label>
                    <p className="font-medium">{format(new Date(selectedWorkForDetail.dueDate), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                {selectedWorkForDetail.jobCardId && (
                  <div>
                    <Label className="text-muted-foreground">Job Card ID</Label>
                    <p className="font-medium">{selectedWorkForDetail.jobCardId}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-line">{selectedWorkForDetail.description}</p>
                </div>
              </div>
              {selectedWorkForDetail.priority === 'High' && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    High Priority - Requires immediate attention
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
