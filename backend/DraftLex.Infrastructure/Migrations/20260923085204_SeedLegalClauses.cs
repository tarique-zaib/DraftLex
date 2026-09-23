using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DraftLex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedLegalClauses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LegalClauses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    IsSystemClause = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegalClauses", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "LegalClauses",
                columns: new[] { "Id", "Category", "Content", "CreatedAt", "CreatedBy", "IsSystemClause", "Title" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "Legal Notice", "Our client calls upon you to clear the outstanding amount within fifteen (15) days from the receipt of this legal notice, failing which appropriate legal proceedings shall be initiated at your cost and risk.", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Payment Default Notice" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "Property", "You are hereby called upon to hand over vacant and peaceful possession of the property within fifteen (15) days, failing which my client shall initiate appropriate legal proceedings.", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Property Possession Demand" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "Employment", "Your services stand terminated in accordance with the applicable terms of employment and relevant provisions of law. You are required to complete the exit formalities immediately.", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Employment Termination" },
                    { new Guid("44444444-4444-4444-4444-444444444444"), "Consumer", "My client calls upon you to rectify the deficiency in service and compensate the loss suffered within fifteen (15) days, failing which proceedings under the Consumer Protection Act shall be initiated.", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Consumer Complaint Relief" },
                    { new Guid("55555555-5555-5555-5555-555555555555"), "Defamation", "You are hereby called upon to immediately cease making defamatory statements concerning my client and issue a written apology within seven (7) days, failing which appropriate legal action shall be initiated.", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Defamation Cease & Desist" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LegalClauses");
        }
    }
}
