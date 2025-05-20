export interface PredictedData {
  questions: string[];
  analysisSummary: string;
  recurringThemes: string[];
  timestamp: number; // To potentially expire old data
}

export interface AIExplanation {
  question: string;
  explanation: string;
  topic: string;
}
