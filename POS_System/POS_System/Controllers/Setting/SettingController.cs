using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace POS_System.Controllers.Setting
{
    [Authorize]
    public class SettingController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
