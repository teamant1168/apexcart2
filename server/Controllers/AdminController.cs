using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Dto;
using server.Entities;
using server.Helper;
using server.Interface.Repository;
using server.Utils;

namespace server.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IUserRepository userRepository;
        private readonly IJwtHelper jwtHelper;
        private readonly IMapper mapper;

        public AdminController(IUserRepository userRepository, IJwtHelper jwtHelper, IMapper mapper)
        {
            this.userRepository = userRepository;
            this.jwtHelper = jwtHelper;
            this.mapper = mapper;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<ResponseDto>> Login([FromBody] AdminLoginReqDto req)
        {
            ResponseDto response = new ResponseDto();
            var credential = req.Username?.Trim();

            if (string.IsNullOrWhiteSpace(credential) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(response.Error("Username/email and password are required."));
            }

            User? adminUser = await userRepository.GetUserByUserNameAndRole(credential, UserRoles.ADMIN.ToString());
            if (adminUser == null)
            {
                User? userByEmail = await userRepository.GetUserByEmail(credential);
                if (userByEmail?.Role == UserRoles.ADMIN.ToString())
                {
                    adminUser = userByEmail;
                }
            }

            if (adminUser == null || !BCrypt.Net.BCrypt.Verify(req.Password, adminUser.Password))
            {
                return Unauthorized(response.Error("Invalid admin credentials."));
            }

            var refreshToken = jwtHelper.GenerateRefreshToken();

            adminUser.RefreshToken = refreshToken;
            adminUser.RefreshTokenExpire = DateTime.Now.AddDays(2);

            await userRepository.UpdateUser(adminUser);

            LoginUserResDto data = new LoginUserResDto()
            {
                AccessToken = jwtHelper.GenerateJwtToken(adminUser),
                RefreshToken = refreshToken,
                userData = mapper.Map<UserDto>(adminUser)
            };

            response.Data = data;
            response.Message = "Admin login successful";
            return Ok(response);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<ResponseDto>> Register([FromBody] AdminRegisterReqDto req)
        {
            ResponseDto response = new ResponseDto();

            if (string.IsNullOrWhiteSpace(req.Username) ||
                string.IsNullOrWhiteSpace(req.Email) ||
                string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(response.Error("Username, email and password are required."));
            }

            User? existingByEmail = await userRepository.GetUserByEmail(req.Email);
            if (existingByEmail != null)
            {
                return BadRequest(response.Error($"User with email {req.Email} already exsist"));
            }

            User? existingByUserName = await userRepository.GetUserByUserName(req.Username);
            if (existingByUserName != null)
            {
                return BadRequest(response.Error($"User with username {req.Username} already exsist"));
            }

            AdminModel adminModel = new AdminModel()
            {
                Username = req.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role = UserRoles.ADMIN.ToString()
            };

            User newAdmin = new User()
            {
                UserName = adminModel.Username,
                Email = req.Email,
                Address = req.Address,
                Role = adminModel.Role,
                Password = adminModel.Password,
                RefreshToken = "",
                RefreshTokenExpire = DateTime.Now.AddDays(2)
            };

            bool result = await userRepository.AddUser(newAdmin);

            if (!result)
            {
                return BadRequest(response.Error("Internal Server error"));
            }

            return Ok(response.success("Admin registered successfully"));
        }
    }
}
