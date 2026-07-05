import { Transaction } from "@/app/types/transaction";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTransactions } from "@/features/transaction/action";
import { cn, convertToIDR } from "@/lib/utils";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import DeleteTransactionDialog from "./delete-transaction-dialog";
import UpdateTransactionDialog from "./update-transaction-dialog";

const TABLE_HEADER = [
  "#",
  "Date",
  "Description",
  "Category",
  "Amount",
  "Action",
];

const TransactionTable = ({
  transactions,
  isLoading,
  refetch,
  page,
  limit,
  search,
  setPage,
  setLimit,
  setSearch,
}: {
  transactions?: Awaited<ReturnType<typeof getTransactions>>;
  isLoading: boolean;
  refetch: () => void;
  page: number;
  limit: number;
  search: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
}) => {
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  });

  const [selectedTransaction, setSelectedTransaction] = useState<{
    data: Omit<Transaction, "user_id" | "embedding">;
    action: "update" | "delete";
  } | null>(null);

  return (
    <>
      <Card className="w-full gap-2">
        <CardHeader className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div>
            <CardTitle>Recent Transaction</CardTitle>
            <CardDescription>Your latest financial activities.</CardDescription>
          </div>
          <div>
            <Input
              placeholder="Search by description..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {TABLE_HEADER.map((header) => (
                  <TableHead key={`th-${header}`}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            {isLoading && (
              <TableCaption className="mb-4">Loading....</TableCaption>
            )}
            {!isLoading && transactions?.data.length === 0 && (
              <TableCaption className="mb-4">
                No Transactions Found
              </TableCaption>
            )}
            <TableBody>
              {!isLoading &&
                transactions?.data?.map((trx, idx) => (
                  <TableRow key={`tr-${trx.id}`}>
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {new Date(trx.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{trx.description}</TableCell>
                    <TableCell>{trx.category}</TableCell>
                    <TableCell
                      className={cn(
                        "font-semibold",
                        trx.type === "expense"
                          ? "text-destructive"
                          : "text-green-500",
                      )}
                    >
                      {trx.type === "expense" && "- "}
                      {convertToIDR(trx.amount)}
                    </TableCell>
                    <TableCell className="flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-yellow-500"
                        onClick={() => {
                          setSelectedTransaction({
                            data: trx,
                            action: "update",
                          });
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setSelectedTransaction({
                            data: trx,
                            action: "delete",
                          });
                        }}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 ">
              <div className="text-sm text-muted-foreground">Rows per page</div>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder={limit.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 5, 10, 20, 50, 100].map((size) => (
                    <SelectItem key={`limit-${size}`} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {transactions?.totalPages && transactions.totalPages > 1 ? (
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        page === 1
                          ? setPage(Number(transactions.totalPages))
                          : setPage(page - 1)
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        page === Number(transactions.totalPages)
                          ? setPage(1)
                          : setPage(page + 1)
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : (
              ""
            )}
          </div>
        </CardContent>
      </Card>
      <DeleteTransactionDialog
        selectedTransaction={selectedTransaction}
        setSelectedTransaction={setSelectedTransaction}
        refetch={refetch}
      />
      <UpdateTransactionDialog
        selectedTransaction={selectedTransaction}
        setSelectedTransaction={setSelectedTransaction}
        refetch={refetch}
      />
    </>
  );
};

export default TransactionTable;
