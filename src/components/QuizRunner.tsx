/**
 * 课后测验组件 — 渲染题面、收集作答、服务端判分。
 */
import { useMemo, useState } from "react";
import quizzesClientJson from "../content/generated/quiz-questions.json";
import { submitQuiz, type SubmitQuizResult } from "../server/progress";
import type { QuizQuestion } from "../../content-src/types";

interface ClientQuiz {
  id: string;
  lessonId: string;
  title: string;
  questions: {
    type: QuizQuestion["type"];
    prompt: string;
    options?: { id: string; text: string }[];
    items?: string[];
  }[];
}

const ALL_QUIZZES = quizzesClientJson as unknown as ClientQuiz[];

export function QuizRunner({
  quizIds,
  lessonId,
}: {
  quizIds: string[];
  lessonId: string;
}) {
  const quizzes = useMemo(
    () => ALL_QUIZZES.filter((q) => quizIds.includes(q.id)),
    [quizIds],
  );
  if (!quizzes.length) return null;

  return (
    <div className="space-y-10">
      {quizzes.map((quiz) => (
        <SingleQuiz key={quiz.id} quiz={quiz} lessonId={lessonId} />
      ))}
    </div>
  );
}

function SingleQuiz({ quiz, lessonId }: { quiz: ClientQuiz; lessonId: string }) {
  const [responses, setResponses] = useState<Record<number, Record<string, unknown>>>({});
  const [result, setResult] = useState<SubmitQuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredAll = quiz.questions.every((_, i) => {
    const r = responses[i];
    if (!r) return false;
    switch (quiz.questions[i].type) {
      case "single":
        return typeof r.single === "string";
      case "multiple":
        return Array.isArray(r.multiple) && r.multiple.length > 0;
      case "truefalse":
        return typeof r.truefalse === "boolean";
      case "order":
        return Array.isArray(r.order) && r.order.length === quiz.questions[i].items?.length;
      case "fill":
        return typeof r.fill === "string" && r.fill.trim().length > 0;
    }
  });

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitQuiz({
        data: {
          quizId: quiz.id,
          lessonId,
          responses: quiz.questions.map((_, i) => responses[i] ?? {}),
        },
      });
      setResult(res);
    } catch (e) {
      setError((e as Error).message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setResult(null);
    setResponses({});
  }

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{quiz.title}</h3>
        {result && (
          <span
            className={`font-mono text-sm ${
              result.score >= 80 ? "text-success" : result.score >= 60 ? "text-warning" : "text-error"
            }`}
          >
            {result.score} 分 · {result.correctCount}/{result.total}
          </span>
        )}
      </div>

      <ol className="mt-5 space-y-7">
        {quiz.questions.map((question, qi) => (
          <li key={qi}>
            <p className="font-medium">
              <span className="mr-2 font-mono text-sm text-mute">{qi + 1}.</span>
              {question.prompt}
            </p>
            <div className="mt-3">
              <QuestionInput
                question={question}
                index={qi}
                disabled={result != null}
                value={responses[qi] ?? {}}
                correct={result?.perQuestion[qi]?.correct}
                onChange={(v) =>
                  setResponses((prev) => ({ ...prev, [qi]: { ...prev[qi], ...v } }))
                }
              />
            </div>
            {result && (
              <p
                className={`mt-2 rounded-md px-3 py-2 text-sm ${
                  result.perQuestion[qi]?.correct
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {result.perQuestion[qi]?.correct ? "✓ 正确。" : "✗ "}
                {result.perQuestion[qi]?.explanation ?? ""}
              </p>
            )}
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        {!result ? (
          <button
            type="button"
            disabled={!answeredAll || submitting}
            onClick={() => void handleSubmit()}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "判分中…" : "提交答案"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full border border-hairline-strong px-5 py-2 text-sm font-medium transition-colors hover:bg-canvas-soft-2"
          >
            再做一次
          </button>
        )}
        {!result && !answeredAll && (
          <span className="text-xs text-mute">回答全部题目后可提交</span>
        )}
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  index,
  disabled,
  value,
  correct,
  onChange,
}: {
  question: ClientQuiz["questions"][number];
  index: number;
  disabled: boolean;
  value: Record<string, unknown>;
  correct: boolean | undefined;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const namePrefix = `q-${index}`;

  if (question.type === "single") {
    return (
      <div className="space-y-2">
        {question.options!.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors ${
              value.single === opt.id
                ? "border-k8s bg-k8s-soft"
                : "border-hairline hover:border-hairline-strong"
            } ${disabled ? "cursor-default opacity-90" : ""}`}
          >
            <input
              type="radio"
              name={namePrefix}
              className="accent-[var(--color-k8s)]"
              disabled={disabled}
              checked={value.single === opt.id}
              onChange={() => onChange({ single: opt.id })}
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multiple") {
    const selected = (value.multiple as string[]) ?? [];
    return (
      <div className="space-y-2">
        {question.options!.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors ${
              selected.includes(opt.id)
                ? "border-k8s bg-k8s-soft"
                : "border-hairline hover:border-hairline-strong"
            } ${disabled ? "cursor-default opacity-90" : ""}`}
          >
            <input
              type="checkbox"
              className="accent-[var(--color-k8s)]"
              disabled={disabled}
              checked={selected.includes(opt.id)}
              onChange={(e) =>
                onChange({
                  multiple: e.target.checked
                    ? [...selected, opt.id]
                    : selected.filter((x) => x !== opt.id),
                })
              }
            />
            <span>{opt.text}</span>
          </label>
        ))}
        <p className="text-xs text-mute">多选</p>
      </div>
    );
  }

  if (question.type === "truefalse") {
    return (
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ truefalse: v })}
            className={`rounded-md border px-4 py-1.5 text-sm transition-colors ${
              value.truefalse === v
                ? "border-k8s bg-k8s-soft text-k8s-bright"
                : "border-hairline hover:border-hairline-strong"
            }`}
          >
            {v ? "正确" : "错误"}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "order") {
    const ordered = (value.order as string[]) ?? [];
    const remaining = question.items!.filter((x) => !ordered.includes(x));
    return (
      <OrderInput
        namePrefix={namePrefix}
        ordered={ordered}
        remaining={remaining}
        correct={correct}
        disabled={disabled}
        onChange={(order) => onChange({ order })}
      />
    );
  }

  // fill
  return (
    <input
      type="text"
      disabled={disabled}
      value={(value.fill as string) ?? ""}
      onChange={(e) => onChange({ fill: e.target.value })}
      placeholder="输入答案…"
      className={`h-10 w-full max-w-md rounded-sm border bg-canvas px-3 text-sm outline-none transition-colors placeholder:text-mute ${
        correct === undefined ? "border-hairline focus:border-k8s" : correct ? "border-success" : "border-error"
      }`}
    />
  );
}

/** 排序题：点击候选 → 加入序列；点击已排项 → 移回候选 */
function OrderInput({
  namePrefix,
  ordered,
  remaining,
  correct,
  disabled,
  onChange,
}: {
  namePrefix: string;
  ordered: string[];
  remaining: string[];
  correct: boolean | undefined;
  disabled: boolean;
  onChange: (order: string[]) => void;
}) {
  return (
    <div data-name={namePrefix} className="space-y-3">
      <div className="space-y-1.5">
        {ordered.map((item, i) => (
          <button
            key={item}
            type="button"
            disabled={disabled}
            onClick={() => onChange(ordered.filter((x) => x !== item))}
            className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors ${
              correct === undefined
                ? "border-k8s bg-k8s-soft"
                : correct
                  ? "border-success bg-success/10"
                  : "border-error bg-error/10"
            }`}
          >
            <span className="shrink-0 font-sans font-medium">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate">{item}</span>
            {!disabled && <span className="shrink-0 text-mute">移除</span>}
          </button>
        ))}
      </div>
      {remaining.length > 0 && (
        <div className="space-y-1.5">
          {remaining.map((item) => (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => onChange([...ordered, item])}
              className="w-full rounded-md border border-dashed border-hairline-strong px-3 py-2 text-left font-mono text-xs text-body transition-colors hover:border-k8s hover:text-ink"
            >
              + {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
