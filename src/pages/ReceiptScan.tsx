import { useState, useRef } from 'react';
import { Camera, Check, Upload } from 'lucide-react';
import { receiptsApi } from '@/lib/api';
import { fileToBase64, speak } from '@/lib/utils';
import type { Receipt, ReceiptParseResult } from '@/types';

export default function ReceiptScan() {
  const [scanning, setScanning] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [parsed, setParsed] = useState<ReceiptParseResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await receiptsApi.scan(base64);
      setReceipt(result.receipt);
      setParsed(result.parsed);
      speak(`I found ${result.parsed.items.length} items from ${result.parsed.store_name || 'the store'}. Please verify.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleVerify = async () => {
    if (!receipt) return;
    setVerifying(true);
    try {
      const result = await receiptsApi.verify(receipt.id);
      speak(`Added ${result.items_added} items to your pantry!`);
      setReceipt(null);
      setParsed(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-chef-800">Scan Receipt</h2>
      <p className="text-sage-600 text-sm">
        Take a photo of your grocery receipt to automatically add items to your pantry. This is the fastest way to get started!
      </p>

      {!parsed ? (
        <div className="space-y-4">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="btn-primary w-full"
          >
            {scanning ? 'Scanning with AI...' : (
              <><Camera size={20} /> Take Photo / Upload Receipt</>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="card text-center py-6 border-dashed border-2 border-sage-200">
            <Upload className="mx-auto text-sage-300 mb-2" size={32} />
            <p className="text-sm text-sage-500">Snap your receipt when you get home from the store</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card bg-chef-50 border-chef-200">
            <h3 className="font-semibold">{parsed.store_name || 'Receipt'}</h3>
            <p className="text-sm text-sage-600">
              {parsed.date} · ${parsed.total?.toFixed(2) || '0.00'} · {parsed.items.length} items
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-sage-600">Verify items — tap to edit later in pantry</h3>
            {parsed.items.map((item, idx) => (
              <div key={idx} className="card flex justify-between items-center py-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-sage-500">{item.quantity} {item.unit} · {item.location}</p>
                </div>
                {item.price != null && <span className="text-sm text-sage-600">${item.price.toFixed(2)}</span>}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setParsed(null); setReceipt(null); }} className="btn-secondary flex-1">
              Retake
            </button>
            <button onClick={handleVerify} disabled={verifying} className="btn-primary flex-1">
              {verifying ? 'Adding...' : <><Check size={20} /> Confirm & Add</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
