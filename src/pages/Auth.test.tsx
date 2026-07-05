import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./Auth";

describe("auth smoke", () => {
  it("renders the sign-in start page", async () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: "SIGN IN" })).toBeInTheDocument();
  });
});
