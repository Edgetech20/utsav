import { redirect } from "next/navigation";

// Old admin login — kept so bookmarks and emails still work. Everything signs in at /login.
export default function AdminLoginRedirect() {
  redirect("/login");
}
