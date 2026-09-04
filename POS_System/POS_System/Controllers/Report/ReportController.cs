using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace POS_System.Controllers.Report
{
    [Authorize]
    public class ReportController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult Inventory()
        {
            return View();
        }

        public IActionResult Product()
        {
            return View();
        }

        public IActionResult Supplier()
        {
            return View();
        }
    }
}
