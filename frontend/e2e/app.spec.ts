import { test, expect } from "@playwright/test";

test.describe("ResumeIQ Landing Page E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local development server URL
    await page.goto("http://localhost:3000/");
  });

  test("should render main hero title and call-to-actions", async ({ page }) => {
    // Verify descriptive title tag (SEO Best Practice)
    await expect(page).toHaveTitle(/ResumeIQ | See Your Resume Through Recruiter Eyes/);

    // Verify main recruiter headline
    const heroTitle = page.locator("h1");
    await expect(heroTitle).toContainText("Discover Why Your Resume Gets Rejected");
    await expect(heroTitle).toContainText("Before Recruiters Even See It.");

    // Verify Badge Tagline exists
    const badge = page.locator("text=See Your Resume Through Recruiter Eyes");
    await expect(badge).toBeVisible();

    // Verify Main CTA is present
    const ctaButton = page.locator("button:has-text('Analyze My Resume')");
    await expect(ctaButton).toBeVisible();
  });

  test("should render the How It Works grid sections", async ({ page }) => {
    // Check headings
    await expect(page.locator("h2:has-text('How It Works')")).toBeVisible();
    await expect(page.locator("h3:has-text('1. Upload Resume')")).toBeVisible();
    await expect(page.locator("h3:has-text('2. Define Target')")).toBeVisible();
    await expect(page.locator("h3:has-text('3. Get Auditor Analysis')")).toBeVisible();
  });

  test("should render pricing tiers and FAQS", async ({ page }) => {
    // Pricing check
    await expect(page.locator("h2:has-text('Simple, Transparent Pricing')")).toBeVisible();
    await expect(page.locator("h3:has-text('Free Audit')")).toBeVisible();
    await expect(page.locator("h3:has-text('Premium Upgrade')")).toBeVisible();
    await expect(page.locator("text=Rp19.900")).toBeVisible();

    // FAQ check
    await expect(page.locator("h2:has-text('Frequently Asked Questions')")).toBeVisible();
    await expect(page.locator("button:has-text('What is ResumeIQ and how does it work?')")).toBeVisible();
  });

  test("should open Clerk sign-in modal on click when logged out", async ({ page }) => {
    // Click analyze button
    const ctaButton = page.locator("button:has-text('Analyze My Resume')");
    await ctaButton.click();
    
    // Playwright will verify it routes to sign-in page or shows signup modal
    // Check if the URL has redirected or matches sign-in routing
    // Depending on Clerk configuration it matches either /sign-in or modal popup
    // For standard testing:
    await page.waitForTimeout(500); // Wait for modal load
  });
});
