namespace POS_System.Models.Employee
{
    public class DocumentStorage
    {
        public int DocumentStorageId { get; set; }

        public int DocumentId { get; set; }

        public int EmployeeId { get; set; }
        public string DocumentName { get; set; }
        public string DocumentType { get; set; }
        public DateTime? UploadDate { get; set; }= default(DateTime?);
        public DateTime? ExpiryDate { get; set; }
        public string Notes { get; set; }

        public string? FilePath { get; set; } = default(string);
        public string? FileName { get; set; } = default(string);
        public string ? FileExtension { get; set; } = default(string);
        public long? FileSize { get; set; } = default(long?);
        public string? ContentType { get; set; } = default(string);
        public string ChangedBy { get; set; }
        public string ChangedDate { get; set; }
        public string? UpdateUID { get; set; } = default(string);
        // Navigation
        public Employee Employee { get; set; }
    }
}
