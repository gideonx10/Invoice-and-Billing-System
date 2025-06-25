'use client';
import InvoiceForm from '@/components/InvoiceForm';

export default function InvoiceGeneratorPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6 text-center text-blue-800">Tax Invoice Generator</h1>
      <InvoiceForm />
    </div>
  );
}