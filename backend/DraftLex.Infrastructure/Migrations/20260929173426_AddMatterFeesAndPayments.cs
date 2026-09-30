using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DraftLex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMatterFeesAndPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MatterFees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatterId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeeType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FixedFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DailyRate = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    HourlyRate = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AppearanceRate = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatterFees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatterFees_Matters_MatterId",
                        column: x => x.MatterId,
                        principalTable: "Matters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatterId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PaymentMode = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ReferenceNumber = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Remarks = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Matters_MatterId",
                        column: x => x.MatterId,
                        principalTable: "Matters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatterFeeEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatterId = table.Column<Guid>(type: "uuid", nullable: false),
                    MatterFeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    HearingId = table.Column<Guid>(type: "uuid", nullable: true),
                    ChargeDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ChargeType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Hours = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    Remarks = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatterFeeEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatterFeeEntries_Hearings_HearingId",
                        column: x => x.HearingId,
                        principalTable: "Hearings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MatterFeeEntries_MatterFees_MatterFeeId",
                        column: x => x.MatterFeeId,
                        principalTable: "MatterFees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MatterFeeEntries_Matters_MatterId",
                        column: x => x.MatterId,
                        principalTable: "Matters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MatterFeeEntries_HearingId",
                table: "MatterFeeEntries",
                column: "HearingId");

            migrationBuilder.CreateIndex(
                name: "IX_MatterFeeEntries_MatterFeeId",
                table: "MatterFeeEntries",
                column: "MatterFeeId");

            migrationBuilder.CreateIndex(
                name: "IX_MatterFeeEntries_MatterId_ChargeDate",
                table: "MatterFeeEntries",
                columns: new[] { "MatterId", "ChargeDate" });

            migrationBuilder.CreateIndex(
                name: "IX_MatterFees_MatterId",
                table: "MatterFees",
                column: "MatterId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_MatterId_PaymentDate",
                table: "Payments",
                columns: new[] { "MatterId", "PaymentDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MatterFeeEntries");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "MatterFees");
        }
    }
}
