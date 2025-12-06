import { useState, useMemo } from 'react';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Search, Plus, Upload, FileText, AlertTriangle, CheckCircle, Download, Merge, Printer, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { documentTypes } from '@/data/mockData';
import type { Document as DocumentType } from '@/data/mockData';

export default function Documents() {
  const { documents, vehicles, drivers, addDocument } = useFleet();

  // Safety checks
  if (!documents || !Array.isArray(documents) || !vehicles || !Array.isArray(vehicles) || !drivers || !Array.isArray(drivers)) {
    return (
      <div className="animate-fade-in min-h-full">
        <PageHeader 
          title="Document Management" 
          description="Manage vehicle and driver documents with expiry tracking"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DocumentType | null>(null);

  // Form state
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expiryDate, setExpiryDate] = useState('');
  const [entityType, setEntityType] = useState<'vehicle' | 'driver'>('vehicle');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Aggregate documents with entity info
  const aggregatedDocs = useMemo(() => {
    return documents.map(doc => {
      const vehicle = doc.vehicleId ? vehicles.find(v => v.id === doc.vehicleId) : null;
      const driver = doc.driverId ? drivers.find(d => d.id === doc.driverId) : null;
      return {
        ...doc,
        entityName: vehicle?.vehicleNumber || driver?.name || 'N/A',
        entityType: doc.vehicleId ? 'Vehicle' : 'Driver',
        id: doc.id,
      };
    });
  }, [documents, vehicles, drivers]);

  const filteredDocs = useMemo(() => {
    return aggregatedDocs.filter(doc => {
      const matchesSearch = doc.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || doc.status === filterStatus;
      const matchesType = !filterType || doc.documentType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [aggregatedDocs, searchTerm, filterStatus, filterType]);

  // Stats
  const expiredCount = documents.filter(d => d.status === 'Expired').length;
  const expiringSoonCount = documents.filter(d => d.status === 'Expiring Soon').length;
  const validCount = documents.filter(d => d.status === 'Valid').length;

  const handleFileUpload = () => {
    const mockFileName = `document_${Date.now()}.pdf`;
    setFileUrl(mockFileName);
    toast.success('Document uploaded successfully');
  };

  const handleAddDocument = () => {
    if (!docType || !docNumber || !expiryDate || !selectedEntity) {
      toast.error('Please fill all required fields');
      return;
    }

    // Determine status based on expiry
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: 'Valid' | 'Expiring Soon' | 'Expired' = 'Valid';
    if (daysUntilExpiry < 0) {
      status = 'Expired';
    } else if (daysUntilExpiry < 30) {
      status = 'Expiring Soon';
    }

    const newDoc: Omit<DocumentType, 'id'> = {
      documentType: docType,
      documentNumber: docNumber,
      issueDate,
      expiryDate,
      fileUrl: fileUrl || '/docs/placeholder.pdf',
      status,
      ...(entityType === 'vehicle' ? { vehicleId: selectedEntity } : { driverId: selectedEntity }),
    };

    addDocument(newDoc);
    toast.success('Document added successfully!');
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setDocType('');
    setDocNumber('');
    setIssueDate(format(new Date(), 'yyyy-MM-dd'));
    setExpiryDate('');
    setEntityType('vehicle');
    setSelectedEntity('');
    setFileUrl('');
  };

  const handleToggleSelect = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const handleMergeDocs = () => {
    if (selectedDocs.length < 2) {
      toast.error('Select at least 2 documents to merge');
      return;
    }
    setShowMergeModal(true);
  };

  const confirmMerge = () => {
    // Simulate merge
    toast.success(`${selectedDocs.length} documents merged successfully! Download ready.`);
    setShowMergeModal(false);
    setSelectedDocs([]);
  };

  const handlePrint = () => {
    printPage('documents-table');
  };

  const handleExport = () => {
    const exportData = filteredDocs.map(doc => ({
      'Document Type': doc.documentType,
      'Document Number': doc.documentNumber,
      'Vehicle/Driver': doc.vehicleId ? vehicles?.find(v => v.id === doc.vehicleId)?.vehicleNumber || 'N/A' : drivers?.find(d => d.id === doc.driverId)?.name || 'N/A',
      'Issue Date': doc.issueDate,
      'Expiry Date': doc.expiryDate,
      'Status': doc.status,
    }));
    exportToExcel(exportData, `documents_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Documents exported successfully');
  };

  return (
    <div className="animate-fade-in min-h-full w-full" style={{ minHeight: '100vh' }}>
      <PageHeader 
        title="Document Management" 
        description="Manage vehicle and driver documents with expiry tracking"
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
            {selectedDocs.length > 0 && (
              <Button variant="outline" onClick={handleMergeDocs}>
                <Merge className="w-4 h-4 mr-2" />
                Merge ({selectedDocs.length})
              </Button>
            )}
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valid</p>
              <p className="text-2xl font-bold text-success">{validCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-warning">{expiringSoonCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle/driver or document number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {documentTypes.map(dt => (
              <SelectItem key={dt} value={dt}>{dt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Valid">Valid</SelectItem>
            <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      <div id="documents-table">
        <DataTable
          data={filteredDocs}
        columns={[
          {
            key: 'select',
            header: '',
            render: (item) => (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedDocs.includes(item.id)}
                  onCheckedChange={() => handleToggleSelect(item.id)}
                />
              </div>
            ),
            className: 'w-10'
          },
          { key: 'entityType', header: 'Type' },
          { key: 'entityName', header: 'Entity' },
          { key: 'documentType', header: 'Document' },
          { key: 'documentNumber', header: 'Number' },
          { key: 'issueDate', header: 'Issue Date' },
          { key: 'expiryDate', header: 'Expiry Date' },
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
                  setSelectedDocForDetail(item);
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
          setSelectedDocForDetail(item);
          setShowDetailModal(true);
        }}
        emptyMessage="No documents found"
      />
      </div>

      {/* Add Document Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Entity Type *</Label>
                <Select value={entityType} onValueChange={(v) => { setEntityType(v as 'vehicle' | 'driver'); setSelectedEntity(''); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{entityType === 'vehicle' ? 'Vehicle' : 'Driver'} *</Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${entityType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {entityType === 'vehicle' 
                      ? vehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>
                        ))
                      : drivers.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Type *</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(dt => (
                      <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Document Number *</Label>
                <Input 
                  placeholder="Enter number"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date *</Label>
                <Input 
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Expiry Date *</Label>
                <Input 
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Upload Document</Label>
              <Button variant="outline" onClick={handleFileUpload} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                {fileUrl ? fileUrl : 'Upload File'}
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddDocument}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Modal */}
      <Dialog open={showMergeModal} onOpenChange={setShowMergeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Merge Documents</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              You are about to merge {selectedDocs.length} documents into a single PDF.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Selected Documents:</h4>
              <ul className="text-sm space-y-1">
                {selectedDocs.map(docId => {
                  const doc = aggregatedDocs.find(d => d.id === docId);
                  return doc ? (
                    <li key={docId}>• {doc.documentType} - {doc.entityName}</li>
                  ) : null;
                })}
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMergeModal(false)}>Cancel</Button>
              <Button onClick={confirmMerge}>
                <Download className="w-4 h-4 mr-2" />
                Merge & Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocForDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Entity Type</Label>
                  <p className="font-medium capitalize">{selectedDocForDetail.entityType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entity Name</Label>
                  <p className="font-medium">{selectedDocForDetail.entityName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Document Type</Label>
                  <p className="font-medium">{selectedDocForDetail.documentType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Document Number</Label>
                  <p className="font-medium">{selectedDocForDetail.documentNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Issue Date</Label>
                  <p className="font-medium">
                    {selectedDocForDetail.issueDate 
                      ? format(new Date(selectedDocForDetail.issueDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className="font-medium">
                    {selectedDocForDetail.expiryDate 
                      ? format(new Date(selectedDocForDetail.expiryDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <StatusBadge status={selectedDocForDetail.status} />
                </div>
                {selectedDocForDetail.issuingAuthority && (
                  <div>
                    <Label className="text-muted-foreground">Issuing Authority</Label>
                    <p className="font-medium">{selectedDocForDetail.issuingAuthority}</p>
                  </div>
                )}
              </div>
              {(selectedDocForDetail.status === 'Expiring Soon' || selectedDocForDetail.status === 'Expired') && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {selectedDocForDetail.status === 'Expired' 
                      ? 'This document has expired and requires immediate renewal'
                      : 'This document is expiring soon and requires attention'}
                  </p>
                </div>
              )}
              {selectedDocForDetail.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{selectedDocForDetail.notes}</p>
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
