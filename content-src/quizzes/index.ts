import type { Quiz } from "../types";
import { k8sQuizzes } from "./k8s";
import { baseQuizzes } from "./base";
import { networkQuizzes } from "./network";
import { storageQuizzes } from "./storage";
import { aiQuizzes } from "./ai";
import { servicesQuizzes } from "./services";

/** 测验注册表 — 构建时校验 lessonId 并拆分客户端/服务端产物 */
export const QUIZZES: Quiz[] = [
  ...k8sQuizzes,
  ...baseQuizzes,
  ...networkQuizzes,
  ...storageQuizzes,
  ...aiQuizzes,
  ...servicesQuizzes,
];
