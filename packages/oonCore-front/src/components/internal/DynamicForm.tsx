import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Heading, Input, Stack, Text, NativeSelect } from "@chakra-ui/react";
import type { OonFormFieldDef } from "../../types";
import { fieldLabel } from "./fieldUtils";
import { ReferenceSelect } from "./ReferenceSelect";

export interface DynamicFormProps {
  title: string;
  fields: OonFormFieldDef[];
  initialValues?: Record<string, unknown>;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}

function coerce(value: string, kind?: string): unknown {
  if (value === "") return undefined;
  if (kind === "number" || kind === "currency" || kind === "currencyConverted") return Number(value);
  if (kind === "boolean") return value === "true";
  return value;
}

function toInputValue(value: unknown, kind?: string): string {
  if (value == null) return "";
  if (kind === "date" && value) {
    try {
      return new Date(value as string).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return String(obj._id ?? obj.id ?? "");
  }
  return String(value);
}

/**
 * Formulário gerado a partir das definições de campo (modo dynamic monta isto
 * direto da metadata). Render por `kind`: ref -> seletor pesquisável; enum ->
 * select; boolean -> select Sim/Não; date -> input date;
 * currency/number -> number; demais -> texto.
 */
export function DynamicForm({ title, fields, initialValues, submitting, error, onSubmit, onCancel }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) init[f.field] = toInputValue(initialValues?.[f.field], f.kind);
    return init;
  });

  const setField = (name: string, value: string) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const coerced = coerce(values[f.field] ?? "", f.kind);
      if (coerced !== undefined) payload[f.field] = coerced;
    }
    onSubmit(payload);
  };

  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={6} maxW="640px">
      <Heading size="md" mb={4}>
        {title}
      </Heading>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          {fields.map((f) => {
            const label = fieldLabel({ name: f.field, label: f.label });

            if (f.kind === "ref" && f.ref) {
              return (
                <ReferenceSelect
                  key={f.field}
                  field={f.field}
                  label={label}
                  refModel={f.ref}
                  value={values[f.field] ?? ""}
                  initialValue={initialValues?.[f.field]}
                  required={f.required}
                  onChange={(value) => setField(f.field, value)}
                />
              );
            }

            if (f.kind === "enum" && f.options?.length) {
              return (
                <Box key={f.field}>
                  <Text fontSize="sm" mb={1} fontWeight="medium">
                    {label}
                    {f.required ? " *" : ""}
                  </Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      required={f.required}
                      value={values[f.field] ?? ""}
                      onChange={(e) => setField(f.field, e.currentTarget.value)}
                    >
                      <option value="">—</option>
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
              );
            }

            if (f.kind === "boolean") {
              return (
                <Box key={f.field}>
                  <Text fontSize="sm" mb={1} fontWeight="medium">
                    {label}
                    {f.required ? " *" : ""}
                  </Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      required={f.required}
                      value={values[f.field] ?? ""}
                      onChange={(e) => setField(f.field, e.currentTarget.value)}
                    >
                      <option value="">—</option>
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
              );
            }

            const inputType =
              f.kind === "date"
                ? "date"
                : f.kind === "number" || f.kind === "currency" || f.kind === "currencyConverted"
                  ? "number"
                  : "text";
            return (
              <Box key={f.field}>
                <Text fontSize="sm" mb={1} fontWeight="medium">
                  {label}
                  {f.required ? " *" : ""}
                </Text>
                <Input
                  size="sm"
                  type={inputType}
                  required={f.required}
                  value={values[f.field] ?? ""}
                  onChange={(e) => setField(f.field, e.currentTarget.value)}
                />
              </Box>
            );
          })}

          {error ? (
            <Text fontSize="sm" color="red.600">
              {error}
            </Text>
          ) : null}

          <Flex gap={3} justify="end" mt={2}>
            <Button size="sm" variant="ghost" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button size="sm" colorPalette="blue" type="submit" loading={submitting}>
              Salvar
            </Button>
          </Flex>
        </Stack>
      </form>
    </Box>
  );
}
