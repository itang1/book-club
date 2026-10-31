import { expect, test, type Page } from '@playwright/test';

/**
 * A book's whole life in the app, as the people involved see it. The demo
 * starts as Lena Kaligaris, who has Carmen's Pride and Prejudice with Tibby
 * next in line.
 */

/** Screens behind the current one stay in the page, hidden: match what's on show. */
const seen = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first();

async function becomes(page: Page, name: string) {
  await page.getByLabel('Dev mode: switch profile').click();
  await page.getByText(name, { exact: true }).last().click();
  await expect(page.getByText(`Viewing as ${name}`)).toBeVisible();
}

async function openBook(page: Page, title: string) {
  await page.getByText(title, { exact: true }).first().click();
  // The screen behind stays in the page, hidden, so wait for the book page itself.
  await expect(page.getByText("Where this copy has been, and who's waiting.")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('The Traveling Books').first()).toBeVisible();
});

test('home opens on the letterhead, with the groups and what happened lately', async ({ page }) => {
  await expect(page.getByText('Lege · Scribe · Trade')).toBeVisible();
  await expect(page.getByText('Lately', { exact: true })).toBeVisible();
  await expect(page.getByText('Central Perk Regulars').first()).toBeVisible();
  await expect(page.getByText('The Upper East Side').first()).toBeVisible();
  await expect(page.getByText('Your copy').first()).toBeVisible();
});

test('a book goes from one reader to the next', async ({ page }) => {
  await openBook(page, 'Pride and Prejudice');
  await page.getByText('Send to Tibby Rollins', { exact: true }).click();
  await page.getByText('Yes, pass to Tibby Rollins').click();
  await expect(seen(page, /In the post to Tibby Rollins/)).toBeVisible();

  await becomes(page, 'Tibby Rollins');
  await seen(page, /^Got it$/).click();
  await expect(seen(page, 'In your hands')).toBeVisible();
});

test('an owner can call a copy home, and it can only go back to them', async ({ page }) => {
  await becomes(page, 'Carmen Lowell');
  await openBook(page, 'Pride and Prejudice');
  await page.getByText('Call it home', { exact: true }).click();
  await expect(seen(page, /You've called it home/)).toBeVisible();

  await becomes(page, 'Lena Kaligaris');
  await expect(seen(page, /^Send home to Carmen Lowell$/)).toBeVisible();
  await expect(page.getByText('Send to Tibby Rollins', { exact: true })).toHaveCount(0);
});

test('sample groups are for looking, not lending', async ({ page }) => {
  await openBook(page, 'Jurassic Park');
  await expect(page.getByText(/This is a sample group/)).toBeVisible();
  await expect(page.getByText('Join the line', { exact: true })).toHaveCount(0);
});

test('a friend request can be accepted', async ({ page }) => {
  await page.getByText('Friends & Groups', { exact: true }).last().click();
  await expect(page.getByText('Bridget Vreeland').first()).toBeVisible();
  await page.getByText('Accept', { exact: true }).click();
  await expect(page.getByText('wants to be friends')).toHaveCount(0);
});

test('whoever runs a group can rename it and remove a member', async ({ page }) => {
  await page.getByText('Friends & Groups', { exact: true }).last().click();
  await page
    .getByLabel('The Traveling Pants group', { exact: true })
    .filter({ visible: true })
    .last()
    .click();
  await expect(seen(page, 'Running the group')).toBeVisible();

  await page.getByLabel('Group name').filter({ visible: true }).fill('The Sisterhood');
  await seen(page, 'Save').click();
  await expect(seen(page, 'The Sisterhood')).toBeVisible();

  await page.getByLabel('Remove Bridget Vreeland from the group').click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByLabel('Remove Bridget Vreeland from the group')).toHaveCount(0);
});

test('other members do not see the controls', async ({ page }) => {
  await becomes(page, 'Tibby Rollins');
  await page.getByText('Friends & Groups', { exact: true }).last().click();
  await page
    .getByLabel('The Traveling Pants group', { exact: true })
    .filter({ visible: true })
    .last()
    .click();
  await expect(seen(page, 'Runs it')).toBeVisible();
  await expect(page.getByText('Running the group')).toHaveCount(0);
});

test('the year in review becomes a picture to share', async ({ page }) => {
  await seen(page, 'See the year so far').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByLabel('Share your year as a picture').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^traveling-books-\d{4}\.png$/);
});

test('a group keeps a wishlist of books nobody owns yet', async ({ page }) => {
  await page.getByText('Friends & Groups', { exact: true }).last().click();
  await page
    .getByLabel('The Traveling Pants group', { exact: true })
    .filter({ visible: true })
    .last()
    .click();
  await page.getByLabel('Title of a book to wish for').fill('Middlemarch');
  await page.getByLabel('Its author').fill('George Eliot');
  await seen(page, 'Add to the wishlist').click();
  await expect(seen(page, 'Wished by you · 1 would read it')).toBeVisible();
  await page.getByLabel("You'd read Middlemarch. Tap to take it back.").click();
  await expect(page.getByLabel("I'd read Middlemarch")).toBeVisible();
});

test('the privacy policy is a page of its own', async ({ page }) => {
  await page.goto('/privacy.html');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByText(/Nothing is sold/)).toBeVisible();
});
