using DraftLex.Application.DTOs.Clients;
using System;
using System.Collections.Generic;
using System.Text;

namespace DraftLex.Application.Interfaces
{
    public interface IClientService
    {
        Task<List<ClientMatterResponse>> GetMattersAsync(Guid clientId);
    }
}
