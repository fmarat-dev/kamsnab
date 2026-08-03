import { ImageResponse } from "next/og";
import { siteName } from "@/lib/site";

export const alt = "КАМСНАБ — складская техника и погрузчики";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          backgroundColor: "#1b2a3a",
          color: "#ffffff",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 44 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 84,
              height: 84,
              borderRadius: 18,
              backgroundColor: "#2980b9",
              fontSize: 46,
              fontWeight: 700
            }}
          >
            К
          </div>
          <div style={{ fontSize: 58, fontWeight: 800 }}>{siteName}</div>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#c7d2dd", maxWidth: 920 }}>
          Складская техника и погрузчики: продажа, доставка по всей России
        </div>
      </div>
    ),
    { ...size }
  );
}
