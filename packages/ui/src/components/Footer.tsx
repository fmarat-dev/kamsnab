export interface FooterProps {
  companyName: string;
  address: string;
  phone: string;
  phoneLandline?: string;
  email: string;
  workHours?: string;
}

export function Footer({ companyName, address, phone, phoneLandline, email, workHours }: FooterProps) {
  return (
    <footer className="border-t border-ink-100 bg-ink-700 py-10 text-ink-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm sm:flex-row sm:justify-between">
        <div>
          <p className="font-semibold text-white">{companyName}</p>
          <p className="mt-1 text-ink-200">{address}</p>
        </div>
        <div className="flex flex-col gap-1">
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hover:text-white">
            {phone}
          </a>
          {phoneLandline && (
            <a href={`tel:${phoneLandline.replace(/[^+\d]/g, "")}`} className="hover:text-white">
              {phoneLandline}
            </a>
          )}
          <a href={`mailto:${email}`} className="hover:text-white">
            {email}
          </a>
          {workHours && <span className="text-ink-300">{workHours}</span>}
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-6xl border-t border-ink-600 px-4 pt-4">
        <p className="text-xs text-ink-300">
          Обращаем ваше внимание на то, что вся представленная на сайте информация носит исключительно
          информационный характер и ни при каких условиях не является публичной офертой определяемой положениями
          Статьи 437(2) Гражданского кодекса Российской Федерации.
        </p>
        <a href="/pages/privacy" className="mt-2 inline-block text-xs text-ink-300 underline hover:text-white">
          Политика конфиденциальности
        </a>
      </div>
    </footer>
  );
}
