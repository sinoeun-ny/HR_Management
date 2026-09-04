using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace POS_System.Controllers.Pos
{
    [Authorize]
    public class PosController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult OrderHistiry()
        {
            return View();
        }
        public IActionResult Return_And_Refund()
        {
            return View();
        }
        public IActionResult Confirm()
        {
            return PartialView();
        }

    }
}
