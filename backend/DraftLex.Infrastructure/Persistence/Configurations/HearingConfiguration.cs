using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class HearingConfiguration
    : IEntityTypeConfiguration<Hearing>
{
    public void Configure(EntityTypeBuilder<Hearing> builder)
    {
        builder.ToTable("Hearings");

        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Matter)
            .WithMany(x => x.Hearings)
            .HasForeignKey(x => x.MatterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(x => x.CourtRoom)
            .HasMaxLength(100);

        builder.Property(x => x.Stage)
            .HasMaxLength(200);
    }
}