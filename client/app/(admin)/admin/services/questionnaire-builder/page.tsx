'use client';
import { useState, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Plus, Trash2, ChevronDown, AlertTriangle, GitBranch, Save, Code } from 'lucide-react';

// Types matching server questionnaire.service.ts
interface QuestionOption {
  value: string;
  label: string;
}

interface ShowIf {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'gt' | 'lt' | 'contains';
  value: any;
}

interface RedFlag {
  operator: 'equals' | 'gt' | 'lt';
  value: any;
  message: string;
}

interface Question {
  id: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: QuestionOption[];
  showIf?: ShowIf;
  redFlag?: RedFlag;
}

const QUESTION_TYPES: { value: Question['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'date', label: 'Date' },
];

const OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'contains', label: 'contains' },
];

const FLAG_OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
];

let nextId = 1;
function generateId() {
  return `q_${Date.now()}_${nextId++}`;
}

export default function QuestionnaireBuilderPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  function addQuestion(type: Question['type'] = 'text') {
    setQuestions(prev => [
      ...prev,
      {
        id: generateId(),
        type,
        label: '',
        required: false,
        placeholder: '',
        options: type === 'select' || type === 'multiselect' ? [{ value: '', label: '' }] : undefined,
      },
    ]);
    setSaved(false);
  }

  function updateQuestion(index: number, updates: Partial<Question>) {
    setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, ...updates } : q)));
    setSaved(false);
  }

  function removeQuestion(index: number) {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function addOption(qIndex: number) {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: [...(q.options || []), { value: '', label: '' }] } : q
      )
    );
    setSaved(false);
  }

  function updateOption(qIndex: number, oIndex: number, field: 'value' | 'label', val: string) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const opts = [...(q.options || [])];
        opts[oIndex] = { ...opts[oIndex], [field]: val };
        return { ...q, options: opts };
      })
    );
    setSaved(false);
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return { ...q, options: (q.options || []).filter((_, j) => j !== oIndex) };
      })
    );
    setSaved(false);
  }

  function toggleCondition(index: number) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== index) return q;
        if (q.showIf) return { ...q, showIf: undefined };
        return { ...q, showIf: { questionId: '', operator: 'equals' as const, value: '' } };
      })
    );
    setSaved(false);
  }

  function updateCondition(index: number, updates: Partial<ShowIf>) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== index || !q.showIf) return q;
        return { ...q, showIf: { ...q.showIf, ...updates } };
      })
    );
    setSaved(false);
  }

  function toggleRedFlag(index: number) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== index) return q;
        if (q.redFlag) return { ...q, redFlag: undefined };
        return { ...q, redFlag: { operator: 'equals' as const, value: '', message: '' } };
      })
    );
    setSaved(false);
  }

  function updateRedFlag(index: number, updates: Partial<RedFlag>) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== index || !q.redFlag) return q;
        return { ...q, redFlag: { ...q.redFlag, ...updates } };
      })
    );
    setSaved(false);
  }

  // Drag and drop reorder
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setQuestions(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  function handleSave() {
    const schema = { version: '1.0', questions };
    // Output to console and copy to clipboard
    const json = JSON.stringify(schema, null, 2);
    navigator.clipboard?.writeText(json);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const schema = { version: '1.0', questions };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaire Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Design clinical questionnaires with branching logic and red flags</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" /> {saved ? 'Copied to clipboard!' : 'Save Schema'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Question Types */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><h3 className="text-sm font-semibold">Question Types</h3></CardHeader>
            <CardBody>
              <div className="space-y-2">
                {QUESTION_TYPES.map(qt => (
                  <button
                    key={qt.value}
                    onClick={() => addQuestion(qt.value)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all font-medium text-gray-700"
                  >
                    <Plus className="w-3 h-3 inline mr-1.5 text-teal-600" />
                    {qt.label}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Area - Questions */}
        <div className="lg:col-span-6 space-y-4">
          {questions.length === 0 && (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <Code className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">No questions yet</p>
                  <p className="text-xs text-gray-500 mt-1">Click a question type on the left to get started</p>
                </div>
              </CardBody>
            </Card>
          )}

          {questions.map((q, index) => (
            <div
              key={q.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e: React.DragEvent) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={dragIndex === index ? 'opacity-50' : ''}
            ><Card>
              <CardBody>
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab text-gray-400 hover:text-gray-600">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">#{index + 1}</span>
                    <input
                      value={q.label}
                      onChange={e => updateQuestion(index, { label: e.target.value })}
                      placeholder="Question label..."
                      className="flex-1 text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-teal-500 outline-none py-1 bg-transparent"
                    />
                    <button
                      onClick={() => removeQuestion(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Type + Required Row */}
                  <div className="flex items-center gap-3 ml-7">
                    <select
                      value={q.type}
                      onChange={e => {
                        const newType = e.target.value as Question['type'];
                        const updates: Partial<Question> = { type: newType };
                        if (newType === 'select' || newType === 'multiselect') {
                          updates.options = q.options?.length ? q.options : [{ value: '', label: '' }];
                        }
                        updateQuestion(index, updates);
                      }}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
                    >
                      {QUESTION_TYPES.map(qt => (
                        <option key={qt.value} value={qt.value}>{qt.label}</option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={e => updateQuestion(index, { required: e.target.checked })}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      Required
                    </label>

                    <input
                      value={q.placeholder || ''}
                      onChange={e => updateQuestion(index, { placeholder: e.target.value })}
                      placeholder="Placeholder text..."
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 bg-white"
                    />
                  </div>

                  {/* Options for select/multiselect */}
                  {(q.type === 'select' || q.type === 'multiselect') && (
                    <div className="ml-7 space-y-2">
                      <p className="text-xs font-medium text-gray-500">Options</p>
                      {(q.options || []).map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            value={opt.value}
                            onChange={e => updateOption(index, oIndex, 'value', e.target.value)}
                            placeholder="Value"
                            className="text-xs border border-gray-200 rounded px-2 py-1 w-28 bg-white"
                          />
                          <input
                            value={opt.label}
                            onChange={e => updateOption(index, oIndex, 'label', e.target.value)}
                            placeholder="Label"
                            className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 bg-white"
                          />
                          <button onClick={() => removeOption(index, oIndex)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addOption(index)} className="text-xs text-teal-600 font-medium hover:underline">
                        + Add option
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-7">
                    <button
                      onClick={() => toggleCondition(index)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        q.showIf ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <GitBranch className="w-3 h-3" /> {q.showIf ? 'Remove Condition' : 'Add Condition'}
                    </button>
                    <button
                      onClick={() => toggleRedFlag(index)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        q.redFlag ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" /> {q.redFlag ? 'Remove Red Flag' : 'Add Red Flag'}
                    </button>
                  </div>

                  {/* Condition Panel */}
                  {q.showIf && (
                    <div className="ml-7 p-3 bg-indigo-50 rounded-lg border border-indigo-200 space-y-2">
                      <p className="text-xs font-medium text-indigo-700">Show if:</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={q.showIf.questionId}
                          onChange={e => updateCondition(index, { questionId: e.target.value })}
                          className="text-xs border border-indigo-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="">Select question...</option>
                          {questions.filter((_, i) => i !== index).map(oq => (
                            <option key={oq.id} value={oq.id}>{oq.label || oq.id}</option>
                          ))}
                        </select>
                        <select
                          value={q.showIf.operator}
                          onChange={e => updateCondition(index, { operator: e.target.value as ShowIf['operator'] })}
                          className="text-xs border border-indigo-200 rounded px-2 py-1 bg-white"
                        >
                          {OPERATORS.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        <input
                          value={String(q.showIf.value)}
                          onChange={e => updateCondition(index, { value: e.target.value })}
                          placeholder="Value"
                          className="text-xs border border-indigo-200 rounded px-2 py-1 flex-1 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Red Flag Panel */}
                  {q.redFlag && (
                    <div className="ml-7 p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                      <p className="text-xs font-medium text-red-700">Red flag if answer:</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={q.redFlag.operator}
                          onChange={e => updateRedFlag(index, { operator: e.target.value as RedFlag['operator'] })}
                          className="text-xs border border-red-200 rounded px-2 py-1 bg-white"
                        >
                          {FLAG_OPERATORS.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        <input
                          value={String(q.redFlag.value)}
                          onChange={e => updateRedFlag(index, { value: e.target.value })}
                          placeholder="Value"
                          className="text-xs border border-red-200 rounded px-2 py-1 w-24 bg-white"
                        />
                        <input
                          value={q.redFlag.message}
                          onChange={e => updateRedFlag(index, { message: e.target.value })}
                          placeholder="Flag message..."
                          className="text-xs border border-red-200 rounded px-2 py-1 flex-1 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card></div>
          ))}

          <button
            onClick={() => addQuestion()}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Add Question
          </button>
        </div>

        {/* Right Panel - JSON Preview */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">JSON Preview</h3>
              <Code className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardBody>
              <pre className="text-[11px] text-gray-700 bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px] font-mono leading-relaxed">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
