import { describe, it, expect } from "vitest";
import { ApiKeyEntity } from "../../src/domain/entities/api-key.entity.js";

describe("ApiKeyEntity", () => {
  it("should create an active entity by default", () => {
    const key = new ApiKeyEntity({
      key: "test-key-123",
      clientName: "Test Client",
      active: true,
    });

    expect(key.key).toBe("test-key-123");
    expect(key.clientName).toBe("Test Client");
    expect(key.active).toBe(true);
    expect(key.isValid()).toBe(true);
    expect(key.createdAt).toBeInstanceOf(Date);
  });

  it("should return false for isValid when entity is inactive", () => {
    const key = new ApiKeyEntity({
      key: "inactive-key",
      clientName: "Inactive Client",
      active: false,
    });

    expect(key.isValid()).toBe(false);
  });
});

