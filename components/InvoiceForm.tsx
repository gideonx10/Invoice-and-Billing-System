'use client';
import { useState } from 'react';
import { generateInvoicePDF } from '../utils/pdfGenerator';

interface Item {
  description: string;
  itemCode: string;
  hsn: string;
  quantity: number;
  rate: number;
  discount: number;
}

export default function InvoiceForm() {
  const [billNo, setBillNo] = useState('');
  const [clientName, setClientName] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [gstRate, setGstRate] = useState(9);
  const [items, setItems] = useState<Item[]>([
    { description: '', itemCode: '', hsn: '', quantity: 0, rate: 0, discount: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { description: '', itemCode: '', hsn: '', quantity: 0, rate: 0, discount: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    if (field === 'description' || field === 'itemCode' || field === 'hsn') {
      newItems[index][field] = value as string;
    } else {
      newItems[index][field] = parseFloat(value as string);
    }
    setItems(newItems);
  };

  const handleDownload = async () => {
    await generateInvoicePDF({
      billNo,
      clientName,
      orderNo,
      challanNo,
      gstNo,
      invoiceDate,
      gstRate,
      items
    });
  };

  return (
    <div className="space-y-6 px-4 sm:px-8 py-6 max-w-4xl mx-auto">
      <form className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" placeholder="Bill No" className="border rounded px-3 py-2" value={billNo} onChange={(e) => setBillNo(e.target.value)} />
          <input type="text" placeholder="Client Name" className="border rounded px-3 py-2" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          <input type="text" placeholder="Order No" className="border rounded px-3 py-2" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
          <input type="text" placeholder="Challan No" className="border rounded px-3 py-2" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} />
          <input type="text" placeholder="GST No" className="border rounded px-3 py-2" value={gstNo} onChange={(e) => setGstNo(e.target.value)} />
          <input type="date" className="border rounded px-3 py-2" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Invoice Items</h2>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              <input type="text" placeholder="Description" className="border px-2 py-1 rounded" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
              <input type="text" placeholder="Item Code" className="border px-2 py-1 rounded" value={item.itemCode} onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)} />
              <input type="text" placeholder="HSN" className="border px-2 py-1 rounded" value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} />
              <input type="number" placeholder="Qty" className="border px-2 py-1 rounded" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
              <input type="number" placeholder="Rate" className="border px-2 py-1 rounded" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} />
              <input type="number" placeholder="Discount" className="border px-2 py-1 rounded" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', e.target.value)} />
              <span className="text-center self-center font-medium">{((item.quantity * item.rate)- item.discount).toFixed(2)}</span>
            </div>
          ))}
          <button type="button" className="text-blue-600 underline" onClick={handleAddItem}>+ Add Item</button>
        </div>

        <div className="pt-4">
          <label className="font-medium mr-2">GST Rate:</label>
          <select className="border rounded px-2 py-1" value={gstRate} onChange={(e) => setGstRate(parseInt(e.target.value))}>
            <option value={9}>9%</option>
            <option value={14}>14%</option>
          </select>
        </div>

        <button type="button" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded" onClick={handleDownload}>
          Generate Invoice PDF
        </button>
      </form>
    </div>
  );
}
