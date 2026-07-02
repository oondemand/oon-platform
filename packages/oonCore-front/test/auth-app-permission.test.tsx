// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { AxiosInstance } from "axios";
import { AuthProvider, useOonAuth } from "../src/security/AuthProvider";
import type { TokenStorage } from "../src/security/tokenStorage";

function createMemoryStorage(initial: string | null = null) {
  let token = initial;
  const storage: TokenStorage = {
    get: () => token,
    set: (value) => {
      token = value;
    },
    clear: () => {
      token = null;
    },
  };

  return { storage, current: () => token };
}

function AuthState() {
  const { status, user } = useOonAuth();
  return <span>{`${status}:${user?.email ?? ""}`}</span>;
}

function LoginAction() {
  const { login, status } = useOonAuth();
  return (
    <button type="button" onClick={() => void login("user@example.com", "senha-ç") }>
      {status}
    </button>
  );
}

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("AuthProvider — permissão do aplicativo", () => {
  it("mantém o token e marca acesso negado quando o backend retorna 403", async () => {
    const { storage, current } = createMemoryStorage("token-valido");
    const get = vi.fn(async () => {
      throw { code: "FORBIDDEN", message: "Sem permissão", status: 403 };
    });
    const http = { get } as unknown as AxiosInstance;

    render(
      <AuthProvider http={http} storage={storage}>
        <AuthState />
      </AuthProvider>,
    );

    expect(await screen.findByText("forbidden:")).toBeTruthy();
    expect(current()).toBe("token-valido");
  });

  it("limpa a sessão quando o backend retorna 401", async () => {
    const { storage, current } = createMemoryStorage("token-expirado");
    const get = vi.fn(async () => {
      throw { code: "UNAUTHORIZED", message: "Token inválido", status: 401 };
    });
    const http = { get } as unknown as AxiosInstance;

    render(
      <AuthProvider http={http} storage={storage}>
        <AuthState />
      </AuthProvider>,
    );

    expect(await screen.findByText("unauthenticated:")).toBeTruthy();
    expect(current()).toBeNull();
  });

  it("autentica, persiste o token e valida a permissão antes de liberar", async () => {
    const { storage, current } = createMemoryStorage();
    const post = vi.fn(async () => ({ data: { token: "novo-token" } }));
    const get = vi.fn(async () => ({
      data: {
        usuario: {
          tipo: "gestor",
          nome: "Usuário",
          email: "user@example.com",
        },
      },
    }));
    const http = { get, post } as unknown as AxiosInstance;

    render(
      <AuthProvider http={http} storage={storage}>
        <LoginAction />
      </AuthProvider>,
    );

    fireEvent.click(await screen.findByRole("button"));

    expect(await screen.findByText("authenticated")).toBeTruthy();
    expect(current()).toBe("novo-token");
    expect(post).toHaveBeenCalledWith(
      "/auth/autenticar",
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
    expect(get).toHaveBeenCalledWith("/auth/validar-token");
  });
});
