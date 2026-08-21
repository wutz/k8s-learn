import manifestJson from "../content/generated/manifest.json";
import type { ContentManifest, LessonMeta, LearningPath } from "../../content-src/types";

export const manifest = manifestJson as unknown as ContentManifest;

const lessonMap = new Map<string, LessonMeta>();
for (const mod of manifest.modules) {
  for (const lesson of mod.lessons) {
    lessonMap.set(lesson.id, lesson);
  }
}

const moduleMap = new Map(manifest.modules.map((m) => [m.id, m]));

export function getModule(id: string) {
  return moduleMap.get(id as never);
}

export function getLesson(id: string): LessonMeta | undefined {
  return lessonMap.get(id);
}

export function getPath(id: string): LearningPath | undefined {
  return manifest.paths.find((p) => p.id === id);
}

/** 课程正文 URL（静态资源，带内容 hash 防缓存过期） */
export function lessonBodyUrl(lesson: { id: string; contentHash: string }): string {
  return `/content/lessons/${lesson.id}.html?v=${lesson.contentHash}`;
}

/** 全部课程（跨模块扁平列表，保持模块顺序） */
export function allLessons(): LessonMeta[] {
  return manifest.modules.flatMap((m) => m.lessons);
}
