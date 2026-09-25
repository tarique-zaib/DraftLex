using Microsoft.Playwright;

namespace DraftLex.NotificationAgent.Services;

public class WhatsAppSender
{
    public async Task SendAsync(string phone, string message)
    {
        using var playwright = await Playwright.CreateAsync();

        // Store WhatsApp session outside the publish folder
        var authPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "DraftLex",
            "WhatsAppSession");

        Directory.CreateDirectory(authPath);

        var browser = await playwright.Chromium.LaunchPersistentContextAsync(
            authPath,
            new BrowserTypeLaunchPersistentContextOptions
            {
                Headless = false,
                Channel = "chrome"
            });

        var page = browser.Pages.FirstOrDefault()
                  ?? await browser.NewPageAsync();

        var encoded = Uri.EscapeDataString(message);

        await page.GotoAsync(
            $"https://web.whatsapp.com/send?phone={phone}&text={encoded}");

        // Wait for the Send button and click it
        await page.WaitForSelectorAsync(
            "button[aria-label='Send']",
            new PageWaitForSelectorOptions
            {
                Timeout = 300000 // 5 minutes (first login)
            });

        await page.ClickAsync("button[aria-label='Send']");

        await Task.Delay(2000);

        await browser.CloseAsync();
    }
}