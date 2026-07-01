// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AxiosInstance } from "axios";
import { AuthProvider, useOonAuth } from "../src/security/AuthProvider";
import type { TokenStorage } from "../src/security/tokenStorage";
import { manifestToConfig } from "../src/manifest";

function AuthState() {
  const { status, user } = useOonAuth();
  return <span>{`${status}:${user?.email ?? ""}`}</span>;
}

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

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("AuthProvider — token de desenvolvimento", () => {
  it("persiste o token de dev e valida no backend antes de autenticar", async () => {
    const { storage, current } = createMemoryStorage("sessao-antiga");
    const get = vi.fn(async () => ({
      data: { usuario: { tipo: "admin", nome: "Dev Local", email: "dev@local" } },
    }));
    const http = { get } as unknown as AxiosInstance;

    render(
      <AuthProvider http={http} storage={storage} auth={{ devToken: "dev-local" }}>
        <AuthState />
      </AuthProvider>
    );

    expect(await screen.findByText("authenticated:dev@local")).toBeTruthy();
    expect(current()).toBe("dev-local");
    expect(get).toHaveBeenCalledWith("/auth/validar-token");
  });

  it("mantém o token recebido pelo SSO com prioridade sobre o token de dev", async () => {
    window.history.replaceState({}, "", "/?code=sso-token");
    const { storage, current } = createMemoryStorage();
    const get = vi.fn(async () => ({
      data: { usuario: { tipo: "admin", nome: "Usuário SSO", email: "sso@local" } },
    }));
    const http = { get } as unknown as AxiosInstance;

    render(
      <AuthProvider http={http} storage={storage} auth={{ devToken: "dev-local" }}>
        <AuthState />
      </AuthProvider>
    );

    expect(await screen.findByText("authenticated:sso@local")).toBeTruthy();
    expect(current()).toBe("sso-token");
    expect(window.location.search).toBe("");
  });

  it("propaga o token do runtime declarativo para a configuração de auth", () => {
    const config = manifestToConfig(
      { name: "Central Teste", slug: "central-teste" },
      { apiBaseUrl: "http://localhost:4000", devToken: "dev-local" }
    );

    expect(config.auth?.devToken).toBe("dev-local");
  });
});
