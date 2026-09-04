using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using POS_System.Data;
using POS_System.Models.Suppliers;

namespace POS_System.Controllers.Suppliers
{
    public class SupplierController : Controller
    {
        private readonly DbHelper _dbHelper;

        public SupplierController(DbHelper dbHelper)
        {
            _dbHelper = dbHelper;
        }
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult add([FromBody] Supplier supplier)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState); // validation object 

            {
                using (SqlConnection con = _dbHelper.GetConnection())
                {
                    con.Open();
                    using (SqlCommand cmd = new SqlCommand("INSERT INTO tblposupplier(suppliername, supplieraddress, supplierphone, Createid) VALUES(@name, @addr, @phone, @createid)", con))
                    {
                        cmd.Parameters.AddWithValue("@name", supplier.Supplier_name);
                        cmd.Parameters.AddWithValue("@addr", supplier.Address);
                        cmd.Parameters.AddWithValue("@phone", supplier.Phone);
                        cmd.Parameters.AddWithValue("@createid", supplier.CreateId);

                        cmd.ExecuteNonQuery();
                    }
                }
            }

            return Json(new { message = "Supplier added successfully!" });
        }
    }
}
