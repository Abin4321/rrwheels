import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { Upload, X, Check, Loader2, AlertTriangle } from 'lucide-react';

const REQUIRED_HEADERS = ['Code', 'Category', 'Description', 'Price'];

function cleanPrice(raw) {
  if (typeof raw === 'number') return raw;
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^\d.]/g, '');
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? 0 : value;
}

export default function ExcelUpload({ onUploaded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | parsing | previewing | uploading | done | error
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const resetState = () => {
    setRows([]);
    setFileName('');
    setStatus('idle');
    setError('');
  };

  const parseFile = (file) => {
    setStatus('parsing');
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (raw.length === 0) {
          setError('That sheet has no rows.');
          setStatus('error');
          return;
        }

        const missingHeaders = REQUIRED_HEADERS.filter((h) => !(h in raw[0]));
        if (missingHeaders.length > 0) {
          setError(`Missing expected column(s): ${missingHeaders.join(', ')}`);
          setStatus('error');
          return;
        }

        const cleaned = raw
          .map((row) => ({
            code: String(row.Code ?? '').trim(),
            category: String(row.Category ?? '').trim() || 'Uncategorized',
            description: String(row.Description ?? '').trim(),
            price: cleanPrice(row.Price),
          }))
          .filter((row) => row.code);

        setRows(cleaned);
        setStatus('previewing');
      } catch (err) {
        console.error(err);
        setError('Could not read that file. Is it a valid .xlsx or .csv?');
        setStatus('error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleUpload = async () => {
    setStatus('uploading');
    setError('');

    // Upsert by `code`: updates category/description/price for existing
    // codes without touching stock_quantity (that column isn't in the
    // payload), and inserts new codes with the table's default stock (0).
    const { error: upsertError } = await supabase
      .from('inventory')
      .upsert(rows, { onConflict: 'code', ignoreDuplicates: false });

    if (upsertError) {
      console.error(upsertError);
      setError(upsertError.message);
      setStatus('error');
      return;
    }

    setStatus('done');
    onUploaded?.();
    setTimeout(() => {
      setIsOpen(false);
      resetState();
    }, 1200);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg px-3.5 py-2 transition-all active:scale-[0.98]"
      >
        <Upload className="w-4 h-4" />
        Upload stock sheet
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#15171C] border border-[#272A32] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col card-enter">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#272A32]">
          <h3 className="text-sm font-semibold text-white">Upload stock sheet</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              resetState();
            }}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {status === 'idle' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-12 cursor-pointer transition-colors ${
                isDragging
                  ? 'border-orange-600 bg-orange-600/5'
                  : 'border-[#2E3138] hover:border-neutral-600'
              }`}
            >
              <Upload className="w-6 h-6 text-neutral-500" />
              <p className="text-sm text-neutral-400">
                Drag a .xlsx or .csv file here, or click to browse
              </p>
              <p className="text-xs text-neutral-600">
                Expects columns: Code, Category, Description, Price
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {status === 'parsing' && (
            <div className="flex items-center justify-center gap-2 py-12 text-neutral-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading {fileName}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/60 text-red-300 text-sm rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={resetState}
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                Try a different file
              </button>
            </div>
          )}

          {status === 'previewing' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                {rows.length} row{rows.length !== 1 ? 's' : ''} parsed from {fileName}.
                Existing stock quantities won't be touched.
              </p>
              <div className="border border-[#272A32] rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#1B1E24] text-neutral-400 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">Code</th>
                        <th className="text-left px-3 py-2">Category</th>
                        <th className="text-left px-3 py-2">Description</th>
                        <th className="text-right px-3 py-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-t border-[#272A32]">
                          <td className="px-3 py-1.5 text-neutral-300">{row.code}</td>
                          <td className="px-3 py-1.5 text-neutral-400">{row.category}</td>
                          <td className="px-3 py-1.5 text-neutral-300 truncate max-w-[160px]">
                            {row.description}
                          </td>
                          <td className="px-3 py-1.5 text-right text-orange-400">
                            ₹{row.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {rows.length > 50 && (
                <p className="text-xs text-neutral-600">
                  Showing first 50 of {rows.length} rows.
                </p>
              )}
            </div>
          )}

          {status === 'uploading' && (
            <div className="flex items-center justify-center gap-2 py-12 text-neutral-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing {rows.length} rows to Supabase
            </div>
          )}

          {status === 'done' && (
            <div className="flex items-center justify-center gap-2 py-12 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              Inventory updated
            </div>
          )}
        </div>

        {status === 'previewing' && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#272A32]">
            <button
              onClick={resetState}
              className="text-sm text-neutral-400 hover:text-white px-3 py-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all active:scale-[0.98]"
            >
              Confirm upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}