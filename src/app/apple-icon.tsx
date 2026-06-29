import { ImageResponse } from "next/og";

// Ícone para a home screen do iOS (180x180). Fundo sólido da marca (a Apple
// arredonda os cantos sozinha) com o "B" em roxo.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            "radial-gradient(70% 70% at 50% 30%, rgba(150,86,161,0.45) 0%, rgba(13,13,26,0) 72%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "sans-serif",
            fontSize: 116,
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
