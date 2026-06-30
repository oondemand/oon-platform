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

/** Formulário dinâmico em diálogo, com duas colunas e validação por campo. */
export function DynamicForm({ title, fields, initialValues, submitting, error, onSubmit, onCancel }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) init[f.field] = toInputValue(initialValues?.[f.field], f.kind);
    return init;
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel, submitting]);

  const setField = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validation: Record<string, string> = {};

    for (const f of fields) {
      if (f.required && !(values[f.field] ?? "").trim()) {
        validation[f.field] = `${fieldLabel({ name: f.field, label: f.label })} é obrigatório.`;
      }
    }

    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }

    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const coerced = coerce(values[f.field] ?? "", f.kind);
      if (coerced !== undefined) payload[f.field] = coerced;
    }
    onSubmit(payload);
  };

  const invalidFields = Object.values(fieldErrors);

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

        <Box as="form" onSubmit={handleSubmit}>
          <Box px={{ base: 4, md: 6 }} py={5} maxH="calc(92vh - 142px)" overflowY="auto">
            <Stack gap={4}>
              {invalidFields.length > 0 ? (
                <Box borderWidth="1px" borderColor="red.200" bg="red.50" borderRadius="9px" px={4} py={3}>
                  <Text fontSize="12px" fontWeight="700" color="red.700" mb={1}>
                    Corrija os campos abaixo para continuar:
                  </Text>
                  {invalidFields.map((message) => (
                    <Text key={message} fontSize="12px" color="red.700">
                      • {message}
                    </Text>
                  ))}
                </Box>
              ) : null}

              {error ? (
                <Box borderWidth="1px" borderColor="red.200" bg="red.50" borderRadius="9px" px={4} py={3}>
                  <Text fontSize="12px" color="red.700">
                    {error}
                  </Text>
                </Box>
              ) : null}

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {fields.map((f) => {
                  const label = fieldLabel({ name: f.field, label: f.label });
                  const fieldError = fieldErrors[f.field];

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
                        invalid={!!fieldError}
                        error={fieldError}
                        onChange={(value) => setField(f.field, value)}
                      />
                    );
                  }

                  if (f.kind === "enum" && f.options?.length) {
                    return (
                      <Box key={f.field}>
                        <Text fontSize="12px" mb={1} fontWeight="600" color="#46545C">
                          {label}{f.required ? <Text as="span" color="red.500"> *</Text> : null}
                        </Text>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            aria-required={f.required}
                            aria-invalid={!!fieldError}
                            value={values[f.field] ?? ""}
                            borderRadius="8px"
                            borderColor={fieldError ? "red.400" : "#DDE3E7"}
                            onChange={(e) => setField(f.field, e.currentTarget.value)}
                          >
                            <option value="">Selecione...</option>
                            {f.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        {fieldError ? <Text fontSize="11px" color="red.600" mt={1}>{fieldError}</Text> : null}
                      </Box>
                    );
                  }

                  if (f.kind === "boolean") {
                    return (
                      <Box key={f.field}>
                        <Text fontSize="12px" mb={1} fontWeight="600" color="#46545C">
                          {label}{f.required ? <Text as="span" color="red.500"> *</Text> : null}
                        </Text>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            aria-required={f.required}
                            aria-invalid={!!fieldError}
                            value={values[f.field] ?? ""}
                            borderRadius="8px"
                            borderColor={fieldError ? "red.400" : "#DDE3E7"}
                            onChange={(e) => setField(f.field, e.currentTarget.value)}
                          >
                            <option value="">Selecione...</option>
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        {fieldError ? <Text fontSize="11px" color="red.600" mt={1}>{fieldError}</Text> : null}
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
                      <Text fontSize="12px" mb={1} fontWeight="600" color="#46545C">
                        {label}{f.required ? <Text as="span" color="red.500"> *</Text> : null}
                      </Text>
                      <Input
                        size="sm"
                        type={inputType}
                        aria-invalid={!!fieldError}
                        borderRadius="8px"
                        borderColor={fieldError ? "red.400" : "#DDE3E7"}
                        value={values[f.field] ?? ""}
                        onChange={(e) => setField(f.field, e.currentTarget.value)}
                        _focusVisible={{ borderColor: fieldError ? "red.500" : "brand.500", boxShadow: `0 0 0 1px ${fieldError ? "#E53E3E" : "#0474AF"}` }}
                      />
                      {fieldError ? <Text fontSize="11px" color="red.600" mt={1}>{fieldError}</Text> : null}
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
