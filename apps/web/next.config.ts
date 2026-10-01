import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Formatos modernos primeiro: menos bytes pro mesmo recurso quando o
    // next/image for usado (a otimização escolhe o melhor suportado).
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
