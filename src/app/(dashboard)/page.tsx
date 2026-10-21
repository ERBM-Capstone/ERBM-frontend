import { redirect } from "next/navigation";

// Root "/" redirects to "/worklist" as the default dashboard page
export default function DashboardIndex() {
  redirect("/worklist");
}
