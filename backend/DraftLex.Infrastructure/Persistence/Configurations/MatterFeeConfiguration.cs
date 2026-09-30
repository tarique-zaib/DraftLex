using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class MatterFeeConfiguration : IEntityTypeConfiguration<MatterFee>
{
    public void Configure(EntityTypeBuilder<MatterFee> builder)
    {
        builder.ToTable("MatterFees");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FeeType)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.FixedFee)
            .HasPrecision(18, 2);

        builder.Property(x => x.DailyRate)
            .HasPrecision(18, 2);

        builder.Property(x => x.HourlyRate)
            .HasPrecision(18, 2);

        builder.Property(x => x.AppearanceRate)
            .HasPrecision(18, 2);

        builder.Property(x => x.Notes)
            .HasMaxLength(2000);

        builder.HasOne(x => x.Matter)
            .WithMany(x => x.Fees)
            .HasForeignKey(x => x.MatterId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}