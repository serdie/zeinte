
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
  id: string; // Unique ID for the exam, usually a timestamp as a string
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


// --- Custom Course Types ---

export interface CourseModule {
  title: string;
  content: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface DetailedCourse {
  id: string; // Unique ID for the course
  timestamp: number; // Creation timestamp
  courseTitleSuggestion: string;
  estimatedDuration: string;
  modules: CourseModule[];
  // Store the original input for context or re-generation
  originalInput: {
      courseTopic: string;
      courseLevel: "Principiante" | "Intermedio" | "Avanzado";
      courseGoals?: string;
      targetAudience?: string;
  }
}
