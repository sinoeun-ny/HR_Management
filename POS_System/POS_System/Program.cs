using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using POS_System.Data;
using POS_System.Services.Inventory;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.SignIn.RequireConfirmedAccount = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddControllersWithViews();

// Register services
builder.Services.AddScoped<DbHelper>();  // For DbConnectionHelper
builder.Services.AddScoped<InventoryService>();   // For InventoryService

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=login}/{action=Index}/{id?}");

app.Run();
