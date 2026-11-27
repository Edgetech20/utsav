import { brandMark } from "@/lib/brandMark";

// Browser tab icon for the whole site (replaces the template favicon.ico)
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return brandMark(size.width);
}
