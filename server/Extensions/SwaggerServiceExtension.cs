using Microsoft.OpenApi;

namespace server.Extensions
{
    public static class SwaggerServiceExtension
    {
        public static IServiceCollection AddSwaggerDoc(this IServiceCollection services)
        {
            services.AddSwaggerGen(options =>
            {
                var securityScheme = new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "JWT Authorization header using the Bearer scheme."
                };

                options.AddSecurityDefinition("Bearer", securityScheme);
                var securitySchemeReference = new OpenApiSecuritySchemeReference("Bearer", null, null);

                options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
                {
                    {
                        securitySchemeReference,
                        new List<string>()
                    }
                });
            });

            return services;
        }
    }
}
