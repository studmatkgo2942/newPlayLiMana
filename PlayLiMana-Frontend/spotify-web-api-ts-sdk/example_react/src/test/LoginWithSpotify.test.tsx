import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginWithSpotifyButton from "../components/features/auth/LoginWithSpotifyButton.tsx";

// Mock the SpotifyContext and its hook
vi.mock("../context/SpotifyContext.tsx", () => ({
    useSpotifyContext: vi.fn(),
}));

import { useSpotifyContext } from "../context/SpotifyContext.tsx";

describe("LoginWithSpotifyButton", () => {
    const mockAuthenticate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const setup = (sdk: any, isAuthenticated: boolean, className?: string) => {
        (useSpotifyContext as unknown as vi.Mock).mockReturnValue({ sdk, isAuthenticated });
        render(<LoginWithSpotifyButton className={className} />);
    };

    it("renders the button with default class and text", () => {
        setup({ authenticate: mockAuthenticate }, false);
        const btn = screen.getByRole("button", { name: /log in with spotify/i });
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveClass("login-button-spotify");
    });

    it("adds the passed className", () => {
        setup({ authenticate: mockAuthenticate }, false, "custom-class");
        const btn = screen.getByRole("button");
        expect(btn).toHaveClass("login-button-spotify");
        expect(btn).toHaveClass("custom-class");
    });

    it("disables the button if sdk is missing", () => {
        setup(null, false);
        const btn = screen.getByRole("button");
        expect(btn).toBeDisabled();
        expect(btn).toHaveAttribute("title", "Login unavailable");
    });

    it("disables the button if sdk.authenticate is not a function", () => {
        setup({ authenticate: "not a function" }, false);
        const btn = screen.getByRole("button");
        expect(btn).toBeDisabled();
        expect(btn).toHaveAttribute("title", "Login unavailable");
    });

    it("disables the button if user is authenticated", () => {
        setup({ authenticate: mockAuthenticate }, true);
        const btn = screen.getByRole("button");
        expect(btn).toBeDisabled();
        expect(btn).toHaveAttribute("title", "Already logged in");
    });

    it("calls sdk.authenticate when button is clicked and sdk is valid", async () => {
        mockAuthenticate.mockResolvedValueOnce(undefined);
        setup({ authenticate: mockAuthenticate }, false);
        const btn = screen.getByRole("button");
        expect(btn).not.toBeDisabled();

        fireEvent.click(btn);
        expect(mockAuthenticate).toHaveBeenCalled();
    });

    /*
    it("calls alert and does not call authenticate if sdk or authenticate is missing", () => {
        const alertMock: ReturnType<typeof vi.spyOn> = vi.spyOn(window, "alert");
        alertMock.mockImplementation(() => {});

        // sdk missing
        setup(null, false);
        const btn = screen.getByRole("button");
        fireEvent.click(btn);
        expect(alertMock).toHaveBeenCalledWith("Error initiating Spotify login. Please try refreshing the page.");

        alertMock.mockClear();

        // sdk present but authenticate missing
        setup({}, false);
        fireEvent.click(screen.getByRole("button"));
        expect(alertMock).toHaveBeenCalledWith("Error initiating Spotify login. Please try refreshing the page.");

        alertMock.mockRestore();
    });
     */

    it("logs error if authenticate rejects", async () => {
        const error = new Error("fail");
        mockAuthenticate.mockRejectedValueOnce(error);
        setup({ authenticate: mockAuthenticate }, false);

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        fireEvent.click(screen.getByRole("button"));

        // Wait a tick for the promise rejection
        await new Promise(process.nextTick);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Login Button: Auth initiation failed:",
            error
        );

        consoleErrorSpy.mockRestore();
    });
});