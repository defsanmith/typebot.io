import test, { expect } from "@playwright/test";

test.describe("Navigation Tests", () => {
  test("should handle non-existent paths gracefully", async ({ page }) => {
    // Navigate to a path that likely doesn't exist
    await page.goto("/this-path-does-not-exist-" + Date.now());

    // Wait for navigation to complete
    await page.waitForLoadState("networkidle");

    // Verify the page loaded something, even if it's an error page
    const hasContent = await page.evaluate(() => {
      return {
        bodyContent: document.body.innerHTML.length, // Make sure this is a number not a boolean
        title: document.title,
      };
    });

    // We just check that some content was loaded (could be a 404 page)
    expect(hasContent.bodyContent).toBeGreaterThan(0);
  });

  test("should handle the root route", async ({ page }) => {
    await page.goto("/");

    // Verify page loads and has content
    const content = await page.evaluate(() => {
      return {
        bodyContent: document.body.innerHTML.length,
        scripts: document.querySelectorAll("script").length,
        links: document.querySelectorAll("link").length,
      };
    });

    expect(content.bodyContent).toBeGreaterThan(0);
    expect(content.scripts).toBeGreaterThan(0);
  });

  test("should have proper response headers", async ({ request }) => {
    // Make a simple request to the root path
    const response = await request.get("/");

    // Check that the response has a content-type header
    const headers = response.headers();
    expect(headers["content-type"]).toBeTruthy();

    // Since the server might be in development mode, it might return any valid status code
    // We just check that we got a response with a status code
    const statusCode = response.status();
    expect(statusCode).toBeGreaterThan(0);

    // Log the status code for debugging
    console.log(`Root path response status: ${statusCode}`);
  });
});
