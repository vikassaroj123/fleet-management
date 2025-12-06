import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
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
import { Search, Plus, Edit, Trash2, Printer, Download, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { format } from 'date-fns';

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  email: string;
  manager: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

interface SubBranch {
  id: string;
  branchId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  manager: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

// Initialize with existing data
const initialBranches: Branch[] = [
  { id: 'BR001', name: 'Head Office - Riyadh', code: 'HO-RYD', address: 'King Fahd Road, Riyadh', city: 'Riyadh', region: 'Central Province', phone: '+966112345678', email: 'ho@fleetpro.sa', manager: 'Ahmed Al-Rashid', status: 'Active', createdAt: '2020-01-15' },
  { id: 'BR002', name: 'Eastern Province', code: 'EP-DMM', address: 'Corniche Road, Dammam', city: 'Dammam', region: 'Eastern Province', phone: '+966133456789', email: 'east@fleetpro.sa', manager: 'Mohammed Al-Saud', status: 'Active', createdAt: '2020-02-20' },
  { id: 'BR003', name: 'Western Province', code: 'WP-JED', address: 'King Abdulaziz Road, Jeddah', city: 'Jeddah', region: 'Western Province', phone: '+966126789012', email: 'west@fleetpro.sa', manager: 'Khalid Al-Mansouri', status: 'Active', createdAt: '2020-03-10' },
  { id: 'BR004', name: 'Central Province', code: 'CP-RYD', address: 'Olaya Street, Riyadh', city: 'Riyadh', region: 'Central Province', phone: '+966118901234', email: 'central@fleetpro.sa', manager: 'Fahad Al-Zahrani', status: 'Active', createdAt: '2020-04-05' },
  { id: 'BR005', name: 'Northern Province', code: 'NP-TBK', address: 'King Faisal Road, Tabuk', city: 'Tabuk', region: 'Northern Province', phone: '+966144567890', email: 'north@fleetpro.sa', manager: 'Omar Al-Shammari', status: 'Active', createdAt: '2020-05-12' },
  { id: 'BR006', name: 'Southern Province', code: 'SP-ABH', address: 'King Khalid Road, Abha', city: 'Abha', region: 'Southern Province', phone: '+966177890123', email: 'south@fleetpro.sa', manager: 'Yousef Al-Qahtani', status: 'Active', createdAt: '2020-06-18' },
];

const initialSubBranches: SubBranch[] = [
  { id: 'SB001', branchId: 'BR001', name: 'Riyadh Main', code: 'RYD-MAIN', address: 'King Fahd Road, Riyadh', phone: '+966112345678', manager: 'Ibrahim Al-Harbi', status: 'Active', createdAt: '2020-01-15' },
  { id: 'SB002', branchId: 'BR001', name: 'Riyadh Warehouse', code: 'RYD-WH', address: 'Industrial Area, Riyadh', phone: '+966112345679', manager: 'Hassan Al-Mutairi', status: 'Active', createdAt: '2020-01-20' },
  { id: 'SB003', branchId: 'BR001', name: 'Riyadh Service Center', code: 'RYD-SVC', address: 'Service Road, Riyadh', phone: '+966112345680', manager: 'Hassan Al-Mutairi', status: 'Active', createdAt: '2020-01-25' },
  { id: 'SB004', branchId: 'BR002', name: 'Dammam', code: 'DMM-MAIN', address: 'Corniche Road, Dammam', phone: '+966133456789', manager: 'Salem Al-Dosari', status: 'Active', createdAt: '2020-02-20' },
  { id: 'SB005', branchId: 'BR002', name: 'Khobar', code: 'KHB-MAIN', address: 'King Fahd Road, Khobar', phone: '+966133456790', manager: 'Hamad Al-Qahtani', status: 'Active', createdAt: '2020-02-25' },
  { id: 'SB006', branchId: 'BR002', name: 'Jubail', code: 'JBL-MAIN', address: 'Industrial Area, Jubail', phone: '+966133456791', manager: 'Nasser Al-Shehri', status: 'Active', createdAt: '2020-03-01' },
  { id: 'SB007', branchId: 'BR003', name: 'Jeddah', code: 'JED-MAIN', address: 'King Abdulaziz Road, Jeddah', phone: '+966126789012', manager: 'Nasser Al-Shehri', status: 'Active', createdAt: '2020-03-10' },
  { id: 'SB008', branchId: 'BR003', name: 'Mecca', code: 'MEC-MAIN', address: 'Al Haram Road, Mecca', phone: '+966126789013', manager: 'Saeed Al-Ghamdi', status: 'Active', createdAt: '2020-03-15' },
  { id: 'SB009', branchId: 'BR003', name: 'Medina', code: 'MED-MAIN', address: 'King Fahd Road, Medina', phone: '+966126789014', manager: 'Faisal Al-Zahrani', status: 'Active', createdAt: '2020-03-20' },
  { id: 'SB010', branchId: 'BR005', name: 'Tabuk', code: 'TBK-MAIN', address: 'King Faisal Road, Tabuk', phone: '+966144567890', manager: 'Turki Al-Shammari', status: 'Active', createdAt: '2020-05-12' },
];

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [subBranches, setSubBranches] = useState<SubBranch[]>(initialSubBranches);
  const [activeTab, setActiveTab] = useState<'branches' | 'subBranches'>('branches');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showSubBranchModal, setShowSubBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingSubBranch, setEditingSubBranch] = useState<SubBranch | null>(null);

  // Branch form state
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchRegion, setBranchRegion] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchEmail, setBranchEmail] = useState('');
  const [branchManager, setBranchManager] = useState('');

  // Sub-branch form state
  const [subBranchName, setSubBranchName] = useState('');
  const [subBranchCode, setSubBranchCode] = useState('');
  const [subBranchBranchId, setSubBranchBranchId] = useState('');
  const [subBranchAddress, setSubBranchAddress] = useState('');
  const [subBranchPhone, setSubBranchPhone] = useState('');
  const [subBranchManager, setSubBranchManager] = useState('');

  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      const matchesSearch = 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || branch.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [branches, searchTerm, filterStatus]);

  const filteredSubBranches = useMemo(() => {
    return subBranches.filter(subBranch => {
      const branch = branches.find(b => b.id === subBranch.branchId);
      const matchesSearch = 
        subBranch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subBranch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || subBranch.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [subBranches, branches, searchTerm, filterStatus]);

  const handleAddBranch = () => {
    if (!branchName || !branchCode || !branchCity || !branchRegion) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingBranch) {
      setBranches(prev => prev.map(b => 
        b.id === editingBranch.id 
          ? { ...b, name: branchName, code: branchCode, address: branchAddress, city: branchCity, region: branchRegion, phone: branchPhone, email: branchEmail, manager: branchManager }
          : b
      ));
      toast.success('Branch updated successfully');
    } else {
      const newBranch: Branch = {
        id: `BR${String(branches.length + 1).padStart(3, '0')}`,
        name: branchName,
        code: branchCode,
        address: branchAddress,
        city: branchCity,
        region: branchRegion,
        phone: branchPhone,
        email: branchEmail,
        manager: branchManager,
        status: 'Active',
        createdAt: format(new Date(), 'yyyy-MM-dd'),
      };
      setBranches(prev => [...prev, newBranch]);
      toast.success('Branch added successfully');
    }
    resetBranchForm();
    setShowBranchModal(false);
  };

  const handleAddSubBranch = () => {
    if (!subBranchName || !subBranchCode || !subBranchBranchId) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingSubBranch) {
      setSubBranches(prev => prev.map(sb => 
        sb.id === editingSubBranch.id 
          ? { ...sb, name: subBranchName, code: subBranchCode, branchId: subBranchBranchId, address: subBranchAddress, phone: subBranchPhone, manager: subBranchManager }
          : sb
      ));
      toast.success('Sub-branch updated successfully');
    } else {
      const newSubBranch: SubBranch = {
        id: `SB${String(subBranches.length + 1).padStart(3, '0')}`,
        branchId: subBranchBranchId,
        name: subBranchName,
        code: subBranchCode,
        address: subBranchAddress,
        phone: subBranchPhone,
        manager: subBranchManager,
        status: 'Active',
        createdAt: format(new Date(), 'yyyy-MM-dd'),
      };
      setSubBranches(prev => [...prev, newSubBranch]);
      toast.success('Sub-branch added successfully');
    }
    resetSubBranchForm();
    setShowSubBranchModal(false);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchCode(branch.code);
    setBranchAddress(branch.address);
    setBranchCity(branch.city);
    setBranchRegion(branch.region);
    setBranchPhone(branch.phone);
    setBranchEmail(branch.email);
    setBranchManager(branch.manager);
    setShowBranchModal(true);
  };

  const handleEditSubBranch = (subBranch: SubBranch) => {
    setEditingSubBranch(subBranch);
    setSubBranchName(subBranch.name);
    setSubBranchCode(subBranch.code);
    setSubBranchBranchId(subBranch.branchId);
    setSubBranchAddress(subBranch.address);
    setSubBranchPhone(subBranch.phone);
    setSubBranchManager(subBranch.manager);
    setShowSubBranchModal(true);
  };

  const handleDeleteBranch = (id: string) => {
    if (window.confirm('Are you sure you want to delete this branch? This will also delete all sub-branches.')) {
      setBranches(prev => prev.filter(b => b.id !== id));
      setSubBranches(prev => prev.filter(sb => sb.branchId !== id));
      toast.success('Branch deleted successfully');
    }
  };

  const handleDeleteSubBranch = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sub-branch?')) {
      setSubBranches(prev => prev.filter(sb => sb.id !== id));
      toast.success('Sub-branch deleted successfully');
    }
  };

  const resetBranchForm = () => {
    setEditingBranch(null);
    setBranchName('');
    setBranchCode('');
    setBranchAddress('');
    setBranchCity('');
    setBranchRegion('');
    setBranchPhone('');
    setBranchEmail('');
    setBranchManager('');
  };

  const resetSubBranchForm = () => {
    setEditingSubBranch(null);
    setSubBranchName('');
    setSubBranchCode('');
    setSubBranchBranchId('');
    setSubBranchAddress('');
    setSubBranchPhone('');
    setSubBranchManager('');
  };

  const handlePrint = () => {
    printPage(activeTab === 'branches' ? 'branches-table' : 'sub-branches-table');
  };

  const handleExport = () => {
    if (activeTab === 'branches') {
      const exportData = filteredBranches.map(b => ({
        'Code': b.code,
        'Name': b.name,
        'Address': b.address,
        'City': b.city,
        'Region': b.region,
        'Phone': b.phone,
        'Email': b.email,
        'Manager': b.manager,
        'Status': b.status,
        'Created Date': b.createdAt,
      }));
      exportToExcel(exportData, `branches_${format(new Date(), 'yyyy-MM-dd')}`);
    } else {
      const exportData = filteredSubBranches.map(sb => {
        const branch = branches.find(b => b.id === sb.branchId);
        return {
          'Code': sb.code,
          'Name': sb.name,
          'Branch': branch?.name || 'N/A',
          'Address': sb.address,
          'Phone': sb.phone,
          'Manager': sb.manager,
          'Status': sb.status,
          'Created Date': sb.createdAt,
        };
      });
      exportToExcel(exportData, `sub_branches_${format(new Date(), 'yyyy-MM-dd')}`);
    }
    toast.success('Data exported successfully');
  };

  const branchColumns = [
    { key: 'code', header: 'Code', className: 'font-medium' },
    { key: 'name', header: 'Name' },
    { key: 'city', header: 'City' },
    { key: 'region', header: 'Region' },
    { key: 'manager', header: 'Manager' },
    { key: 'phone', header: 'Phone' },
    { key: 'status', header: 'Status', render: (branch: Branch) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        branch.status === 'Active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
      }`}>
        {branch.status}
      </span>
    )},
    { key: 'actions', header: 'Actions', className: 'text-right', render: (branch: Branch) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => handleEditBranch(branch)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDeleteBranch(branch.id)}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  const subBranchColumns = [
    { key: 'code', header: 'Code', className: 'font-medium' },
    { key: 'name', header: 'Name' },
    { key: 'branch', header: 'Branch', render: (subBranch: SubBranch) => {
      const branch = branches.find(b => b.id === subBranch.branchId);
      return branch?.name || 'N/A';
    }},
    { key: 'manager', header: 'Manager' },
    { key: 'phone', header: 'Phone' },
    { key: 'status', header: 'Status', render: (subBranch: SubBranch) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        subBranch.status === 'Active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
      }`}>
        {subBranch.status}
      </span>
    )},
    { key: 'actions', header: 'Actions', className: 'text-right', render: (subBranch: SubBranch) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => handleEditSubBranch(subBranch)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDeleteSubBranch(subBranch.id)}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in min-h-full w-full">
      <PageHeader 
        title="Branch Management" 
        description="Manage branches and sub-branches across all regions"
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
            <Button onClick={() => {
              if (activeTab === 'branches') {
                resetBranchForm();
                setShowBranchModal(true);
              } else {
                resetSubBranchForm();
                setShowSubBranchModal(true);
              }
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab === 'branches' ? 'Branch' : 'Sub-Branch'}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'branches'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Branches ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab('subBranches')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'subBranches'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="w-4 h-4 inline mr-2" />
          Sub-Branches ({subBranches.length})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={`Search ${activeTab === 'branches' ? 'branches' : 'sub-branches'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tables */}
      {activeTab === 'branches' ? (
        <div id="branches-table">
          <DataTable
            data={filteredBranches}
            columns={branchColumns}
            emptyMessage="No branches found"
          />
        </div>
      ) : (
        <div id="sub-branches-table">
          <DataTable
            data={filteredSubBranches}
            columns={subBranchColumns}
            emptyMessage="No sub-branches found"
          />
        </div>
      )}

      {/* Add/Edit Branch Modal */}
      <Dialog open={showBranchModal} onOpenChange={(open) => {
        setShowBranchModal(open);
        if (!open) resetBranchForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Branch Name *</Label>
                <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} />
              </div>
              <div>
                <Label>Branch Code *</Label>
                <Input value={branchCode} onChange={(e) => setBranchCode(e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label>City *</Label>
                <Input value={branchCity} onChange={(e) => setBranchCity(e.target.value)} />
              </div>
              <div>
                <Label>Region *</Label>
                <Input value={branchRegion} onChange={(e) => setBranchRegion(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={branchEmail} onChange={(e) => setBranchEmail(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Manager</Label>
                <Input value={branchManager} onChange={(e) => setBranchManager(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowBranchModal(false);
                resetBranchForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddBranch}>
                {editingBranch ? 'Update' : 'Add'} Branch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Sub-Branch Modal */}
      <Dialog open={showSubBranchModal} onOpenChange={(open) => {
        setShowSubBranchModal(open);
        if (!open) resetSubBranchForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubBranch ? 'Edit Sub-Branch' : 'Add New Sub-Branch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sub-Branch Name *</Label>
                <Input value={subBranchName} onChange={(e) => setSubBranchName(e.target.value)} />
              </div>
              <div>
                <Label>Sub-Branch Code *</Label>
                <Input value={subBranchCode} onChange={(e) => setSubBranchCode(e.target.value.toUpperCase())} />
              </div>
              <div className="col-span-2">
                <Label>Parent Branch *</Label>
                <Select value={subBranchBranchId} onValueChange={setSubBranchBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={subBranchAddress} onChange={(e) => setSubBranchAddress(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={subBranchPhone} onChange={(e) => setSubBranchPhone(e.target.value)} />
              </div>
              <div>
                <Label>Manager</Label>
                <Input value={subBranchManager} onChange={(e) => setSubBranchManager(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowSubBranchModal(false);
                resetSubBranchForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddSubBranch}>
                {editingSubBranch ? 'Update' : 'Add'} Sub-Branch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

