using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DraftLex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHearingModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Hearings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatterId = table.Column<Guid>(type: "uuid", nullable: false),
                    HearingDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CourtRoom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    JudgeName = table.Column<string>(type: "text", nullable: false),
                    Stage = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Remarks = table.Column<string>(type: "text", nullable: false),
                    NextHearingDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsCancelled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hearings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hearings_Matters_MatterId",
                        column: x => x.MatterId,
                        principalTable: "Matters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_MatterId",
                table: "Hearings",
                column: "MatterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Hearings");
        }
    }
}
