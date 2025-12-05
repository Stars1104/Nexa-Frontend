import { useEffect, useState } from "react";
import { adminApi, StudentVerificationRequest } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function StudentVerificationRequests() {
    const [requests, setRequests] = useState<StudentVerificationRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
    const [perPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number; per_page: number } | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
    const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
    const { toast } = useToast();

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params: any = { per_page: perPage, page: page };
            if (status !== "all") params.status = status;
            const res = await adminApi.getStudentVerificationRequests(params);
            const data = res.data;
            setRequests(data.data);
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                per_page: data.per_page,
                total: data.total,
            });
            
            if (data.current_page !== page) {
                setPage(data.current_page);
            }
        } catch (e: any) {
            toast({ title: "Erro", description: e?.message || "Falha ao carregar solicitações", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        
    }, [status, page]);

    const handleApprove = async (requestId: number) => {
        setActionLoadingId(requestId);
        try {
            const notes = reviewNotes[requestId] || undefined;
            await adminApi.approveStudentVerification(requestId, { review_notes: notes });
            toast({ title: "Aprovado", description: "Solicitação aprovada com sucesso" });
            setReviewNotes((prev) => {
                const updated = { ...prev };
                delete updated[requestId];
                return updated;
            });
            fetchRequests();
        } catch (e: any) {
            toast({ title: "Erro", description: e?.message || "Falha ao aprovar", variant: "destructive" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleReject = async (requestId: number) => {
        setActionLoadingId(requestId);
        try {
            const notes = reviewNotes[requestId] || undefined;
            await adminApi.rejectStudentVerification(requestId, { review_notes: notes });
            toast({ title: "Rejeitado", description: "Solicitação rejeitada com sucesso" });
            setReviewNotes((prev) => {
                const updated = { ...prev };
                delete updated[requestId];
                return updated;
            });
            fetchRequests();
        } catch (e: any) {
            toast({ title: "Erro", description: e?.message || "Falha ao rejeitar", variant: "destructive" });
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold">Verificação de Alunos</h2>
                <div className="flex items-center gap-2">
                    <Select value={status} onValueChange={(v: any) => { setStatus(v); setPage(1); }}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                            <SelectItem value="approved">Aprovados</SelectItem>
                            <SelectItem value="rejected">Rejeitados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border overflow-hidden">
                <div className="grid grid-cols-12 gap-0 bg-muted px-3 py-2 text-sm font-medium">
                    <div className="col-span-3">Usuário</div>
                    <div className="col-span-3">Email da Compra</div>
                    <div className="col-span-2">Curso</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Ações</div>
                </div>
                {loading ? (
                    <div className="p-4 text-sm">Carregando...</div>
                ) : requests.length === 0 ? (
                    <div className="p-4 text-sm">Nenhuma solicitação encontrada.</div>
                ) : (
                    requests.map((r) => (
                        <div key={r.id} className="grid grid-cols-12 gap-0 items-center border-t px-3 py-3 text-sm">
                            <div className="col-span-3 flex flex-col">
                                <span className="font-medium">{r.user?.name ?? `#${r.user_id}`}</span>
                                <span className="text-muted-foreground">{r.user?.email}</span>
                            </div>
                            <div className="col-span-3">
                                {r.purchase_email}
                            </div>
                            <div className="col-span-2 truncate">
                                {r.course_name || "—"}
                            </div>
                            <div className="col-span-2">
                                <span className={`px-2 py-1 rounded text-xs ${r.status === "pending" ? "bg-yellow-100 text-yellow-800" : r.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{r.status}</span>
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-2">
                                {r.status === "pending" && (
                                    <>
                                        <Input
                                            placeholder="Notas de revisão (opcional)"
                                            value={reviewNotes[r.id] || ""}
                                            onChange={(e) => setReviewNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                            className="max-w-[180px]"
                                        />
                                        <Button size="sm" variant="outline" disabled={actionLoadingId === r.id} onClick={() => handleReject(r.id)}>
                                            {actionLoadingId === r.id ? "..." : "Rejeitar"}
                                        </Button>
                                        <Button size="sm" disabled={actionLoadingId === r.id} onClick={() => handleApprove(r.id)}>
                                            {actionLoadingId === r.id ? "..." : "Aprovar"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {pagination && (
                <div className="flex items-center justify-between mt-4 text-sm">
                    <div>
                        Página {pagination.current_page} de {pagination.last_page} — {pagination.total} solicitações
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" disabled={pagination.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
                        <Button variant="outline" disabled={pagination.current_page >= pagination.last_page} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                    </div>
                </div>
            )}
        </div>
    );
}


