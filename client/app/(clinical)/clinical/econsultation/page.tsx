'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ChevronRight, ChevronLeft, AlertTriangle, Check, X } from 'lucide-react';

const SAMPLE_STEPS = [
  { id: 'eligibility', title: 'Patient Eligibility', description: 'Confirm patient meets inclusion criteria' },
  { id: 'history', title: 'Medical History', description: 'Review medications, allergies, conditions' },
  { id: 'vitals', title: 'Vital Signs', description: 'Record BMI, blood pressure, relevant measurements' },
  { id: 'contraindications', title: 'Contraindication Check', description: 'Screen for red flags and exclusion criteria' },
  { id: 'dose', title: 'Dose Selection', description: 'Select appropriate product and dose' },
  { id: 'counselling', title: 'Counselling Points', description: 'Discuss key information with patient' },
  { id: 'supply', title: 'Supply Decision', description: 'Confirm or refuse supply' },
  { id: 'record', title: 'Record & Sign', description: 'Complete consultation record with digital signature' },
];

export default function EConsultationPage() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [redFlag, setRedFlag] = useState(false);
  const [notes, setNotes] = useState('');
  const step = SAMPLE_STEPS[currentStep];
  const progress = ((currentStep + 1) / SAMPLE_STEPS.length) * 100;

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Patient sidebar */}
      <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <Avatar firstName="Laura" lastName="Wilson" color="indigo" />
            <div><div className="text-sm font-semibold">Laura Wilson</div><div className="text-xs text-gray-500">DOB: 08/11/1985 | F | 40 yrs</div></div>
          </div>
          <div className="text-xs text-gray-400">Booking #BK-4521 | Weight Management</div>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-2">Pre-Screen Answers</div>
          {[['BMI', '31.5'], ['Weight', '89 kg'], ['Height', '168 cm'], ['Previous GLP-1', 'No'], ['Medications', 'Sertraline 50mg'], ['Allergies', 'Penicillin']].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm py-1"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></div>
          ))}
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-2">PGD Reference</div>
          <div className="text-sm font-medium text-teal-700">Weight Management PGD v3.2</div>
          <div className="text-xs text-gray-500 mt-1">Products: Wegovy (0.25-2.4mg), Mounjaro (2.5-15mg)</div>
        </div>
        <div className="p-4">
          <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-2">Consultation Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full min-h-[100px] border border-gray-200 rounded-lg p-2 text-sm" placeholder="Add clinical notes..." />
        </div>
      </div>

      {/* Main eConsultation tool */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col">
        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Step {currentStep + 1} of {SAMPLE_STEPS.length}: {step.title}</div>
            <div className="text-xs text-gray-400">PGD v3.2 | Weight Management</div>
          </div>
          <div className="flex gap-1">{SAMPLE_STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i < currentStep ? 'bg-teal-500' : i === currentStep ? 'bg-teal-400' : 'bg-gray-200'}`} />
          ))}</div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
          <p className="text-sm text-gray-500 mb-6">{step.description}</p>

          {currentStep === 3 && ( // Contraindication step
            <>
              <div className="space-y-2">
                {['No contraindications identified', 'Personal/family history of medullary thyroid carcinoma (MTC)', 'Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)', 'History of pancreatitis', 'Pregnant, planning pregnancy, or breastfeeding', 'Type 1 diabetes', 'Severe renal impairment (eGFR <15)'].map((q, i) => (
                  <label key={i} className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all ${i === 0 && !redFlag ? 'border-teal-500 bg-teal-50' : redFlag && i > 0 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/50'}`}>
                    <input type={i === 0 ? 'radio' : 'checkbox'} name="contra" className="accent-teal-600 w-4 h-4" defaultChecked={i === 0} onChange={() => setRedFlag(i > 0)} />
                    <span className="text-sm">{q}</span>
                  </label>
                ))}
              </div>
              {redFlag && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div><h4 className="text-sm font-semibold text-red-700">RED FLAG: Contraindication Detected</h4><p className="text-sm text-red-600 mt-1">Supply under this PGD is not appropriate. Consider referral to GP or alternative treatment pathway.</p></div>
                </div>
              )}
            </>
          )}

          {currentStep === 4 && ( // Dose selection
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Product</label>
                <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                  <option>Wegovy (Semaglutide)</option>
                  <option>Mounjaro (Tirzepatide)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Dose</label>
                <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                  <option>0.25mg weekly (Starter)</option>
                  <option>0.5mg weekly</option>
                  <option>1mg weekly</option>
                  <option>1.7mg weekly</option>
                  <option>2.4mg weekly (Maintenance)</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>Dose escalation protocol:</strong> Start at 0.25mg weekly for 4 weeks, then escalate monthly as tolerated.
              </div>
            </div>
          )}

          {currentStep !== 3 && currentStep !== 4 && (
            <div className="space-y-3">
              {['Question 1 for this step', 'Question 2 for this step', 'Question 3 for this step'].map((q, i) => (
                <label key={i} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:border-teal-300 hover:bg-teal-50/50 transition-all">
                  <input type="radio" name={`step-${currentStep}`} className="accent-teal-600 w-4 h-4" />
                  <span className="text-sm">{q}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <Button variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep(s => s - 1)}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="text-red-600 border-red-200">
              <X className="w-4 h-4" /> Stop Supply
            </Button>
            {currentStep < SAMPLE_STEPS.length - 1 ? (
              <Button onClick={() => setCurrentStep(s => s + 1)}>
                Next: {SAMPLE_STEPS[currentStep + 1]?.title} <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="success">
                <Check className="w-4 h-4" /> Complete & Sign
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
