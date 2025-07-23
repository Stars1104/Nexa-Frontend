import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";

export default function SubscriptionModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    card: "",
    expiry: "",
    cvc: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 rounded-2xl overflow-hidden">
        <form className="bg-background w-full flex flex-col px-5 py-6 gap-4 sm:gap-6" onSubmit={e => { e.preventDefault(); /* handle payment */ }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-2 text-foreground">Finalizar assinatura</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Ana Silva"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ana.silva@email.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="000.000.000-00"
                autoComplete="off"
                value={form.cpf}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
          </div>
          <div className="border-t pt-4 flex flex-col gap-3">
            <div className="font-medium text-base text-foreground mb-1">Dados do cartão</div>
            <div>
              <Label htmlFor="card">Número do cartão</Label>
              <Input
                id="card"
                name="card"
                type="text"
                placeholder="0000 0000 0000 0000"
                autoComplete="cc-number"
                value={form.card}
                onChange={handleChange}
                required
                className="mt-1"
                inputMode="numeric"
                maxLength={19}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="expiry">Validade</Label>
                <Input
                  id="expiry"
                  name="expiry"
                  type="text"
                  placeholder="MM/AA"
                  autoComplete="cc-exp"
                  value={form.expiry}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  name="cvc"
                  type="text"
                  placeholder="000"
                  autoComplete="cc-csc"
                  value={form.cvc}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <Checkbox id="terms" checked={accepted} onCheckedChange={v => setAccepted(!!v)} />
            <Label htmlFor="terms" className="text-xs text-muted-foreground select-none">
              Aceito os <a href="#" className="text-[#E91E63] hover:underline">Termos de Uso</a> e a <a href="#" className="text-[#E91E63] hover:underline">Política de Privacidade</a>
            </Label>
          </div>
          <Button
            type="submit"
            className="w-full mt-2 bg-[#E91E63] hover:bg-pink-600 text-white font-semibold text-base py-3 rounded-lg"
            disabled={!accepted}
          >
            Confirmar pagamento
          </Button>
        </form>
        <DialogClose asChild>
          <button
            aria-label="Fechar"
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            type="button"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

