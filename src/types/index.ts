export interface PredictedQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface PredictedData {
  questions: PredictedQuestion[];
  analysisSummary: string;
  recurringThemes: string[];
  timestamp: number; // To potentially expire old data
}

export interface AIExplanation {
  question: string; // This is the main question text
  explanation: string;
  topic: string;
}

