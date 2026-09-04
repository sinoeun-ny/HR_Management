using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS_System.Models;

namespace POS_System.Controllers.Login
{

    [AllowAnonymous]
    public class LoginController : Controller
    {

        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly UserManager<IdentityUser> _userManager;

        public LoginController(SignInManager<IdentityUser> signInManager, UserManager<IdentityUser> userManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
        }




 
        public IActionResult Index()
        {
            return View(new UserLoginModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Index(UserLoginModel model)
        {

            if (ModelState.IsValid)
            {
                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user != null)
                {
                    var Rs = await _signInManager.PasswordSignInAsync(user, model.Password,false,false);
                    if (Rs.Succeeded)
                    {
                        return RedirectToAction("Index", "Employee");
                    }
                    else
                    {
                        // If login fails, show an error message
                        ViewData["Error"] = "Incorrect password";
                    }

                }
                else
                {
                    // If login fails, show an error message
                    ViewData["Error"] = "Invalid Account";
                }

            }

            return View(model);
        }


        public async Task<IActionResult> createUser()
        {
            var user = new IdentityUser { UserName = "Sinoeun", PhoneNumber="010100800" ,Email= "phearunphoeun@gmail.com" };
            var result = await _userManager.CreateAsync(user, "Admin@1234");
            return Content(result.Succeeded ? "Test user created successfully" : "Error create");
        }
    }
}
