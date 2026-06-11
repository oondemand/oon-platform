import type {
  CollectionViewDef,
  DashboardViewDef,
  DocumentViewDef,
  OonModule,
  PipelineViewDef,
} from "../types";

/**
 * Helpers declarativos (API pública da Seção 4.3). São identidades tipadas que
 * fixam o `type` da view — servem para o autocomplete e para registrar a view
 * num módulo ou no `ui.views` da config.
 */

export function defineCollectionView(def: Omit<CollectionViewDef, "type">): CollectionViewDef {
  return { type: "collection", ...def };
}

export function defineDocumentView(def: Omit<DocumentViewDef, "type">): DocumentViewDef {
  return { type: "document", ...def };
}

export function definePipelineView(def: Omit<PipelineViewDef, "type">): PipelineViewDef {
  return { type: "pipeline", ...def };
}

export function defineDashboard(def: Omit<DashboardViewDef, "type">): DashboardViewDef {
  return { type: "dashboard", ...def };
}

/** Açúcar para declarar um módulo com tipagem. */
export function defineOonModule(mod: OonModule): OonModule {
  return mod;
}
