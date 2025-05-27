
export type ExamType = "test" | "written" | "oral";

export interface PredictedQuestion {
  questionText: string;
  options?: string[]; // Optional for written/oral
  correctAnswerIndex?: number; // Optional for written/oral
  explanation?: string;
  questionType: ExamType; // To know how to render it
}

export interface AnalysisDetails {
  identifiedExamPatterns?: string;
  potentialFocusAreas?: string[];
}

export interface PredictedData extends AnalysisDetails {
  questions: PredictedQuestion[];
  analysisSummary: string;
  recurringThemes: string[];
  timestamp: number;
  originalDocumentContent?: string;
  requestedNumberOfQuestions?: number;
  examType: ExamType; // Added to know what type of exam was generated
}

export interface AIExplanation {
  question: string;
  explanation: string;
  topic: string;
}

export interface ExamConfig {
  defaultNumberOfQuestions: number;
  defaultExamType: ExamType;
}
