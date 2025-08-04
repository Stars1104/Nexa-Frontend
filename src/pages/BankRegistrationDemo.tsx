import React from "react";
import BankAccountManager from "@/components/BankAccountManager";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BankRegistrationDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
        <BankAccountManager />
    </div>
  );
};

export default BankRegistrationDemo; 