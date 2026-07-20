"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

export interface LeadFormValues {
  name: string;
  phone: string;
  message?: string;
}

export interface LeadFormProps {
  productTitle?: string;
  submitLabel?: string;
  onSubmit: (values: LeadFormValues) => Promise<void> | void;
}

const PHONE_LENGTH = 11;
const PHONE_LEADING_DIGITS = ["7", "8"];

export function LeadForm({ productTitle, submitLabel = "Отправить заявку", onSubmit }: LeadFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error" | "invalid-phone">("idle");
  const [phone, setPhone] = useState("");

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, PHONE_LENGTH);
    if (digits.length > 0 && !PHONE_LEADING_DIGITS.includes(digits[0])) {
      return;
    }
    setPhone(digits);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Захватываем ссылку на форму синхронно: после await React обнуляет
    // event.currentTarget у синтетического события.
    const formEl = event.currentTarget;

    if (phone.length !== PHONE_LENGTH) {
      setStatus("invalid-phone");
      return;
    }

    const form = new FormData(formEl);
    const values: LeadFormValues = {
      name: String(form.get("name") ?? ""),
      phone,
      message: String(form.get("message") ?? "") || undefined
    };
    setStatus("submitting");
    try {
      await onSubmit(values);
      setStatus("done");
      formEl.reset();
      setPhone("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-card bg-brand-50 p-4 text-brand-700">
        Заявка отправлена, менеджер свяжется с вами в ближайшее время.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {productTitle && (
        <p className="text-sm text-ink-500">
          По товару: <span className="font-medium text-ink-700">{productTitle}</span>
        </p>
      )}
      <input
        name="name"
        required
        placeholder="Ваше имя"
        className="rounded-card border border-ink-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
      />
      <input
        name="phone"
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={PHONE_LENGTH}
        placeholder="Телефон"
        value={phone}
        onChange={handlePhoneChange}
        className="rounded-card border border-ink-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
      />
      <textarea
        name="message"
        placeholder="Комментарий (необязательно)"
        rows={3}
        className="rounded-card border border-ink-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-card bg-accent-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
      >
        {status === "submitting" ? "Отправка..." : submitLabel}
      </button>
      <p className="text-xs text-ink-400">
        Нажимая на кнопку, я принимаю{" "}
        <a href="/pages/privacy" className="underline hover:text-ink-600">
          Политику в области обработки и защиты персональных данных
        </a>{" "}
        и соглашаюсь получать сообщения.
      </p>
      {status === "error" && (
        <p className="text-sm text-accent-600">Не удалось отправить, попробуйте ещё раз.</p>
      )}
      {status === "invalid-phone" && (
        <p className="text-sm text-accent-600">
          Проверьте номер телефона — 11 цифр, начиная с 7 или 8.
        </p>
      )}
    </form>
  );
}
