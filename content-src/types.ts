/** 内容模型 — 管线产物与前端共用 */

export type ModuleId =
  | "k8s"
  | "base"
  | "network"
  | "storage"
  | "ai"
  | "repo"
  | "o11y"
  | "compute"
  | "db"
  | "addons"
  | "os"
  | "security";

export interface TocSection {
  id: string;
  title: string;
  level: 2 | 3;
}

export interface LessonMeta {
  /** 全局唯一 id，如 "network/cilium"；URL 即 /lessons/<id> */
  id: string;
  moduleId: ModuleId;
  title: string;
  description?: string;
  readingMinutes: number;
  underConstruction: boolean;
  hasMermaid: boolean;
  sections: TocSection[];
  quizIds: string[];
  prevId: string | null;
  nextId: string | null;
  /** 参考库内相对路径（溯源用） */
  sourcePath: string;
  /** 内容 hash（8 位），用作缓存参数 */
  contentHash: string;
}

export interface ContentModule {
  id: ModuleId;
  title: string;
  description: string;
  order: number;
  lessons: LessonMeta[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  lessonIds: string[];
}

export interface ContentManifest {
  version: number;
  generatedAt: string;
  modules: ContentModule[];
  paths: LearningPath[];
  quizzes: { id: string; lessonId: string; title: string; questionCount: number }[];
}

/* ---------- 测验 ---------- */

export type QuizQuestion =
  | {
      type: "single";
      prompt: string;
      options: { id: string; text: string }[];
      answer: string;
      explanation?: string;
    }
  | {
      type: "multiple";
      prompt: string;
      options: { id: string; text: string }[];
      answers: string[];
      explanation?: string;
    }
  | { type: "truefalse"; prompt: string; answer: boolean; explanation?: string }
  | { type: "order"; prompt: string; items: string[]; explanation?: string }
  | {
      type: "fill";
      prompt: string;
      accepts: string[];
      caseSensitive?: boolean;
      explanation?: string;
    };

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
}
