"use client";

import { useEffect, useState } from "react";

export function createSlugListStore(storageKey: string, changeEvent: string, limit?: number) {
  function read(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  function write(slugs: string[]) {
    window.localStorage.setItem(storageKey, JSON.stringify(slugs));
    window.dispatchEvent(new Event(changeEvent));
  }

  function toggle(slug: string): string[] {
    const current = read();
    const next = current.includes(slug)
      ? current.filter((item) => item !== slug)
      : limit != null && current.length >= limit
        ? current
        : [...current, slug];
    write(next);
    return next;
  }

  function remove(slug: string) {
    write(read().filter((item) => item !== slug));
  }

  function clear() {
    write([]);
  }

  function useSlugs(): string[] {
    const [slugs, setSlugs] = useState<string[]>([]);

    useEffect(() => {
      setSlugs(read());
      const handleChange = () => setSlugs(read());
      window.addEventListener(changeEvent, handleChange);
      window.addEventListener("storage", handleChange);
      return () => {
        window.removeEventListener(changeEvent, handleChange);
        window.removeEventListener("storage", handleChange);
      };
    }, []);

    return slugs;
  }

  return { toggle, remove, clear, useSlugs };
}
