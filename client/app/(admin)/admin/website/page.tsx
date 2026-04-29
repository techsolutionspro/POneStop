'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components/website-builder/block-renderer';
import { BlockEditor } from '@/components/website-builder/block-editor';
import { BlockData, BlockType, BLOCK_TEMPLATES, TEMPLATES, SiteConfig } from '@/components/website-builder/types';
import {
  Eye, Edit3, Plus, GripVertical, Trash2, ChevronUp, ChevronDown,
  Monitor, Smartphone, Save, Undo2, Redo2, Globe, Palette, Layout,
} from 'lucide-react';

function generateId() { return Math.random().toString(36).substring(2, 9); }

export default function WebsiteBuilderPage() {
  const { user } = useAuthStore();
  const primaryColor = user?.tenant?.primaryColor || '#0d9488';
  const pharmacyName = user?.tenant?.name || 'My Pharmacy';

  const [blocks, setBlocks] = useState<BlockData[]>([
    { id: generateId(), type: 'hero', content: BLOCK_TEMPLATES.hero.defaultContent, order: 0 },
    { id: generateId(), type: 'services', content: BLOCK_TEMPLATES.services.defaultContent, order: 1 },
    { id: generateId(), type: 'about', content: BLOCK_TEMPLATES.about.defaultContent, order: 2 },
    { id: generateId(), type: 'testimonials', content: BLOCK_TEMPLATES.testimonials.defaultContent, order: 3 },
    { id: generateId(), type: 'faq', content: BLOCK_TEMPLATES.faq.defaultContent, order: 4 },
    { id: generateId(), type: 'cta', content: BLOCK_TEMPLATES.cta.defaultContent, order: 5 },
  ]);

  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [showTemplates, setShowTemplates] = useState(false);
  const [history, setHistory] = useState<BlockData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((newBlocks: BlockData[]) => {
    setHistory(h => [...h.slice(0, historyIndex + 1), newBlocks]);
    setHistoryIndex(i => i + 1);
  }, [historyIndex]);

  function addBlock(type: BlockType, afterIndex?: number) {
    const newBlock: BlockData = {
      id: generateId(),
      type,
      content: { ...BLOCK_TEMPLATES[type].defaultContent },
      order: afterIndex !== undefined ? afterIndex + 1 : blocks.length,
    };
    const newBlocks = [...blocks];
    if (afterIndex !== undefined) {
      newBlocks.splice(afterIndex + 1, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    const reordered = newBlocks.map((b, i) => ({ ...b, order: i }));
    setBlocks(reordered);
    pushHistory(reordered);
    setShowAddMenu(false);
  }

  function removeBlock(id: string) {
    const newBlocks = blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i }));
    setBlocks(newBlocks);
    pushHistory(newBlocks);
  }

  function moveBlock(id: string, direction: 'up' | 'down') {
    const index = blocks.findIndex(b => b.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;
    const newBlocks = [...blocks];
    const swap = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swap]] = [newBlocks[swap], newBlocks[index]];
    const reordered = newBlocks.map((b, i) => ({ ...b, order: i }));
    setBlocks(reordered);
    pushHistory(reordered);
  }

  function updateBlock(updated: BlockData) {
    const newBlocks = blocks.map(b => b.id === updated.id ? updated : b);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
  }

  function loadTemplate(templateId: string) {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const newBlocks = template.blocks.map((type, i) => ({
      id: generateId(), type, content: { ...BLOCK_TEMPLATES[type].defaultContent }, order: i,
    }));
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setShowTemplates(false);
  }

  function undo() {
    if (historyIndex <= 0) return;
    setHistoryIndex(i => i - 1);
    setBlocks(history[historyIndex - 1]);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(i => i + 1);
    setBlocks(history[historyIndex + 1]);
  }

  const blockTypes = Object.entries(BLOCK_TEMPLATES) as [BlockType, typeof BLOCK_TEMPLATES[BlockType]][];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}><Undo2 className="w-3.5 h-3.5" /></Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo2 className="w-3.5 h-3.5" /></Button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <Button variant={showTemplates ? 'primary' : 'outline'} size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            <Layout className="w-3.5 h-3.5" /> Templates
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddMenu(!showAddMenu)}>
            <Plus className="w-3.5 h-3.5" /> Add Block
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewport('desktop')} className={`p-1.5 rounded ${viewport === 'desktop' ? 'bg-white shadow-sm' : ''}`}>
              <Monitor className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => setViewport('mobile')} className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-white shadow-sm' : ''}`}>
              <Smartphone className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <Button variant={previewMode ? 'primary' : 'outline'} size="sm" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="w-3.5 h-3.5" /> {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button size="sm"><Save className="w-3.5 h-3.5" /> Publish</Button>
        </div>
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex-shrink-0">
          <div className="text-sm font-semibold mb-3">Start from a template</div>
          <div className="flex gap-3">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => loadTemplate(t.id)}
                className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-teal-400 hover:shadow-md transition-all flex-1">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-gray-500 mt-1">{t.description}</div>
                <div className="text-[10px] text-gray-400 mt-2">{t.blocks.length} blocks</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Block Menu */}
      {showAddMenu && (
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="text-sm font-semibold mb-3">Add a block</div>
          <div className="grid grid-cols-6 gap-2">
            {blockTypes.map(([type, template]) => (
              <button key={type} onClick={() => addBlock(type)}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center hover:border-teal-400 hover:bg-teal-50 transition-all">
                <div className="text-xs font-medium">{template.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
        <div className={`mx-auto bg-white shadow-lg rounded-xl overflow-hidden transition-all ${viewport === 'mobile' ? 'max-w-[375px]' : 'max-w-[1200px]'}`}>
          {/* Site header preview */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: primaryColor }}>
                {pharmacyName.charAt(0)}
              </div>
              <span className="font-semibold text-sm">{pharmacyName}</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Home</span><span>Services</span><span>About</span><span>Contact</span>
            </div>
          </div>

          {/* Blocks */}
          {blocks.sort((a, b) => a.order - b.order).map((block, index) => (
            <div key={block.id} className="relative group">
              {/* Block controls */}
              {!previewMode && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => moveBlock(block.id, 'up')} disabled={index === 0}
                    className="w-7 h-7 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-30">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-400 cursor-grab">
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => moveBlock(block.id, 'down')} disabled={index === blocks.length - 1}
                    className="w-7 h-7 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-30">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Block actions */}
              {!previewMode && (
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => setEditingBlock(block)}
                    className="p-1.5 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50">
                    <Edit3 className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <button onClick={() => removeBlock(block.id)}
                    className="p-1.5 bg-white border border-gray-200 rounded shadow-sm hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Add between blocks */}
              {!previewMode && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => { setShowAddMenu(false); /* inline add could go here */ }}
                    className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-teal-700">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <BlockRenderer
                block={block}
                primaryColor={primaryColor}
                pharmacyName={pharmacyName}
                isPreview={!previewMode}
                onEdit={() => setEditingBlock(block)}
              />
            </div>
          ))}

          {/* Footer preview */}
          <div className="bg-gray-900 text-gray-400 px-6 py-8 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-white font-semibold text-sm mb-2">{pharmacyName}</div>
                <div>GPhC: {user?.tenant?.slug || '1234567'}</div>
              </div>
              <div className="text-right">
                <div>&copy; 2026 {pharmacyName}</div>
                <div className="mt-1">Powered by Pharmacy One Stop</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block Editor Modal */}
      {editingBlock && (
        <BlockEditor block={editingBlock} onSave={updateBlock} onClose={() => setEditingBlock(null)} />
      )}
    </div>
  );
}
