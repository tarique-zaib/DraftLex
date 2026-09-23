using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DraftLex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOppositePartyToMatter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OppositePartyAddress",
                table: "Matters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OppositePartyName",
                table: "Matters",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OppositePartyAddress",
                table: "Matters");

            migrationBuilder.DropColumn(
                name: "OppositePartyName",
                table: "Matters");
        }
    }
}
