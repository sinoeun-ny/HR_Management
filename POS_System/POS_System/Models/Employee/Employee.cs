namespace POS_System.Models.Employee
{
    public class Employee
    {
        public int EmployeeId { get; set; }   
        public int HistoryId { get; set; }  
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime? HireDate { get; set; }
        public string Status { get; set; } = "Active";

        public string? ProfilePhoto { get; set; }
        public DateTime? CreateDate { get; set; }

        public int CreateUID { get; set; } 

        public string? UpdateUID { get; set; }  
        public string? ChangedBy { get; set; } 
        public string? Search { get; set; }

        public string? SortBy { get; set; }
        public string? FullName { get; set; }    
        public DateTime? ChangedDate { get; set; }

        public string? SortByEmp { get; set; }

        public string? Remark { get; set; }
    }
}
