using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class MatterConfiguration : IEntityTypeConfiguration<Matter>
{
    public void Configure(EntityTypeBuilder<Matter> builder)
    {
        builder.ToTable("Matters");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.MatterNumber)
               .HasMaxLength(30)
               .IsRequired();

        builder.HasIndex(x => x.MatterNumber)
               .IsUnique();

        builder.Property(x => x.Title)
               .HasMaxLength(300)
               .IsRequired();

        builder.HasOne(x => x.Client)
               .WithMany(x => x.Matters)
               .HasForeignKey(x => x.ClientId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}