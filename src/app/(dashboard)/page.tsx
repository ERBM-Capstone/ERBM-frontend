import { redirect } from "next/navigation";

// Start at login. The login route restores any existing session and forwards
// authenticated users to the worklist.
export default function DashboardIndex() {
  redirect("/login");
}
