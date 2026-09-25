using DraftLex.NotificationAgent.Models;
using System.Net.Http.Json;
using System.Text.Json;

namespace DraftLex.NotificationAgent.Services;

public class DraftLexApiClient
{
    private readonly HttpClient _http;

    public DraftLexApiClient()
    {
        _http = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:5073/api/")
        };
    }

    public async Task<List<HearingReminder>> GetTodaysHearingsAsync()
    {
        var hearings = await _http.GetFromJsonAsync<List<HearingReminder>>("Hearings")
                     ?? new();

        return hearings
            .Where(h => h.HearingDate.Date == DateTime.Today)
            .OrderBy(h => h.HearingDate)
            .ToList();
    }
}