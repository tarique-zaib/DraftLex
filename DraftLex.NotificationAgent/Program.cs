using DraftLex.NotificationAgent.Services;

const string Phone = "919891901905"; // Your WhatsApp number (without +)

Console.WriteLine($"DraftLex Notification Agent started at {DateTime.Now:HH:mm:ss}");

try
{
    var scheduler = new ReminderScheduler();
    await scheduler.SendTodaysHearingsAsync(Phone);

    Console.WriteLine("✅ Today's hearing reminders sent.");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
}

Console.WriteLine("Agent completed.");