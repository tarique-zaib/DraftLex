using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class AdvocateConfiguration : IEntityTypeConfiguration<Advocate>
{
    public void Configure(EntityTypeBuilder<Advocate> builder)
    {
        builder.ToTable("Advocates");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FullName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Email)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Mobile)
            .HasMaxLength(15);

        builder.Property(x => x.BarCouncilNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.StateBarCouncil)
            .HasMaxLength(100);

        builder.HasIndex(x => x.Email).IsUnique();

        builder.HasIndex(x => x.BarCouncilNumber).IsUnique();
    }
}