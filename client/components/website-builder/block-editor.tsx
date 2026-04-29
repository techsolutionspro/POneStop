'use client';

import { useState } from 'react';
import { BlockData, BLOCK_TEMPLATES } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Trash2 } from 'lucide-react';

interface BlockEditorProps {
  block: BlockData;
  onSave: (block: BlockData) => void;
  onClose: () => void;
}

export function BlockEditor({ block, onSave, onClose }: BlockEditorProps) {
  const [content, setContent] = useState<Record<string, any>>({ ...block.content });
  const template = BLOCK_TEMPLATES[block.type];

  function updateField(key: string, value: any) {
    setContent(c => ({ ...c, [key]: value }));
  }

  function handleSave() {
    onSave({ ...block, content });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">Edit: {template.label}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Dynamic fields based on block type */}
          {Object.entries(template.defaultContent).map(([key, defaultValue]) => {
            const value = content[key] ?? defaultValue;

            // Boolean toggle
            if (typeof defaultValue === 'boolean') {
              return (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!value} onChange={e => updateField(key, e.target.checked)}
                    className="w-5 h-5 accent-teal-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">{formatLabel(key)}</span>
                </label>
              );
            }

            // Number
            if (typeof defaultValue === 'number') {
              return <Input key={key} label={formatLabel(key)} type="number" value={value} onChange={e => updateField(key, parseInt(e.target.value) || 0)} />;
            }

            // Array (items, members, reviews, images)
            if (Array.isArray(defaultValue)) {
              return (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{formatLabel(key)}</label>
                  <div className="space-y-2">
                    {(value as any[]).map((item: any, i: number) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          {typeof item === 'object' ? (
                            Object.entries(item).filter(([k]) => k !== 'imageUrl').map(([k, v]) => (
                              <input key={k} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder={formatLabel(k)} value={String(v || '')}
                                onChange={e => {
                                  const arr = [...value];
                                  arr[i] = { ...arr[i], [k]: e.target.value };
                                  updateField(key, arr);
                                }} />
                            ))
                          ) : (
                            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={String(item || '')}
                              onChange={e => { const arr = [...value]; arr[i] = e.target.value; updateField(key, arr); }} />
                          )}
                        </div>
                        <button onClick={() => updateField(key, (value as any[]).filter((_: any, j: number) => j !== i))}
                          className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newItem = Array.isArray(defaultValue) && defaultValue[0] && typeof defaultValue[0] === 'object'
                        ? { ...defaultValue[0] } : '';
                      updateField(key, [...(value || []), newItem]);
                    }} className="flex items-center gap-1 text-teal-600 text-sm font-medium hover:text-teal-700">
                      <Plus className="w-3.5 h-3.5" /> Add {formatLabel(key).replace(/s$/, '')}
                    </button>
                  </div>
                </div>
              );
            }

            // Long text
            if (key === 'text' || key === 'subheading' || key === 'answer') {
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">{formatLabel(key)}</label>
                  <textarea className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" rows={3}
                    value={value || ''} onChange={e => updateField(key, e.target.value)} />
                </div>
              );
            }

            // Default: text input
            return <Input key={key} label={formatLabel(key)} value={value || ''} onChange={e => updateField(key, e.target.value)} />;
          })}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/url$/i, 'URL');
}
