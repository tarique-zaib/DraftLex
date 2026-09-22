using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DraftLex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMatterModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Matters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatterNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    MatterType = table.Column<string>(type: "text", nullable: false),
                    Court = table.Column<string>(type: "text", nullable: false),
                    CaseNumber = table.Column<string>(type: "text", nullable: false),
                    JudgeName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Matters_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Matters_ClientId",
                table: "Matters",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Matters_MatterNumber",
                table: "Matters",
                column: "MatterNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Matters");
        }
    }
}
