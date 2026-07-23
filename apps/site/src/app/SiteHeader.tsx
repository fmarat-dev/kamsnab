"use client";

import { useState } from "react";
import { Header, Modal, type HeaderProps } from "@kamsnab/ui";
import { ContactLeadForm } from "./contacts/ContactLeadForm";

type SiteHeaderProps = Omit<HeaderProps, "ctaLabel" | "onCtaClick" | "ctaHref">;

export function SiteHeader(props: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Header {...props} ctaLabel="Обратный звонок" onCtaClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)} title="Обратный звонок">
        <ContactLeadForm />
      </Modal>
    </>
  );
}
