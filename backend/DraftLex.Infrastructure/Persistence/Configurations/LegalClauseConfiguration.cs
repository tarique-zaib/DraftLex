using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class LegalClauseConfiguration
    : IEntityTypeConfiguration<LegalClause>
{
    public void Configure(EntityTypeBuilder<LegalClause> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Content)
            .IsRequired();

        builder.Property(x => x.IsSystemClause)
            .HasDefaultValue(true);
    }
}