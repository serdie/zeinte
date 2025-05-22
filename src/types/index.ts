
export interface PredictedQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface AnalysisDetails {
  identifiedExamPatterns?: string; // Descripción de patrones de exámenes pasados, si se encuentran
  potentialFocusAreas?: string[]; // Áreas de enfoque deducidas, con énfasis en exámenes pasados
}

export interface PredictedData extends AnalysisDetails {
  questions: PredictedQuestion[];
  analysisSummary: string;
  recurringThemes: string[];
  timestamp: number;
  originalDocumentContent?: string;
  requestedNumberOfQuestions?: number;
}

export interface AIExplanation {
  question: string;
  explanation: string;
  topic: string;
}

export type ExamType = "test" | "written" | "oral";

export interface ExamConfig {
  defaultNumberOfQuestions: number;
  defaultExamType: ExamType;
}
