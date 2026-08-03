import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "NLA Fabrication — reproduction parts for the 1996–2000 Civic (EK/EJ) that the factory no longer makes";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07080a",
          // Volumetric glows, matching the site's .atmosphere layer.
          backgroundImage:
            "radial-gradient(60% 70% at 78% 0%, rgba(245,165,36,0.20), transparent 60%), radial-gradient(55% 65% at 5% 15%, rgba(91,157,217,0.16), transparent 60%)",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 14, height: 14, background: "#f5a524" }} />
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 4,
              color: "#a6acb4",
              textTransform: "uppercase",
            }}
          >
            EK · EJ · 1996–2000 Civic
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              lineHeight: 1.08,
              fontWeight: 600,
              color: "#edeef0",
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            The parts marked “No Longer Available.” Made available.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 28,
              color: "#a6acb4",
              maxWidth: 820,
            }}
          >
            Reverse-engineered interior components for the 96–00 Civic.
            Validated on the chassis. Produced to order.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #34383f",
            paddingTop: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 600,
              color: "#edeef0",
              letterSpacing: 1,
            }}
          >
            NLA<span style={{ color: "#f5a524", padding: "0 4px" }}>·</span>FABRICATION
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#7d848d", letterSpacing: 2 }}>
            REF 77540-S04-003ZA
          </div>
        </div>
      </div>
    ),
    size
  );
}
