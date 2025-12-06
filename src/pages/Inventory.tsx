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
import { Search, Info, Plus, CheckCircle, Printer, Download, Eye } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { categories, branches, subBranches } from '@/data/mockData';
import { toast } from 'sonner';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { format } from 'date-fns';
import type { InventoryItem, PurchaseRecord } from '@/data/mockData';

export default function Inventory() {
  const { inventory, addInventoryItem } = useFleet();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);

  // Form state for adding new item
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemSubCategory, setNewItemSubCategory] = useState('');
  const [newItemBranch, setNewItemBranch] = useState('');
  const [newItemSubBranch, setNewItemSubBranch] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Safety check - ensure inventory is loaded
  if (!inventory || !Array.isArray(inventory)) {
    return (
      <div className="animate-fade-in min-h-full w-full">
        <PageHeader 
          title="Inventory / Spare Parts" 
          description="Manage stock levels and track parts across branches"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || item.category === filterCategory;
      const matchesBranch = !filterBranch || item.branch === filterBranch;
      return matchesSearch && matchesCategory && matchesBranch;
    });
  }, [inventory, searchTerm, filterCategory, filterBranch]);

  const handleViewPurchaseHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowPurchaseHistory(true);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return 'Out of Stock';
    if (stock < 5) return 'Critical';
    if (stock < 10) return 'Low';
    return 'Available';
  };

  const getStockVariant = (stock: number): 'danger' | 'warning' | 'success' => {
    if (stock === 0) return 'danger';
    if (stock < 10) return 'warning';
    return 'success';
  };

  const availableSubBranches = newItemBranch ? subBranches[newItemBranch] || [] : [];

  const handleAddItem = () => {
    if (!newItemSku || !newItemName || !newItemCategory || !newItemBranch || !newItemSubBranch || !newItemStock || !newItemPrice) {
      toast.error('Please fill all required fields');
      return;
    }

    const stock = parseInt(newItemStock);
    const price = parseFloat(newItemPrice);

    if (isNaN(stock) || stock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    // Generate new ID
    const newId = `INV${String(inventory.length + 1).padStart(3, '0')}`;

    const newItem: InventoryItem = {
      id: newId,
      sku: newItemSku,
      name: newItemName,
      category: newItemCategory,
      subCategory: newItemSubCategory || '',
      branch: newItemBranch,
      subBranch: newItemSubBranch,
      stockAvailable: stock,
      lastPurchasePrice: price,
      averagePrice: price,
      purchaseHistory: [],
    };

    addInventoryItem(newItem);
    toast.success('Inventory item added successfully!');
    setShowAddModal(false);
    resetAddForm();
  };

  const resetAddForm = () => {
    setNewItemSku('');
    setNewItemName('');
    setNewItemCategory('');
    setNewItemSubCategory('');
    setNewItemBranch('');
    setNewItemSubBranch('');
    setNewItemStock('');
    setNewItemPrice('');
  };

  const handlePrint = () => {
    printPage('inventory-table');
  };

  const handleExport = () => {
    const exportData = filteredInventory.map(item => ({
      'SKU': item.sku,
      'Name': item.name,
      'Category': item.category,
      'Sub Category': item.subCategory,
      'Branch': item.branch,
      'Sub Branch': item.subBranch,
      'Stock Available': item.stockAvailable,
      'Last Purchase Price (SAR)': item.lastPurchasePrice,
      'Average Price (SAR)': item.averagePrice,
      'Stock Value (SAR)': item.stockAvailable * item.averagePrice,
    }));
    exportToExcel(exportData, `inventory_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Inventory data exported successfully');
  };

  return (
    <div className="animate-fade-in min-h-full w-full" style={{ minHeight: '100vh' }}>
      <PageHeader 
        title="Inventory / Spare Parts" 
        description="Manage stock levels and track parts across branches"
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
              Add Item
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold">{inventory.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
          <p className="text-2xl font-bold text-warning">{inventory.filter(i => i.stockAvailable < 10 && i.stockAvailable > 0).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="text-2xl font-bold text-destructive">{inventory.filter(i => i.stockAvailable === 0).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Stock Value</p>
          <p className="text-2xl font-bold">SAR {inventory.reduce((sum, i) => sum + (i.stockAvailable * i.averagePrice), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory || "all"} onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBranch || "all"} onValueChange={(v) => setFilterBranch(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(b => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <div id="inventory-table">
        <DataTable
          data={filteredInventory}
        columns={[
          { key: 'sku', header: 'SKU' },
          { key: 'name', header: 'Item Name', className: 'max-w-[200px]' },
          { key: 'category', header: 'Category' },
          { key: 'subCategory', header: 'Sub-Category' },
          { key: 'branch', header: 'Branch' },
          { key: 'subBranch', header: 'Sub-Branch' },
          { 
            key: 'stockAvailable', 
            header: 'Stock',
            render: (item) => (
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.stockAvailable}</span>
                <StatusBadge 
                  status={getStockStatus(item.stockAvailable)} 
                  variant={getStockVariant(item.stockAvailable)}
                />
              </div>
            )
          },
          { 
            key: 'lastPurchasePrice', 
            header: 'Last Price',
            render: (item) => `SAR ${item.lastPurchasePrice.toLocaleString()}`
          },
          { 
            key: 'averagePrice', 
            header: 'Avg Price',
            render: (item) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewPurchaseHistory(item);
                }}
                className="text-primary hover:underline flex items-center gap-1"
              >
                SAR {item.averagePrice.toLocaleString()}
                <Info className="w-3 h-3" />
              </button>
            )
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
                  setSelectedItemForDetail(item);
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
          setSelectedItemForDetail(item);
          setShowDetailModal(true);
        }}
        emptyMessage="No inventory items found"
      />
      </div>

      {/* Purchase History Modal */}
      <Dialog open={showPurchaseHistory} onOpenChange={setShowPurchaseHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase History - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">SKU:</span>
                    <p className="font-semibold">{selectedItem.sku}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Stock:</span>
                    <p className="font-semibold">{selectedItem.stockAvailable}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Weighted Avg Price:</span>
                    <p className="font-semibold text-primary">SAR {selectedItem.averagePrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Supplier</th>
                      <th className="text-left p-3">Branch</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-right p-3">Unit Price</th>
                      <th className="text-right p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.purchaseHistory.map(purchase => (
                      <tr key={purchase.id} className="border-t">
                        <td className="p-3">{purchase.purchaseDate}</td>
                        <td className="p-3">{purchase.supplier}</td>
                        <td className="p-3">{purchase.branch} / {purchase.subBranch}</td>
                        <td className="p-3 text-right">{purchase.quantity}</td>
                        <td className="p-3 text-right">SAR {purchase.unitPrice.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">SAR {(purchase.quantity * purchase.unitPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>Weighted Average Calculation:</strong></p>
                <p>Sum of (Quantity × Unit Price) / Total Quantity</p>
                <p className="mt-1">
                  = ({selectedItem.purchaseHistory.map(p => `${p.quantity} × ${p.unitPrice}`).join(' + ')}) / {selectedItem.purchaseHistory.reduce((s, p) => s + p.quantity, 0)}
                </p>
                <p className="mt-1 font-semibold">= SAR {selectedItem.averagePrice.toLocaleString()}</p>
              </div>

              <Button onClick={() => setShowPurchaseHistory(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU *</Label>
                <Input
                  placeholder="Enter SKU"
                  value={newItemSku}
                  onChange={(e) => setNewItemSku(e.target.value)}
                />
              </div>
              <div>
                <Label>Item Name *</Label>
                <Input
                  placeholder="Enter item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={newItemCategory} onValueChange={(v) => { setNewItemCategory(v); setNewItemSubCategory(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub-Category</Label>
                <Select value={newItemSubCategory} onValueChange={setNewItemSubCategory} disabled={!newItemCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.find(c => c.name === newItemCategory)?.subCategories.map(sc => (
                      <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Branch *</Label>
                <Select value={newItemBranch} onValueChange={(v) => { setNewItemBranch(v); setNewItemSubBranch(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub-Branch *</Label>
                <Select value={newItemSubBranch} onValueChange={setNewItemSubBranch} disabled={!newItemBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubBranches.map(sb => (
                      <SelectItem key={sb} value={sb}>{sb}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Initial Stock *</Label>
                <Input
                  type="number"
                  placeholder="Enter stock quantity"
                  value={newItemStock}
                  onChange={(e) => setNewItemStock(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <Label>Initial Price *</Label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setShowAddModal(false); resetAddForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inventory Item Details</DialogTitle>
          </DialogHeader>
          {selectedItemForDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">SKU</Label>
                  <p className="font-medium">{selectedItemForDetail.sku}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Item Name</Label>
                  <p className="font-medium">{selectedItemForDetail.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedItemForDetail.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sub-Category</Label>
                  <p className="font-medium">{selectedItemForDetail.subCategory}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Branch</Label>
                  <p className="font-medium">{selectedItemForDetail.branch}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sub-Branch</Label>
                  <p className="font-medium">{selectedItemForDetail.subBranch}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stock Available</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedItemForDetail.stockAvailable}</p>
                    <StatusBadge 
                      status={getStockStatus(selectedItemForDetail.stockAvailable)} 
                      variant={getStockVariant(selectedItemForDetail.stockAvailable)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit</Label>
                  <p className="font-medium">{selectedItemForDetail.unit || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Purchase Price</Label>
                  <p className="font-medium">SAR {selectedItemForDetail.lastPurchasePrice.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Average Price</Label>
                  <p className="font-medium">SAR {selectedItemForDetail.averagePrice.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Stock Value</Label>
                  <p className="font-medium text-lg">
                    SAR {(selectedItemForDetail.stockAvailable * selectedItemForDetail.averagePrice).toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedItemForDetail.purchaseHistory && selectedItemForDetail.purchaseHistory.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Recent Purchase History</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedItemForDetail.purchaseHistory.slice(0, 5).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{format(new Date(record.purchaseDate), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">Qty: {record.quantity} • Supplier: {record.supplier}</p>
                        </div>
                        <p className="font-medium">SAR {record.unitPrice.toLocaleString()}</p>
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
