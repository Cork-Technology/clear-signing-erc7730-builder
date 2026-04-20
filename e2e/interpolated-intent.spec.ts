import { test, expect } from "@playwright/test";

const SIMPLE_ABI = JSON.stringify([
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
]);

test.describe("interpolatedIntent field", () => {
  test.setTimeout(60000);

  test("is editable and persists in v2 mode", async ({ page }) => {
    await page.goto("/");

    // Select v2 schema version
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "v2 (current)" }).click();

    // Paste ABI
    await page.locator("textarea#abi").fill(SIMPLE_ABI);

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();

    // Chains page — just click Continue
    await page.waitForURL("**/chains");
    await page.getByRole("button", { name: "Continue" }).click();

    // Metadata page — fill required fields then Continue
    await page.waitForURL("**/metadata");
    await page.getByLabel("Smart contract owner common name").fill("Test Owner");
    await page.getByLabel("Legal Name").fill("Test Legal");
    await page.getByLabel("URL").fill("https://example.com");
    await page.getByLabel("Smart contract name").fill("TestContract");
    await page.getByRole("button", { name: "Continue" }).click();

    // Operations page
    await page.waitForURL("**/operations");

    // Click the operation in the sidebar
    await page.locator("text=transfer(address to,uint256 amount)").first().click();
    await page.waitForTimeout(500);

    // Should be on intent tab — find the interpolated intent input
    const interpolatedInput = page.getByPlaceholder("e.g. Send {value} to {to}");
    await expect(interpolatedInput).toBeVisible();

    // Type a value
    await interpolatedInput.click();
    await interpolatedInput.fill("Send {amount} to {to}");

    // Wait for watch/re-render cycles
    await page.waitForTimeout(1000);

    // Screenshot for debugging
    await page.screenshot({ path: "e2e/screenshots/04-after-typing.png" });

    // Verify value persisted after re-renders
    await expect(interpolatedInput).toHaveValue("Send {amount} to {to}");

    // Navigate to a field tab and back to verify persistence across tabs
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(500);

    // Go back to intent tab
    const intentTab = page.locator('[role="tab"]').filter({ hasText: "intent" });
    await intentTab.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: "e2e/screenshots/05-after-roundtrip.png" });

    // Verify value survived the round-trip
    await expect(interpolatedInput).toHaveValue("Send {amount} to {to}");
  });

  test("can be cleared to empty string", async ({ page }) => {
    await page.goto("/");

    // Select v2 schema version
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "v2 (current)" }).click();

    // Paste ABI and submit
    await page.locator("textarea#abi").fill(SIMPLE_ABI);
    await page.getByRole("button", { name: "Submit" }).click();

    // Chains
    await page.waitForURL("**/chains");
    await page.getByRole("button", { name: "Continue" }).click();

    // Metadata — fill required fields
    await page.waitForURL("**/metadata");
    await page.getByLabel("Smart contract owner common name").fill("Test Owner");
    await page.getByLabel("Legal Name").fill("Test Legal");
    await page.getByLabel("URL").fill("https://example.com");
    await page.getByLabel("Smart contract name").fill("TestContract");
    await page.getByRole("button", { name: "Continue" }).click();

    // Operations
    await page.waitForURL("**/operations");
    await page.locator("text=transfer(address to,uint256 amount)").first().click();
    await page.waitForTimeout(500);

    const interpolatedInput = page.getByPlaceholder("e.g. Send {value} to {to}");
    await expect(interpolatedInput).toBeVisible();

    // Type a value first
    await interpolatedInput.click();
    await interpolatedInput.fill("x");
    await page.waitForTimeout(500);
    await expect(interpolatedInput).toHaveValue("x");

    // Clear it completely
    await interpolatedInput.fill("");
    await page.waitForTimeout(500);

    // Verify it's actually empty — not stuck on last character
    await expect(interpolatedInput).toHaveValue("");
  });
});
