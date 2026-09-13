using System.ComponentModel.DataAnnotations;

namespace POS_System.Models
{
    public class UserLoginModel
    {
        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
    }
}
