"use client";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBalanceSummary } from "@/features/transaction/action";
import { convertToIDR } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { TrendingDownIcon, TrendingUpIcon, WalletIcon } from "lucide-react";

const BalanceCards = () => {
  const { data, error } = useQuery({
    queryKey: ["balance"],
    queryFn: () => getBalanceSummary(),
  });
  if (error) {
    return (
      <div className="w-full p-4 text-sm border rounded-lg border-destructive/50 text-destructive bg-destructive/10 ">
        Failed to get balance
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <WalletIcon className="size-4" />
            <span>Savings</span>
          </CardTitle>
          <CardDescription className="text-2xl font-semibold text-secondary-foreground">
            {convertToIDR(Number(data?.savings) || 0)}
          </CardDescription>
        </CardHeader>
        <CardFooter className="text-sm">Savings for all time</CardFooter>
      </Card>
      {/* income  */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUpIcon className="size-4 " />
            <span>Total Income</span>
          </CardTitle>
          <CardDescription className="text-2xl font-semibold text-secondary-foreground">
            {convertToIDR(Number(data?.totalIncome) || 0)}
          </CardDescription>
        </CardHeader>
        <CardFooter className="text-sm">Total Income for all time</CardFooter>
      </Card>
      {/* expense */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <TrendingDownIcon className="size-4 " />
            <span>Total Expenses</span>
          </CardTitle>
          <CardDescription className="text-2xl font-semibold text-secondary-foreground">
            {convertToIDR(Number(data?.totalExpense) || 0)}
          </CardDescription>
        </CardHeader>
        <CardFooter className="text-sm">Total Expense for all time</CardFooter>
      </Card>
    </div>
  );
};

export default BalanceCards;
