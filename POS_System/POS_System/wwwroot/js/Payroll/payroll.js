// ============================================================
//  Payroll Page — payroll.js
// ============================================================

let allPayrollData = [];
let currentStatusFilter = ""; // tracks active status dropdown so search + status combine

// ── On Ready ─────────────────────────────────────────────────
$(document).ready(function () {
    loadPayrollData();
    refreshPeriodTable();

    $("#searchInput").on("keyup", filterTable);
    $("#clearBtn").on("click", clearSearch);

    // Show/hide Pay Date when status changes
    $("#editStatus").on("change", function () {
        const val = $(this).val();
        if (val === "Paid") {
            const today = new Date().toISOString().split("T")[0];
            $("#editPayDate").val(today);
            $("#editPayDateWrapper").removeClass("d-none");
        } else {
            $("#editPayDate").val("");
            $("#editPayDateWrapper").addClass("d-none");
        }
    });

    // Auto-calc net salary
    $("#editGrossSalary, #editTaxDeductions").on("input", autoCalcNet);
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(function (el) {
        new bootstrap.Dropdown(el, {
            popperConfig: function (defaultBsPopperConfig) {
                return Object.assign({}, defaultBsPopperConfig, { strategy: 'fixed' });
            }
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────

function autoCalcNet() {
    const gross = parseFloat($("#editGrossSalary").val()) || 0;
    const tax = parseFloat($("#editTaxDeductions").val()) || 0;
    const net = Math.max(0, gross - tax);
    $("#editNetSalary").val(net.toFixed(2));
}

function formatDate(value) {
    if (!value) return "N/A";
    const d = new Date(value);
    return isNaN(d) ? "N/A" : d.toLocaleDateString("en-US");
}

function formatDateLong(value) {
    if (!value) return "N/A";
    const d = new Date(value);
    return isNaN(d) ? "N/A" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPeriodShort(value) {
    if (!value) return "N/A";
    const d = new Date(value);
    return isNaN(d) ? "N/A" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusBadge(status) {
    const s = (status || "").toLowerCase();
    const base = "display:inline-block;padding:4px 14px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;";
    if (s === "paid") return `<span style="${base}background:#28a745;color:#fff;">Paid</span>`;
    if (s === "unpaid") return `<span style="${base}background:#dc3545;color:#fff;">Unpaid</span>`;
    if (s === "not paid") return `<span style="${base}background:#dc3545;color:#fff;">Not Paid</span>`;
    if (s === "pending") return `<span style="${base}background:#fd7e14;color:#fff;">Pending</span>`;
    if (s === "paid early") return `<span style="${base}background:#1565C0;color:#fff;">Paid Early</span>`;
    return `<span style="${base}background:#6c757d;color:#fff;">${status || "N/A"}</span>`;
}
function get(obj, key) {
    if (!obj) return null;
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    const p = key.charAt(0).toUpperCase() + key.slice(1);
    if (obj[p] !== undefined && obj[p] !== null) return obj[p];
    const c = key.charAt(0).toLowerCase() + key.slice(1);
    if (obj[c] !== undefined && obj[c] !== null) return obj[c];
    return null;
}

// Auto-generated payment note
// Produces e.g. "1st half salary for Jul to John Doe" based on which
// half-month cycle is currently active and the employee's name.
function buildDefaultNote(emp) {
    const day = parseInt(get(emp, "currentDay")) || new Date().getDate();
    const periodStart = get(emp, "currentPeriodStart");
    const cycleLabel = day <= 15 ? "1st half" : "2nd half";

    const monthDate = periodStart ? new Date(periodStart) : new Date();
    const monthName = isNaN(monthDate) ? "" : monthDate.toLocaleDateString("en-US", { month: "short" });

    const empName = get(emp, "employeeName") ?? "";

    return `${cycleLabel} salary for ${monthName} to ${empName}`.trim();
}

// Error display helper
// The controller now returns { success:false, code:"ERR-XXX", message:"..." }
// instead of raw exception text. This shows ONLY the code + friendly
// message — never xhr.responseJSON's raw .NET/SQL exception detail.
function showApiError(xhr, fallbackTitle) {
    const body = xhr && xhr.responseJSON;
    const code = body && body.code ? body.code : "ERR-000";
    const msg = body && body.message ? body.message : "Something went wrong. Please try again.";

    Swal.fire({
        icon: "error",
        title: fallbackTitle || "Error",
        html: `<p>${msg}</p><p class="text-muted small mb-0">Error code: ${code}</p>`
    });
}

// ── Load Data ─────────────────────────────────────────────────

function loadPayrollData() {
    $.ajax({
        url: "/Payroll/GetEmployees",
        type: "GET",
        dataType: "json",
        success: function (data) {
            allPayrollData = data || [];
            populateTable(allPayrollData);
            updateSummaryCards(allPayrollData);
            buildDeptTable(allPayrollData);

            // Cycle info alert — only once per login
            if (data && data.length > 0 && !localStorage.getItem("cycleAlertShown")) {
                const currentDay = get(data[0], "currentDay");
                const periodStart = get(data[0], "currentPeriodStart");
                const periodEnd = get(data[0], "currentPeriodEnd");

                if (currentDay && periodStart && periodEnd) {
                    const cycle = parseInt(currentDay) <= 15 ? 1 : 2;
                    Swal.fire({
                        icon: "info",
                        title: `📅 Cycle ${cycle} Payroll`,
                        html: `
                            <p>Showing payroll for period:</p>
                            <h5 class="text-primary fw-bold">
                                ${formatDateLong(periodStart)} → ${formatDateLong(periodEnd)}
                            </h5>
                            <p class="text-muted small">
                                Employees paid within this period are marked <b>Paid</b>.
                            </p>`,
                        confirmButtonText: "Got it",
                        timer: 4000,
                        timerProgressBar: true
                    });
                    localStorage.setItem("cycleAlertShown", "true");
                }
            }
        },
        error: function (xhr) {
            console.error("Load error:", xhr);
            showApiError(xhr, "Couldn't load payroll data");
        }
    });
}

// ── Employee Table ────────────────────────────────────────────

function populateTable(data) {
    const $tbody = $("#payrollTable tbody");
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.append(`<tr><td colspan="8" class="text-center text-muted py-4">No payroll records found.</td></tr>`);
        return;
    }

    $.each(data, function (index, emp) {
        const transId = parseInt(get(emp, "transactionId")) || 0;
        const empId = parseInt(get(emp, "employeeId")) || 0;
        const status = get(emp, "payrollStatus") || get(emp, "status") || "Pending";
        const netSalary = Number(get(emp, "netSalary") ?? 0);
        const empName = (get(emp, "employeeName") ?? "").replace(/'/g, "\\'");
        const position = (get(emp, "positionName") ?? "N/A").replace(/'/g, "\\'");
        const dept = (get(emp, "departmentName") ?? "N/A").replace(/'/g, "\\'");

        $tbody.append(`
        <tr data-transid="${transId}" data-index="${index}">
            <td>${empId}</td>
            <td>${get(emp, "employeeName") ?? ""}</td>
            <td>${get(emp, "departmentName") ?? "N/A"}</td>
            <td>${get(emp, "positionName") ?? "N/A"}</td>
            <td>${formatDate(get(emp, "payDate"))}</td>
            <td>$${netSalary.toFixed(2)}</td>
            <td>${getStatusBadge(status)}</td>
            <td>
                <button class="btn btn-warning btn-sm me-1"
                    onclick="openEditModal(${transId}, ${index})">
                    <i class="fas fa-money-bill-wave me-1"></i>Pay
                </button>
                <button class="btn btn-primary btn-sm"
                    onclick="openSlipModal(${empId}, '${empName}', '${position}', '${dept}')">
                    <i class="fas fa-eye me-1"></i>View
                </button>
            </td>
        </tr>`);
    });
}

// ── Summary Cards ─────────────────────────────────────────────

function updateSummaryCards(data) {
    let totalNet = 0, totalGross = 0;

    $.each(data, function (_, emp) {
        totalNet += Number(get(emp, "netSalary") ?? 0);
        totalGross += Number(get(emp, "grossSalary") ?? 0);
    });

    const pct = totalGross === 0 ? 0 : (totalNet / totalGross) * 100;
    $("#monthlyPayroll").text(`$${totalNet.toFixed(2)}`);
    $("#payrollPercent").text(`${pct.toFixed(2)}% of total`);
}

// ── View Switch ───────────────────────────────────────────────

function switchView(view) {
    const isEmployee = view === 'employee';

    document.getElementById('employeeTableWrap').style.display = isEmployee ? 'block' : 'none';
    document.getElementById('deptTableWrap').style.display = isEmployee ? 'none' : 'block';

    document.getElementById('empSearchBar').style.cssText = isEmployee
        ? 'display:flex !important'
        : 'display:none !important';
    document.getElementById('deptSearchBar').style.cssText = isEmployee
        ? 'display:none !important'
        : 'display:flex !important';

    const empBtn = document.getElementById('empToggleBtn');
    const deptBtn = document.getElementById('deptToggleBtn');

    if (isEmployee) {
        empBtn.style.background = '#fff';
        empBtn.style.color = '#2979FF';
        deptBtn.style.background = 'transparent';
        deptBtn.style.color = 'rgba(255,255,255,0.85)';
    } else {
        deptBtn.style.background = '#fff';
        deptBtn.style.color = '#2979FF';
        empBtn.style.background = 'transparent';
        empBtn.style.color = 'rgba(255,255,255,0.85)';
    }
}

// ── Department Table ──────────────────────────────────────────

function buildDeptTable(data) {
    const $tbody = $('#deptTableBody');
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.append(`<tr><td colspan="6" class="text-center text-muted py-4">No department data found.</td></tr>`);
        return;
    }

    const deptMap = {};
    $.each(data, function (_, emp) {
        const dept = get(emp, 'departmentName') || 'N/A';
        const net = Number(get(emp, 'netSalary') ?? 0);
        const status = (get(emp, 'status') || get(emp, 'payrollStatus') || 'Pending').toLowerCase();
        const pStart = get(emp, 'currentPeriodStart');
        const pEnd = get(emp, 'currentPeriodEnd');

        if (!deptMap[dept]) {
            deptMap[dept] = { count: 0, total: 0, paid: 0, periodStart: pStart, periodEnd: pEnd };
        }
        deptMap[dept].count++;
        deptMap[dept].total += net;
        // "Paid Early" counts as settled for department summary purposes too —
        // otherwise a fully-paid (some early) department would still show "Pay now".
        if (status === 'paid' || status === 'paid early') deptMap[dept].paid++;
    });

    const dotColors = ['#2979FF', '#28a745', '#fd7e14', '#dc3545', '#6f42c1', '#17a2b8'];
    let colorIdx = 0;

    $.each(deptMap, function (deptName, info) {
        const allPaid = info.paid === info.count;
        const nonePaid = info.paid === 0;
        const statusLabel = allPaid ? 'paid' : nonePaid ? 'pending' : 'partial';

        const statusBadge = allPaid
            ? `<span style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:12px;font-weight:600;background:#28a745;color:#fff;">Paid</span>`
            : nonePaid
                ? `<span style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:12px;font-weight:600;background:#fd7e14;color:#fff;">Pending</span>`
                : `<span style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:12px;font-weight:600;background:#1565C0;color:#fff;">Partial</span>`;

        const dot = `<span style="width:9px;height:9px;border-radius:50%;background:${dotColors[colorIdx % dotColors.length]};display:inline-block;margin-right:8px;vertical-align:middle;"></span>`;

        const periodText = (info.periodStart && info.periodEnd)
            ? `${formatPeriodShort(info.periodStart)} – ${formatDateLong(info.periodEnd)}`
            : 'N/A';

        const actionBtn = allPaid
            ? `<button class="btn btn-secondary btn-sm" disabled>
                   <i class="fas fa-check me-1"></i>Paid
               </button>`
            : `<button class="btn btn-success btn-sm" onclick="payDepartment('${deptName.replace(/'/g, "\\'")}')">
                   <i class="fas fa-money-bill-wave me-1"></i>Pay now
               </button>`;

        $tbody.append(`
            <tr data-dept="${deptName.toLowerCase()}" data-status="${statusLabel}">
                <td>${dot}${deptName}</td>
                <td>${info.count}</td>
                <td>$${info.total.toFixed(2)}</td>
                <td><small class="text-muted">${periodText}</small></td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td>
            </tr>`);

        colorIdx++;
    });

    const deptNames = Object.keys(deptMap);
    const paidDepts = deptNames.filter(d => deptMap[d].paid === deptMap[d].count).length;
    $('#deptActiveCount').text(`${deptNames.length} active`);
    $('#deptPaidLabel').text(`${paidDepts} of ${deptNames.length} paid`);
}

// ── Department Pay Now ──────────────────────────────────────────
function payDepartment(deptName) {
    const today = new Date().toISOString().split("T")[0];

    const pendingEmployees = allPayrollData.filter(emp => {
        const dept = get(emp, 'departmentName') || 'N/A';
        const status = (get(emp, 'status') || get(emp, 'payrollStatus') || 'Pending').toLowerCase();
        // "Paid Early" is a special case — already paid ahead of schedule,
        // so it must be excluded from bulk department pay same as "Paid" is.
        return dept === deptName && status !== 'paid' && status !== 'paid early';
    });

    Swal.fire({
        title: `Pay ${deptName}?`,
        text: `This will mark ${pendingEmployees.length} employee(s) in ${deptName} as Paid for the current cycle.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, pay now',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#28a745'
    }).then(result => {
        if (!result.isConfirmed) return;

        const requests = pendingEmployees.map(emp => {
            const model = {
                TransactionId: parseInt(get(emp, "transactionId")) || 0,
                EmployeeId: parseInt(get(emp, "employeeId")) || 0,
                PayrollPeriodId: 0, // manual pay — no period required
                GrossSalary: Number(get(emp, "grossSalary") ?? 0),
                TaxDeductions: Number(get(emp, "taxDeductions") ?? 0),
                NetSalary: Number(get(emp, "netSalary") ?? 0),
                Notes: (get(emp, "notes") && get(emp, "notes").trim() !== "") ? get(emp, "notes") : buildDefaultNote(emp),
                Status: "Paid",
                PayDate: today
            };

            return $.ajax({
                url: "/Payroll/UpdatePayroll",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(model)
            });
        });

        Promise.allSettled(requests)
            .then(results => {
                const failed = results.filter(r => r.status === 'rejected');
                if (failed.length === 0) {
                    Swal.fire('Success', `${deptName} payment processed for ${pendingEmployees.length} employee(s).`, 'success');
                } else {
                    const firstFail = failed[0].reason;
                    const code = firstFail?.responseJSON?.code || "ERR-000";
                    Swal.fire({
                        icon: 'warning',
                        title: 'Some payments failed',
                        html: `<p>${failed.length} of ${pendingEmployees.length} payment(s) in ${deptName} did not go through.</p><p class="text-muted small mb-0">Error code: ${code}</p>`
                    });
                }
                loadPayrollData();
            });
    });
}

// ── Department Search ─────────────────────────────────────────

let currentDeptStatusFilter = ""; // mirrors currentStatusFilter for the department select

function filterDeptTable() {
    const q = $('#deptSearchInput').val().toLowerCase().trim();
    const filterSt = currentDeptStatusFilter;

    $('#deptTableBody tr[data-dept]').each(function () {
        const dept = ($(this).data('dept') || '').toLowerCase();
        const status = ($(this).data('status') || '').toLowerCase();
        $(this).toggle((!q || dept.includes(q)) && (!filterSt || status === filterSt));
    });
}

function setDeptFilter(status) {
    currentDeptStatusFilter = (status || "").trim().toLowerCase();
    filterDeptTable();
}

// ── Pay Now Modal ─────────────────────────────────────────────

function openEditModal(transactionId, rowIndex) {
    let emp = null;

    if (transactionId && transactionId > 0) {
        emp = allPayrollData.find(x => parseInt(get(x, "transactionId")) === parseInt(transactionId));
    }
    if (!emp && rowIndex !== undefined && rowIndex >= 0 && rowIndex < allPayrollData.length) {
        emp = allPayrollData[rowIndex];
    }
    if (!emp) {
        Swal.fire("Error", "Could not find payroll record.", "error");
        return;
    }

    const resolvedTransId = parseInt(get(emp, "transactionId")) || 0;
    const currentStatus = get(emp, "status") ?? "Pending";
    const existingPayDate = get(emp, "payDate");

    // Populate fields
    $("#editTransactionId").val(resolvedTransId);
    $("#editEmployeeId").val(parseInt(get(emp, "employeeId")) || 0);
    $("#editEmployeeName").val(get(emp, "employeeName") ?? "");
    $("#editPosition").val(get(emp, "positionName") ?? "");
    $("#editGrossSalary").val(get(emp, "grossSalary") ?? 0);
    $("#editTaxDeductions").val(get(emp, "taxDeductions") ?? 0);
    $("#editNetSalary").val(Number(get(emp, "netSalary") ?? 0).toFixed(2));

    // Auto-fill the note only if there isn't already one saved (don't clobber
    // notes on an already-paid record you're reopening to review/edit).
    const existingNotes = get(emp, "notes");
    $("#editNotes").val(
        existingNotes && existingNotes.trim() !== "" ? existingNotes : buildDefaultNote(emp)
    );

    $("#editStatus").val(currentStatus);

    // Pay date visibility
    if (currentStatus === "Paid" && existingPayDate) {
        const d = new Date(existingPayDate);
        $("#editPayDate").val(!isNaN(d) ? d.toISOString().split("T")[0] : "");
        $("#editPayDateWrapper").removeClass("d-none");
    } else if (currentStatus === "Paid") {
        $("#editPayDate").val(new Date().toISOString().split("T")[0]);
        $("#editPayDateWrapper").removeClass("d-none");
    } else {
        $("#editPayDate").val("");
        $("#editPayDateWrapper").addClass("d-none");
    }

    $("#editModal").modal("show");
}

// ── Save / Pay ────────────────────────────────────────────────

function saveEditChanges() {
    const transId = parseInt($("#editTransactionId").val()) || 0;
    const employeeId = parseInt($("#editEmployeeId").val()) || 0;
    const status = $("#editStatus").val();

    if (employeeId === 0) {
        Swal.fire("Error", "Employee ID is missing.", "error");
        return;
    }

    const gross = parseFloat($("#editGrossSalary").val()) || 0;
    const tax = parseFloat($("#editTaxDeductions").val()) || 0;
    const net = parseFloat($("#editNetSalary").val()) || 0;
    const payDateVal = status === "Paid" ? ($("#editPayDate").val() || null) : null;

    const model = {
        TransactionId: transId,
        EmployeeId: employeeId,
        PayrollPeriodId: 0,          // not required for manual pay
        GrossSalary: gross,
        TaxDeductions: tax,
        NetSalary: net,
        Notes: $("#editNotes").val() || "",
        Status: status,
        PayDate: payDateVal
    };

    $.ajax({
        url: "/Payroll/UpdatePayroll",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(model),
        success: function () {
            Swal.fire({
                icon: "success",
                title: "Success",
                text: status === "Paid"
                    ? "Payment processed successfully."
                    : "Payroll record updated successfully.",
                timer: 2000,
                showConfirmButton: false
            });
            $("#editModal").modal("hide");
            loadPayrollData();
        },
        error: function (xhr) {
            showApiError(xhr, "Couldn't save this payment");
        }
    });
}

// ── View Slip Modal ───────────────────────────────────────────
// Shows the employee's FULL pay history — every period they've ever
// been paid for (Jun P1, Jun P2, Jul P1, Jul P2, ...), newest first.
// The backend (HRMS_GetPayrollSlipByEmployeeId) now returns all
// periods instead of just the current cycle, so no client-side
// filtering by date is needed here — just render what comes back.

async function openSlipModal(employeeId, employeeName, position, department) {
    document.getElementById('slipEmployeeId').value = employeeId;
    document.getElementById('slipEmployeeName').value = employeeName;
    document.getElementById('slipPosition').value = position || 'N/A';
    document.getElementById('slipDepartment').value = department || 'N/A';

    const tbody = document.getElementById('slipTableBody');
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Loading…</td></tr>`;

    new bootstrap.Modal(document.getElementById('viewSlipModal')).show();

    try {
        const res = await fetch(`/Payroll/GetSlipByEmployee?employeeId=${employeeId}`);
        const payload = await res.json();

        if (!res.ok) {
            const code = payload?.code || "ERR-000";
            const msg = payload?.message || "Failed to load records.";
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">${msg} <span class="text-muted">(${code})</span></td></tr>`;
            return;
        }

        const records = payload;
        tbody.innerHTML = '';

        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No payroll history found for this employee</td></tr>`;
            return;
        }

        records.forEach(r => {
            const statusVal = (r.status ?? r.Status ?? '').toLowerCase();
            const badge = getStatusBadge(statusVal);

            const payDateVal = r.payDate ?? r.PayDate;
            const payDate = payDateVal
                ? new Date(payDateVal).toLocaleDateString("en-US")
                : '<span class="text-muted">N/A</span>';

            const net = Number(r.netSalary ?? r.NetSalary ?? 0).toFixed(2);

            const periodLabel = r.periodLabel ?? r.PeriodLabel ?? 'N/A';
            const periodRange = r.periodDate ?? r.PeriodDate ?? 'N/A';

            tbody.innerHTML += `
                <tr>
                    <td>${r.transactionId ?? r.TransactionId ?? '-'}</td>
                    <td>
                        <div class="fw-semibold">${periodLabel}</div>
                        <div class="text-muted small">${periodRange}</div>
                    </td>
                    <td>${payDate}</td>
                    <td class="text-success fw-bold">$${net}</td>
                    <td>${badge}</td>
                    <td>${r.notes ?? r.Notes ?? '-'}</td>
                </tr>`;
        });

    } catch (err) {
        console.error("Slip load error:", err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Failed to load records</td></tr>`;
    }
}

// ── Employee Search + Status Filter ─────────────────────────────

function applyEmployeeFilters() {
    const q = $("#searchInput").val().toLowerCase().trim();
    $("#clearBtn").toggleClass("d-none", q.length === 0);

    $("#payrollTable tbody tr").each(function () {
        const id = $(this).find("td:eq(0)").text().toLowerCase();
        const name = $(this).find("td:eq(1)").text().toLowerCase();
        const badgeText = $(this).find("td:eq(6) span").text().trim().toLowerCase();

        const matchesSearch = !q || id.includes(q) || name.includes(q);

        // The "Unpaid" filter value sends 'unpaid', but the actual badge
        // text for that state can be "Not Paid" — handle both so they
        // always match regardless of which label the backend used.
        const matchesStatus = !currentStatusFilter
            || badgeText === currentStatusFilter
            || (currentStatusFilter === "unpaid" && badgeText === "not paid");

        $(this).toggle(matchesSearch && matchesStatus);
    });
}

function filterTable() {
    applyEmployeeFilters();
}

function clearSearch() {
    $("#searchInput").val("");
    $("#statusSelect").val("");
    filterByStatus("");
}

// Driven by a native <select id="statusSelect"> instead of a Bootstrap
// dropdown. The select's onchange handler calls this directly with its
// value, so there's no <a> element or .active class to manage.
function setFilter(status) {
    filterByStatus(status);
}

function filterByStatus(status) {
    currentStatusFilter = (status || "").trim().toLowerCase();
    applyEmployeeFilters();
}

// ── Payroll Periods ───────────────────────────────────────────

function savePeriod() {
    const start = $("#periodStart").val();
    const end = $("#periodEnd").val();

    if (!start || !end) {
        Swal.fire("Warning", "Please select both start and end dates.", "warning");
        return;
    }

    $.ajax({
        url: "/Payroll/SavePayrollPeriod",
        type: "POST",
        data: { periodStart: start, periodEnd: end },
        success: function () {
            Swal.fire("Success", "New payroll period added.", "success");
            $("#periodStart, #periodEnd").val("");
            refreshPeriodTable();
        },
        error: function (xhr) {
            showApiError(xhr, "Couldn't save period");
        }
    });
}

function refreshPeriodTable() {
    $.ajax({
        url: "/Payroll/GetPayrollPeriods",
        type: "GET",
        dataType: "json",
        success: function (data) {
            const $tbody = $("#periodTable");
            $tbody.empty();

            if (!data || data.length === 0) {
                $tbody.append(`<tr><td colspan="3" class="text-center text-muted">No periods found.</td></tr>`);
                return;
            }

            $.each(data, function (_, item) {
                const id = item.periodId ?? item.PeriodId ?? "";
                const start = item.start ?? item.Start ?? "";
                const end = item.end ?? item.End ?? "";
                $tbody.append(`<tr><td>${id}</td><td>${start}</td><td>${end}</td></tr>`);
            });
        },
        error: function (xhr) {
            console.error("Failed to load period table:", xhr);
        }
    });
}

function updateSummaryCards(data) {
    let totalNet = 0, totalGross = 0, pendingTotal = 0;

    $.each(data, function (_, emp) {
        const net = Number(get(emp, "netSalary") ?? 0);
        const gross = Number(get(emp, "grossSalary") ?? 0);
        const status = (get(emp, "payrollStatus") || get(emp, "status") || "Pending").toLowerCase();

        totalNet += net;
        totalGross += gross;

        // Only count toward "pending" if not yet paid (Paid / Paid Early are settled)
        if (status !== "paid" && status !== "paid early") {
            pendingTotal += net;
        }
    });

    const pct = totalGross === 0 ? 0 : (pendingTotal / totalGross) * 100;

    $("#monthlyPayroll").text(`$${pendingTotal.toFixed(2)}`);
    $("#payrollPercent").text(`${pct.toFixed(2)}% of total`);
}