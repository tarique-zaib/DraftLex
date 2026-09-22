using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class TimelineEventConfiguration : IEntityTypeConfiguration<TimelineEvent>
{
    public void Configure(EntityTypeBuilder<TimelineEvent> builder)
    {
        builder.ToTable("TimelineEvents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.EventType)
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(x => x.Title)
               .HasMaxLength(200)
               .IsRequired();

        builder.Property(x => x.Description)
               .HasMaxLength(2000);

        builder.Property(x => x.EventDate)
               .HasColumnType("timestamp without time zone");

        builder.Property(x => x.CreatedAt)
               .HasColumnType("timestamp with time zone");

        builder.HasOne(x => x.Matter)
               .WithMany(x => x.TimelineEvents)
               .HasForeignKey(x => x.MatterId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.MatterId, x.EventDate });
    }
}