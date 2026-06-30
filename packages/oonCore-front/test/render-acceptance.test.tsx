// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import type { AxiosInstance } from "axios";
import { ApiProvider } from "../src/api/ApiProvider";
import { CoreCollection } from "../src/components/CoreCollection";
import type { ModelSummary } from "../src/types";

/**
 * Render real (happy-dom) do critério de pronto da Fase 3: `<CoreCollection
 * model="Cotacao" mode="dynamic" />` monta a TELA inteira (heading + grid com
 * colunas derivadas + linhas + ação "Novo") a partir só da metadata, sem
 * nenhuma página/coluna/form escritos à mão.
 */
const cotacaoSchema: ModelSummary = {
  name: "Cotacao",
  singular: "cotacao",
  basePath: "/cotacoes",
  crud: true,
  roles: { write: ["admin"] },
  searchable: ["descricao"],
  fields: [
    { name: "cliente", kind: "ref", ref: "Pessoa", label: "Cliente" },
    { name: "descricao", kind: "string", label: "Descrição", searchable: true },
    { name: "valor", kind: "currency", label: "Valor" },
    { name: "moeda", kind: "currencyCode", label: "Moeda" },
    { name: "status", kind: "enum", options: ["rascunho", "enviada", "aprovada", "recusada"], label: "Status" },
  ],
};

const rows = [
  { _id: "1", descricao: "Proposta A", valor: 1500, moeda: "USD", status: "rascunho" },
  { _id: "2", descricao: "Proposta B", valor: 2300, moeda: "EUR", status: "aprovada" },
];

/** Fake do client REST: responde /core/models/:name e o CRUD do recurso. */
function fakeHttp(): AxiosInstance {
  return {
    get: async (url: string) => {
      if (url === "/core/models/Cotacao") return { data: cotacaoSchema };
      if (url.startsWith("/cotacoes")) {
        return {
          data: { results: rows, pagination: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 20 } },
        };
      }
      throw new Error(`URL inesperada no teste: ${url}`);
    },
    post: async () => ({ data: {} }),
  } as unknown as AxiosInstance;
}

beforeAll(() => {
  // Chakra consulta matchMedia para breakpoints; happy-dom não implementa.
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

function renderCollection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChakraProvider value={defaultSystem}>
        <ApiProvider http={fakeHttp()}>
          <CoreCollection model="Cotacao" mode="dynamic" />
        </ApiProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

describe("CoreCollection — render dinâmico da Cotacao", () => {
  it("monta heading, colunas derivadas, linhas e ação Novo sem código de UI", async () => {
    renderCollection();

    // Heading (nome da model vindo da metadata).
    expect(await screen.findByText("Cotacao")).toBeTruthy();

    // Colunas derivadas da metadata (labels dos campos).
    expect(await screen.findByText("Descrição")).toBeTruthy();
    expect(screen.getByText("Valor")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();

    // Linhas do recurso /cotacoes.
    expect(await screen.findByText("Proposta A")).toBeTruthy();
    expect(screen.getByText("Proposta B")).toBeTruthy();

    // Valor formatado como moeda pela célula do Core.
    expect(screen.getByText(/R\$\s?1\.500,00/)).toBeTruthy();

    // Ação de criar registro. Aceita o prefixo visual "+" do padrão Minexco.
    expect(screen.getByRole("button", { name: /Novo/ })).toBeTruthy();
  });
});
