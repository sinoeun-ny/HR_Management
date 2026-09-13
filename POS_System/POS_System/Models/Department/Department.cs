namespace POS_System.Models.Department
{
    public class Department
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Abbreviation { get; set; }
        public DateTime ChangedDate { get; set; } = DateTime.Now;

        public string? CreatedBy { get; set; }
        public string? ChangedBy { get; set; }
        public string? UpdateUID { get; set; } 
         
        public string? SortBy { get; set; }
        public string? Search { get; set; }

        public string? PositionName { get; set; }
        public string? FullName { get; set; }  
        public string? Salary { get; set; }
        public int EmployeeId { get; set; }
    }
}