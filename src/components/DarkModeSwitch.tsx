
import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const getPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const DarkModeSwitch = () => {
  const [dark, setDark] = useState(() => {
    // Prefer localStorage, else system
    const pref = localStorage.getItem("theme");
    if (pref === "dark") return true;
    if (pref === "light") return false;
    return getPrefersDark();
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="flex items-center gap-1 px-3 py-2 bg-primary/10 dark:bg-primary/20 rounded-lg hover:scale-110 transition shadow"
      aria-label="Toggle dark mode"
      type="button"
    >
      {dark ? (
        <Sun className="h-5 w-5 text-yellow-300" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-100" />
      )}
      <span className="hidden md:inline text-xs text-foreground dark:text-secondary-foreground">{dark ? "Light" : "Dark"}</span>
    </button>
  );
};

export default DarkModeSwitch;
