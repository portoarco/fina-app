import { CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fina",
  description: "Your personal finance App with AI",
};
export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <CircleDollarSign className="text-primary size-20 my-2" />
      <h1 className="text-4xl font-bold text-primary">Welcome to Fina</h1>
      <p className="mt-2 text-lg">Your personal Finance App with AI</p>
      <Link href="/dashboard">
        <Button className="mt-2" size={"lg"}>
          Get Started
        </Button>
      </Link>
    </main>
  );
}
