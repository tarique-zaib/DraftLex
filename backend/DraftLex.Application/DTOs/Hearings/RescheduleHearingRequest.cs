namespace DraftLex.Application.DTOs.Hearings;

public class RescheduleHearingRequest
{
    public DateTime HearingDate { get; set; }
    public string Remarks { get; set; } = "";
}