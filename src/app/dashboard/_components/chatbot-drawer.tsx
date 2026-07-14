"use client";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { handleChatStreaming } from "@/features/ai/chat";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { BotIcon, ChevronDownIcon, EllipsisIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import ChatbotTextarea from "./chatbot-textarea";
import { Conversation } from "@/app/types/ai";

const ChatbotDrawer = () => {
  const chatRef = useRef<HTMLDivElement>(null);
  //   WITH THINKING STATE AND MULTI TURN CONVERSATION (CEK HISTORY PERCAKAPAN)
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [mode, setMode] = useState<"general" | "personalized">("general");

  // mutation untuk generate streaming
  const { mutate: handleChatMutation, isPending } = useMutation({
    // mutationFn: handleChat,
    mutationFn: async ({
      // message,
      isThinking,
    }: {
      // message: string;
      isThinking: boolean;
    }) => {
      if (isThinking) {
        // buat dulu conversation nya
        setConversation((prev) => [
          ...prev,
          { role: "model", parts: [{ thought: true, text: "" }, { text: "" }] },
        ]);
        const response = await handleChatStreaming(
          conversation,
          isThinking,
          mode,
        );
        for await (const chunk of response) {
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastIndex = newConversation.length - 1;
            const parts = newConversation[lastIndex].parts;
            newConversation[lastIndex] = {
              ...newConversation[lastIndex],
              parts: [
                {
                  ...parts[0],
                  text: chunk?.startsWith("[thought]")
                    ? parts[0].text + chunk.replace("[thought]", "")
                    : parts[0].text,
                },
                {
                  text: !chunk?.startsWith("[thought]")
                    ? parts[1].text + chunk
                    : parts[1].text,
                },
              ],
            };
            return newConversation;
          });
        }
        return response;
      } else {
        setConversation((prev) => [
          ...prev,
          { role: "model", parts: [{ text: "" }] },
        ]);
        // panggil response
        const response = await handleChatStreaming(
          conversation,
          isThinking,
          mode,
        );
        // panggil satu satu dengan looping
        for await (const chunk of response) {
          setConversation((prev) => {
            const newConversation = [...prev];
            // ambil indeks terakhir dari conversation yang ada
            const lastIndex = newConversation.length - 1;
            newConversation[lastIndex] = {
              ...newConversation[lastIndex],
              parts: [
                { text: newConversation[lastIndex].parts[0].text + chunk },
              ],
            };
            return newConversation;
          });
        }
        return response;
      }
    },
    // !!!!!!!!!! ERROR BELUM KEHANDLE, SEHINGGA PERLU
    onError: (error) => {
      const botMessage = {
        role: "model",
        parts: [{ text: "Terjadi kesalahan: " + error.message }],
      };
      setConversation((prev) => [...prev, botMessage]);
    },
  });
  function sendMessage(message: string) {
    const newMessage = {
      role: "user",
      parts: [{ text: message }],
    };
    setConversation((prev) => [...prev, newMessage]);
    // handleChatWithThinkingMutation(message);
    handleChatMutation({ isThinking: isThinking });
  }

  //
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [conversation]);

  return (
    <Drawer direction="right" modal={false}>
      <DrawerTrigger className="fixed bottom-4 right-4" asChild>
        <Button
          className="size-14 rounded-full "
          variant={"outline"}
          size="icon-lg"
        >
          <BotIcon className="size-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-screen! md:w-28">
        <DrawerHeader className="flex flex-row justify-between">
          <div>
            <DrawerTitle className="text-primary font-bold">
              AI Financial Advisor
            </DrawerTitle>
            <DrawerDescription>
              Get personalized financial advise
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant={"outline"} size={"icon"}>
              <XIcon />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div id="chatbox" className="no-scrollbar overflow-y-auto px-4 h-full">
          {conversation.length > 0 ? (
            <div
              ref={chatRef}
              className="flex flex-col h-full overflow-x-hidden no-scrollbar overflow-y-auto gap-8"
            >
              {conversation.map((message, idx) => (
                <div
                  key={`conversation-${idx}`}
                  className={cn(
                    "flex flex-col gap-2",
                    message.role === "model" ? "items-start" : "items-end",
                  )}
                >
                  <div
                    className={cn("flex flex-col w-full", {
                      "bg-primary text-white px-5 py-2 rounded-3xl rounded-br-md w-fit max-w-3/4":
                        message.role === "user",
                    })}
                  >
                    {message.role === "model" && (
                      <div className="flex items-center text-xs gap-1  text-primary font-semibold">
                        <BotIcon />
                        AI Advisor
                      </div>
                    )}
                    {/* karena modelnya markdown, maka harus pakai tag <pre/> atau install dependency react markdown */}
                    {message.role === "model" ? (
                      <div className="response-ai">
                        {message.parts.map((part, idxPart) => (
                          <div key={`response-ai-${idx}-${idxPart}`}>
                            {part.thought ? (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant={"ghost"}>
                                    <ChevronDownIcon />
                                    Tampilkan alur berpikir
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="border-l pl-2 ml-4 text-xs">
                                    <Markdown>{part.text}</Markdown>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              <Markdown>{part.text}</Markdown>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>{message.parts[0].text}</div>
                    )}
                  </div>
                </div>
              ))}
              {/* {isPendingChatWithThinking && (
                <div className="flex items-center animate-pulse">
                  <EllipsisIcon className="size-8 text-primary/50" />
                </div>
              )} */}
              {isPending && (
                <div className="flex items-center animate-pulse">
                  <EllipsisIcon className="size-8 text-primary/50" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-3xl font-bold text-primary">Hello There!</h2>
              <h4 className="text-xl">What can I help you?</h4>
            </div>
          )}
        </div>
        <DrawerFooter>
          <ChatbotTextarea
            isThinking={isThinking}
            setIsThinking={setIsThinking}
            sendMessage={sendMessage}
            mode={mode}
            setMode={setMode}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatbotDrawer;
