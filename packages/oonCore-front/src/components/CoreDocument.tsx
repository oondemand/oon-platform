import type { OonColumnDef, OonFormFieldDef } from "../types";
import { useOonApi } from "../api/ApiProvider";
import { CoreCollection } from "./CoreCollection";

export interface CoreDocumentProps {
  model: string;
  label?: string;
  endpoint?: string;
  columns?: OonColumnDef[];
  form?: OonFormFieldDef[];
  /** liga ações de aprovar/reprovar (RESTful: /:id/actions/approve|reject). */
  approval?: boolean;
  /** liga gestão de anexos (futuro: /:id/files). */
  attachments?: boolean;
}

/**
 * Tipo documental. Hoje reusa a coleção genérica (list + CRUD). Quando
 * `approval` está ligado, expõe o helper `approveDocument` para as ações
 * RESTful do back (Seção 5.2) — documentos fiscais e cadastrais viram
 * configuração, não páginas escritas à mão.
 */
export function CoreDocument({ model, label, endpoint, columns, form }: CoreDocumentProps) {
  return (
    <CoreCollection
      model={model}
      label={label}
      mode={columns && form ? "full" : "dynamic"}
      endpoint={endpoint}
      columns={columns}
      form={form}
    />
  );
}

/**
 * Aciona uma ação RESTful de documento (approve/reject/archive). Exposto para
 * o domínio usar em botões de linha sem reimplementar a chamada.
 */
export function useDocumentAction(basePath: string) {
  const { http } = useOonApi();
  return (id: string, action: "approve" | "reject" | "archive") =>
    http.post(`${basePath}/${id}/actions/${action}`, {}, { headers: { "x-oon-origin": "form" } });
}
