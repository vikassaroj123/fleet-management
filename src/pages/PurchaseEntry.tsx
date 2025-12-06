import { useState, useMemo } from 'react';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
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
import { Plus, Upload, CheckCircle, Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { categories, branches, subBranches, suppliers } from '@/data/mockData';
import type { PurchaseRecord } from '@/data/mockData';

interface PurchaseEntryData {
  id: string;
  purchaseDate: string;
  supplier: string;
  branch: string;
  subBranch: string;
  itemId: string;
  itemName: string;
  category: string;
  subCategory: string;
  quantity: number;
  unitPrice: number;
  total: number;
  invoiceUrl?: string;
}

export default function PurchaseEntry() {
  const { inventory, addPurchaseEntry, addInventoryItem } = useFleet();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [purchaseEntries, setPurchaseEntries] = useState<PurchaseEntryData[]>([]);

  // Form state
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [supplier, setSupplier] = useState('');
  const [branch, setBranch] = useState('');
  const [subBranch, setSubBranch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');

  const availableSubBranches = branch ? subBranches[branch] || [] : [];

  const filteredInventoryItems = useMemo(() => {
    return inventory.filter(item => {
      if (!selectedCategory) return false;
      const matchesCategory = item.category === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || item.subCategory === selectedSubCategory;
      return matchesCategory && matchesSubCategory;
    });
  }, [inventory, selectedCategory, selectedSubCategory]);

  const handleFileUpload = () => {
    // Simulate file upload
    const mockFileName = `invoice_${Date.now()}.pdf`;
    setInvoiceUrl(mockFileName);
    toast.success('Invoice uploaded successfully');
  };

  const handleSubmit = () => {
    if (!selectedItem || !quantity || !unitPrice || !supplier || !branch || !subBranch) {
      toast.error('Please fill all required fields');
      return;
    }

    const item = inventory.find(i => i.id === selectedItem);
    if (!item) return;

    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);
    const purchaseId = `PUR${String(purchaseEntries.length + 1).padStart(3, '0')}`;

    const purchaseRecord: PurchaseRecord = {
      id: purchaseId,
      purchaseDate,
      quantity: qty,
      unitPrice: price,
      supplier,
      branch,
      subBranch,
      invoiceUrl,
    };

    addPurchaseEntry(selectedItem, purchaseRecord);

    const newEntry: PurchaseEntryData = {
      id: purchaseId,
      purchaseDate,
      supplier,
      branch,
      subBranch,
      itemId: selectedItem,
      itemName: item.name,
      category: item.category,
      subCategory: item.subCategory,
      quantity: qty,
      unitPrice: price,
      total: qty * price,
      invoiceUrl,
    };

    setPurchaseEntries([newEntry, ...purchaseEntries]);
    toast.success('Purchase entry added successfully! Stock updated.');
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setPurchaseDate(format(new Date(), 'yyyy-MM-dd'));
    setSupplier('');
    setBranch('');
    setSubBranch('');
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedItem('');
    setQuantity('');
    setUnitPrice('');
    setInvoiceUrl('');
  };

  const selectedItemData = inventory.find(i => i.id === selectedItem);

  const handlePrint = () => {
    printPage('purchase-entries-table');
  };

  const handleExport = () => {
    const exportData = purchaseEntries.map(entry => ({
      'ID': entry.id,
      'Purchase Date': entry.purchaseDate,
      'Supplier': entry.supplier,
      'Branch': entry.branch,
      'Sub Branch': entry.subBranch,
      'Item Name': entry.itemName,
      'Category': entry.category,
      'Sub Category': entry.subCategory,
      'Quantity': entry.quantity,
      'Unit Price (SAR)': entry.unitPrice,
      'Total (SAR)': entry.total,
      'Invoice URL': entry.invoiceUrl || 'N/A',
    }));
    exportToExcel(exportData, `purchase_entries_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Purchase entries exported successfully');
  };

  return (
    <div className="animate-fade-in min-h-full w-full" style={{ minHeight: '100vh' }}>
      <PageHeader 
        title="Purchase Entry" 
        description="Record new stock purchases and update inventory"
        action={
          <div className="flex gap-2">
            {purchaseEntries.length > 0 && (
              <>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          </div>
        }
      />

      {/* Recent Purchases */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Recent Purchase Entries</h2>
        </div>
        {purchaseEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No purchase entries yet. Click "New Purchase" to add one.
          </div>
        ) : (
          <div id="purchase-entries-table" className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Branch</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {purchaseEntries.map(entry => (
                  <tr key={entry.id}>
                    <td className="font-medium">{entry.id}</td>
                    <td>{entry.purchaseDate}</td>
                    <td>{entry.supplier}</td>
                    <td>{entry.itemName}</td>
                    <td>{entry.category}</td>
                    <td>{entry.branch} / {entry.subBranch}</td>
                    <td>{entry.quantity}</td>
                    <td>SAR {entry.unitPrice.toLocaleString()}</td>
                    <td className="font-medium">SAR {entry.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Purchase Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date *</Label>
                <Input 
                  type="date" 
                  value={purchaseDate} 
                  onChange={(e) => setPurchaseDate(e.target.value)} 
                />
              </div>
              <div>
                <Label>Supplier *</Label>
                <Select value={supplier} onValueChange={setSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Branch *</Label>
                <Select value={branch} onValueChange={(v) => { setBranch(v); setSubBranch(''); }}>
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
                <Select value={subBranch} onValueChange={setSubBranch} disabled={!branch}>
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

            {/* Item Selection */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedSubCategory(''); setSelectedItem(''); }}>
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
                <Select value={selectedSubCategory} onValueChange={(v) => { setSelectedSubCategory(v); setSelectedItem(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.find(c => c.name === selectedCategory)?.subCategories.map(sc => (
                      <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Item *</Label>
                <div className="flex gap-2">
                  <Select value={selectedItem} onValueChange={setSelectedItem} disabled={filteredInventoryItems.length === 0} className="flex-1">
                    <SelectTrigger>
                      <SelectValue placeholder={filteredInventoryItems.length === 0 ? "Select category first" : "Select item"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredInventoryItems.length === 0 ? (
                        <SelectItem value="no-items" disabled>No items available - Select category</SelectItem>
                      ) : (
                        filteredInventoryItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} (Stock: {item.stockAvailable})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => {
                        // Navigate to inventory page or show message
                        toast.info('Please add new items from Inventory page first');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Item
                    </Button>
                  )}
                </div>
                {filteredInventoryItems.length === 0 && selectedCategory && (
                  <p className="text-xs text-muted-foreground mt-1">No items found in this category. Click "New Item" or add from Inventory page.</p>
                )}
              </div>
            </div>

            {/* Item Details */}
            {selectedItemData && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">SKU:</span>
                    <p className="font-medium">{selectedItemData.sku}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Stock:</span>
                    <p className="font-medium">{selectedItemData.stockAvailable}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Purchase Price:</span>
                    <p className="font-medium">SAR {selectedItemData.lastPurchasePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Price:</span>
                    <p className="font-medium text-primary">SAR {selectedItemData.averagePrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity and Price */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input 
                  type="number" 
                  placeholder="Enter quantity"
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label>Unit Price *</Label>
                <Input 
                  type="number" 
                  placeholder="Enter unit price"
                  value={unitPrice} 
                  onChange={(e) => setUnitPrice(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <Label>Total</Label>
                <Input 
                  value={quantity && unitPrice ? `SAR ${(parseInt(quantity) * parseFloat(unitPrice)).toLocaleString()}` : 'SAR 0'} 
                  disabled 
                />
              </div>
            </div>

            {/* Invoice Upload */}
            <div>
              <Label className="mb-2 block">Upload Invoice</Label>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleFileUpload} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  {invoiceUrl ? invoiceUrl : 'Upload Invoice'}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Add Purchase Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
