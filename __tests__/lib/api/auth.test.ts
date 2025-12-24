/**
 * @jest-environment node
 */
import {
  AuthenticationError,
  AuthorizationError,
  handleApiError,
} from "@/lib/api/auth";

describe("API Auth Utilities", () => {
  describe("AuthenticationError", () => {
    it("should create an authentication error with default message", () => {
      const error = new AuthenticationError();
      expect(error.message).toBe("Authentication required");
      expect(error.name).toBe("AuthenticationError");
    });

    it("should create an authentication error with custom message", () => {
      const error = new AuthenticationError("Custom auth error");
      expect(error.message).toBe("Custom auth error");
      expect(error.name).toBe("AuthenticationError");
    });
  });

  describe("AuthorizationError", () => {
    it("should create an authorization error with default message", () => {
      const error = new AuthorizationError();
      expect(error.message).toBe("Unauthorized");
      expect(error.name).toBe("AuthorizationError");
    });

    it("should create an authorization error with custom message", () => {
      const error = new AuthorizationError("Custom auth error");
      expect(error.message).toBe("Custom auth error");
      expect(error.name).toBe("AuthorizationError");
    });
  });

  describe("handleApiError", () => {
    it("should handle Zod validation errors", () => {
      const zodError = {
        name: "ZodError",
        errors: [{ message: "Invalid input" }],
      };

      const response = handleApiError(zodError);
      
      expect(response.status).toBe(400);
    });

    it("should handle AuthenticationError", () => {
      const authError = new AuthenticationError("Please log in");

      const response = handleApiError(authError);
      
      expect(response.status).toBe(401);
    });

    it("should handle AuthorizationError", () => {
      const authzError = new AuthorizationError("Access denied");

      const response = handleApiError(authzError);
      
      expect(response.status).toBe(403);
    });

    it("should handle unknown errors with 500 status", () => {
      const unknownError = new Error("Something went wrong");

      const response = handleApiError(unknownError);
      
      expect(response.status).toBe(500);
    });

    it("should handle non-Error objects", () => {
      const stringError = "Something went wrong";

      const response = handleApiError(stringError);
      
      expect(response.status).toBe(500);
    });
  });
});

