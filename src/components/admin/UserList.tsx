import React, { useState, useEffect } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "../ui/select";
import { adminApi, AdminUser, AdminBrand, UsersResponse } from "../../api/admin";
import { useToast } from "../../hooks/use-toast";
import { Helmet } from "react-helmet-async";

const statusColors = {
    Ativo: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
    Bloqueado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
    Removido: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    Pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
};

const tabs = [
    { label: "Criadores", key: "creators" },
    { label: "Marcas", key: "brands" },
];



function usePagination(data: any[], initialRowsPerPage = 5) {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
    const totalPages = Math.ceil(data.length / rowsPerPage) || 1;
    const paginated = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const goToPage = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));
    React.useEffect(() => { setPage(1); }, [rowsPerPage, data]);
    
    return { page, setPage: goToPage, rowsPerPage, setRowsPerPage, totalPages, paginated };

}

export default function UserList() {
    // State for API data
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [brands, setBrands] = useState<AdminBrand[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("creators");
    const isCreators = activeTab === "creators";
    const data = isCreators ? users : brands;
    const { page, setPage, rowsPerPage, setRowsPerPage, totalPages, paginated } = usePagination(data);


    // Fetch data from API
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isCreators) {
                const response = await adminApi.getCreators({
                    per_page: rowsPerPage,
                    page: page
                });
                setUsers(response.data as AdminUser[]);
            } else {
                const response = await adminApi.getBrands({
                    per_page: rowsPerPage,
                    page: page
                });
                setBrands(response.data as AdminBrand[]);
            }
        } catch (err) {
            setError('Failed to fetch data');
            toast({
                title: "Error",
                description: "Failed to load user data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Load data when component mounts or tab changes
    useEffect(() => {
        fetchData();
    }, [activeTab, page, rowsPerPage]);

    const canonical = typeof window !== "undefined" ? window.location.href : "";
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
    };

    return (
        <>
            <Helmet>
                <title>Nexa - Admin Usuários</title>
                <meta name="description" content="Browse Nexa guides filtered by brand and creator. Watch embedded videos and manage guides." />
                {canonical && <link rel="canonical" href={canonical} />}
                <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            </Helmet>
            <div className="p-4 md:p-8 bg-gray-50 dark:bg-neutral-900 min-h-[92vh]">
                <div className="w-full mx-auto">
                    <h1 className="text-xl md:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                        Usuários da Plataforma
                    </h1>
                    <p className="text-gray-500 dark:text-gray-300 mb-6 text-sm md:text-base">
                        Gerencie criadores e marcas registrados na plataforma
                    </p>
                    <div className="bg-background p-4 md:p-6 rounded-lg">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-neutral-700 mb-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`px-4 py-2 text-sm font-medium focus:outline-none transition-colors duration-150
                                            ${activeTab === tab.key
                                            ? "text-[#E91E63] border-b-2 border-[#E91E63]"
                                            : "text-gray-500 dark:text-gray-300 border-b-2 border-transparent hover:text-[#E91E63]"}`}
                                    onClick={() => setActiveTab(tab.key)}
                                    type="button"
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E91E63]"></div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                                <p className="text-red-600 dark:text-red-400">{error}</p>
                                <button
                                    onClick={fetchData}
                                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* Responsive Table Container */}
                        {!loading && !error && (
                            <div className="overflow-x-auto">
                                <div className="min-w-full inline-block align-middle">
                                    <div className="overflow-hidden border border-gray-200 dark:border-neutral-700 rounded-lg">
                                    {isCreators ? (
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                            <thead className="bg-gray-50 dark:bg-neutral-800">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Nome
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                                                        E-mail
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                                                        Tempo
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                                                        Campanhas
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Conta
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                                                {paginated.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                                                            Nenhum registro encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginated.map((user) => (
                                                        <tr key={user.email} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <div className="flex flex-col">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {user.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                                                                        {user.email}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                                                                {user.email}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.statusColor}`}>
                                                                    {user.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                                                                {user.time}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                                                                {user.campaigns}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[user.accountStatus]}`}>
                                                                    {user.accountStatus}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                            <thead className="bg-gray-50 dark:bg-neutral-800">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Empresa
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                                                        Marca
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                                                        E-mail
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Campanhas
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Conta
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                                                {paginated.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                                                            Nenhum registro encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginated.map((brand) => (
                                                        <tr key={brand.email} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <div className="flex flex-col">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {brand.company}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                                                                        {brand.brandName}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400 md:hidden">
                                                                        {brand.email}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                                                                {brand.brandName}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                                                                {brand.email}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${brand.statusColor}`}>
                                                                    {brand.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                {brand.campaigns}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[brand.accountStatus]}`}>
                                                                    {brand.accountStatus}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}



                        {/* Pagination */}
                        {!loading && !error && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Linhas por página:</span>
                                    <Select value={String(rowsPerPage)} onValueChange={val => setRowsPerPage(Number(val))}>
                                        <SelectTrigger className="w-[80px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[5, 10, 20, 50].map(n => (
                                                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        &lt;
                                    </button>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                                        {page} de {totalPages}
                                    </span>
                                    <button
                                        className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
