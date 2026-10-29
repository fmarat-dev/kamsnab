// Общий дизайн-токены КАМСНАБ: используется как Tailwind preset во всех
// фронтах (сайт, Telegram mini app, Max mini app), чтобы визуально совпадали.
//
// Синий — цвет из текущего логотипа (сохраняем бренд), красный — акцент для
// CTA/кнопок заявки (уже использовался на старом сайте), whatsapp — служебный
// брендированный цвет мессенджера, не подлежит переосмыслению.
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6fc",
          100: "#d6eaf6",
          200: "#aed4ed",
          300: "#7fb9e0",
          400: "#529dd2",
          500: "#3498db",
          600: "#2980b9",
          700: "#20638f",
          800: "#194c6d",
          900: "#123650"
        },
        accent: {
          50: "#fdedec",
          100: "#fad7d3",
          200: "#f5aca4",
          300: "#f08074",
          400: "#eb6153",
          500: "#e74c3c",
          600: "#c0392b",
          700: "#992e22",
          800: "#73231a",
          900: "#4d1811"
        },
        ink: {
          50: "#f4f6f8",
          100: "#e6eaee",
          200: "#c3ccd4",
          300: "#94a2b0",
          400: "#5f7180",
          500: "#3e5164",
          600: "#34495e",
          700: "#2c3e50",
          800: "#1e2c39",
          900: "#121b23"
        },
        whatsapp: {
          DEFAULT: "#25D366",
          dark: "#128C7E"
        }
      },
      // Шрифты подключает сайт через next/font (CSS-переменные на <html>).
      // var() с запасным значением: в мини-аппах переменных нет, и без запасного
      // значения вся декларация font-family стала бы невалидной (откат к serif).
      fontFamily: {
        sans: [
          "var(--font-inter, Inter)",
          "Inter",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        // Заголовки, логотип, цены, крупные цифры — Oswald, ВЕРХНИЙ регистр.
        display: ["var(--font-oswald, Oswald)", "Oswald", "Inter", "sans-serif"]
      },
      fontSize: {
        // Типографическая шкала (стиль C). Заголовки — font-display uppercase.
        display: ["3.625rem", { lineHeight: "1.04", letterSpacing: "0.01em", fontWeight: "700" }],
        h1: ["2.25rem", { lineHeight: "1.1", fontWeight: "700" }],
        h2: ["2.375rem", { lineHeight: "1.1", fontWeight: "700" }],
        h3: ["1.1875rem", { lineHeight: "1.25", fontWeight: "600" }],
        price: ["1.75rem", { lineHeight: "1.1", fontWeight: "600" }]
      },
      letterSpacing: {
        // Кнопки/навигация — caps; надзаголовки и бейджи — label; логотип — logo.
        caps: "0.05em",
        logo: "0.06em",
        label: "0.08em",
        eyebrow: "0.14em"
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem",
        tile: "0.5rem",
        showcase: "1rem"
      },
      boxShadow: {
        card: "0 1px 2px rgba(30, 44, 57, 0.04)",
        "card-hover": "0 12px 32px rgba(30, 44, 57, 0.10)",
        raised: "0 8px 24px rgba(30, 44, 57, 0.08)",
        "bar-top": "0 -8px 24px rgba(30, 44, 57, 0.08)"
      }
    }
  }
};
