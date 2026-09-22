using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DraftLex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvocateTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Advocates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    BarCouncilNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StateBarCouncil = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Mobile = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Advocates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Advocates_BarCouncilNumber",
                table: "Advocates",
                column: "BarCouncilNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Advocates_Email",
                table: "Advocates",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Advocates");
        }
    }
}
