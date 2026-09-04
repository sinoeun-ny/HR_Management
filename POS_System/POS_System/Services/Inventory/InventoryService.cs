using Microsoft.Data.SqlClient;
using POS_System.Data;
using POS_System.Models.Inventory;

namespace POS_System.Services.Inventory
{
    public class InventoryService
    {

        private readonly DbHelper _dbHelper;

        public InventoryService(DbHelper dbHelper)
        {
            _dbHelper = dbHelper;
        }

        public List<stockProductModel> GetCentralStockProduct()
        {
            var inventoryList = new List<stockProductModel>();
            string query = @"
               SELECT p.ProductName, c.CategoryName, i.Quantity, i.ExpireDate
                FROM TblInventory i
                INNER JOIN TblProduct p ON i.ProductID = p.ProductID
                INNER JOIN TblCategory c on c.CategoryID = p.CategoryID
                ORDER BY i.ProductID";
            using (SqlConnection conn = _dbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(query, conn))
            {
                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        inventoryList.Add(new stockProductModel
                        {
                            ProductName = reader["ProductName"].ToString(),
                            CategoryName = reader["CategoryName"].ToString(),
                            Quantity = Convert.ToInt32(reader["Quantity"]),
                            ExpireDate = Convert.ToDateTime(reader["ExpireDate"])
                        });
                    }
                }
                conn.Close();
            }
      

            return inventoryList;
        }

        public List<stockProductModel> GetCentralStockProductThreeMonthExpiration()
        {
            var inventoryList = new List<stockProductModel>();
            string query = @"SELECT 
                                    p.ProductName, 
                                    c.CategoryName, 
                                    i.Quantity, 
                                    i.ExpireDate
                                        FROM TblInventory i
                                        INNER JOIN TblProduct p ON i.ProductID = p.ProductID
                                        INNER JOIN TblCategory c ON c.CategoryID = p.CategoryID
                                        WHERE i.ExpireDate BETWEEN GETDATE() AND DATEADD(DAY, 120, GETDATE())
                                        ORDER BY i.ProductID";
            using (SqlConnection conn = _dbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(query, conn))
            {
                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        inventoryList.Add(new stockProductModel
                        {
                            ProductName = reader["ProductName"].ToString(),
                            CategoryName = reader["CategoryName"].ToString(),
                            Quantity = Convert.ToInt32(reader["Quantity"]),
                            ExpireDate = Convert.ToDateTime(reader["ExpireDate"])
                        });
                    }
                }
                conn.Close();
            }


            return inventoryList;
        }


        public List<StoreModel> GetStoreDetail()
        {
            var storeList = new List<StoreModel>();
            string query = "Select *from TblStore";
            using (SqlConnection conn = _dbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(query, conn))
            {
                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        storeList.Add(new StoreModel
                        {
                            StoreID = Convert.ToInt32(reader["StoreID"]),
                            StoreName = reader["StoreName"].ToString(),
                            Location = reader["Location"].ToString(),

                        });
                    }
                }
                conn.Close();
            }

            return storeList;
        }
    }





    
}
