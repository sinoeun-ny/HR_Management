namespace POS_System.Models.Suppliers
{
    public class Supplier
    {
        public int Id { get; set; }  // Primary key

        public string Supplier_name { get; set; }

        public string Address { get; set; }

        public string Phone { get; set; }

        public string CreateId { get; set; }
    }
}
