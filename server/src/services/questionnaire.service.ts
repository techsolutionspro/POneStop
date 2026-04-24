// Branching logic questionnaire engine
// Evaluates questionnaire schemas with conditional logic

export interface Question {
  id: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'file';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
  // Branching: only show this question if condition is met
  showIf?: { questionId: string; operator: 'equals' | 'not_equals' | 'gt' | 'lt' | 'contains'; value: any };
  // Red flag: if answer matches, flag for clinical attention
  redFlag?: { operator: 'equals' | 'gt' | 'lt'; value: any; message: string };
}

export interface QuestionnaireSchema {
  questions: Question[];
  version: string;
}

export interface QuestionnaireResult {
  answers: Record<string, any>;
  redFlags: { questionId: string; message: string }[];
  isEligible: boolean;
  completedAt: string;
}

export class QuestionnaireService {
  // Get visible questions based on current answers (branching logic)
  static getVisibleQuestions(schema: QuestionnaireSchema, answers: Record<string, any>): Question[] {
    return schema.questions.filter(q => {
      if (!q.showIf) return true;
      const { questionId, operator, value } = q.showIf;
      const answer = answers[questionId];
      if (answer === undefined) return false;

      switch (operator) {
        case 'equals': return answer === value;
        case 'not_equals': return answer !== value;
        case 'gt': return Number(answer) > Number(value);
        case 'lt': return Number(answer) < Number(value);
        case 'contains': return String(answer).toLowerCase().includes(String(value).toLowerCase());
        default: return true;
      }
    });
  }

  // Validate answers and check for red flags
  static evaluate(schema: QuestionnaireSchema, answers: Record<string, any>): QuestionnaireResult {
    const redFlags: { questionId: string; message: string }[] = [];
    let isEligible = true;

    const visibleQuestions = this.getVisibleQuestions(schema, answers);

    for (const q of visibleQuestions) {
      const answer = answers[q.id];

      // Required check
      if (q.required && (answer === undefined || answer === '' || answer === null)) {
        isEligible = false;
      }

      // Validation
      if (q.validation && answer !== undefined) {
        if (q.validation.min !== undefined && Number(answer) < q.validation.min) isEligible = false;
        if (q.validation.max !== undefined && Number(answer) > q.validation.max) isEligible = false;
      }

      // Red flag check
      if (q.redFlag && answer !== undefined) {
        const { operator, value, message } = q.redFlag;
        let flagged = false;
        switch (operator) {
          case 'equals': flagged = answer === value; break;
          case 'gt': flagged = Number(answer) > Number(value); break;
          case 'lt': flagged = Number(answer) < Number(value); break;
        }
        if (flagged) {
          redFlags.push({ questionId: q.id, message });
        }
      }
    }

    return { answers, redFlags, isEligible: isEligible && redFlags.length === 0, completedAt: new Date().toISOString() };
  }

  // Calculate BMI from height (cm) and weight (kg)
  static calculateBMI(heightCm: number, weightKg: number): { bmi: number; category: string } {
    const heightM = heightCm / 100;
    const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
    let category = 'Normal';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else if (bmi < 35) category = 'Obese Class I';
    else if (bmi < 40) category = 'Obese Class II';
    else category = 'Obese Class III';
    return { bmi, category };
  }

  // Weight management questionnaire template
  static getWeightManagementSchema(): QuestionnaireSchema {
    return {
      version: '1.0',
      questions: [
        { id: 'height', type: 'number', label: 'Height (cm)', required: true, validation: { min: 100, max: 250 } },
        { id: 'weight', type: 'number', label: 'Weight (kg)', required: true, validation: { min: 30, max: 300 } },
        { id: 'previous_glp1', type: 'boolean', label: 'Have you used GLP-1 medications (Wegovy, Mounjaro, Ozempic) before?', required: true },
        { id: 'previous_product', type: 'text', label: 'Which product and dose?', required: true, showIf: { questionId: 'previous_glp1', operator: 'equals', value: true } },
        { id: 'diabetes_type1', type: 'boolean', label: 'Do you have Type 1 diabetes?', required: true, redFlag: { operator: 'equals', value: true, message: 'Type 1 diabetes is a contraindication for GLP-1 agonists' } },
        { id: 'diabetes_type2', type: 'boolean', label: 'Do you have Type 2 diabetes?', required: true },
        { id: 'thyroid_cancer', type: 'boolean', label: 'Do you or any family member have a history of medullary thyroid carcinoma or MEN2?', required: true, redFlag: { operator: 'equals', value: true, message: 'MTC/MEN2 history is a contraindication' } },
        { id: 'pancreatitis', type: 'boolean', label: 'Have you ever had pancreatitis?', required: true, redFlag: { operator: 'equals', value: true, message: 'Pancreatitis history requires further assessment' } },
        { id: 'pregnant', type: 'boolean', label: 'Are you pregnant, planning pregnancy, or breastfeeding?', required: true, redFlag: { operator: 'equals', value: true, message: 'Pregnancy/breastfeeding is a contraindication' } },
        { id: 'medications', type: 'text', label: 'List all current medications', required: true },
        { id: 'allergies', type: 'text', label: 'Do you have any known allergies?', required: true },
        { id: 'bp_reading', type: 'text', label: 'Recent blood pressure reading (if known)', required: false },
        { id: 'kidney_disease', type: 'boolean', label: 'Do you have severe kidney disease (eGFR < 15)?', required: true, redFlag: { operator: 'equals', value: true, message: 'Severe renal impairment is a contraindication' } },
      ],
    };
  }
}
