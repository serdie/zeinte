
export type ExamType = "test"; // Simplified to only "test" for now

export interface PredictedQuestion {
  questionText: string;
  options: string[]; // No longer optional
  correctAnswerIndex: number; // No longer optional
  explanation?: string;
  // questionType: ExamType; // Removed
}

export interface AnalysisDetails {
  identifiedExamPatterns?: string;
  potentialFocusAreas?: string[];
}

export interface PredictedData extends AnalysisDetails {
  id: number; // Unique ID for the exam, usually a timestamp as a number
  title: string; // A title for the exam to show in the history list
  questions: PredictedQuestion[];
  analysisSummary: string;
  recurringThemes: string[];
  timestamp: number;
  originalDocumentContent?: string;
  requestedNumberOfQuestions?: number;
  // examType: ExamType; // Removed
}

export interface AIExplanation {
  question: string;
  explanation: string;
  topic: string;
}

export interface ExamConfig {
  defaultNumberOfQuestions: number;
  // defaultExamType: ExamType; // Removed
}
