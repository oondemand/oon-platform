import { describe, it, expect } from "vitest";
import type { AxiosInstance } from "axios";
import type { ModelSummary } from "../src/types";
import { manifestToConfig, type CentralUiManifest } from "../src/manifest";
import { columnsFromMeta, formFieldsFromMeta } from "../src/components/internal/fieldUtils";
import { createResourceClient } from "../src/api/resourceClient";

/**
 * Critério de pronto da Fase 3 (Seção 6): a model `Cotacao`, declarada só com
 * `defineModel` no back, sobe a tela completa em `mode: "dynamic"` sem código
 * de UI. Este teste usa a metadata REAL emitida pelo oonCore-back para a
 * Cotacao do central-exemplo (capturada via /core/models/Cotacao) e verifica
 * que o pipeline dinâmico do front deriva endpoint, colunas e formulário.
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
    { name: "valorConvertido", kind: "currencyConverted", base: "BRL", label: "Valor (BRL)" },
    { name: "validade", kind: "date", label: "Validade" },
    { name: "status", kind: "enum", options: ["rascunho", "enviada", "aprovada", "recusada"], label: "Status" },
  ],
};

describe("Cotacao dynamic — critério de aceite", () => {
  it("manifest central.ui.json vira config com a coleção dynamic", () => {
    const manifest: CentralUiManifest = {
      name: "Central Exemplo",
      slug: "central-exemplo",
      navigation: { mode: "auto" },
      collections: [{ model: "Cotacao", mode: "dynamic" }],
      pipelines: [{ model: "Servico", stageField: "statusProcessamento", label: "Serviços" }],
    };

    const config = manifestToConfig(manifest, { apiBaseUrl: "http://localhost:4000" });

    expect(config.app.id).toBe("central-exemplo");
    expect(config.api.baseUrl).toBe("http://localhost:4000");

    const cotacaoView = config.ui?.views.find((v) => v.type === "collection" && v.model === "Cotacao");
    expect(cotacaoView).toBeTruthy();
    expect(cotacaoView).toMatchObject({ type: "collection", mode: "dynamic" });

    const pipelineView = config.ui?.views.find((v) => v.type === "pipeline");
    expect(pipelineView).toMatchObject({ type: "pipeline", model: "Servico", stageField: "statusProcessamento" });
  });

  it("deriva colunas da metadata (grid sem código de UI)", () => {
    const cols = columnsFromMeta(cotacaoSchema.fields).map((c) => c.field);
    // campos de negócio presentes; nada de _id/__v.
    expect(cols).toContain("descricao");
    expect(cols).toContain("valor");
    expect(cols).toContain("status");
    expect(cols).not.toContain("_id");
  });

  it("deriva o formulário, preservando opções do enum status", () => {
    const form = formFieldsFromMeta(cotacaoSchema.fields);
    const status = form.find((f) => f.field === "status");
    expect(status?.options).toEqual(["rascunho", "enviada", "aprovada", "recusada"]);
    const valor = form.find((f) => f.field === "valor");
    expect(valor?.kind).toBe("currency");
  });

  it("resolve o endpoint real (/cotacoes) e monta a chamada de listagem", async () => {
    const calls: string[] = [];
    const http = {
      get: async (url: string, cfg?: { params?: unknown }) => {
        calls.push(url + (cfg?.params ? `?${new URLSearchParams(cfg.params as Record<string, string>)}` : ""));
        return { data: { results: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } } };
      },
    } as unknown as AxiosInstance;

    // o front usa schema.basePath — não o ingênuo /<model>s, que daria /cotacaos.
    const client = createResourceClient(http, cotacaoSchema.basePath);
    await client.list({ pageIndex: 0, pageSize: 20 });
    expect(calls[0]).toContain("/cotacoes");
    expect(calls[0]).not.toContain("/cotacaos");
  });
});
