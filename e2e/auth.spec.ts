import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("should allow signup, logout, and login", async ({ page }) => {
    const random = Math.random().toString(36).substring(2, 15);

    // Generate a unique email for testing
    const testEmail = `test-${random}@example.com`;
    const testPassword = "TestPassword123!";

    // Navigate to login page
    await page.goto("/login");

    // Sign up with new account
    await page.getByTestId("email-input").fill(testEmail);
    await page.getByTestId("password-input").fill(testPassword);
    await page.getByTestId("signup-button").click();

    // Verify we're on the home page and signed in
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("signout-button")).toBeVisible();

    // Sign out
    await page.getByTestId("signout-button").click();

    // Verify we're logged out by checking URL
    await expect(page).toHaveURL("/login");

    // Log in with the same credentials
    await page.getByTestId("email-input").fill(testEmail);
    await page.getByTestId("password-input").fill(testPassword);
    await page.getByTestId("login-button").click();

    // Verify we're logged in again
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("signout-button")).toBeVisible();
  });
});
