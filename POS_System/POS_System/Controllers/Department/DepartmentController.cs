using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Storage;
using POS_System.Data;
using POS_System.Models.Department;
using System.Collections.Generic;
using System.Data;
using System.Text.Json;

namespace POS_System.Controllers
{
    public class DepartmentController : Controller
    {
        private readonly DbHelper _dbHelper;
        private readonly UserManager<IdentityUser> _userManager;
        public DepartmentController(DbHelper dbHelper, UserManager<IdentityUser> userManager)
        {
            _dbHelper = dbHelper;
            _userManager = userManager;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult DeptHistory()
        {
            return View();
        }

        public IActionResult viewDept()
        {
            return View();
        }


        [HttpGet]
        public IActionResult GetDeptHistory(string? search = null, string? sortBy = null)
        {
            try
            {
                string? mappedSort = sortBy switch
                {
                    "DeptAsc" => "asc",
                    "DeptDesc" => "desc",
                    _ => null
                };

                var parameters = new Dictionary<string, object>
        {
            { "@Search", string.IsNullOrWhiteSpace(search) ? (object)DBNull.Value : search.Trim() },   // ← FIXED
            { "@SortByDept", string.IsNullOrWhiteSpace(mappedSort) ? (object)DBNull.Value : mappedSort }
        };


                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDepartmentHistory", parameters);
                var list = new List<object>();

                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new
                    {
                        historyId = Convert.ToInt32(row["HistoryId"]),
                        departmentId = Convert.ToInt32(row["DepartmentId"]),
                        departmentName = row["DepartmentName"].ToString(),
                        abbreviation = row["Abbreviation"]?.ToString() ?? "",
                        description = row["Description"]?.ToString() ?? "",
                        updateUID = row["UpdateUID"]?.ToString() ?? "",
                        changedBy = row["ChangedBy"].ToString(),
                        changedDate = row["ChangedDate"] == DBNull.Value ? null
                                         : Convert.ToDateTime(row["ChangedDate"]).ToString("dd MMM yyyy")
                    });
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetDeptHisAll(int id)
        {
            try
            {
                var parameters = new Dictionary<string, object> { { "@HistoryId", id } };
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDepartmentHistoryById", parameters);

                if (dt.Rows.Count == 0)
                    return NotFound(new { success = false, message = "Snapshot not found." });

                return Ok(new
                {
                    success = true,
                    snapshot = new
                    {
                        historyId = Convert.ToInt32(dt.Rows[0]["HistoryId"]),
                        departmentId = Convert.ToInt32(dt.Rows[0]["DepartmentId"]),
                        departmentName = dt.Rows[0]["DepartmentName"].ToString(),
                        abbreviation = dt.Rows[0]["Abbreviation"]?.ToString() ?? "",
                        description = dt.Rows[0]["Description"]?.ToString() ?? "",
                        changedBy = dt.Rows[0]["ChangedBy"].ToString(),
                        updateUID = dt.Rows[0]["UpdateUID"].ToString(),
                        changedDate = dt.Rows[0]["ChangedDate"] == DBNull.Value ? null
                                         : Convert.ToDateTime(dt.Rows[0]["ChangedDate"]).ToString("dd MMM yyyy ")
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetDepartments(string? searchDept = null)  // ← Parameter matches JS
        {
            try
            {
                var parameters = new Dictionary<string, object>
        {
            { "@SearchDept", string.IsNullOrWhiteSpace(searchDept) ? (object)DBNull.Value : searchDept.Trim() }
        };

                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDepartments", parameters);  // ← FIXED: use parameters

                var list = new List<object>();
                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new
                    {
                        departmentId = Convert.ToInt32(row["DepartmentId"]),
                        departmentName = row["DepartmentName"].ToString(),
                        abbreviation = row["Abbreviation"]?.ToString() ?? "",
                        description = row["Description"]?.ToString() ?? "",
                        employeeTotal = Convert.ToInt32(row["EmployeeTotal"]),
                        positionTotal = Convert.ToInt32(row["PositionTotal"])
                    });
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpPost]
        public IActionResult UpdateDept(Department dept)
        {
            try
            {
                if (dept == null || dept.DepartmentId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid department ID." });
                }

                var userId = _userManager.GetUserId(User);
                object updateUidParam = string.IsNullOrEmpty(userId) ? (object)DBNull.Value : userId;
                var updateParams = new Dictionary<string, object>
        {
            { "@DepartmentId", dept.DepartmentId },
            { "@DepartmentName", dept.DepartmentName },
            { "@Description", string.IsNullOrWhiteSpace(dept.Description) ? (object)DBNull.Value : dept.Description },
            { "@Abbreviation", string.IsNullOrWhiteSpace(dept.Abbreviation) ? (object)DBNull.Value : dept.Abbreviation },
            { "@UpdateUID", updateUidParam }
        };

                _dbHelper.ExecuteNonQuery("HRMS_UpdateDepartments", updateParams);
                return Ok(new { success = true, message = "Department updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetDeptById(int id)
        {
            try
            {
                var parameters = new Dictionary<string, object> { { "@DepartmentId", id } };
                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetDepartmentById", parameters);

                if (dt.Rows.Count == 0)
                    return NotFound(new { success = false, message = "Department not found." });

                return Ok(new
                {
                    success = true,
                    departmentId = Convert.ToInt32(dt.Rows[0]["DepartmentId"]),
                    departmentName = dt.Rows[0]["DepartmentName"].ToString(),
                    abbreviation = dt.Rows[0]["Abbreviation"]?.ToString(),
                    description = dt.Rows[0]["Description"]?.ToString(),
                    employeeTotal = Convert.ToInt32(dt.Rows[0]["EmployeeTotal"]),
                    positionTotal = Convert.ToInt32(dt.Rows[0]["PositionTotal"])

                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetEmployeesByDept(int departmentId,
     string? search = null, string? sortBy = null)
        {
            try
            {
                string? mappedSort = sortBy switch
                {
                    "Descending" => "desc",
                    "Ascending" => "asc",
                    _ => null
                };

                var parameters = new Dictionary<string, object>
        {
            { "@DepartmentId", departmentId },
            { "@Search",  string.IsNullOrWhiteSpace(search)     ? (object)DBNull.Value : search.Trim() },
            { "@SortBy",  string.IsNullOrWhiteSpace(mappedSort) ? (object)DBNull.Value : mappedSort    }
        };

                var dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetEmployeesByDepartment", parameters);
                var list = new List<object >();

                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new
                    {
                        employeeId = Convert.ToInt32(row["EmployeeId"]),
                        fullName = row["FirstName"].ToString() + " " + row["LastName"].ToString(),
                        positionName = row["PositionName"].ToString(),   // ← This populates Position column
                        salary = row["Salary"] == DBNull.Value ? 0 : Convert.ToDecimal(row["Salary"]),
                        startDate = row["StartDate"] == DBNull.Value ? null
                                       : Convert.ToDateTime(row["StartDate"]).ToString("dd MMM yyyy"),
                        status = row["Status"].ToString()  // ← ADD this for Status column
                    });
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult AddDepartment(string departmentName,
    string? abbreviation, string? description)
        {
            try
            {
                var userId = _userManager.GetUserId(User);

                var parameters = new Dictionary<string, object>
                {
                    { "@DepartmentName", departmentName.Trim() },
                    { "@Abbreviation", string.IsNullOrWhiteSpace(abbreviation) ? DBNull.Value : abbreviation.Trim() },
                    { "@Description", string.IsNullOrWhiteSpace(description) ? DBNull.Value : description.Trim() },
                    { "@CreateUID", string.IsNullOrWhiteSpace(userId) ? DBNull.Value : userId }
                };

                var dt = _dbHelper.ExecuteStoredProcedure("dbo.HRMS_InsertDepartment", parameters);

                if (dt.Rows.Count == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "The procedure did not return the inserted department."
                    });
                }

                DataRow row = dt.Rows[0];

                return Ok(new
                {
                    success = true,
                    message = "Department added successfully.",
                    department = new
                    {
                        departmentId = Convert.ToInt32(row["DepartmentId"]),
                        departmentName = row["DepartmentName"]?.ToString() ?? "",
                        abbreviation = row["Abbreviation"] == DBNull.Value ? "" : row["Abbreviation"]?.ToString() ?? "",
                        description = row["Description"] == DBNull.Value ? "" : row["Description"]?.ToString() ?? "",
                        employeeTotal = 0,
                        positionTotal = 0
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpGet]
        public IActionResult GetPositionsByDept(int departmentId)
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
                    positionName = row["PositionName"].ToString()
                });
            }

            return Ok(list);
        }


        [HttpPost]
        public IActionResult DeleteDept(int id)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                var parameters = new Dictionary<string, object>
        {
            { "@DepartmentId", id },
            { "@UpdateUID", userId ?? (object)DBNull.Value }
        };
                _dbHelper.ExecuteNonQuery("HRMS_DeleteDepartments", parameters);
                return Ok(new { success = true, message = "Department deleted." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
