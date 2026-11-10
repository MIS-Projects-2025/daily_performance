import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEffect } from "react";

export default function Dashboard({ tableData, tableFilters }) {
    const { emp_data } = usePage().props;

    useEffect(() => {
        console.log("emp_data:", emp_data);
    }, [emp_data]);

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <h1 className="text-2xl font-bold">Dashboard</h1>
        </AuthenticatedLayout>
    );
}
