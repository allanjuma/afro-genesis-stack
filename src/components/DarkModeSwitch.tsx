
import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const getPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const DarkModeSwitch = () => {
  const [dark, setDark] = useState(true); // Default to dark mode

  useEffect(() => {
    // Force dark mode on mount
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

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
      className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:bg-accent/50 transition-all duration-200 hover:shadow-glow"
      aria-label="Toggle dark mode"
      type="button"
    >
      {dark ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-purple-400" />
      )}
      <span className="hidden md:inline text-sm font-medium">{dark ? "Light" : "Dark"}</span>
    </button>
  );
};

export default DarkModeSwitch;
