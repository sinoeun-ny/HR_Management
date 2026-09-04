using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using POS_System.Models.Employee;

namespace POS_System.Data
{
    public class ApplicationDbContext : IdentityDbContext
    {


        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<EmployeePosition> EmployeePosition {get; set; }
        public DbSet<DocumentStorage> DocumentStorages { get; set; }



        //protected override void OnModelCreating(ModelBuilder modelBuilder)
        //{
        //    modelBuilder.Entity<Employee>()
        //        .HasOne(e => e.Employment)
        //        .WithOne(emp => emp.Employee)
        //        .HasForeignKey<Employment>(emp => emp.EmployeeId);

        //    modelBuilder.Entity<Employee>()
        //        .HasMany(e => e.Documents)
        //        .WithOne(d => d.Employee)
        //        .HasForeignKey(d => d.EmployeeId);
        //}


    }
}
