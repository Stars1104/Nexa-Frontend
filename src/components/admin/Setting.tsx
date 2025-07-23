import React, { useState } from 'react';
import { Input } from '../ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '../ui/dialog';

const initialCohorts = [
  { name: 'Turma Abril 2023', username: 'admin1', start: '01/04/2023', end: '30/09/2023', duration: '6 meses' },
  { name: 'Turma Julho 2023', username: 'admin2', start: '01/07/2023', end: '31/12/2023', duration: '6 meses' },
  { name: 'Turma Outubro 2023', username: 'admin3', start: '01/10/2023', end: '31/03/2024', duration: '6 meses' },
];

const Setting: React.FC = () => {
  const [apiProvider, setApiProvider] = useState('Hotmart');
  const [apiKey, setApiKey] = useState('');
  const [cohorts, setCohorts] = useState(initialCohorts);
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [cohortForm, setCohortForm] = useState({ name: '', username: '', start: '', end: '', duration: '6 meses' });
  const [monthlyPrice, setMonthlyPrice] = useState('2990');
  const [commission, setCommission] = useState('5');
  const [gateway, setGateway] = useState('Pagar.me');
  const [promo, setPromo] = useState(false);

  const handleCohortEdit = (idx: number) => {
    setEditIndex(idx);
    setCohortForm(cohorts[idx]);
    setShowCohortModal(true);
  };

  const handleCohortAdd = () => {
    setEditIndex(null);
    setCohortForm({ name: '', username: '', start: '', end: '', duration: '6 meses' });
    setShowCohortModal(true);
  };

  const handleCohortSave = () => {
    if (editIndex !== null) {
      const updated = [...cohorts];
      updated[editIndex] = cohortForm;
      setCohorts(updated);
    } else {
      setCohorts([...cohorts, cohortForm]);
    }
    setShowCohortModal(false);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-neutral-900 min-h-[92vh] w-full">
      <div className="w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-1">Configurações de Regras</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">Configure as regras de acesso e pagamento da plataforma</p>

        {/* Free Access Section */}
        <section className="bg-background rounded-xl shadow p-4 sm:p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Acesso Gratuito para Alunos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">API de Verificação</label>
              <Select value={apiProvider} onValueChange={setApiProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hotmart">Hotmart</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Chave da API</label>
              <Input
                type="text"
                placeholder="Insira a chave da API"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>
          </div>

          {/* Cohort Table */}
          <div className="mb-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Tabela de Coortes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-300">
                    <th className="px-2 py-1">Nome da Turma</th>
                    <th className="px-2 py-1">Username</th>
                    <th className="px-2 py-1">Data de Início</th>
                    <th className="px-2 py-1">Data de Fim</th>
                    <th className="px-2 py-1">Duração do Acesso</th>
                    <th className="px-2 py-1">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c, idx) => (
                    <tr key={idx} className="bg-gray-50 dark:bg-neutral-900 rounded-lg">
                      <td className="px-2 py-2 font-medium text-gray-800 dark:text-gray-100">{c.name}</td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-200">{c.username}</td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-200">{c.start}</td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-200">{c.end}</td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-200">{c.duration}</td>
                      <td className="px-2 py-2">
                        <button
                          className="border border-gray-300 dark:border-neutral-700 rounded px-3 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                          onClick={() => handleCohortEdit(idx)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="mt-3 border border-gray-300 dark:border-neutral-700 rounded px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
              onClick={handleCohortAdd}
            >
              Adicionar Nova Turma
            </button>
          </div>
        </section>

        {/* Payment Plans Section */}
        <section className="bg-background rounded-xl shadow p-4 sm:p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Planos de Pagamento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Preço da Assinatura Mensal (R$)</label>
              <Input
                type="number"
                value={monthlyPrice}
                onChange={e => setMonthlyPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Taxa de Comissão (%)</label>
              <Input
                type="number"
                value={commission}
                onChange={e => setCommission(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center mb-4">
            <Input
              id="promo"
              type="checkbox"
              checked={promo}
              onChange={e => setPromo(e.target.checked)}
              className="h-4 w-4 mr-2"
            />
            <label htmlFor="promo" className="block text-sm text-gray-700 dark:text-gray-200">
              Ativar promoção especial
              <span className="block text-xs text-gray-400 dark:text-gray-400">Oferecer 1 mês grátis para novos usuários</span>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              className="bg-[#DB2777] hover:bg-primary-600 text-white font-semibold rounded px-6 py-2 transition"
            >
              Salvar Alterações
            </button>
          </div>
        </section>

        {/* Cohort Modal as Dialog */}
        <Dialog open={showCohortModal} onOpenChange={setShowCohortModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editIndex !== null ? 'Editar Turma' : 'Adicionar Nova Turma'}</DialogTitle>
            </DialogHeader>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nome da Turma</label>
              <Input
                type="text"
                value={cohortForm.name}
                onChange={e => setCohortForm({ ...cohortForm, name: e.target.value })}
                className="mb-2"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Username</label>
              <Input
                type="text"
                value={cohortForm.username}
                onChange={e => setCohortForm({ ...cohortForm, username: e.target.value })}
                className="mb-2"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Data de Início</label>
              <Input
                type="text"
                placeholder="dd/mm/aaaa"
                value={cohortForm.start}
                onChange={e => setCohortForm({ ...cohortForm, start: e.target.value })}
                className="mb-2"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Data de Fim</label>
              <Input
                type="text"
                placeholder="dd/mm/aaaa"
                value={cohortForm.end}
                onChange={e => setCohortForm({ ...cohortForm, end: e.target.value })}
                className="mb-2"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Duração do Acesso</label>
              <Input
                type="text"
                value={cohortForm.duration}
                onChange={e => setCohortForm({ ...cohortForm, duration: e.target.value })}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-600"
                  type="button"
                >
                  Cancelar
                </button>
              </DialogClose>
              <button
                className="px-4 py-2 rounded bg-[#DB2777] hover:bg-primary-600 text-white font-semibold"
                type="button"
                onClick={handleCohortSave}
              >
                Salvar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Setting;
