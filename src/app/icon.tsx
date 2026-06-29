import { ImageResponse } from "next/og";

// Ícone dinâmico da marca: "B" da BRL em roxo sobre o fundo escuro da marca.
// 512x512 deixa o mesmo asset servir de favicon (escalado) e de ícone do PWA
// (inclusive maskable — o "B" fica centralizado, longe das bordas).
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d1a",
          backgroundImage:
            "radial-gradient(60% 60% at 50% 32%, rgba(150,86,161,0.40) 0%, rgba(13,13,26,0) 70%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "sans-serif",
            fontSize: 320,
            fontWeight: 800,
            lineHeight: 1,
            color: "#9656a1",
          }}
        >
          B
        </div>
      </div>
    ),
    { ...size },
  );
}
