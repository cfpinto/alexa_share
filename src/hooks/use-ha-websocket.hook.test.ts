import { act, renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import nock from "nock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHaSocket } from "./use-ha-websocket.hook";

// Configure axios defaults for testing
axios.defaults.baseURL = "http://localhost:3000";

// Mock WebSocket
class MockWebSocket {
	public onopen: (() => void) | null = null;
	public onerror: ((event: Event) => void) | null = null;
	public onclose: (() => void) | null = null;
	public onmessage: ((event: Event) => void) | null = null;

	constructor(public url: string) {}

	send(_data: string) {}

	close() {
		if (this.onclose) {
			this.onclose();
		}
	}

	// Helper to simulate receiving a message
	simulateMessage(data: unknown) {
		if (this.onmessage) {
			this.onmessage({ data: JSON.stringify(data) } as unknown as Event);
		}
	}

	// Helper to simulate connection open
	simulateOpen() {
		if (this.onopen) {
			this.onopen();
		}
	}

	// Helper to simulate error
	simulateError(event: Event = {} as Event) {
		if (this.onerror) {
			this.onerror(event);
		}
	}
}

describe("useHaSocket", () => {
	let mockWebSocket: MockWebSocket;
	let WebSocketSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		nock.cleanAll();
		nock.disableNetConnect();

		// Mock WebSocket with a proper constructor function and spy
		WebSocketSpy = vi.fn(function (
			this: MockWebSocket,
			url: string,
		): MockWebSocket {
			mockWebSocket = new MockWebSocket(url);
			// Copy properties to 'this' to make it work as a constructor
			Object.assign(this, mockWebSocket);
			return mockWebSocket;
		});
		(global as unknown as { WebSocket: typeof WebSocketSpy }).WebSocket =
			WebSocketSpy;
	});

	afterEach(() => {
		nock.cleanAll();
		nock.enableNetConnect();
		vi.clearAllMocks();
	});

	it("should fetch access token on mount", async () => {
		nock("http://localhost:3000").get("/api/ha-config").reply(200, {
			success: true,
			accessToken: "test-token",
			haWebsocketUrl: "http://homeassistant.local:8123",
		});

		renderHook(() => useHaSocket());

		await waitFor(
			() => {
				expect(nock.isDone()).toBe(true);
			},
			{ timeout: 2000 },
		);
	});

	it("should set error when access token fetch fails", async () => {
		nock("http://localhost:3000").get("/api/ha-config").reply(200, {
			success: false,
			error: "Token not found",
		});

		const { result } = renderHook(() => useHaSocket());

		await waitFor(
			() => {
				expect(result.current.error).toContain("Token not found");
			},
			{ timeout: 2000 },
		);
	});

	it("should connect to WebSocket after token is fetched", async () => {
		nock("http://localhost:3000").get("/api/ha-config").reply(200, {
			success: true,
			accessToken: "test-token",
			haWebsocketUrl: "http://homeassistant.local:8123",
		});

		renderHook(() => useHaSocket());

		await waitFor(
			() => {
				expect(WebSocketSpy).toHaveBeenCalled();
			},
			{ timeout: 2000 },
		);
	});

	it("should have WebSocket event handlers attached", async () => {
		nock("http://localhost:3000").get("/api/ha-config").reply(200, {
			success: true,
			accessToken: "test-token",
			haWebsocketUrl: "http://homeassistant.local:8123",
		});

		renderHook(() => useHaSocket());

		// Wait for WebSocket to be created
		await waitFor(
			() => {
				expect(WebSocketSpy).toHaveBeenCalled();
				expect(mockWebSocket).toBeDefined();
			},
			{ timeout: 5000 },
		);

		// Verify event handlers are attached
		expect(mockWebSocket.onopen).not.toBeNull();
		expect(mockWebSocket.onerror).not.toBeNull();
		expect(mockWebSocket.onclose).not.toBeNull();
		expect(mockWebSocket.onmessage).not.toBeNull();
	});

	it("should handle auth required message", async () => {
		nock("http://localhost:3000").get("/api/ha-config").reply(200, {
			success: true,
			accessToken: "test-token",
			haWebsocketUrl: "http://homeassistant.local:8123",
		});

		renderHook(() => useHaSocket());

		await waitFor(
			() => {
				expect(WebSocketSpy).toHaveBeenCalled();
				expect(mockWebSocket).toBeDefined();
			},
			{ timeout: 5000 },
		);

		const sendSpy = vi.spyOn(mockWebSocket, "send");

		// Simulate auth required message
		act(() => {
			mockWebSocket.simulateMessage({
				type: "auth_required",
			});
		});

		await waitFor(
			() => {
				expect(sendSpy).toHaveBeenCalled();
				const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
				expect(sentData.type).toBe("auth");
				expect(sentData.access_token).toBe("test-token");
			},
			{ timeout: 3000 },
		);
	});

	it("should return empty compiled entities initially", () => {
		nock("http://localhost:3000").get("/api/ha-config").reply(200, {
			success: true,
			accessToken: "test-token",
			haWebsocketUrl: "http://homeassistant.local:8123",
		});

		const { result } = renderHook(() => useHaSocket());

		expect(result.current.compiled).toEqual([]);
		expect(result.current.entities.size).toBe(0);
		expect(result.current.devices.size).toBe(0);
		expect(result.current.areas.size).toBe(0);
	});
});
