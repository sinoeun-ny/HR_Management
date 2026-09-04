public class PayrollInfo
{
    public int TransactionId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime? HireDate { get; set; }
    public string DepartmentName { get; set; }
    public string PositionName { get; set; }
    public string EmployeeStatus { get; set; }
    public int PayrollPeriodId { get; set; }
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }
    public DateTime? PayDate { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal TaxDeductions { get; set; }
    public decimal NetSalary { get; set; }
    public string Status { get; set; }
    public string Notes { get; set; }
    public DateTime? CurrentPeriodStart { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public int CurrentDay { get; set; }
}