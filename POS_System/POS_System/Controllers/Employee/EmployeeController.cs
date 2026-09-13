using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using POS_System.Data;
using POS_System.Models.Employee;
using System.Data;

namespace POS_System.Controllers
{
    public class EmployeeController : Controller
    {
        private readonly DbHelper _dbHelper;
        private readonly UserManager<IdentityUser> _userManager;

        public EmployeeController(UserManager<IdentityUser> userManager, DbHelper dbHelper)
        {
            _userManager = userManager;
            _dbHelper = dbHelper;
        }

        public IActionResult Index() => View();
        public IActionResult TotalEmp() => View();
        public IActionResult DocumentStorage() => View();
        public IActionResult EmployeeInfo() => View();
        public IActionResult Employment() => View();
        public IActionResult History() => View();

        [HttpGet]
        public IActionResult GetPositionsByDept(int departmentId)
        {
            try
            {
                var parameters = new Dictionary<string, object>
                {
                    { "@DepartmentId", departmentId }
                };

                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetPositionsByDepartment", parameters);
                var list = new List<object>();

                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new
                    {
                        positionId = Convert.ToInt32(row["PositionId"]),
                        positionName = row["PositionName"]?.ToString() ?? ""
                    });
                }

                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult RestoreEmployee(int id)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                var parameters = new Dictionary<string, object>
                {
                    { "@EmployeeId", id },
                    { "@UpdateUID",  userId ?? "System" }
                };
                _dbHelper.ExecuteNonQuery("HRMS_RestoreEmployeeProfile", parameters);
                return Json(new { success = true, message = "Employee restored successfully." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetProbationAlerts()
        {
            try
            {
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetProbationAlerts", new Dictionary<string, object>());
                var list = new List<object>();

                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new
                    {
                        employeeId = Convert.ToInt32(row["EmployeeId"]),
                        fullName = row["FullName"]?.ToString() ?? "",
                        hireDate = row["HireDate"] == DBNull.Value ? "" : Convert.ToDateTime(row["HireDate"]).ToString("dd MMM yyyy"),
                        probationEndDate = row["ProbationEndDate"] == DBNull.Value ? "" : Convert.ToDateTime(row["ProbationEndDate"]).ToString("dd MMM yyyy"),
                        departmentName = row["DepartmentName"]?.ToString() ?? "",
                        positionName = row["PositionName"]?.ToString() ?? "",
                        salary = row["Salary"] == DBNull.Value ? 0 : Convert.ToDecimal(row["Salary"]),
                        daysOverdue = row["DaysOverdue"] == DBNull.Value ? 0 : Convert.ToInt32(row["DaysOverdue"]),
                        alertMessage = row["AlertMessage"]?.ToString() ?? "",
                        alertLevel = row["AlertLevel"]?.ToString() ?? ""
                    });
                }

                return Ok(new { success = true, count = list.Count, alerts = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetEmployeeStats()
        {
            try
            {
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeeStats", new Dictionary<string, object>());

                if (dt.Rows.Count == 0)
                    return Ok(new { active = 0, inactive = 0, total = 0 });

                return Ok(new
                {
                    active = dt.Rows[0]["Active"] == DBNull.Value ? 0 : Convert.ToInt32(dt.Rows[0]["Active"]),
                    inactive = dt.Rows[0]["Inactive"] == DBNull.Value ? 0 : Convert.ToInt32(dt.Rows[0]["Inactive"]),
                    total = dt.Rows[0]["Total"] == DBNull.Value ? 0 : Convert.ToInt32(dt.Rows[0]["Total"])
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetNewHiresByDept()
        {
            try
            {
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetNewHire", new Dictionary<string, object>());
                var labels = new List<string>();
                var data = new List<int>();

                foreach (DataRow row in dt.Rows)
                {
                    labels.Add(row["DepartmentName"]?.ToString() ?? "");
                    data.Add(row["NewHires"] == DBNull.Value ? 0 : Convert.ToInt32(row["NewHires"]));
                }

                return Ok(new { labels, data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetEmployees(string? search = null, string? sortBy = null)
        {
            try
            {
                string? mappedSort = sortBy switch
                {
                    "NewlyHire" => "desc",
                    "SeniorEmployee" => "asc",
                    _ => null
                };

                var parameters = new Dictionary<string, object>
                {
                    { "@Search", string.IsNullOrWhiteSpace(search)    ? (object)DBNull.Value : search.Trim() },
                    { "@SortBy", string.IsNullOrWhiteSpace(mappedSort) ? (object)DBNull.Value : mappedSort  }
                };

                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GETEmployeeList", parameters);
                var empInfo = new List<EmployeeInfo>();

                foreach (DataRow row in dt.Rows)
                {
                    empInfo.Add(new EmployeeInfo
                    {
                        EmployeeId = Convert.ToInt32(row["employeeId"]),
                        FirstName = row["FirstName"]?.ToString() ?? "",
                        LastName = row["LastName"]?.ToString() ?? "",
                        Email = row["Email"]?.ToString() ?? "",
                        PhoneNumber = row["PhoneNumber"]?.ToString() ?? "",
                        HireDate = row["HireDate"] == DBNull.Value ? null : Convert.ToDateTime(row["HireDate"]),
                        DepartmentName = row["DepartmentName"]?.ToString() ?? "",
                        PositionName = row["Position"]?.ToString() ?? "",
                        Status = row["Status"]?.ToString() ?? ""
                    });
                }

                return Ok(empInfo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetEmpHis(string? searchEmp = null, string? sortByEmp = null)
        {
            try
            {
                string? mappedSort = sortByEmp switch
                {
                    "EmpAsc" => "asc",
                    "EmpDesc" => "desc",
                    _ => null
                };

                var parameters = new Dictionary<string, object>
                {
                    { "@SearchEmp", string.IsNullOrWhiteSpace(searchEmp)  ? (object)DBNull.Value : searchEmp.Trim() },
                    { "@SortByEmp", string.IsNullOrWhiteSpace(mappedSort) ? (object)DBNull.Value : mappedSort }
                };

                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeeProfileHistory", parameters);
                var empHis = new List<object>();

                foreach (DataRow row in dt.Rows)
                {
                    empHis.Add(new
                    {
                        historyId = Convert.ToInt32(row["HistoryId"]),
                        employeeId = Convert.ToInt32(row["EmployeeId"]),
                        fullName = row["FullName"]?.ToString() ?? "",
                        status = row["Status"]?.ToString() ?? "",
                        changedBy = row["ChangedBy"]?.ToString() ?? "",
                        updateUID = row["UpdateUID"]?.ToString() ?? "",
                        changedDate = row["ChangedDate"] == DBNull.Value ? null
                                      : Convert.ToDateTime(row["ChangedDate"]).ToString("dd MMM yyyy HH:mm")
                    });
                }
                return Ok(empHis);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetAllEmployees(
            string? searchAll = null,
            string? sortByAll = null,
            string? Status = null)
        {
            try
            {
                string? mappedSort = sortByAll switch
                {
                    "Descending" => "desc",
                    "Ascending" => "asc",
                    _ => null
                };

                string? statusSort = Status switch
                {
                    "Active" => "Active",
                    "Inactive" => "Inactive",
                    _ => null
                };

                var parameters = new Dictionary<string, object>
                {
                    { "@SearchAll", string.IsNullOrWhiteSpace(searchAll)  ? (object)DBNull.Value : searchAll.Trim() },
                    { "@SortByAll", string.IsNullOrWhiteSpace(mappedSort) ? (object)DBNull.Value : mappedSort       },
                    { "@Status",    string.IsNullOrWhiteSpace(statusSort) ? (object)DBNull.Value : statusSort.Trim()}
                };

                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetAllEmployeeList", parameters);
                var empAllInfo = new List<EmployeeInfo>();

                foreach (DataRow row in dt.Rows)
                {
                    empAllInfo.Add(new EmployeeInfo
                    {
                        EmployeeId = Convert.ToInt32(row["employeeId"]),
                        FirstName = row["FirstName"]?.ToString() ?? "",
                        LastName = row["LastName"]?.ToString() ?? "",
                        Email = row["Email"]?.ToString() ?? "",
                        PhoneNumber = row["PhoneNumber"]?.ToString() ?? "",
                        HireDate = row["HireDate"] == DBNull.Value ? null : Convert.ToDateTime(row["HireDate"]),
                        DepartmentName = row["DepartmentName"]?.ToString() ?? "",
                        PositionName = row["Position"]?.ToString() ?? "",
                        Status = row["Status"]?.ToString() ?? ""
                    });
                }

                return Ok(empAllInfo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetEmployeeById(int id)
        {
            try
            {
                var parameters = new Dictionary<string, object>
                {
                    { "@EmployeeId", id }
                };

                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeeProfileById", parameters);

                if (dt.Rows.Count == 0)
                    return NotFound(new { success = false, message = "Employee Not Found" });

                var emp = new
                {
                    employeeId = Convert.ToInt32(dt.Rows[0]["EmployeeId"]),
                    firstName = dt.Rows[0]["FirstName"]?.ToString() ?? "",
                    lastName = dt.Rows[0]["LastName"]?.ToString() ?? "",
                    gender = dt.Rows[0]["Gender"]?.ToString() ?? "",
                    dateOfBirth = dt.Rows[0]["DateOfBirth"] == DBNull.Value ? null : Convert.ToDateTime(dt.Rows[0]["DateOfBirth"]).ToString("yyyy-MM-dd"),
                    email = dt.Rows[0]["Email"]?.ToString() ?? "",
                    phoneNumber = dt.Rows[0]["PhoneNumber"]?.ToString() ?? "",
                    address = dt.Rows[0]["Address"]?.ToString() ?? "",
                    hireDate = dt.Rows[0]["HireDate"] == DBNull.Value ? null : Convert.ToDateTime(dt.Rows[0]["HireDate"]).ToString("yyyy-MM-dd"),
                    status = dt.Rows[0]["Status"]?.ToString() ?? "",
                    profilePhoto = dt.Rows[0]["ProfilePhoto"] == DBNull.Value ? null : dt.Rows[0]["ProfilePhoto"]?.ToString()
                };

                return Ok(new { success = true, employee = emp });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetPosHis(string? searchPos = null, string? sortByPos = null)
        {
            try
            {
                string? mappedSort = sortByPos switch
                {
                    "PosAsc" => "asc",
                    "PosDesc" => "desc",
                    _ => null
                };

                var parameters = new Dictionary<string, object>
                {
                    { "@SearchPos", string.IsNullOrWhiteSpace(searchPos) ? (object)DBNull.Value : searchPos.Trim() },
                    { "@SortByPos", string.IsNullOrWhiteSpace(mappedSort) ? (object)DBNull.Value : mappedSort }
                };

                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeePositionHistory", parameters);
                var list = new List<object>();

                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new
                    {
                        historyId = Convert.ToInt32(row["HistoryId"]),
                        employeeId = Convert.ToInt32(row["EmployeeId"]),
                        fullName = row["FullName"]?.ToString() ?? "",
                        departmentName = row["DepartmentName"]?.ToString() ?? "",
                        positionName = row["PositionName"]?.ToString() ?? "",
                        salary = row["Salary"] == DBNull.Value ? 0 : Convert.ToDecimal(row["Salary"]),
                        startDate = row["StartDate"] == DBNull.Value ? null : Convert.ToDateTime(row["StartDate"]).ToString("dd MMM yyyy"),
                        endDate = row["EndDate"] == DBNull.Value ? "Present" : Convert.ToDateTime(row["EndDate"]).ToString("dd MMM yyyy"),
                        isPromoted = row["IsPromoted"] != DBNull.Value && Convert.ToBoolean(row["IsPromoted"]),
                        changedBy = row["ChangedBy"]?.ToString() ?? "",
                        updateUID = row["UpdateUID"]?.ToString() ?? "",
                        changedDate = row["ChangedDate"] == DBNull.Value ? null : Convert.ToDateTime(row["ChangedDate"]).ToString("dd MMM yyyy HH:mm")
                    });
                }
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetDocHis(string? searchDoc = null, string? sortByDoc = null)
        {
            try
            {
                string? mappedSort = sortByDoc switch
                {
                    "DocAsc" => "asc",
                    "DocDesc" => "desc",
                    _ => null
                };

                var parameters = new Dictionary<string, object>
                {
                    { "@SearchDoc", string.IsNullOrWhiteSpace(searchDoc)  ? (object)DBNull.Value : searchDoc.Trim() },
                    { "@SortByDoc", string.IsNullOrWhiteSpace(mappedSort) ? (object)DBNull.Value : mappedSort }
                };

                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeeDocumentHistory", parameters);
                var list = new List<object>();

                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new
                    {
                        historyId = Convert.ToInt32(row["HistoryId"]),
                        employeeId = Convert.ToInt32(row["EmployeeId"]),
                        fullName = row["FullName"]?.ToString() ?? "",
                        documentName = row["DocumentName"]?.ToString() ?? "",
                        expiryDate = row["ExpiryDate"] == DBNull.Value ? "No Expiry" : Convert.ToDateTime(row["ExpiryDate"]).ToString("dd MMM yyyy"),
                        changedBy = row["ChangedBy"]?.ToString() ?? "",
                        changedDate = row["ChangedDate"] == DBNull.Value ? null : Convert.ToDateTime(row["ChangedDate"]).ToString("dd MMM yyyy HH:mm"),
                        updateUID = row["UpdateUID"]?.ToString() ?? ""
                    });
                }
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetEmpHisAll(int id)
        {
            try
            {
                var parameters = new Dictionary<string, object> { { "@HistoryId", id } };
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeeProfile_HistoryById", parameters);

                if (dt.Rows.Count == 0)
                    return NotFound(new { success = false, message = "Snapshot not found." });

                var snap = new
                {
                    historyId = Convert.ToInt32(dt.Rows[0]["HistoryId"]),
                    employeeId = Convert.ToInt32(dt.Rows[0]["EmployeeId"]),
                    fullName = (dt.Rows[0]["Firstname"]?.ToString() ?? "") + " " + (dt.Rows[0]["Lastname"]?.ToString() ?? ""),
                    status = dt.Rows[0]["Status"]?.ToString() ?? "",
                    gender = dt.Rows[0]["Gender"]?.ToString() ?? "",
                    dateOfBirth = dt.Rows[0]["DateOfBirth"] == DBNull.Value ? null : Convert.ToDateTime(dt.Rows[0]["DateOfBirth"]).ToString("dd MMM yyyy"),
                    email = dt.Rows[0]["Email"]?.ToString() ?? "",
                    phoneNumber = dt.Rows[0]["PhoneNumber"]?.ToString() ?? "",
                    address = dt.Rows[0]["Address"]?.ToString() ?? "",
                    hireDate = dt.Rows[0]["HireDate"] == DBNull.Value ? null : Convert.ToDateTime(dt.Rows[0]["HireDate"]).ToString("dd MMM yyyy"),
                    changedBy = dt.Rows[0]["ChangedBy"]?.ToString() ?? "",
                    changedDate = dt.Rows[0]["ChangedDate"] == DBNull.Value ? null : Convert.ToDateTime(dt.Rows[0]["ChangedDate"]).ToString("dd MMM yyyy HH:mm"),
                    updateUID = dt.Rows[0]["UpdateUID"]?.ToString() ?? "",
                    profilePhoto = dt.Rows[0]["ProfilePhoto"] == DBNull.Value ? null : dt.Rows[0]["ProfilePhoto"]?.ToString()
                };

                return Ok(new { success = true, snapshot = snap });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetPositionHisAll(int id)
        {
            try
            {
                var parameters = new Dictionary<string, object> { { "@HistoryId", id } };
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeePositions_HistoryById", parameters);

                if (dt.Rows.Count == 0)
                    return NotFound(new { success = false, message = "Snapshot not found." });

                var snap = new
                {
                    historyId = Convert.ToInt32(dt.Rows[0]["HistoryId"]),
                    employeeId = Convert.ToInt32(dt.Rows[0]["EmployeeId"]),
                    fullName = dt.Rows[0]["FullName"]?.ToString() ?? "",
                    departmentName = dt.Rows[0]["DepartmentName"]?.ToString() ?? "",
                    positionName = dt.Rows[0]["PositionName"]?.ToString() ?? "",
                    salary = dt.Rows[0]["Salary"] == DBNull.Value ? 0 : Convert.ToDecimal(dt.Rows[0]["Salary"]),
                    isPromoted = dt.Rows[0]["IsPromoted"] != DBNull.Value && Convert.ToBoolean(dt.Rows[0]["IsPromoted"]),
                    startDate = dt.Rows[0]["StartDate"] == DBNull.Value ? null : Convert.ToDateTime(dt.Rows[0]["StartDate"]).ToString("dd MMM yyyy"),
                    endDate = dt.Rows[0]["EndDate"] == DBNull.Value ? "Present" : Convert.ToDateTime(dt.Rows[0]["EndDate"]).ToString("dd MMM yyyy"),
                    changedBy = dt.Rows[0]["ChangedBy"]?.ToString() ?? "",
                    changedDate = dt.Rows[0]["ChangedDate"] == DBNull.Value ? null : Convert.ToDateTime(dt.Rows[0]["ChangedDate"]).ToString("dd MMM yyyy HH:mm"),
                    updateUID = dt.Rows[0]["UpdateUID"]?.ToString() ?? ""
                };

                return Ok(new { success = true, snapshot = snap });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetDocHisAll(int id)
        {
            try
            {
                var snapParams = new Dictionary<string, object> { { "@HistoryId", id } };
                var snapDt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDocument_HistoryById", snapParams);

                if (snapDt.Rows.Count == 0)
                    return NotFound(new { success = false, message = "Snapshot not found." });

                var snap = new
                {
                    historyId = Convert.ToInt32(snapDt.Rows[0]["HistoryId"]),
                    employeeId = Convert.ToInt32(snapDt.Rows[0]["EmployeeId"]),
                    fullName = snapDt.Rows[0]["FullName"]?.ToString() ?? "",
                    documentName = snapDt.Rows[0]["DocumentName"]?.ToString() ?? "",
                    documentType = snapDt.Rows[0]["DocumentType"]?.ToString() ?? "",
                    uploadDate = snapDt.Rows[0]["UploadDate"] == DBNull.Value ? null
                                   : Convert.ToDateTime(snapDt.Rows[0]["UploadDate"]).ToString("dd MMM yyyy"),
                    expiryDate = snapDt.Rows[0]["ExpiryDate"] == DBNull.Value ? "No Expiry"
                                   : Convert.ToDateTime(snapDt.Rows[0]["ExpiryDate"]).ToString("dd MMM yyyy"),
                    notes = snapDt.Rows[0]["Notes"]?.ToString() ?? "",
                    changedBy = snapDt.Rows[0]["ChangedBy"]?.ToString() ?? "",
                    updateUID = snapDt.Rows[0]["UpdateUID"]?.ToString() ?? "",
                    changedDate = snapDt.Rows[0]["ChangedDate"] == DBNull.Value ? null
                                   : Convert.ToDateTime(snapDt.Rows[0]["ChangedDate"]).ToString("dd MMM yyyy HH:mm")
                };

                var empId = Convert.ToInt32(snapDt.Rows[0]["EmployeeId"]);
                var allDocParams = new Dictionary<string, object> { { "@EmployeeId", empId } };
                var allDocDt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDocumentsById", allDocParams);

                var allDocs = new List<object>();
                foreach (DataRow row in allDocDt.Rows)
                {
                    allDocs.Add(new
                    {
                        documentId = Convert.ToInt32(row["DocumentId"]),
                        documentName = row["DocumentName"]?.ToString() ?? "",
                        documentType = row["DocumentType"]?.ToString() ?? "",
                        uploadDate = row["UploadDate"] == DBNull.Value ? null
                                       : Convert.ToDateTime(row["UploadDate"]).ToString("dd MMM yyyy"),
                        expiryDate = row["ExpiryDate"] == DBNull.Value ? "No Expiry"
                                       : Convert.ToDateTime(row["ExpiryDate"]).ToString("dd MMM yyyy"),
                        notes = row["Notes"]?.ToString() ?? ""
                    });
                }

                return Ok(new { success = true, snapshot = snap, allDocuments = allDocs });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // CREATE EMPLOYEE
        [HttpPost]
        public IActionResult CreateUser(Employee employee, IFormFile? ProfilePhoto)
        {
            try
            {
                if (employee == null)
                    return BadRequest(new { success = false, message = "Employee data is required." });

                var userId = _userManager.GetUserId(User);
                string uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                var insertParams = new Dictionary<string, object>
                {
                    { "@FirstName",   employee.FirstName ?? "" },
                    { "@LastName",    employee.LastName ?? "" },
                    { "@Gender",      employee.Gender ?? "" },
                    { "@DateOfBirth", employee.DateOfBirth.HasValue ? (object)employee.DateOfBirth.Value : DBNull.Value },
                    { "@Email",       employee.Email ?? "" },
                    { "@PhoneNumber", employee.PhoneNumber ?? "" },
                    { "@Address",     employee.Address ?? "" },
                    { "@HireDate",    employee.HireDate.HasValue ? (object)employee.HireDate.Value : DBNull.Value },
                    { "@Status",      employee.Status ?? "Active" },
                    { "@ProfilePhoto", DBNull.Value },
                    { "@CreateDate",  DateTime.Now },
                    { "@CreateUID",   userId ?? (object)DBNull.Value },
                    { "@UpdateUID",   userId ?? (object)DBNull.Value }
                };

                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_InsertEmployeeProfile", insertParams);
                if (dt.Rows.Count == 0)
                    return BadRequest(new { success = false, message = "Failed to create employee profile in database." });

                int newEmpId = Convert.ToInt32(dt.Rows[0]["EmployeeId"]);
                string? photoPath = null;

                if (ProfilePhoto != null && ProfilePhoto.Length > 0)
                {
                    var ext = Path.GetExtension(ProfilePhoto.FileName).ToLower();
                    var newFileName = newEmpId + ext;
                    var filePath = Path.Combine(uploadsFolder, newFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                        ProfilePhoto.CopyTo(stream);

                    photoPath = "/uploads/" + newFileName;

                    _dbHelper.ExecuteNonQuery("HRMS_UpdateEmployeePhoto", new Dictionary<string, object>
                    {
                        { "@EmployeeID", newEmpId },
                        { "@Photo",      photoPath }
                    });
                }

                return Ok(new { success = true, employeeId = newEmpId, photoPath });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // UPDATE EMPLOYEE PROFILE
        [HttpPost]
        public IActionResult UpdateEmployeeProfile(Employee employee, IFormFile? ProfilePhoto)
        {
            try
            {
                if (employee == null || employee.EmployeeId <= 0)
                    return BadRequest(new { success = false, message = "Valid employee ID is required." });

                var userId = _userManager.GetUserId(User);
                string uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                var updateParams = new Dictionary<string, object>
                {
                    { "@EmployeeID",  employee.EmployeeId },
                    { "@FirstName",   employee.FirstName ?? "" },
                    { "@LastName",    employee.LastName ?? "" },
                    { "@Gender",      employee.Gender ?? "" },
                    { "@DateOfBirth", employee.DateOfBirth.HasValue ? (object)employee.DateOfBirth.Value : DBNull.Value },
                    { "@Email",       employee.Email ?? "" },
                    { "@PhoneNumber", employee.PhoneNumber ?? "" },
                    { "@Address",     employee.Address ?? "" },
                    { "@HireDate",    employee.HireDate.HasValue ? (object)employee.HireDate.Value : DBNull.Value },
                    { "@Status",      employee.Status ?? "Active" },
                    { "@UpdateDate",  DateTime.Now },
                    { "@UpdateUID",   userId ?? (object)DBNull.Value }
                };
                _dbHelper.ExecuteNonQuery("HRMS_UpdateEmployeeProfile", updateParams);

                string? photoPath = null;

                if (ProfilePhoto != null && ProfilePhoto.Length > 0)
                {
                    // Delete old photo if exists
                    var oldPhotoTable = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeeProfileById",
                        new Dictionary<string, object> { { "@EmployeeID", employee.EmployeeId } });

                    if (oldPhotoTable.Rows.Count > 0)
                    {
                        string? oldPhoto = oldPhotoTable.Rows[0]["ProfilePhoto"]?.ToString();
                        if (!string.IsNullOrEmpty(oldPhoto))
                        {
                            string oldFile = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", oldPhoto.TrimStart('/'));
                            if (System.IO.File.Exists(oldFile)) System.IO.File.Delete(oldFile);
                        }
                    }

                    // Save new photo
                    var ext = Path.GetExtension(ProfilePhoto.FileName);
                    var newFileName = employee.EmployeeId + ext;
                    var newFilePath = Path.Combine(uploadsFolder, newFileName);

                    using (var stream = new FileStream(newFilePath, FileMode.Create))
                        ProfilePhoto.CopyTo(stream);

                    photoPath = "/uploads/" + newFileName;

                    _dbHelper.ExecuteNonQuery("HRMS_UpdateEmployeePhoto", new Dictionary<string, object>
                    {
                        { "@EmployeeID", employee.EmployeeId },
                        { "@Photo",      photoPath }
                    });
                }

                return Ok(new { success = true, message = "Employee updated successfully", employeeId = employee.EmployeeId, photo = photoPath });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE EMPLOYEE
        [HttpPost]
        public IActionResult DeleteEmployee(int id)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                var parameters = new Dictionary<string, object>
                {
                    { "@EmployeeId", id },
                    { "@UpdateUID",  userId ?? "System" }
                };
                _dbHelper.ExecuteNonQuery("HRMS_DeleteEmployeeProfile", parameters);
                return Json(new { success = true, message = "Employee marked as inactive successfully." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error deleting employee: " + ex.Message });
            }
        }

        // POSITIONS
        [HttpGet]
        public IActionResult GetPosition(int employeeId)
        {
            try
            {
                var parameters = new Dictionary<string, object> { { "@EmployeeId", employeeId } };
                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeePositionsById", parameters);

                if (dt.Rows.Count == 0) return Ok(new { success = false });

                DataRow row = dt.Rows[0];
                var empPosi = new EmployeePosition
                {
                    EmployeeId = Convert.ToInt32(row["EmployeeId"]),
                    PositionId = Convert.ToInt32(row["PositionId"]),
                    StartDate = row["StartDate"] == DBNull.Value ? null : Convert.ToDateTime(row["StartDate"]),
                    DepartmentId = Convert.ToInt32(row["DepartmentId"]),
                    Salary = row["Salary"] == DBNull.Value ? null : Convert.ToDecimal(row["Salary"]),
                    EndDate = row["EndDate"] == DBNull.Value ? null : Convert.ToDateTime(row["EndDate"])
                };

                return Ok(new { success = true, employeePosition = empPosi });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult CreateEmpPosition([FromBody] EmployeePosition empPosition)
        {
            try
            {
                if (empPosition == null)
                    return BadRequest(new { success = false, message = "Position data is required." });

                var userId = _userManager.GetUserId(User);
                var parameters = new Dictionary<string, object>
                {
                    { "@EmployeeId",   empPosition.EmployeeId },
                    { "@PositionId",   empPosition.PositionId },
                    { "@StartDate",    empPosition.StartDate.HasValue ? (object)empPosition.StartDate.Value : DBNull.Value },
                    { "@DepartmentId", empPosition.DepartmentId },
                    { "@Salary",       empPosition.Salary.HasValue ? (object)empPosition.Salary.Value : DBNull.Value },
                    { "@EndDate",      empPosition.EndDate.HasValue ? (object)empPosition.EndDate.Value : DBNull.Value },
                    { "@IsPromoted",   empPosition.IsPromoted },
                    { "@UpdateUID",    userId ?? (object)DBNull.Value }
                };
                _dbHelper.ExecuteNonQuery("HRMS_InsertEmployeePositions", parameters);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult UpdateEmpPosition([FromBody] EmployeePosition posi)
        {
            if (posi == null)
                return BadRequest(new { success = false, message = "Invalid data." });

            try
            {
                var userId = _userManager.GetUserId(User);
                var updateParams = new Dictionary<string, object>
                {
                    { "@EmployeeID",   posi.EmployeeId },
                    { "@PositionId",   posi.PositionId },
                    { "@StartDate",    posi.StartDate.HasValue ? (object)posi.StartDate.Value : DBNull.Value },
                    { "@DepartmentId", posi.DepartmentId },
                    { "@Salary",       posi.Salary.HasValue ? (object)posi.Salary.Value : DBNull.Value },
                    { "@EndDate",      posi.EndDate.HasValue ? (object)posi.EndDate.Value : DBNull.Value },
                    { "@IsPromoted",   posi.IsPromoted },
                    { "@ChangedBy",    posi.ChangedBy ?? (object)DBNull.Value },
                    { "@UpdateUID",    userId ?? (object)DBNull.Value }
                };
                _dbHelper.ExecuteNonQuery("HRMS_UpdateEmployeePositions", updateParams);
                return Ok(new { success = true, message = "Position updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DOCUMENTS
        [HttpGet]
        public IActionResult GetDocument(int employeeId)
        {
            try
            {
                var parameters = new Dictionary<string, object> { { "@EmployeeId", employeeId } };
                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDocumentsById", parameters);

                if (dt.Rows.Count == 0) return Ok(new { success = false });

                var documents = new List<DocumentStorage>();
                foreach (DataRow row in dt.Rows)
                {
                    documents.Add(new DocumentStorage
                    {
                        DocumentId = Convert.ToInt32(row["DocumentId"]),
                        EmployeeId = Convert.ToInt32(row["EmployeeId"]),
                        DocumentType = row["DocumentType"]?.ToString() ?? "",
                        DocumentName = row["DocumentName"]?.ToString() ?? "",
                        UploadDate = row["UploadDate"] == DBNull.Value ? null : Convert.ToDateTime(row["UploadDate"]),
                        ExpiryDate = row["ExpiryDate"] == DBNull.Value ? null : Convert.ToDateTime(row["ExpiryDate"]),
                        Notes = row["Notes"]?.ToString() ?? ""
                    });
                }

                return Ok(new { success = true, documents });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult AddDocument(int EmployeeId, string? DocumentName, string? ExpiryDate, string? Notes, List<IFormFile> Files)
        {
            try
            {
                if (Files == null || Files.Count == 0)
                    return Ok(new { success = false, message = "No files uploaded." });

                string empFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/EmpDoc", EmployeeId.ToString());
                if (!Directory.Exists(empFolder)) Directory.CreateDirectory(empFolder);

                object expiryParam = DBNull.Value;
                if (!string.IsNullOrWhiteSpace(ExpiryDate) && DateTime.TryParse(ExpiryDate, out DateTime parsedExp))
                {
                    expiryParam = parsedExp;
                }

                int filesUploaded = 0;
                foreach (var file in Files)
                {
                    if (file.Length <= 0) continue;
                    string fileName = Path.GetFileName(file.FileName);
                    string filePath = Path.Combine(empFolder, fileName);
                    using (var stream = new FileStream(filePath, FileMode.Create)) file.CopyTo(stream);

                    string documentPath = $"/EmpDoc/{EmployeeId}/{fileName}";
                    string docLabel = !string.IsNullOrWhiteSpace(DocumentName) ? DocumentName : Path.GetFileNameWithoutExtension(fileName);

                    var userId = _userManager.GetUserId(User);
                    var parameters = new Dictionary<string, object>
                    {
                        { "@EmployeeId",   EmployeeId },
                        { "@DocumentType", documentPath },
                        { "@DocumentName", docLabel },
                        { "@ExpiryDate",   expiryParam },
                        { "@Notes",        Notes ?? "" },
                        { "@UpdateUID",    userId ?? (object)DBNull.Value }
                    };
                    _dbHelper.ExecuteNonQuery("HRMS_InsertDocuments", parameters);
                    filesUploaded++;
                }
                return Ok(new { success = true, filesUploaded });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult UpdateDocument(int EmployeeId, string? DocumentName, string? ExpiryDate, string? Notes, List<IFormFile> Files, string? ChangedBy, string? UpdateUID, string? ChangedDate)
        {
            try
            {
                var userId = _userManager.GetUserId(User);

                object expiryParam = DBNull.Value;
                if (!string.IsNullOrWhiteSpace(ExpiryDate) && DateTime.TryParse(ExpiryDate, out DateTime parsedExp))
                {
                    expiryParam = parsedExp;
                }

                object changedDateParam = DBNull.Value;
                if (!string.IsNullOrWhiteSpace(ChangedDate) && DateTime.TryParse(ChangedDate, out DateTime parsedChanged))
                {
                    changedDateParam = parsedChanged;
                }

                var updateParams = new Dictionary<string, object>
                {
                    { "@EmployeeId",   EmployeeId },
                    { "@DocumentName", DocumentName ?? "" },
                    { "@ExpiryDate",   expiryParam },
                    { "@Notes",        Notes ?? "" },
                    { "@ChangedDate",  changedDateParam },
                    { "@UpdateUID",    userId ?? (object)DBNull.Value }
                };
                _dbHelper.ExecuteNonQuery("HRMS_UpdateDocuments", updateParams);

                if (Files != null && Files.Count > 0)
                {
                    string empFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/EmpDoc", EmployeeId.ToString());
                    if (!Directory.Exists(empFolder)) Directory.CreateDirectory(empFolder);

                    foreach (var file in Files)
                    {
                        if (file.Length <= 0) continue;

                        string fileName = Path.GetFileName(file.FileName);
                        string filePath = Path.Combine(empFolder, fileName);
                        using (var stream = new FileStream(filePath, FileMode.Create)) file.CopyTo(stream);

                        string documentPath = $"/EmpDoc/{EmployeeId}/{fileName}";
                        string docLabel = !string.IsNullOrWhiteSpace(DocumentName) ? DocumentName : Path.GetFileNameWithoutExtension(fileName);

                        var insertParams = new Dictionary<string, object>
                        {
                            { "@EmployeeId",   EmployeeId },
                            { "@DocumentType", documentPath },
                            { "@DocumentName", docLabel },
                            { "@ExpiryDate",   expiryParam },
                            { "@Notes",        Notes ?? "" },
                            { "@ChangedDate",  changedDateParam },
                            { "@ChangedBy",    (object?)ChangedBy ?? DBNull.Value },
                            { "@UpdateUID",    userId ?? (object)DBNull.Value }
                        };
                        _dbHelper.ExecuteNonQuery("HRMS_InsertDocuments", insertParams);
                    }
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult DeleteDocFile(int documentId)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDocById",
                    new Dictionary<string, object> { 
                        { "@DocumentId", documentId },
                        { "@UpdateUID",  userId ?? (object)DBNull.Value }
                    });

                if (dt.Rows.Count > 0)
                {
                    string docPath = dt.Rows[0]["DocumentType"]?.ToString() ?? "";
                    if (!string.IsNullOrEmpty(docPath))
                    {
                        string fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", docPath.TrimStart('/'));
                        if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
                    }
                }

                _dbHelper.ExecuteNonQuery("HRMS_DeleteDocById", new Dictionary<string, object> { { "@DocumentId", documentId } });
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult DownloadDocument(int documentId)
        {
            try
            {
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDocumentById",
                    new Dictionary<string, object> { { "@DocumentId", documentId } });

                if (dt.Rows.Count == 0)
                    return NotFound(new { success = false, message = "Document not found." });

                DataRow row = dt.Rows[0];
                string documentPath = row["DocumentType"]?.ToString() ?? "";
                string documentName = row["DocumentName"]?.ToString() ?? "document";
                string fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", documentPath.TrimStart('/'));

                if (string.IsNullOrEmpty(documentPath) || !System.IO.File.Exists(fullPath))
                    return NotFound(new { success = false, message = "File not found on server." });

                byte[] fileBytes = System.IO.File.ReadAllBytes(fullPath);
                string extension = Path.GetExtension(documentPath);
                string contentType = GetContentTypeFromExtension(extension);
                string downloadName = documentName.Contains('.') ? documentName : documentName + extension;

                return File(fileBytes, contentType, downloadName);
            }
            catch (Exception ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }

        private string GetContentTypeFromExtension(string extension)
        {
            var map = new Dictionary<string, string>
            {
                { ".pdf",  "application/pdf" },
                { ".jpg",  "image/jpeg" },
                { ".jpeg", "image/jpeg" },
                { ".png",  "image/png" }
            };
            return map.TryGetValue(extension.ToLower(), out string? ct) ? ct : "application/octet-stream";
        }
    }
}