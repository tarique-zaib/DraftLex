using System.Text;
using DraftLex.NotificationAgent.Services;

namespace DraftLex.NotificationAgent.Services;

public class ReminderScheduler
{
    private readonly DraftLexApiClient _api = new();
    private readonly WhatsAppSender _sender = new();

    public async Task SendTodaysHearingsAsync(string phone)
    {
        var hearings = await _api.GetTodaysHearingsAsync();

        if (!hearings.Any())
        {
            Console.WriteLine("No hearings today.");
            return;
        }

        var message = BuildMessage(hearings);

        await _sender.SendAsync(phone, message);

        Console.WriteLine($"✅ Sent reminder with {hearings.Count} hearing(s).");
    }

    private static string BuildMessage(List<Models.HearingReminder> hearings)
    {
        var sb = new StringBuilder();

        sb.AppendLine("⚖️ *DraftLex Hearing Reminder*");
        sb.AppendLine();
        sb.AppendLine($"📅 {DateTime.Now:dddd, dd MMM yyyy}");
        sb.AppendLine();

        for (int i = 0; i < hearings.Count; i++)
        {
            var h = hearings[i];

            sb.AppendLine($"*{i + 1}. {h.MatterTitle}*");
            sb.AppendLine($"🏛 Court: {h.Court}");
            sb.AppendLine($"🚪 Court Room: {h.CourtRoom}");
            sb.AppendLine($"⏰ Time: {h.HearingDate:hh:mm tt}");
            sb.AppendLine($"⚖️ Stage: {h.Stage}");

            if (!string.IsNullOrWhiteSpace(h.JudgeName))
                sb.AppendLine($"👨‍⚖️ Judge: {h.JudgeName}");

            sb.AppendLine();
        }

        sb.AppendLine("Please carry all required documents.");
        sb.AppendLine();
        sb.Append("— DraftLex");

        return sb.ToString();
    }
}