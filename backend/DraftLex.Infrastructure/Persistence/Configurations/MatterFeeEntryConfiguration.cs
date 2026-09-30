using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class MatterFeeEntryConfiguration
    : IEntityTypeConfiguration<MatterFeeEntry>
{
    public void Configure(EntityTypeBuilder<MatterFeeEntry> builder)
    {
        builder.ToTable("MatterFeeEntries");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ChargeType)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Amount)
            .HasPrecision(18, 2);

        builder.Property(x => x.Hours)
            .HasPrecision(10, 2);

        builder.Property(x => x.Remarks)
            .HasMaxLength(2000);

        builder.HasOne(x => x.Matter)
            .WithMany(x => x.FeeEntries)
            .HasForeignKey(x => x.MatterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.MatterFee)
            .WithMany(x => x.FeeEntries)
            .HasForeignKey(x => x.MatterFeeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Hearing)
            .WithMany()
            .HasForeignKey(x => x.HearingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => new
        {
            x.MatterId,
            x.ChargeDate
        });
    }
}