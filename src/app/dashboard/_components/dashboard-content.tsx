"use client";
import React from "react";
import BalanceCards from "./balance-cards";
import WizardInput from "./wizard-input";
import { useQuery } from "@tanstack/react-query";
import { getBalanceSummary } from "@/features/transaction/action";

const DashboardContent = () => {
  const { data, error, refetch } = useQuery({
    queryKey: ["balance"],
    queryFn: () => getBalanceSummary(),
  });
  return (
    <section id="content" className="space-y-4">
      <WizardInput refetch={refetch} />
      <BalanceCards data={data} error={error} />
    </section>
  );
};

export default DashboardContent;
