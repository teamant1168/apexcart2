using server.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace server.Helper
{
    public class JwtHelper : IJwtHelper
    {
        private readonly IConfiguration _config;

        public JwtHelper(IConfiguration config)
        {
            this._config = config;
        }
        public string GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"] ?? throw new Exception("Jwt key is missing");
            var issuer = _config["Jwt:Issuer"] ?? throw new Exception("Jwt issuer is missing");
            var audience = _config["Jwt:Audience"];
            if (string.IsNullOrWhiteSpace(audience))
            {
                audience = issuer;
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credential = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha512);

            List<Claim> claims = new List<Claim>(){
                                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                                new Claim(JwtRegisteredClaimNames.Sid, user.UserId.ToString()),
                                new Claim("UserID", user.UserId.ToString()),
                                new Claim("UserId", user.UserId.ToString()),
                                new Claim(ClaimTypes.Name, user.Email),
                                new Claim(ClaimTypes.Email, user.Email),
                                new Claim(ClaimTypes.Role, user.Role),
                                new Claim("Date", DateTime.Now.ToString()),
                                };

            var token = new JwtSecurityToken(
                  issuer,
                  audience,
                  claims.ToArray(),
                  notBefore:DateTime.Now,
                  expires:DateTime.Now.AddMinutes(10),
                  signingCredentials: credential
                );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

        public ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var jwtKey = _config["Jwt:Key"] ?? throw new Exception("Jwt key is missing");
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false, 
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateLifetime = false 
            };
            var tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken securityToken;
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
            var jwtSecurityToken = securityToken as JwtSecurityToken;
            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha512, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");
            return principal;
        }
    }
}
