import type { AxiosInstance } from "axios";
import type { CoreMetadata, ModelSummary } from "../types";

/**
 * SDK do contrato /core/* (introspecção dirigida por metadata). É o que
 * permite o modo "dynamic" das coleções: o front monta grid/form/rotas a
 * partir do que o back descreve, sem código de UI por entidade.
 */
export interface CoreClient {
  metadata(): Promise<CoreMetadata>;
  models(): Promise<ModelSummary[]>;
  model(name: string): Promise<ModelSummary>;
  permissions(): Promise<Array<{ resource: string; action: string; roles: string[] }>>;
  menus(): Promise<CoreMetadata["menus"]>;
}

export function createCoreClient(http: AxiosInstance): CoreClient {
  return {
    async metadata() {
      const { data } = await http.get<CoreMetadata>("/core/metadata");
      return data;
    },
    async models() {
      const { data } = await http.get<{ results: ModelSummary[] }>("/core/models");
      return data.results;
    },
    async model(name) {
      const { data } = await http.get<ModelSummary>(`/core/models/${name}`);
      return data;
    },
    async permissions() {
      const { data } = await http.get<{ results: Array<{ resource: string; action: string; roles: string[] }> }>(
        "/core/permissions"
      );
      return data.results;
    },
    async menus() {
      const { data } = await http.get<{ results: CoreMetadata["menus"] }>("/core/menus");
      return data.results;
    },
  };
}
