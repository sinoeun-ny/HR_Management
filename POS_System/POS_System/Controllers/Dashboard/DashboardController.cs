using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace POS_System.Controllers.Dashboard
{
    [Authorize]
    public class DashboardController : Controller
    {

        public IActionResult Index()
        {
            return View();
        }
        public IActionResult DashboardNotifications()
        {
            return View();
        }
        public IActionResult AddEmployee()
        {
            return View();
        }
    }
}
