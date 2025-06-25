'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="text-center space-y-6">
      <h1 className="text-5xl font-bold text-blue-800">Shakti Mechanical Works</h1>
      <p className="text-lg text-gray-600">Trusted partner in mechanical excellence</p>
      <button
        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded shadow-lg"
        onClick={() => router.push('/invoice-generator')}
      >
        Generate Invoice
      </button>
    </div>
  );
}
