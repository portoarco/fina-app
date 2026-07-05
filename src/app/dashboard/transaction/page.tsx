import { Metadata } from "next";
import Transaction from "./_components/transaction";

export const metadata: Metadata = {
  title: "Fina - Transaction",
  description: "View and manage your financial transactions",
};
const TransactionPage = () => {
  return (
    <section className="p-2 space-y-4">
      <section id="header">
        <h1 className="text-3xl font-bold text-primary">Transaction</h1>
        <p className="my-2 text-sm font-medium">
          View and manage your financial transactions
        </p>
      </section>
      <section id="content">
        <Transaction />
      </section>
    </section>
  );
};

export default TransactionPage;
