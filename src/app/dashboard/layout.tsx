import AppSidebar from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import ChatbotDrawer from "./_components/chatbot-drawer";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-4">
        <SidebarTrigger />
        {children}
        <ChatbotDrawer />
      </main>
    </SidebarProvider>
  );
};

export default DashboardLayout;
