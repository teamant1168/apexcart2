
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Extensions;


var builder = WebApplication.CreateBuilder(args);

IConfiguration configuration = builder.Configuration;

// Add services to the container.
builder.Services.AddDbContext<DataContex>(options =>
{
    var defaultConnection = configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(defaultConnection))
    {
        options.UseSqlServer(defaultConnection);
    }
});

builder.Services.AddControllers();
//    .AddJsonOptions(options =>
//{
//    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
//    options.JsonSerializerOptions.WriteIndented = true; // Optional: For pretty printing
//});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddIdentityServices(configuration);
builder.Services.AddCors(options =>
{
    var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    options.AddPolicy("ClientApp", policies =>
    {
        if (allowedOrigins is { Length: > 0 })
        {
            policies.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
            return;
        }

        policies.AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

builder.Services.AddAppServices();

builder.Services.AddAutoMapper(_ => { }, AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddSwaggerDoc();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    var dbContext = scope.ServiceProvider.GetRequiredService<DataContex>();

    try
    {
        if (dbContext.Database.IsRelational())
        {
            dbContext.Database.Migrate();
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning("Database migration skipped. Verify SQL Server connectivity and pending migrations. {Message}", ex.Message);
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
Directory.CreateDirectory(uploadsPath);

app.UseCors("ClientApp");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/image"
});
app.MapControllers();

app.Run();
