using Microsoft.AspNetCore.Mvc;

namespace POS_System.Controllers.Product
{
    public class ProductController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult ManageProduct()
        {
            return View();
        }
        public IActionResult ManageCategory()
        {
            return View();
        }
        public IActionResult ManageLogistic()
        {
            return View();
        }
        public IActionResult SupplierProduct()
        {
            return View();
        }
    }
}
