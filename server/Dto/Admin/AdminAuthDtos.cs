namespace server.Dto
{
    public class AdminModel
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
    }

    public class AdminLoginReqDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class AdminRegisterReqDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Address { get; set; } = "";
    }
}
