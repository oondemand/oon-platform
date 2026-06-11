import { useState } from "react";
import { Box, Button, Flex, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useOonApi } from "../api/ApiProvider";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CoreAssistantProps {
  /** code do assistente registrado no back (ex.: "servicos-tomados.revisao"). */
  assistantCode: string;
  label?: string;
  /** entidade de contexto (apenas tipo + id; nada sensível). */
  entity?: { type: string; id: string };
  /** base de assistentes; default usa o mesmo client REST do Core. */
  endpoint?: string;
}

/**
 * Assistente IA do Core (Seção 2.12 / 6.2). Envia ao back apenas
 * assistantCode + entity + message — NUNCA chave de IA, modelo ou prompt.
 * O back resolve modelo, prompt, chave e políticas.
 */
export function CoreAssistant({ assistantCode, label = "Assistente", entity, endpoint = "/assistant-runs" }: CoreAssistantProps) {
  const { http } = useOonApi();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");

  const ask = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await http.post<{ reply?: string; message?: string }>(
        endpoint,
        {
          assistantCode,
          entity,
          message,
          // Contexto redigido: a Central pode enriquecer, mas o Core não envia PII por padrão.
          context: { redactionPolicy: "default" },
        },
        { headers: { "x-oon-origin": "assistant" } }
      );
      return data.reply ?? data.message ?? "";
    },
    onSuccess: (reply) => setMessages((prev) => [...prev, { role: "assistant", content: reply }]),
  });

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    ask.mutate(text);
  };

  return (
    <Stack gap={4} maxW="560px">
      <Heading size="md">{label}</Heading>
      <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={4} minH="240px">
        <Stack gap={3}>
          {messages.length === 0 ? (
            <Text color="gray.400" fontSize="sm">
              Faça uma pergunta ao assistente.
            </Text>
          ) : (
            messages.map((m, idx) => (
              <Flex key={idx} justify={m.role === "user" ? "flex-end" : "flex-start"}>
                <Box
                  bg={m.role === "user" ? "blue.500" : "gray.100"}
                  color={m.role === "user" ? "white" : "gray.800"}
                  px={3}
                  py={2}
                  borderRadius="md"
                  maxW="80%"
                  fontSize="sm"
                >
                  {m.content}
                </Box>
              </Flex>
            ))
          )}
          {ask.isPending ? (
            <Text color="gray.400" fontSize="sm">
              Pensando…
            </Text>
          ) : null}
          {ask.isError ? (
            <Text color="red.600" fontSize="sm">
              {ask.error?.message}
            </Text>
          ) : null}
        </Stack>
      </Box>
      <Flex gap={2}>
        <Input
          size="sm"
          value={input}
          placeholder="Digite sua mensagem..."
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <Button size="sm" colorPalette="blue" onClick={send} loading={ask.isPending}>
          Enviar
        </Button>
      </Flex>
    </Stack>
  );
}
