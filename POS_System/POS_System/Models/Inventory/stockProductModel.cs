namespace POS_System.Models.Inventory
{
    public class stockProductModel
    {
        public string ProductName { get; set; }
        public string CategoryName { get; set; }
        public int Quantity { get; set; }
        public DateTime ExpireDate { get; set; }
    }
}
