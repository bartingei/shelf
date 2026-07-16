import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shelf — A cinematic home for your PDFs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "90px",
          background: "#0e0d0c",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 34,
            color: "#d6b58f",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Premium reading experience
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 128,
            color: "#f4ede4",
            lineHeight: 1.05,
          }}
        >
          Shelf<span style={{ color: "#eecda3" }}>.</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 38,
            color: "#b9b0a4",
            maxWidth: 900,
          }}
        >
          A cinematic home for your PDFs.
        </div>
      </div>
    ),
    { ...size }
  );
}
