using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace POS_System.Models
{
    public class UserLoginModel
    {
        [Required]
        public string Email { get; set; }


        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; }


    }
}
