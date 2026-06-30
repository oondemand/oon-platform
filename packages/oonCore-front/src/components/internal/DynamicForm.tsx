import { useEffect, useState, type FormEvent } from "react";
import { Box, Button, Flex, Heading, Input, NativeSelect, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import type { OonFormFieldDef } from "../../types";
import { fieldLabel } from "./fieldUtils";
import { ReferenceSelect } from "./ReferenceSelect";

export interface DynamicFormProps {
  title: string;
  fields: OonFormFieldDef[];
  initialValues?: Record<string, unknown>;
  submitting?: boolean;
  error?: unknown;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
  onFieldChange?: () => void;
}

type FieldErrors = Record<string, string>;

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

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function fieldControlId(field: string): string {
  return `oon-form-field-${field.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function fieldErrorId(field: string): string {
  return `${fieldControlId(field)}-error`;
}

function validateRequired(fields: OonFormFieldDef[], values: Record<string, string>): FieldErrors {
  const validation: FieldErrors = {};
  for (const field of fields) {
    if (field.required && !(values[field.field] ?? "").trim()) {
      validation[field.field] = `${fieldLabel({ name: field.field, label: field.label })} é obrigatório.`;
    }
  }
  return validation;
}

function errorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    const envelope = record.error;
    if (envelope && typeof envelope === "object" && typeof (envelope as Record<string, unknown>).message === "string") {
      return (envelope as Record<string, unknown>).message as string;
    }
  }
  return "Não foi possível salvar o registro.";
}

function isValidationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    const message = normalize(errorMessage(error));
    return message.includes("validacao") || message.includes("validation");
  }
  const record = error as Record<string, unknown>;
  const code = normalize(record.code);
  const message = normalize(errorMessage(error));
  return code.includes("validation") || message.includes("validacao") || message.includes("validation");
}

function serverDetails(error: unknown): unknown {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  if (record.details != null) return record.details;

  const envelope = record.error;
  if (envelope && typeof envelope === "object") {
    const nested = envelope as Record<string, unknown>;
    if (nested.details != null) return nested.details;
  }

  const response = record.response;
  if (response && typeof response === "object") {
    const data = (response as Record<string, unknown>).data;
    if (data && typeof data === "object") {
      const dataRecord = data as Record<string, unknown>;
      const dataEnvelope = dataRecord.error;
      if (dataEnvelope && typeof dataEnvelope === "object") {
        return (dataEnvelope as Record<string, unknown>).details ?? dataEnvelope;
      }
      return dataRecord.details ?? dataRecord.errors ?? dataRecord;
    }
  }

  return null;
}

function extractServerFieldErrors(error: unknown, fields: OonFormFieldDef[]): FieldErrors {
  const result: FieldErrors = {};
  const byName = new Map<string, OonFormFieldDef>();

  for (const field of fields) {
    byName.set(normalize(field.field), field);
    byName.set(normalize(field.label), field);
  }

  const resolveField = (candidate: unknown) => {
    if (typeof candidate !== "string") return undefined;
    const pieces = candidate.split(/[.[\]]+/).filter(Boolean);
    for (const piece of [candidate, ...pieces].reverse()) {
      const match = byName.get(normalize(piece.replace(/[`'\"]/g, "")));
      if (match) return match;
    }
    return undefined;
  };

  const friendlyMessage = (field: OonFormFieldDef, raw: unknown) => {
    const label = fieldLabel({ name: field.field, label: field.label });
    const message = typeof raw === "string" && raw.trim() ? raw.trim() : "Revise o valor informado.";
    const normalized = normalize(message);
    if (normalized.includes("required") || normalized.includes("obrigatorio")) return `${label} é obrigatório.`;
    return message.replace(/Path\s+[`'\"]?[^`'\"\s]+[`'\"]?/i, label);
  };

  const visited = new WeakSet<object>();
  const visit = (value: unknown, keyHint?: string) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, keyHint));
      return;
    }
    if (typeof value === "string") {
      const field = resolveField(keyHint);
      if (field) result[field.field] = friendlyMessage(field, value);
      return;
    }
    if (typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);

    const record = value as Record<string, unknown>;
    const candidate = record.field ?? record.path ?? record.property ?? record.name ?? record.key ?? keyHint;
    const field = resolveField(candidate);
    const message = record.message ?? record.msg ?? record.reason ?? record.error;
    if (field && (typeof message === "string" || message == null)) {
      result[field.field] = friendlyMessage(field, message);
    }

    for (const [key, nested] of Object.entries(record)) {
      const directField = resolveField(key);
      if (directField) {
        if (typeof nested === "string") {
          result[directField.field] = friendlyMessage(directField, nested);
        } else if (nested && typeof nested === "object") {
          const nestedRecord = nested as Record<string, unknown>;
          result[directField.field] = friendlyMessage(
            directField,
            nestedRecord.message ?? nestedRecord.msg ?? nestedRecord.reason
          );
        }
      }

      if (["errors", "details", "fields", "validation", "violations", "issues"].includes(key) || !directField) {
        visit(nested, key);
      }
    }
  };

  visit(serverDetails(error));
  return result;
}

function focusField(field: string) {
  window.setTimeout(() => {
    const control = document.getElementById(fieldControlId(field)) as HTMLElement | null;
    control?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    control?.focus({ preventScroll: true });
  }, 0);
}

/** Formulário dinâmico em diálogo, com duas colunas e validação detalhada por campo. */
export function DynamicForm({
  title,
  fields,
  initialValues,
  submitting,
  error,
  onSubmit,
  onCancel,
  onFieldChange,
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of fields) init[field.field] = toInputValue(initialValues?.[field.field], field.kind);
    return init;
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [dismissedError, setDismissedError] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || submitting) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[role="combobox"], [role="listbox"]')) return;
      onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel, submitting]);

  useEffect(() => {
    setDismissedError(false);
    if (!error) return;

    const serverErrors = extractServerFieldErrors(error, fields);
    const fallbackErrors = isValidationError(error) ? validateRequired(fields, values) : {};
    const nextErrors = Object.keys(serverErrors).length ? serverErrors : fallbackErrors;

    if (Object.keys(nextErrors).length) {
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      const first = fields.find((field) => nextErrors[field.field]);
      if (first) focusField(first.field);
    }
    // O erro só muda quando uma nova tentativa de persistência é concluída.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const setField = (name: string, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
    setDismissedError(true);
    onFieldChange?.();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateRequired(fields, values);

    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      setDismissedError(true);
      const first = fields.find((field) => validation[field.field]);
      if (first) focusField(first.field);
      return;
    }

    setFieldErrors({});
    setDismissedError(false);
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const coerced = coerce(values[field.field] ?? "", field.kind);
      if (coerced !== undefined) payload[field.field] = coerced;
    }
    onSubmit(payload);
  };

  const invalidFields = fields
    .filter((field) => fieldErrors[field.field])
    .map((field) => ({ field: field.field, message: fieldErrors[field.field] }));
  const genericError = dismissedError ? null : errorMessage(error);
  const showGenericError = genericError && !(isValidationError(error) && invalidFields.length > 0);

  return (
    <Flex
      position="fixed"
      inset={0}
      zIndex={1000}
      align="center"
      justify="center"
      p={{ base: 3, md: 6 }}
      bg="rgba(7, 38, 46, 0.42)"
      backdropFilter="blur(3px)"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !submitting) onCancel();
      }}
    >
      <Box
        bg="white"
        borderRadius="14px"
        boxShadow="0 24px 70px rgba(7, 38, 46, 0.28)"
        w="100%"
        maxW="900px"
        maxH="92vh"
        overflow="hidden"
      >
        <Flex px={{ base: 4, md: 6 }} py={4} align="center" borderBottomWidth="1px" borderColor="#E8ECEF" bg="#FCFDFD">
          <Box>
            <Text fontSize="10px" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.08em">
              Cadastro
            </Text>
            <Heading size="md" color="#24323A">
              {title}
            </Heading>
          </Box>
          <Button ml="auto" size="sm" variant="ghost" borderRadius="8px" type="button" disabled={submitting} onClick={onCancel}>
            Fechar
          </Button>
        </Flex>

        <Box as="form" noValidate onSubmit={handleSubmit}>
          <Box px={{ base: 4, md: 6 }} py={5} maxH="calc(92vh - 142px)" overflowY="auto">
            <Stack gap={4}>
              {invalidFields.length > 0 ? (
                <Box role="alert" aria-live="assertive" borderWidth="1px" borderColor="red.200" borderLeftWidth="4px" borderLeftColor="red.500" bg="red.50" borderRadius="9px" px={4} py={3}>
                  <Text fontSize="12px" fontWeight="700" color="red.700" mb={1}>
                    Não foi possível salvar. Corrija os campos abaixo:
                  </Text>
                  <Stack as="ul" gap={0.5} pl={4}>
                    {invalidFields.map(({ field, message }) => (
                      <Box as="li" key={field} color="red.700" fontSize="12px">
                        <Button
                          type="button"
                          variant="plain"
                          minH="auto"
                          h="auto"
                          p={0}
                          color="red.700"
                          fontSize="12px"
                          fontWeight="500"
                          textDecoration="underline"
                          textUnderlineOffset="2px"
                          whiteSpace="normal"
                          textAlign="left"
                          onClick={() => focusField(field)}
                        >
                          {message}
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {showGenericError ? (
                <Box role="alert" borderWidth="1px" borderColor="red.200" borderLeftWidth="4px" borderLeftColor="red.500" bg="red.50" borderRadius="9px" px={4} py={3}>
                  <Text fontSize="12px" color="red.700">
                    {genericError}
                  </Text>
                </Box>
              ) : null}

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {fields.map((field) => {
                  const label = fieldLabel({ name: field.field, label: field.label });
                  const validationMessage = fieldErrors[field.field];
                  const controlId = fieldControlId(field.field);
                  const errorId = validationMessage ? fieldErrorId(field.field) : undefined;

                  if (field.kind === "ref" && field.ref) {
                    return (
                      <ReferenceSelect
                        key={field.field}
                        field={field.field}
                        inputId={controlId}
                        errorId={errorId}
                        label={label}
                        refModel={field.ref}
                        value={values[field.field] ?? ""}
                        initialValue={initialValues?.[field.field]}
                        required={field.required}
                        invalid={!!validationMessage}
                        error={validationMessage}
                        onChange={(value) => setField(field.field, value)}
                      />
                    );
                  }

                  if (field.kind === "enum" && field.options?.length) {
                    return (
                      <Box key={field.field}>
                        <Text as="label" htmlFor={controlId} fontSize="12px" mb={1} fontWeight="600" color="#46545C">
                          {label}{field.required ? <Text as="span" color="red.500"> *</Text> : null}
                        </Text>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            id={controlId}
                            required={field.required}
                            aria-required={field.required}
                            aria-invalid={!!validationMessage}
                            aria-describedby={errorId}
                            value={values[field.field] ?? ""}
                            borderRadius="8px"
                            borderColor={validationMessage ? "red.400" : "#DDE3E7"}
                            boxShadow={validationMessage ? "0 0 0 3px rgba(220, 38, 38, 0.10)" : undefined}
                            onChange={(event) => setField(field.field, event.currentTarget.value)}
                          >
                            <option value="">Selecione...</option>
                            {field.options.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        {validationMessage ? <Text id={errorId} role="alert" fontSize="11px" color="red.600" mt={1}>{validationMessage}</Text> : null}
                      </Box>
                    );
                  }

                  if (field.kind === "boolean") {
                    return (
                      <Box key={field.field}>
                        <Text as="label" htmlFor={controlId} fontSize="12px" mb={1} fontWeight="600" color="#46545C">
                          {label}{field.required ? <Text as="span" color="red.500"> *</Text> : null}
                        </Text>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            id={controlId}
                            required={field.required}
                            aria-required={field.required}
                            aria-invalid={!!validationMessage}
                            aria-describedby={errorId}
                            value={values[field.field] ?? ""}
                            borderRadius="8px"
                            borderColor={validationMessage ? "red.400" : "#DDE3E7"}
                            boxShadow={validationMessage ? "0 0 0 3px rgba(220, 38, 38, 0.10)" : undefined}
                            onChange={(event) => setField(field.field, event.currentTarget.value)}
                          >
                            <option value="">Selecione...</option>
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        {validationMessage ? <Text id={errorId} role="alert" fontSize="11px" color="red.600" mt={1}>{validationMessage}</Text> : null}
                      </Box>
                    );
                  }

                  const inputType =
                    field.kind === "date"
                      ? "date"
                      : field.kind === "number" || field.kind === "currency" || field.kind === "currencyConverted"
                        ? "number"
                        : "text";

                  return (
                    <Box key={field.field}>
                      <Text as="label" htmlFor={controlId} fontSize="12px" mb={1} fontWeight="600" color="#46545C">
                        {label}{field.required ? <Text as="span" color="red.500"> *</Text> : null}
                      </Text>
                      <Input
                        id={controlId}
                        size="sm"
                        type={inputType}
                        required={field.required}
                        aria-required={field.required}
                        aria-invalid={!!validationMessage}
                        aria-describedby={errorId}
                        borderRadius="8px"
                        borderColor={validationMessage ? "red.400" : "#DDE3E7"}
                        boxShadow={validationMessage ? "0 0 0 3px rgba(220, 38, 38, 0.10)" : undefined}
                        value={values[field.field] ?? ""}
                        onChange={(event) => setField(field.field, event.currentTarget.value)}
                        _focusVisible={{ borderColor: validationMessage ? "red.500" : "brand.500", boxShadow: `0 0 0 1px ${validationMessage ? "#E53E3E" : "#0474AF"}` }}
                      />
                      {validationMessage ? <Text id={errorId} role="alert" fontSize="11px" color="red.600" mt={1}>{validationMessage}</Text> : null}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Stack>
          </Box>

          <Flex px={{ base: 4, md: 6 }} py={4} gap={3} justify="end" borderTopWidth="1px" borderColor="#E8ECEF" bg="#FCFDFD">
            <Button size="sm" variant="outline" borderRadius="8px" type="button" disabled={submitting} onClick={onCancel}>
              Cancelar
            </Button>
            <Button size="sm" colorPalette="brand" borderRadius="8px" type="submit" loading={submitting}>
              Salvar
            </Button>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
}
