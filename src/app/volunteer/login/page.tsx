import { redirect } from "next/navigation";

// Old volunteer login — kept so links still work. Everything signs in at /login.
export default function VolunteerLoginRedirect() {
  redirect("/login");
}
