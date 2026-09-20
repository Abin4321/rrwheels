import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ExcelUpload({ onUploadSuccess }) {
  const [previewData, setPreviewData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Clean and parse numeric currency/price strings
  const cleanPrice = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const sanitized = String(val).replace(/[^0-9.-]+/g, '');
    return parseFloat(sanitized) || 0;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // Convert sheet to raw array of JSON objects
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        // Normalize matching column names flexibly
        const parsedRows = rawJson.map((row) => {
          const code = row['Code'] || row['code'] || row['Item Code'] || '';
          const description = row['Description'] || row['description'] || '';
          const serialNumber = row['Serial Number'] || row['serial_number'] || row['Serial'] || '';
          const rawPrice = row['Selling Price'] || row['selling_price'] || row['Price'] || 0;

          return {
            item_code: String(code).trim(),
            description: String(description).trim(),
            serial_number: String(serialNumber).trim(),
            selling_price: cleanPrice(rawPrice)
          };
        }).filter(item => item.item_code && item.description);

        if (parsedRows.length === 0) {
          setStatusMessage({ type: 'error', text: 'No valid rows found. Ensure headers are Code, Description, Serial Number, Selling Price.' });
          return;
        }

        setPreviewData(parsedRows);
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Failed to read Excel file: ' + err.message });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSyncToSupabase = async () => {
    if (previewData.length === 0) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      // Upsert: Updates price/description if item_code exists, inserts if new.
      const { error } = await supabase
        .from('inventory')
        .upsert(previewData, { 
          onConflict: 'item_code',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      setStatusMessage({ 
        type: 'success', 
        text: `Successfully synced ${previewData.length} items to database!` 
      });
      setPreviewData([]);
      setFileName('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Supabase sync failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mb-6">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Bulk Stock / Price Update</h3>
      <p className="text-sm text-slate-500 mb-4">
        Upload distributor Excel files containing columns: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Code</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Description</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Serial Number</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Selling Price</code>.
      </p>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-6 text-center transition-colors cursor-pointer bg-slate-50 relative">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-700">
          {fileName ? fileName : 'Click or drag Excel sheet here'}
        </p>
        <p className="text-xs text-slate-400 mt-1">Supports .xlsx and .xls</p>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {statusMessage.text}
        </div>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">
              Previewing {previewData.length} items to update
            </span>
            <button
              onClick={handleSyncToSupabase}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm & Sync to Database
            </button>
          </div>

          <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase sticky top-0">
                <tr>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Serial</th>
                  <th className="p-2.5 text-right">Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewData.slice(0, 15).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-medium text-slate-800">{row.item_code}</td>
                    <td className="p-2.5 font-medium">{row.description}</td>
                    <td className="p-2.5 text-slate-500">{row.serial_number || '—'}</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-600">₹{row.selling_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 15 && (
              <div className="text-center py-2 text-xs text-slate-400 bg-slate-50">
                Showing first 15 of {previewData.length} items
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}