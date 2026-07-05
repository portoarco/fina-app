"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import TransactionTable from "./transaction-table";
import { getTransactions } from "@/features/transaction/action";
import CreateTransactionCard from "./create-transaction-card";

const Transaction = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["transactions", page, limit, search],
    queryFn: () => getTransactions({ page, limit, search }),
  });
  return (
    <section className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
      <TransactionTable
        transactions={data}
        isLoading={isLoading}
        refetch={refetch}
        page={page}
        limit={limit}
        search={search}
        setPage={setPage}
        setLimit={setLimit}
        setSearch={setSearch}
      />
      <CreateTransactionCard refetch={refetch} />
    </section>
  );
};

export default Transaction;
