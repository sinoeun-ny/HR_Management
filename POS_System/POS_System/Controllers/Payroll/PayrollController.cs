using Microsoft.AspNetCore.Mvc;
using POS_System.Data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace POS_System.Controllers.Payroll
{
    public class PayrollController : Controller
    {
        private readonly DbHelper _dbHelper;

        public PayrollController(DbHelper dbHelper)
        {
            _dbHelper = dbHelper;
        }

        // ── GET /Payroll ─────────────────────────────────────────────
        public IActionResult Index() => View();

        // ── ERROR CODE MAP ────────────────────────────────────────────
        // Centralized so the client only ever sees a code + friendly text,
        // never the raw SQL/.NET exception message. Full exception detail
        // is still logged server-side (see LogError) for debugging.
        //
        //  101  Employee list failed to load
        //  102  Failed to save a NEW payroll payment (insert)
        //  103  Failed to update an EXISTING payroll transaction
        //  104  Failed to update payroll status
        //  105  Failed to save a payroll period
        //  106  Failed to load payroll periods
        //  107  Failed to load an employee's payroll slip
        //  108  Invalid/missing request data (validation, not a DB error)

        private static IActionResult ErrorResult(int code, string friendlyMessage, Exception ex = null, int httpStatus = 500)
        {
            if (ex != null) LogError(code, ex);
            return new ObjectResult(new { success = false, code = $"ERR-{code}", message = friendlyMessage })
            {
                StatusCode = httpStatus
            };
        }

        private static void LogError(int code, Exception ex)
        {
            // TODO: swap for ILogger<PayrollController> if/when DI logging is wired up.
            Console.Error.WriteLine($"[Payroll ERR-{code}] {ex}");
        }

        // ── GET /Payroll/GetEmployees ────────────────────────────────
        [HttpGet]
        public IActionResult GetEmployees()
        {
            try
            {
                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetPayrollList");
                var list = new List<PayrollInfo>();

                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new PayrollInfo
                    {
                        TransactionId = Convert.ToInt32(row["TransactionId"]),
                        EmployeeId = Convert.ToInt32(row["EmployeeId"]),
                        EmployeeName = row["EmployeeName"].ToString(),
                        Email = row["Email"].ToString(),
                        PhoneNumber = row["PhoneNumber"].ToString(),
                        HireDate = row["HireDate"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(row["HireDate"]),
                        DepartmentName = row["DepartmentName"].ToString(),
                        PositionName = row["PositionName"].ToString(),
                        EmployeeStatus = row["EmployeeStatus"].ToString(),
                        PayrollPeriodId = row["PayrollPeriodId"] == DBNull.Value ? 0 : Convert.ToInt32(row["PayrollPeriodId"]),
                        PeriodStart = row["PeriodStart"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(row["PeriodStart"]),
                        PeriodEnd = row["PeriodEnd"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(row["PeriodEnd"]),
                        PayDate = row["PayDate"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(row["PayDate"]),
                        GrossSalary = row["GrossSalary"] == DBNull.Value ? 0 : Convert.ToDecimal(row["GrossSalary"]),
                        TaxDeductions = row["TaxDeductions"] == DBNull.Value ? 0 : Convert.ToDecimal(row["TaxDeductions"]),
                        NetSalary = row["NetSalary"] == DBNull.Value ? 0 : Convert.ToDecimal(row["NetSalary"]),
                        Status = row["PayrollStatus"].ToString(),
                        Notes = row["Notes"].ToString(),
                        CurrentPeriodStart = row["CurrentPeriodStart"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(row["CurrentPeriodStart"]),
                        CurrentPeriodEnd = row["CurrentPeriodEnd"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(row["CurrentPeriodEnd"]),
                        CurrentDay = row["CurrentDay"] == DBNull.Value ? 0 : Convert.ToInt32(row["CurrentDay"])
                    });
                }

                return Ok(list);
            }
            catch (Exception ex)
            {
                return ErrorResult(101, "Couldn't load the employee payroll list. Please refresh and try again.", ex);
            }
        }

        // ── POST /Payroll/UpdatePayroll ──────────────────────────────
        [HttpPost]
        public IActionResult UpdatePayroll([FromBody] PayrollInfo model)
        {
            if (model == null)
                return ErrorResult(108, "Invalid request data.", null, 400);

            if (model.EmployeeId <= 0)
                return ErrorResult(108, "Employee ID is required.", null, 400);

            // ✅ NO period validation — period is optional for manual pay

            if (model.TransactionId <= 0)
            {
                // INSERT new transaction
                try
                {
                    var insertParams = new Dictionary<string, object>
                    {
                        { "@EmployeeId",      model.EmployeeId },
                        { "@PayrollPeriodId", model.PayrollPeriodId > 0 ? (object)model.PayrollPeriodId : DBNull.Value },
                        { "@GrossSalary",     model.GrossSalary },
                        { "@TaxDeductions",   model.TaxDeductions },
                        { "@NetSalary",       model.NetSalary },
                        { "@Status",          model.Status ?? "Pending" },
                        { "@Notes",           (object?)model.Notes ?? DBNull.Value },
                        { "@PayDate",         model.PayDate.HasValue ? (object)model.PayDate.Value : DBNull.Value }
                    };
                    // FIXED: SP is named HRMS_InsertPayrollTransactions (plural) — the
                    // singular name was hitting a different/older procedure with fewer
                    // params, causing "too many arguments" and silently skipping the insert.
                    _dbHelper.ExecuteNonQuery("HRMS_InsertPayrollTransactions", insertParams);
                }
                catch (Exception ex)
                {
                    return ErrorResult(102, "Contact support with code ERR-102.", ex);
                }
            }
            else
            {
                // UPDATE existing transaction
                try
                {
                    var updateParams = new Dictionary<string, object>
                    {
                        { "@TransactionId",   model.TransactionId },
                        { "@EmployeeId",      model.EmployeeId },
                        { "@PayrollPeriodId", model.PayrollPeriodId > 0 ? (object)model.PayrollPeriodId : DBNull.Value },
                        { "@GrossSalary",     model.GrossSalary },
                        { "@TaxDeductions",   model.TaxDeductions },
                        { "@NetSalary",       model.NetSalary },
                        { "@Notes",           (object?)model.Notes ?? DBNull.Value }
                    };
                    _dbHelper.ExecuteNonQuery("HRMS_UpdatePayrollTransactions", updateParams);
                }
                catch (Exception ex)
                {
                    return ErrorResult(103, "Contact support with code ERR-103.", ex);
                }

                // UPDATE status + pay date together
                try
                {
                    var statusParams = new Dictionary<string, object>
                    {
                        { "@TransactionId", model.TransactionId },
                        { "@Status",        model.Status ?? "Pending" },
                        { "@PayDate",       model.PayDate.HasValue ? (object)model.PayDate.Value : DBNull.Value }
                    };
                    _dbHelper.ExecuteNonQuery("HRMS_UpdatePayrollStatus", statusParams);
                }
                catch (Exception ex)
                {
                    return ErrorResult(104, "Contact support with code ERR-104.", ex);
                }
            }

            return Ok(new { success = true, message = "Payroll saved successfully." });
        }

        // ── POST /Payroll/SavePayrollPeriod ──────────────────────────
        [HttpPost]
        public IActionResult SavePayrollPeriod(DateTime periodStart, DateTime periodEnd)
        {
            if (periodEnd <= periodStart)
                return ErrorResult(108, "End date must be after start date.", null, 400);

            try
            {
                var parameters = new Dictionary<string, object>
                {
                    { "@PeriodStart", periodStart },
                    { "@PeriodEnd",   periodEnd }
                };

                _dbHelper.ExecuteNonQuery("HRMS_InsertPayrollPeriods", parameters);
                return Ok(new { success = true, message = "Payroll period saved successfully." });
            }
            catch (Exception ex)
            {
                return ErrorResult(105, "Contact support with code ERR-105.", ex);
            }
        }

        // ── GET /Payroll/GetPayrollPeriods ────────────────────────────
        [HttpGet]
        public IActionResult GetPayrollPeriods()
        {
            try
            {
                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetPayrollPeriods");

                var periods = dt.AsEnumerable().Select(r => new
                {
                    PeriodId = r.Field<int>("PayrollPeriodId"),
                    Start = r.Field<DateTime>("PeriodStart").ToString("yyyy-MM-dd"),
                    End = r.Field<DateTime>("PeriodEnd").ToString("yyyy-MM-dd")
                }).ToList();

                return Ok(periods);
            }
            catch (Exception ex)
            {
                return ErrorResult(106, "Contact support with code ERR-106.", ex);
            }
        }

        // ── GET /Payroll/GetSlipByEmployee ────────────────────────────
        // Returns the employee's FULL payroll history (all periods, newest
        // first) — not just the current cycle. Each row now includes
        // PeriodLabel (e.g. "Jun P1 2026") alongside the full PeriodDate
        // range, so the slip modal can show every past pay period
        // (Jun P1, Jun P2, Jul P1, Jul P2, ...) that's been paid.
        [HttpGet]
        public IActionResult GetSlipByEmployee(int employeeId)
        {
            try
            {
                var parameters = new Dictionary<string, object>
                {
                    { "@EmployeeId", employeeId }
                };

                DataTable dt = _dbHelper.ExecuteStoredProcedure("HRMS_GetPayrollSlipByEmployeeId", parameters);

                var records = dt.AsEnumerable().Select(r => new
                {
                    TransactionId = r.Field<int>("TransactionId"),
                    PeriodLabel = r["PeriodLabel"] == DBNull.Value ? "N/A" : r.Field<string>("PeriodLabel"),
                    PeriodDate = r["PeriodDate"] == DBNull.Value ? "N/A" : r.Field<string>("PeriodDate"),
                    PayDate = r["PayDate"] == DBNull.Value ? null : (DateTime?)r.Field<DateTime>("PayDate"),
                    GrossSalary = r["GrossSalary"] == DBNull.Value ? 0 : Convert.ToDecimal(r["GrossSalary"]),
                    TaxDeductions = r["TaxDeductions"] == DBNull.Value ? 0 : Convert.ToDecimal(r["TaxDeductions"]),
                    NetSalary = r["NetSalary"] == DBNull.Value ? 0 : Convert.ToDecimal(r["NetSalary"]),
                    Status = r["Status"] == DBNull.Value ? "Pending" : r.Field<string>("Status"),
                    Notes = r["Notes"] == DBNull.Value ? "-" : r.Field<string>("Notes")
                }).ToList();

                return Json(records);
            }
            catch (Exception ex)
            {
                return ErrorResult(107, "Contact support with code ERR-107.", ex);
            }
        }


    }
}

