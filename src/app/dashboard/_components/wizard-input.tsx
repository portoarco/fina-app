"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { handleWizardTools } from "@/features/ai/wizard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Loader2Icon,
  MicIcon,
  SendIcon,
  SparkleIcon,
  SquareIcon,
} from "lucide-react";
import { KeyboardEvent, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Markdown from "react-markdown";
import { toast } from "sonner";
import z from "zod";
const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

const WizardInput = ({ refetch }: { refetch: () => void }) => {
  // recording format
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  //
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });
  // wizard input mutation
  const { mutate, isPending } = useMutation({
    // ----- CARA SETELAH WIZARD INPUT
    // mutationFn: async (message: string) => {
    //   const aiResponse = await handleWizardInput(message);
    //   if (!aiResponse) throw new Error("Failed to process AI Input");
    //   return createTransaction(aiResponse);
    // },
    // -----
    // --- CARA FUNCTION CALLING - AI DECIDE FUNC AUTOMATICALLY ---
    // mutationFn: handleWizardInput,
    mutationFn: handleWizardTools,
    onSuccess: (response) => {
      // toast.success("Transaction created successfully");
      toast.success(
        <div className="response-ai w-full!">
          <Markdown>{response}</Markdown>
        </div>,
      );
      form.reset();
      refetch();
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process request",
      );
    },
  });
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // form.reset();
    // mutate(data.message);
    const formData = new FormData();
    formData.append("type", "text");
    formData.append("file", "");
    formData.append("request", data.message);
    mutate(formData);
  };
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(form.getValues());
    }
  }
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("type", "audio");
        formData.append("request", "");
        formData.append("file", audioBlob);
        mutate(formData);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to access media recorder");
    }
  }

  // cari dokumentasinya di media recorder chrome
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const isText = form.watch("message") !== "";
  return (
    <Card className="w-full border-primary/20 p-0">
      <CardContent className="pr-3">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center gap-2"
        >
          <div className="text-primary">
            <SparkleIcon className="size-5" />
          </div>
          <Controller
            control={form.control}
            name="message"
            render={({ field, fieldState }) => (
              <Field>
                <input
                  {...field}
                  id="form-message"
                  placeholder={
                    isRecording
                      ? "Listening..."
                      : isPending && !field.value
                        ? "Processing your request..."
                        : "Manage Your Transaction here..."
                  }
                  autoComplete="off"
                  className="h-14 focus:outline-none"
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                />
              </Field>
            )}
          />
          <Button
            type={isText ? "submit" : "button"}
            size={"icon"}
            variant={"ghost"}
            disabled={isPending}
            onClick={
              !isText
                ? isRecording
                  ? stopRecording
                  : startRecording
                : undefined
            }
          >
            {isPending ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : isText ? (
              <SendIcon className="size-5" />
            ) : isRecording ? (
              <SquareIcon className="size-5 text-red-500 animate-pulse fill-red-500 " />
            ) : (
              <MicIcon className="size-5" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WizardInput;
