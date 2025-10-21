import { useEffect, useState } from 'react';
import { apiClient } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';

interface StudentRequest {
  id: number;
  user: { id: number; name: string; email: string };
  purchase_email?: string;
  course_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function StudentRequests() {
  const [status, setStatus] = useState<'pending'|'approved'|'rejected'|''>('pending');
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/student-requests', { params: { status: status || undefined, per_page: 20 } });
      setRequests(res.data?.data?.data || []);
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Falha ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const approve = async (id: number) => {
    try {
      await apiClient.patch(`/admin/student-requests/${id}/approve`, { duration_months: 12 });
      toast.success('Solicitação aprovada');
      load();
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Falha ao aprovar');
    }
  };

  const reject = async (id: number) => {
    try {
      await apiClient.patch(`/admin/student-requests/${id}/reject`, {});
      toast.success('Solicitação rejeitada');
      load();
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Falha ao rejeitar');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(v:any)=>setStatus(v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load} disabled={loading}>{loading? 'Carregando...' : 'Recarregar'}</Button>
      </div>

      {requests.map(req => (
        <Card key={req.id}>
          <CardHeader>
            <CardTitle>{req.user?.name} <span className="text-sm text-muted-foreground">({req.user?.email})</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">Email de compra: {req.purchase_email || '-'}</div>
            <div className="text-sm">Curso: {req.course_name || '-'}</div>
            <div className="flex gap-2 pt-2">
              <Button onClick={()=>approve(req.id)} disabled={loading}>Aprovar</Button>
              <Button variant="destructive" onClick={()=>reject(req.id)} disabled={loading}>Rejeitar</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


