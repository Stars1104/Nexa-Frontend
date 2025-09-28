import React, { useState, useEffect } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { GraduationCap, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Ban, Trash2, Shield } from "lucide-react";
import { adminApi, AdminStudent } from "../../api/admin";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/alert-dialog";

interface StudentsResponse {
    success: boolean;
    data: AdminStudent[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

function usePagination(data: any[], initialRowsPerPage = 10) {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
    const totalPages = Math.ceil(data.length / rowsPerPage) || 1;
    const paginated = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const goToPage = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));
    React.useEffect(() => { setPage(1); }, [rowsPerPage, data]);
    
    return { page, setPage: goToPage, rowsPerPage, setRowsPerPage, totalPages, paginated };
}

export default function StudentList() {
    const [students, setStudents] = useState<AdminStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [updatingStudent, setUpdatingStudent] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const { toast } = useToast();

    const { page, setPage, rowsPerPage, setRowsPerPage, totalPages, paginated } = usePagination(students);

    // Fetch students data
    const fetchStudents = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching students from admin API...');
            const result = await adminApi.getStudents();
            console.log('Students API result:', result);
            setStudents(result.data);
            console.log('Students data set:', result.data);
        } catch (err: any) {
            console.error('Error fetching students:', err);
            setError('Failed to fetch students data');
            toast({
                title: "Error",
                description: err?.message || "Failed to load students data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Load data when component mounts
    useEffect(() => {
        console.log('StudentList component mounted, fetching students...');
        fetchStudents();
    }, []);

    // Filter students based on search and status
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (student.academic_email && student.academic_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (student.institution && student.institution.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === "all" || student.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const { page: filteredPage, setPage: setFilteredPage, rowsPerPage: filteredRowsPerPage, setRowsPerPage: setFilteredRowsPerPage, totalPages: filteredTotalPages, paginated: filteredPaginated } = usePagination(filteredStudents, rowsPerPage);

    // Update trial period
    const updateTrialPeriod = async (studentId: number, period: '1month' | '6months' | '1year') => {
        if (updatingStudent === studentId) return; // Prevent multiple clicks
        
        setUpdatingStudent(studentId);
        try {
            console.log('Updating trial period for student:', studentId, 'period:', period);
            
            const result = await adminApi.updateStudentTrial(studentId, period);
            
            console.log('Trial update result:', result);
            
            toast({
                title: "Success",
                description: result.message || "Trial period updated successfully",
            });

            // Refresh the data
            await fetchStudents();
        } catch (err: any) {
            console.error('Error updating trial period:', err);
            toast({
                title: "Error",
                description: err?.message || "Failed to update trial period",
                variant: "destructive",
            });
        } finally {
            setUpdatingStudent(null);
        }
    };

    // Update student status (activate, block, remove)
    const updateStudentStatus = async (studentId: number, action: 'activate' | 'block' | 'remove') => {
        if (actionLoading === studentId) return; // Prevent multiple clicks
        
        setActionLoading(studentId);
        try {
            console.log('Updating student status:', studentId, 'action:', action);
            
            const result = await adminApi.updateStudentStatus(studentId, action);
            
            console.log('Status update result:', result);
            
            toast({
                title: "Success",
                description: result.message || "Student status updated successfully",
            });

            // Refresh the data
            await fetchStudents();
        } catch (err: any) {
            console.error('Error updating student status:', err);
            toast({
                title: "Error",
                description: err?.message || "Failed to update student status",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (student: AdminStudent) => {
        if (student.has_premium) {
            return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">Premium</Badge>;
        }
        
        if (student.trial_status === 'active') {
            return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">Trial Active</Badge>;
        }
        
        if (student.trial_status === 'expired') {
            return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">Trial Expired</Badge>;
        }
        
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">No Trial</Badge>;
    };

    const getTrialStatusIcon = (student: AdminStudent) => {
        if (student.has_premium) {
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
        
        if (student.trial_status === 'active') {
            return <Clock className="w-4 h-4 text-blue-500" />;
        }
        
        if (student.trial_status === 'expired') {
            return <XCircle className="w-4 h-4 text-red-500" />;
        }
        
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getDaysRemaining = (expiresAt: string | null) => {
        if (!expiresAt) return 0;
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const canonical = typeof window !== "undefined" ? window.location.href : "";
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
    };

    return (
        <>
            <Helmet>
                <title>Nexa - Admin Estudantes</title>
                <meta name="description" content="Gerencie estudantes e seus períodos de teste gratuito na plataforma Nexa." />
                {canonical && <link rel="canonical" href={canonical} />}
                <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            </Helmet>
            <div className="p-4 md:p-8 bg-gray-50 dark:bg-neutral-900 min-h-[92vh]">
                <div className="w-full mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <GraduationCap className="w-8 h-8 text-[#E91E63]" />
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                Gerenciar Estudantes
                            </h1>
                            <p className="text-gray-500 dark:text-gray-300 text-sm md:text-base">
                                Gerencie estudantes verificados e seus períodos de teste gratuito
                            </p>
                        </div>
                    </div>

                    <div className="bg-background p-4 md:p-6 rounded-lg">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <Input
                                    placeholder="Buscar por nome, email ou instituição..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="active">Ativos</SelectItem>
                                        <SelectItem value="expired">Expirados</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                                    onClick={fetchStudents}
                                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* Students Table */}
                        {!loading && !error && (
                            <div className="overflow-x-auto">
                                <div className="min-w-full inline-block align-middle">
                                    <div className="overflow-hidden border border-gray-200 dark:border-neutral-700 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                            <thead className="bg-gray-50 dark:bg-neutral-800">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Estudante
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                                                        Instituição
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                                                        Período de Teste
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                                                        Dias Restantes
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Ações
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                                                {filteredPaginated.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                                                            Nenhum estudante encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredPaginated.map((student) => (
                                                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <div className="flex flex-col">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {student.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {student.email}
                                                                    </div>
                                                                    {student.academic_email && (
                                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                            Acadêmico: {student.academic_email}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                                                                <div className="flex flex-col">
                                                                    <div className="font-medium">{student.institution || 'N/A'}</div>
                                                                    {student.course_name && (
                                                                        <div className="text-xs text-gray-500">{student.course_name}</div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    {getTrialStatusIcon(student)}
                                                                    {getStatusBadge(student)}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        <span>Início: {formatDate(student.created_at)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        <span>Fim: {formatDate(student.free_trial_expires_at)}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span className={student.days_remaining > 0 ? 'text-green-600' : 'text-red-600'}>
                                                                        {student.days_remaining} dias
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <div className="flex flex-col gap-2">
                                                                    <Select 
                                                                        onValueChange={(value) => updateTrialPeriod(student.id, value as any)}
                                                                        disabled={updatingStudent === student.id}
                                                                    >
                                                                        <SelectTrigger className="w-32 h-8 text-xs">
                                                                            <SelectValue placeholder={updatingStudent === student.id ? "Atualizando..." : "Período"} />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="1month">1 Mês</SelectItem>
                                                                            <SelectItem value="6months">6 Meses</SelectItem>
                                                                            <SelectItem value="1year">1 Ano</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <div className="flex gap-1">
                                                                        {/* Activate Button */}
                                                                        {!student.email_verified_at && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-7 px-2 text-xs"
                                                                                onClick={() => updateStudentStatus(student.id, 'activate')}
                                                                                disabled={actionLoading === student.id}
                                                                            >
                                                                                <Shield className="w-3 h-3 mr-1" />
                                                                                Ativar
                                                                            </Button>
                                                                        )}
                                                                        
                                                                        {/* Block Button */}
                                                                        {student.email_verified_at && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-7 px-2 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                                                                                onClick={() => updateStudentStatus(student.id, 'block')}
                                                                                disabled={actionLoading === student.id}
                                                                            >
                                                                                <Ban className="w-3 h-3 mr-1" />
                                                                                Bloquear
                                                                            </Button>
                                                                        )}
                                                                        
                                                                        {/* Remove Button */}
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                                                    disabled={actionLoading === student.id}
                                                                                >
                                                                                    <Trash2 className="w-3 h-3 mr-1" />
                                                                                    Remover
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                                                                        <Trash2 className="w-5 h-5" />
                                                                                        Confirmar Remoção
                                                                                    </AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Tem certeza que deseja remover o estudante <strong>{student.name}</strong> da plataforma?
                                                                                        <br /><br />
                                                                                        Esta ação não pode ser desfeita e todos os dados do estudante serão permanentemente removidos.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => updateStudentStatus(student.id, 'remove')}
                                                                                        className="bg-red-600 hover:bg-red-700"
                                                                                    >
                                                                                        Remover Estudante
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && !error && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Linhas por página:</span>
                                    <Select value={String(filteredRowsPerPage)} onValueChange={val => setFilteredRowsPerPage(Number(val))}>
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
                                        onClick={() => setFilteredPage(filteredPage - 1)}
                                        disabled={filteredPage === 1}
                                    >
                                        &lt;
                                    </button>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                                        {filteredPage} de {filteredTotalPages}
                                    </span>
                                    <button
                                        className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                                        onClick={() => setFilteredPage(filteredPage + 1)}
                                        disabled={filteredPage === filteredTotalPages}
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
