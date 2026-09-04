namespace POS_System.Models.Employee
{
    public class Employee
    {
        public int EmployeeId { get; set; }   
        public int HistoryId { get; set; }  
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public DateTime? HireDate { get; set; }
        public string Status { get; set; } 

        public string? ProfilePhoto { get; set; }
        //// Navigation
        public DateTime? CreateDate { get; set; } = default(DateTime?);

        public int CreateUID { get; set; } 

        public string? UpdateUID { get; set; }  
        public string ChangedBy { get; set; } 
        public string Search { get; set; }

        public string SortBy { get; set; }
        public string FullName { get; set; }    
        public DateTime? ChangedDate { get; set; }

        public string SortByEmp { get; set; }

        public string Remark { get; set; }

        }

}
