"use client";

import { useState } from "react";
import { Modal, buttonClassName, type ButtonSize, type ButtonVariant } from "@kamsnab/ui";
import { ContactLeadForm } from "@/app/contacts/ContactLeadForm";

// Кнопка «Получить консультацию»: открывает ту же форму заявки, что и
// «Оставить заявку» в шапке (без JS — ссылка на /contacts).
export function ConsultButton({
  label = "Получить консультацию",
  variant = "outline",
  size = "lg",
  className = ""
}: {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <a
        href="/contacts"
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
        className={`${buttonClassName(variant, size)} ${className}`}
      >
        {label}
      </a>
      <Modal open={open} onClose={() => setOpen(false)} title="Получить консультацию">
        <ContactLeadForm />
      </Modal>
    </>
  );
}
