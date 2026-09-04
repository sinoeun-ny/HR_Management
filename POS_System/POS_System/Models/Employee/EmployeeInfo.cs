namespace POS_System.Models.Employee
{
    public class EmployeeInfo
    {
        public int EmployeeId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime? HireDate { get; set; }
        public string DepartmentName { get; set; }
        public string PositionName { get; set; }

        public string Status { get; set; }
    }
}
