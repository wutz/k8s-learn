import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("k8l-theme", next ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "切换到暗色" : "切换到亮色"}
      title={light ? "切换到暗色" : "切换到亮色"}
      className="rounded-full border border-hairline px-2.5 py-1.5 text-sm text-body transition-colors hover:border-hairline-strong hover:text-ink"
    >
      {light ? "☾" : "☀"}
    </button>
  );
}
