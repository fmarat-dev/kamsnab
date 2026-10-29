"use client";

import { useEffect, useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

const TABS_ANCHOR = "product-tabs";
const OPEN_TAB_EVENT = "kamsnab:open-product-tab";

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  // Открыть вкладку снаружи: ссылка «Все характеристики →» или #parameters в URL.
  useEffect(() => {
    const ids = new Set(tabs.map((tab) => tab.id));
    const fromHash = window.location.hash.slice(1);
    if (ids.has(fromHash)) setActiveId(fromHash);

    function onOpen(event: Event) {
      const id = (event as CustomEvent<string>).detail;
      if (ids.has(id)) setActiveId(id);
    }
    window.addEventListener(OPEN_TAB_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TAB_EVENT, onOpen);
  }, [tabs]);

  return (
    <div id={TABS_ANCHOR} className="flex scroll-mt-4 flex-col gap-6">
      <div role="tablist" aria-label="Информация о товаре" className="-mx-4 flex overflow-x-auto border-b border-ink-100 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const selected = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={`-mb-px min-h-[2.75rem] shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold uppercase tracking-caps transition-colors ${
                selected ? "border-brand-600 text-ink-800" : "border-transparent text-ink-400 hover:text-ink-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`tabpanel-${active?.id}`} aria-labelledby={`tab-${active?.id}`}>
        {active?.content}
      </div>
    </div>
  );
}

// Ссылка, которая открывает вкладку и прокручивает к ней (без JS — просто якорь).
export function ProductTabLink({ tab, children, className }: { tab: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={`#${TABS_ANCHOR}`}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_TAB_EVENT, { detail: tab }))}
      className={className}
    >
      {children}
    </a>
  );
}
