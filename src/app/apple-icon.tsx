import { brandMark } from "@/lib/brandMark";

// iOS home-screen icon — square; iOS applies its own rounded mask
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return brandMark(size.width, false);
}
