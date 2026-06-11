const { defineValidation, GenericError } = require("@oondemand/oon-core-back");

/**
 * Validação de domínio da Pessoa. Roda antes de create/update no CRUD.
 * O dev escreve só a regra; o Core decide quando aplicá-la.
 */
defineValidation("Pessoa", async (data, { op }) => {
  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    throw new GenericError("E-mail inválido.", { statusCode: 422 });
  }
  if ((data.tipo === "pf" || data.tipo === "pj") && !data.documento) {
    throw new GenericError("Documento é obrigatório para PF/PJ.", {
      statusCode: 422,
      details: { campo: "documento", op },
    });
  }
});
