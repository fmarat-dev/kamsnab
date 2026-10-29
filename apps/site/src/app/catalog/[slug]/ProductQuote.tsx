"use client";

import { useState } from "react";
import { Modal, buttonClassName } from "@kamsnab/ui";
import { ProductLeadForm } from "./ProductLeadForm";

interface ProductQuoteProps {
  productId: string;
  productTitle: string;
  phone: string;
}

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

function PhoneIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

function QuoteModal({ open, onClose, productId, productTitle }: Omit<ProductQuoteProps, "phone"> & { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Запросить коммерческое предложение">
      <ProductLeadForm productId={productId} productTitle={productTitle} />
    </Modal>
  );
}

// Кнопки в правой колонке (десктоп).
export function ProductQuoteButtons({ productId, productTitle, phone }: ProductQuoteProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2.5">
      <button type="button" onClick={() => setOpen(true)} className={`${buttonClassName("accent", "lg")} w-full`}>
        Запросить КП
      </button>
      <a href={telHref(phone)} className={`${buttonClassName("outline", "lg")} w-full`}>
        <PhoneIcon />
        Позвонить {phone}
      </a>
      <QuoteModal open={open} onClose={() => setOpen(false)} productId={productId} productTitle={productTitle} />
    </div>
  );
}

// Липкая нижняя панель на мобильном (< lg).
export function ProductStickyBar({ productId, productTitle, phone }: ProductQuoteProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky bottom-0 z-30 flex gap-2.5 border-t border-ink-100 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-bar-top lg:hidden">
      <a
        href={telHref(phone)}
        aria-label={`Позвонить ${phone}`}
        className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-button border border-ink-200 text-ink-800"
      >
        <PhoneIcon />
      </a>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonClassName("accent", "lg")} flex-1`}>
        Запросить КП
      </button>
      <QuoteModal open={open} onClose={() => setOpen(false)} productId={productId} productTitle={productTitle} />
    </div>
  );
}
