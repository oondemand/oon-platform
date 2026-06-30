// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import type { AxiosInstance } from "axios";
import { ApiProvider } from "../src/api/ApiProvider";
import { CoreCollection } from "../src/components/CoreCollection";
import { CorePipeline } from "../src/components/CorePipeline";
import type { ModelSummary } from "../src/types";

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

const viagemSchema: ModelSummary = {
  name: "Viagem",
  singular: "viagem",
  basePath: "/viagens",
  crud: true,
  roles: { write: ["admin"] },
  searchable: ["codigo", "origem", "destino"],
  fields: [
    { name: "codigo", kind: "string", label: "Código", searchable: true, required: true },
    { name: "origem", kind: "string", label: "Origem", searchable: true, required: true },
    { name: "destino", kind: "string", label: "Destino", searchable: true, required: true },
    { name: "dataSaida", kind: "date", label: "Data e hora de saída", required: true },
    { name: "capacidadeTotal", kind: "number", label: "Capacidade total" },
    { name: "observacoes", kind: "string", label: "Observações" },
    { name: "status", kind: "enum", options: ["planejamento", "aberta_venda", "embarque"], label: "Etapa" },
  ],
};

const cotacaoRows = [
  { _id: "1", descricao: "Proposta A", valor: 1500, moeda: "USD", status: "rascunho" },
  { _id: "2", descricao: "Proposta B", valor: 2300, moeda: "EUR", status: "aprovada" },
];

const viagemRows = [
  {
    _id: "v1",
    codigo: "VIA-001",
    origem: "São Paulo",
    destino: "Campinas",
    dataSaida: "2026-06-29T12:00:00.000Z",
    capacidadeTotal: 44,
    observacoes: "Embarque no terminal central",
    status: "planejamento",
  },
];

function fakeHttp(): AxiosInstance {
  return {
    get: async (url: string) => {
      if (url === "/core/models/Cotacao") return { data: cotacaoSchema };
      if (url === "/core/models/Viagem") return { data: viagemSchema };
      if (url.startsWith("/cotacoes")) {
        return { data: { results: cotacaoRows, pagination: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 20 } } };
      }
      if (url.startsWith("/viagens")) {
        return { data: { results: viagemRows, pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 200 } } };
      }
      throw new Error(`URL inesperada no teste: ${url}`);
    },
    post: async () => ({ data: {} }),
    put: async () => ({ data: {} }),
    patch: async () => ({ data: {} }),
  } as unknown as AxiosInstance;
}

beforeAll(() => {
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

function renderWithProviders(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChakraProvider value={defaultSystem}>
        <ApiProvider http={fakeHttp()}>{node}</ApiProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

describe("CoreCollection — render dinâmico da Cotacao", () => {
  it("monta heading, colunas derivadas, linhas e ação Novo sem código de UI", async () => {
    renderWithProviders(<CoreCollection model="Cotacao" mode="dynamic" />);

    expect(await screen.findByText("Cotacao")).toBeTruthy();
    expect(await screen.findByText("Descrição")).toBeTruthy();
    expect(screen.getByText("Valor")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
    expect(await screen.findByText("Proposta A")).toBeTruthy();
    expect(screen.getByText("Proposta B")).toBeTruthy();
    expect(screen.getByText(/R\$\s?1\.500,00/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Novo/ })).toBeTruthy();
  });
});

describe("CorePipeline — ticket em formulário modal", () => {
  it("abre todos os campos editáveis do ticket ao clicar no cartão", async () => {
    renderWithProviders(
      <CorePipeline
        model="Viagem"
        label="Operação de Viagens"
        stageField="status"
        stages={[
          { id: "planejamento", label: "Planejamento" },
          { id: "aberta_venda", label: "Aberta venda" },
          { id: "embarque", label: "Embarque" },
        ]}
      />
    );

    const ticket = await screen.findByRole("button", { name: "Abrir ticket VIA-001" });
    fireEvent.click(ticket);

    expect(await screen.findByRole("dialog", { name: "Editar viagem" })).toBeTruthy();
    expect(screen.getByLabelText(/Código/)).toHaveValue("VIA-001");
    expect(screen.getByLabelText(/Origem/)).toHaveValue("São Paulo");
    expect(screen.getByLabelText(/Destino/)).toHaveValue("Campinas");
    expect(screen.getByLabelText(/Capacidade total/)).toHaveValue(44);
    expect(screen.getByLabelText(/Observações/)).toHaveValue("Embarque no terminal central");
    expect(screen.getByLabelText(/Etapa/)).toHaveValue("planejamento");
  });
});
