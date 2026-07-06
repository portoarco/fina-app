import React from "react";
import BalanceCards from "./balance-cards";
import WizardInput from "./wizard-input";

const DashboardContent = () => {
  return (
    <section id="content" className="space-y-4">
      <WizardInput />
      <BalanceCards />
    </section>
  );
};

export default DashboardContent;
