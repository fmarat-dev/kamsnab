"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { buttonClassName } from "@kamsnab/ui";
import { submitLead } from "@/lib/leads";

const PHONE_LENGTH = 11;

// Короткая форма «Перезвоните мне» для синей полосы на главной. Та же заявка
// через /api/leads, что и у LeadForm (honeypot + время заполнения).
export function CallbackForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error" | "invalid-phone">("idle");
  const [phone, setPhone] = useState("");
  const renderedAt = useRef(Date.now());

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, PHONE_LENGTH);
    if (digits.length > 0 && !["7", "8"].includes(digits[0])) return;
    setPhone(digits);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    if (phone.length !== PHONE_LENGTH) {
      setStatus("invalid-phone");
      return;
    }
    const form = new FormData(formEl);
    setStatus("submitting");
    try {
      await submitLead({
        name: String(form.get("name") ?? "").trim(),
        phone,
        message: "Перезвоните мне: помощь с выбором техники",
        website: String(form.get("website") ?? ""),
        renderedAt: renderedAt.current
      });
      setStatus("done");
      formEl.reset();
      setPhone("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-card bg-white/10 p-4 text-white" role="status">
        Заявка отправлена — перезвоним в рабочее время.
      </p>
    );
  }

  const labelClass = "flex flex-1 basis-44 flex-col gap-1.5 text-xs font-semibold uppercase tracking-label text-brand-100";
  const inputClass =
    "min-h-[3.25rem] rounded-button border-0 bg-white px-4 text-base font-medium normal-case tracking-normal text-ink-800 outline-none placeholder:text-ink-300 focus-visible:ring-2 focus-visible:ring-brand-300";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className={labelClass}>
          Имя
          <input name="name" required autoComplete="name" placeholder="Как к вам обращаться" className={inputClass} />
        </label>
        <label className={labelClass}>
          Телефон
          <input
            name="phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={PHONE_LENGTH}
            placeholder="79991234567"
            value={phone}
            onChange={handlePhoneChange}
            className={inputClass}
          />
        </label>
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
          style={{ left: "-9999px" }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className={`${buttonClassName("accent", "lg")} w-full sm:w-auto`}
        >
          {status === "submitting" ? "Отправка..." : "Перезвоните мне"}
        </button>
      </div>
      {status === "invalid-phone" && (
        <p className="text-sm font-medium text-white" role="alert">
          Проверьте номер телефона — 11 цифр, начиная с 7 или 8.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm font-medium text-white" role="alert">
          Не удалось отправить, попробуйте ещё раз.
        </p>
      )}
      <p className="text-xs text-brand-100">
        Нажимая на кнопку, я принимаю{" "}
        <a href="/pages/privacy" className="underline hover:text-white">
          Политику обработки персональных данных
        </a>
        .
      </p>
    </form>
  );
}
