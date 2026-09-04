using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS_System.Models;
using POS_System.Services.Inventory;

namespace POS_System.Controllers.Inventory
{
    [Authorize]
    public class InventoryController : Controller
    {

       
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }
        public IActionResult Supplier()
        {
            return View();
        }
        public IActionResult RequestProduct()
        {
            return View();
        }
        public IActionResult CentralStock()
        {
            return View();
        }
        public IActionResult ProductCheck()
        {
            return View();
        }
        public IActionResult StoreRequest()
        {
            return View();
        }

        
    }
}
