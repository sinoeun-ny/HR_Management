namespace POS_System.Models.Employee
{
    public class EmployeePosition
    {
        public int EmployeePositionId { get; set; } //pk
        public int EmployeeId { get; set; }//fk
        public int PositionId { get; set; }//fk
        public DateTime? StartDate { get; set; } 
        public decimal? Salary { get; set; }

        public DateTime? EndDate { get; set; }
        public bool IsPromoted { get; set; } = default(bool);
        public int DepartmentId { get; set; }

        public DateTime? ChangedDate { get; set; }
        public string? ChangedBy { get; set; }

        public string? UpdateUID { get; set; }
    }
}
