namespace POS_System.Models.Employee
{
    public class DocumentStorage
    {
        public int DocumentStorageId { get; set; }
        public int DocumentId { get; set; }
        public int EmployeeId { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public DateTime? UploadDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string Notes { get; set; } = string.Empty;

        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public string? FileExtension { get; set; }
        public long? FileSize { get; set; }
        public string? ContentType { get; set; }
        public string? ChangedBy { get; set; }
        public string? ChangedDate { get; set; }
        public string? UpdateUID { get; set; }

        // Navigation
        public Employee? Employee { get; set; }
    }
}
