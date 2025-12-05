import React, { useState, useEffect } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "../ui/select";
import { adminApi, AdminUser, AdminBrand, AdminStudent, UsersResponse, StudentsResponse, PaginationData } from "../../api/admin";
import { useToast } from "../../hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { Search, MoreVertical, XCircle, Trash2, UserCheck } from "lucide-react";

const statusColors = {
    Ativo: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
    Bloqueado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
    Removido: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    Pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
};

const tabs = [
    { label: "Criadores", key: "creators" },
    { label: "Marcas", key: "brands" },
    { label: "alunos", key: "students" },
];

export default function UserList() {
    
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [brands, setBrands] = useState<AdminBrand[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    
    
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("creators");
    const isCreators = activeTab === "creators";
    const isBrands = activeTab === "brands";
    const isStudents = activeTab === "students";
    
    
    const [searchQuery, setSearchQuery] = useState("");
    
    
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        action: () => void;
    }>({
        open: false,
        title: "",
        description: "",
        action: () => {},
    });
    
    
    const data = isCreators ? users : isBrands ? brands : students;

    
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                per_page: rowsPerPage,
                page: page,
                ...(searchQuery && { search: searchQuery }),
            };
            
            if (isCreators) {
                const response = await adminApi.getCreators(params);
                setUsers(response.data as AdminUser[]);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else if (isBrands) {
                const response = await adminApi.getBrands(params);
                setBrands(response.data as AdminBrand[]);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else if (isStudents) {
                const response = await adminApi.getStudents(params);
                setStudents(response.data as AdminStudent[]);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
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
    
    
    const handleUserStatusUpdate = async (
        userId: number,
        action: 'activate' | 'block' | 'remove',
        userName: string
    ) => {
        try {
            await adminApi.updateUserStatus(userId, action);
            toast({
                title: "Success",
                description: `User ${userName} has been ${action === 'activate' ? 'activated' : action === 'block' ? 'blocked' : 'removed'} successfully`,
            });
            fetchData();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.response?.data?.message || `Failed to ${action} user`,
                variant: "destructive",
            });
        }
    };
    
    
    const handleStudentStatusUpdate = async (
        studentId: number,
        action: 'activate' | 'block' | 'remove',
        studentName: string
    ) => {
        try {
            await adminApi.updateStudentStatus(studentId, action);
            toast({
                title: "Success",
                description: `Student ${studentName} has been ${action === 'activate' ? 'activated' : action === 'block' ? 'blocked' : 'removed'} successfully`,
            });
            fetchData();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.response?.data?.message || `Failed to ${action} student`,
                variant: "destructive",
            });
        }
    };
    
    
    const openConfirmDialog = (
        title: string,
        description: string,
        action: () => void
    ) => {
        setConfirmDialog({
            open: true,
            title,
            description,
            action,
        });
    };
    
    
    const closeConfirmDialog = () => {
        setConfirmDialog({
            open: false,
            title: "",
            description: "",
            action: () => {},
        });
    };

    
    useEffect(() => {
        setPage(1);
    }, [activeTab, rowsPerPage, searchQuery]);

    
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) {
                fetchData();
            } else {
                setPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
        
    }, [searchQuery]);

    
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
                        {}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar por nome, e-mail ou empresa..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        {}
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

                        {}
                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E91E63]"></div>
                            </div>
                        )}

                        {}
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

                        {}
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
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Ações
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                                                {data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                                                            Nenhum registro encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.map((user) => {
                                                        const userData = user as AdminUser;
                                                        const isActive = userData.accountStatus === 'Ativo';
                                                        const isBlocked = userData.accountStatus === 'Bloqueado';
                                                        const isRemoved = userData.accountStatus === 'Removido';
                                                        
                                                        return (
                                                            <tr key={userData.email} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <div className="flex flex-col">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {userData.name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                                                                            {userData.email}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                                                                    {userData.email}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userData.statusColor}`}>
                                                                        {userData.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                                                                    {userData.time}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                                                                    {userData.campaigns}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[userData.accountStatus]}`}>
                                                                        {userData.accountStatus}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            {!isActive && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openConfirmDialog(
                                                                                        "Ativar Usuário",
                                                                                        `Tem certeza que deseja ativar o usuário ${userData.name}?`,
                                                                                        () => handleUserStatusUpdate(userData.id, 'activate', userData.name)
                                                                                    )}
                                                                                >
                                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                                    Ativar
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {!isBlocked && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openConfirmDialog(
                                                                                        "Bloquear Usuário",
                                                                                        `Tem certeza que deseja bloquear o usuário ${userData.name}?`,
                                                                                        () => handleUserStatusUpdate(userData.id, 'block', userData.name)
                                                                                    )}
                                                                                    className="text-yellow-600 dark:text-yellow-400"
                                                                                >
                                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                                    Bloquear
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {!isRemoved && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openConfirmDialog(
                                                                                        "Remover Usuário",
                                                                                        `Tem certeza que deseja remover o usuário ${userData.name}? Esta ação não pode ser desfeita.`,
                                                                                        () => handleUserStatusUpdate(userData.id, 'remove', userData.name)
                                                                                    )}
                                                                                    className="text-red-600 dark:text-red-400"
                                                                                >
                                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                                    Remover
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    ) : isBrands ? (
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
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Ações
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                                                {data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                                                            Nenhum registro encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.map((brand) => {
                                                        const brandData = brand as AdminBrand;
                                                        const isActive = brandData.accountStatus === 'Ativo';
                                                        const isBlocked = brandData.accountStatus === 'Bloqueado';
                                                        const isRemoved = brandData.accountStatus === 'Removido';
                                                        
                                                        return (
                                                            <tr key={brandData.email} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <div className="flex flex-col">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {brandData.company}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                                                                            {brandData.brandName}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400 md:hidden">
                                                                            {brandData.email}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                                                                    {brandData.brandName}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                                                                    {brandData.email}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${brandData.statusColor}`}>
                                                                        {brandData.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    {brandData.campaigns}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[brandData.accountStatus]}`}>
                                                                        {brandData.accountStatus}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            {!isActive && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openConfirmDialog(
                                                                                        "Ativar Marca",
                                                                                        `Tem certeza que deseja ativar a marca ${brandData.company}?`,
                                                                                        () => handleUserStatusUpdate(brandData.id, 'activate', brandData.company)
                                                                                    )}
                                                                                >
                                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                                    Ativar
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {!isBlocked && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openConfirmDialog(
                                                                                        "Bloquear Marca",
                                                                                        `Tem certeza que deseja bloquear a marca ${brandData.company}?`,
                                                                                        () => handleUserStatusUpdate(brandData.id, 'block', brandData.company)
                                                                                    )}
                                                                                    className="text-yellow-600 dark:text-yellow-400"
                                                                                >
                                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                                    Bloquear
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {!isRemoved && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openConfirmDialog(
                                                                                        "Remover Marca",
                                                                                        `Tem certeza que deseja remover a marca ${brandData.company}? Esta ação não pode ser desfeita.`,
                                                                                        () => handleUserStatusUpdate(brandData.id, 'remove', brandData.company)
                                                                                    )}
                                                                                    className="text-red-600 dark:text-red-400"
                                                                                >
                                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                                    Remover
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    ) : isStudents ? (
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                            <thead className="bg-gray-50 dark:bg-neutral-800">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Nome
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                                                        E-mail
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                                                        Instituição
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                                                        Trial
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Verificado
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Ações
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                                                {data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                                                            Nenhum aluno encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.map((student) => {
                                                        const studentData = student as AdminStudent;
                                                        const isActive = studentData.trial_status === 'active' || studentData.trial_status === 'premium';
                                                        const isBlocked = studentData.trial_status === 'expired';
                                                        
                                                        return (
                                                            <tr key={studentData.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <div className="flex flex-col">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {studentData.name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                                                                            {studentData.email}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                                                                    {studentData.email}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                                                                    {studentData.institution || 'N/A'}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        studentData.trial_status === 'active' 
                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                                                                            : studentData.trial_status === 'expired'
                                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                                    }`}>
                                                                        {studentData.trial_status === 'active' ? 'Ativo' : 
                                                                         studentData.trial_status === 'expired' ? 'Expirado' : 'Premium'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                                                                    {studentData.days_remaining > 0 ? `${studentData.days_remaining} dias` : 'N/A'}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        studentData.student_verified 
                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
                                                                    }`}>
                                                                        {studentData.student_verified ? 'Sim' : 'Não'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            {!isActive && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openConfirmDialog(
                                                                                        "Ativar Aluno",
                                                                                        `Tem certeza que deseja ativar o aluno ${studentData.name}?`,
                                                                                        () => handleStudentStatusUpdate(studentData.id, 'activate', studentData.name)
                                                                                    )}
                                                                                >
                                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                                    Ativar
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {!isBlocked && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openConfirmDialog(
                                                                                        "Bloquear Aluno",
                                                                                        `Tem certeza que deseja bloquear o aluno ${studentData.name}?`,
                                                                                        () => handleStudentStatusUpdate(studentData.id, 'block', studentData.name)
                                                                                    )}
                                                                                    className="text-yellow-600 dark:text-yellow-400"
                                                                                >
                                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                                    Bloquear
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            <DropdownMenuItem
                                                                                onClick={() => openConfirmDialog(
                                                                                    "Remover Aluno",
                                                                                    `Tem certeza que deseja remover o aluno ${studentData.name}? Esta ação não pode ser desfeita.`,
                                                                                    () => handleStudentStatusUpdate(studentData.id, 'remove', studentData.name)
                                                                                )}
                                                                                className="text-red-600 dark:text-red-400"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Remover
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        )}



                        {}
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
                                        {pagination.current_page} de {pagination.last_page}
                                    </span>
                                    <button
                                        className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= pagination.last_page}
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeConfirmDialog}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                confirmDialog.action();
                                closeConfirmDialog();
                            }}
                            className="bg-[#E91E63] hover:bg-[#E91E63]/90"
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
