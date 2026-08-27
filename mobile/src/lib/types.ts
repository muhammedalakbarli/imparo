// Məzmun tipləri (webdən port, minimal).

export type TaskType = "multiple_choice" | "fill_blank" | "numeric" | "word_order" | "listening";

interface Base {
  id: string;
  type: TaskType;
  prompt: string;
  xp: number;
  speakOptions?: boolean;
}
export interface MultipleChoiceTask extends Base {
  type: "multiple_choice";
  options: string[];
  correctIndex: number;
}
export interface FillBlankTask extends Base {
  type: "fill_blank";
  accepted: string[];
}
export interface NumericTask extends Base {
  type: "numeric";
  answer: number;
  tolerance?: number;
}
export interface WordOrderTask extends Base {
  type: "word_order";
  words: string[];
  answer: string;
  translation?: string;
}
export interface ListeningTask extends Base {
  type: "listening";
  audioText: string;
  options: string[];
  correctIndex: number;
}
export type Task =
  | MultipleChoiceTask
  | FillBlankTask
  | NumericTask
  | WordOrderTask
  | ListeningTask;

export interface Lesson {
  id: string;
  title: string;
  intro?: string;
  tasks: Task[];
  bonusTasks?: Task[];
}
export interface Unit {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}
export interface Subject {
  slug: string;
  name: string;
  grade: number;
  icon: string;
  color?: string;
  units: Unit[];
}
