using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration
    : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.PaymentMode)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.ReferenceNumber)
            .HasMaxLength(200);

        builder.Property(x => x.Remarks)
            .HasMaxLength(2000);

        builder.HasOne(x => x.Matter)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.MatterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new
        {
            x.MatterId,
            x.PaymentDate
        });
    }
}