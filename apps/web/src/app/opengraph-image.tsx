import { ImageResponse } from "next/og";

export const alt = "BRL Health — treino e nutrição que se falam";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0d0d1a",
          backgroundImage:
            "radial-gradient(60% 60% at 100% 0%, rgba(150,86,161,0.45) 0%, rgba(13,13,26,0) 60%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#9656a1",
            fontWeight: 700,
          }}
        >
          BRL Health
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 920,
          }}
        >
          Treino e nutrição que se falam.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 36,
            color: "#9aa0aa",
            maxWidth: 820,
          }}
        >
          Do objetivo à conquista — comece grátis.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontSize: 28,
            color: "#ff8906",
            fontWeight: 600,
          }}
        >
          brlhealth.com.br
        </div>
      </div>
    ),
    { ...size },
  );
}
