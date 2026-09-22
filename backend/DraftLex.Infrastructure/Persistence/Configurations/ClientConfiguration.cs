using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DraftLex.Infrastructure.Persistence.Configurations;

public class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.ToTable("Clients");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ClientCode)
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(x => x.ClientCode)
            .IsUnique();

        builder.Property(x => x.FullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Mobile)
            .HasMaxLength(20);

        builder.Property(x => x.Email)
            .HasMaxLength(200);

        builder.Property(x => x.Address)
            .HasMaxLength(500);
    }
}