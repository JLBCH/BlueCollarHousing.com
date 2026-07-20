import { ImageResponse } from "next/og";

/**
 * Default OpenGraph card (1200×630) for pages without their own image.
 * Self-contained: brand colors + system font stack, no external assets.
 */

export const alt = "BlueCollarHousing · Furnished housing minutes from the job";
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#13314f",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}
        >
          <span>BlueCollar</span>
          <span style={{ color: "#cf4715" }}>Housing</span>
        </div>
        <div
          style={{
            width: 220,
            height: 8,
            marginTop: 28,
            backgroundColor: "#cf4715",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            marginTop: 32,
            fontSize: 36,
            fontWeight: 500,
            color: "#c9d6e4",
          }}
        >
          Furnished housing minutes from the job
        </div>
      </div>
    ),
    { ...size },
  );
}
