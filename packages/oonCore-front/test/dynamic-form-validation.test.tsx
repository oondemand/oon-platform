// @vitest-environment happy-dom
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { DynamicForm } from "../src/components/internal/DynamicForm";
import type { OonFormFieldDef } from "../src/types";

const fields: OonFormFieldDef[] = [
  { field: "codigo", label: "Código", kind: "string", required: true },
  { field: "placa", label: "Placa", kind: "string", required: true },
  { field: "prefixo", label: "Prefixo", kind: "string" },
  { field: "capacidadePassageiros", label: "Capacidade de passageiros", kind: "number", required: true },
];

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

function renderForm(props: Partial<ComponentProps<typeof DynamicForm>> = {}) {
  const onSubmit = vi.fn();
  render(
    <ChakraProvider value={defaultSystem}>
      <DynamicForm
        title="Novo Veículos"
        fields={fields}
        onSubmit={onSubmit}
        onCancel={() => {}}
        {...props}
      />
    </ChakraProvider>
  );
  return { onSubmit };
}

describe("DynamicForm — validação detalhada", () => {
  it("lista, destaca e foca os campos obrigatórios", async () => {
    const { onSubmit } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Não foi possível salvar. Corrija os campos abaixo:")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Código é obrigatório." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Placa é obrigatório." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Capacidade de passageiros é obrigatório." })).toBeTruthy();

    const codigo = screen.getByRole("textbox", { name: /Código/ });
    const placa = screen.getByRole("textbox", { name: /Placa/ });
    expect(codigo.getAttribute("aria-invalid")).toBe("true");
    expect(placa.getAttribute("aria-invalid")).toBe("true");

    await waitFor(() => expect(document.activeElement).toBe(codigo));

    fireEvent.change(codigo, { target: { value: "VEI-001" } });
    expect(screen.queryByRole("button", { name: "Código é obrigatório." })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Placa é obrigatório." }));
    await waitFor(() => expect(document.activeElement).toBe(placa));
  });

  it("transforma detalhes de validação do backend em erro do campo", async () => {
    renderForm({
      error: {
        code: "VALIDATION_ERROR",
        message: "Erro de validação.",
        details: {
          errors: {
            placa: {
              path: "placa",
              message: "Path `placa` is required.",
            },
          },
        },
      },
    });

    expect(await screen.findByRole("button", { name: "Placa é obrigatório." })).toBeTruthy();
    expect(screen.queryByText("Erro de validação.")).toBeNull();
    expect(screen.getByRole("textbox", { name: /Placa/ }).getAttribute("aria-invalid")).toBe("true");
  });
});
