import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { LayoutDashboard } from "lucide-react";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />
        </nav>
    );
}
