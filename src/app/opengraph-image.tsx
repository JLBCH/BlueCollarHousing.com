import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Default OpenGraph card (1200×630) for pages without their own image — this is
 * what shows when the site link is shared in a text/social preview. Uses the
 * real site logo (the header mark) on white, matching the top-left of the site.
 * The logo PNG is read from disk and inlined as a data URI so the card is
 * self-contained (next/og can't fetch relative assets at render time).
 */

export const alt = "BlueCollarHousing — Hotel Alternatives for those Working on the Road";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/header-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

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
          backgroundColor: "#ffffff",
          padding: 64,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={640}
          height={308}
          alt=""
          style={{ objectFit: "contain" }}
        />
        <div
          style={{
            width: 260,
            height: 8,
            marginTop: 12,
            backgroundColor: "#cf4715",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            marginTop: 28,
            maxWidth: 900,
            textAlign: "center",
            fontSize: 46,
            fontWeight: 600,
            color: "#13314f",
          }}
        >
          Hotel Alternatives for those Working on the Road
        </div>
      </div>
    ),
    { ...size },
  );
}
