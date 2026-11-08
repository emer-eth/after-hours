import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the amber moon on the dark tile, same as the tab icon. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2a2414" }}>
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path fill="#f5b544" d="M44.8 38.4A15.6 15.6 0 0 1 24.8 18.4a15.6 15.6 0 1 0 20 20Z" />
        </svg>
      </div>
    ),
    size,
  );
}
