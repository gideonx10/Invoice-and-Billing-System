'use client';
import React, { useState } from 'react';
import { generateInvoicePDF } from '../utils/new_pdfGenerator';

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
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [gstRate, setGstRate] = useState(9);
  const [items, setItems] = useState<Item[]>([
    { description: '', itemCode: '', hsn: '', quantity: 1, rate: 0, discount: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { description: '', itemCode: '', hsn: '', quantity: 1, rate: 0, discount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    if (field === 'description' || field === 'itemCode' || field === 'hsn') {
      newItems[index][field] = value as string;
    } else {
      newItems[index][field] = parseFloat(value as string) || 0;
    }
    setItems(newItems);
  };

  const calculateItemTotal = (item: Item) => {
    return (item.quantity * item.rate) - item.discount;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (gstRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    return subtotal + (tax * 2); // SGST + CGST
  };

  const handleDownload = async () => {
    if (!billNo || !clientName) {
      alert('Please fill in Bill No and Client Name');
      return;
    }
    
    try {
      await generateInvoicePDF({
        billNo,
        clientName,
        orderNo,
        challanNo,
        gstNo,
        invoiceDate,
        gstRate,
        items: items.filter(item => item.description.trim()) // Only include items with descriptions
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Generator</h1>
          <p className="text-gray-600">Create professional invoices with GST calculations</p>
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
              Invoice Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Bill No *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter bill number"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Client Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Invoice Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Order No</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter order number"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Challan No</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter challan number"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">GST No</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter GST number"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
              <h2 className="text-xl font-semibold text-gray-900">Invoice Items</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-base font-medium text-gray-700">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 text-base font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                        placeholder="Item description"
                        rows={2}
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Item Code</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Code"
                        value={item.itemCode}
                        onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">HSN</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="HSN code"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Qty"
                        min="0"
                        step="0.01"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Rate"
                        min="0"
                        step="0.01"
                        value={item.rate || ''}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Discount"
                        min="0"
                        step="0.01"
                        value={item.discount || ''}
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 text-right">
                    <span className="text-xl font-medium text-gray-700">
                      Amount: <span className="text-xl font-semibold text-green-600">₹{calculateItemTotal(item).toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals and Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* GST Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">GST Settings</h3>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">GST Rate</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={gstRate}
                  onChange={(e) => setGstRate(parseInt(e.target.value))}
                >
                  <option value={9}>9%</option>
                  <option value={14}>14%</option>
                </select>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Invoice Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">SGST ({gstRate}%):</span>
                  <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">CGST ({gstRate}%):</span>
                  <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-xl font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-green-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-all hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Invoice PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}