using System;
using System.Collections.Generic;
using System.Text;

namespace DraftLex.Application.DTOs.Clients
{
    public class ClientMatterResponse
    {
        public Guid Id { get; set; }
        public string MatterNumber { get; set; } = "";
        public string Title { get; set; } = "";
        public string Court { get; set; } = "";
        public string Status { get; set; } = "";
    }
}
