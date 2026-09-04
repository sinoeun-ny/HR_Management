
; (function ($) {
    'use strict';

    //state global 
    let _suppressReset = false;
    let _pendingRestoreId = null;
    let isViewMode = false;

    // CHARTS pull from DB
 
        $.get('/Employee/GetEmployeeStats', function (stats) {
            document.getElementById('cardActive').textContent = stats.active;
        document.getElementById('cardInactive').textContent = stats.inactive;
        document.getElementById('cardTotal').textContent    = stats.total;
        new Chart(document.getElementById('chartTotalEmployees'), {
            type: 'doughnut',
        data: {labels: ['Active','Inactive'], datasets: [{data: [stats.active, stats.inactive], backgroundColor: ['#0d6efd','#dc3545'], borderWidth: 2 }] },
        options: {responsive: true, maintainAspectRatio: false, plugins: {legend: {position: 'bottom' }, tooltip: {callbacks: {label: function(ctx) { return ctx.label+': '+ctx.raw+' ('+Math.round(ctx.raw/stats.total*100)+'%)'; }}}}}
        });
    });

    $.get('/Employee/GetNewHiresByDept', function (result) {
            document.getElementById('cardNewHires').textContent = result.data.reduce(function (a, b) { return a + b; }, 0);
        new Chart(document.getElementById('chartNewHires'), {
            type: 'bar',
        data: {labels: result.labels, datasets: [{label: 'New Hires', data: result.data, backgroundColor: '#0d6efd', borderRadius: 4 }] },
        options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: {legend: {display: false } }, scales: {x: {beginAtZero: true, ticks: {stepSize: 1 } } } }
        });
    });


    // SECTION 3 — ALL EMPLOYEE TABLE
    $('#tblAllEmployeeInfo').bootstrapTable({
        url: '/Employee/GetAllEmployees',
        uniqueId: 'employeeId',
        pagination: true,
        sidePagination: 'client',
        pageSize: 10,
        search: false,
        columns: [
            { field: 'employeeId', title: 'Employee ID', sortable: true },
            { field: 'firstName', title: 'First Name' },
            { field: 'lastName', title: 'Last Name' },
            { field: 'departmentName', title: 'Department' },
            { field: 'positionName', title: 'Position' },
            {
                field: 'hireDate', title: 'Hire Date', sortable: true, sortable: true ,
                formatter: function (v) { return v ? v.split('T')[0] : ''; }
            },
            {
                field: 'status', title: 'Status', sortable: true, align: 'center',
                formatter: function (value, row) {
                    return row.status === 'Active'
                        ? '<span class="badge bg-success">Active</span>'
                        : '<span class="badge bg-danger">Inactive</span>';
                }
            },
            {
                field: 'actions', title: 'Actions', align: 'center',
                formatter: function (value, row) {
                    // View button and restorre for inactive emp
                    return '<button class="btn btn-sm btn-primary" onclick="handleView(' +
                        row.employeeId + ',\'' + row.status + '\')">View</button>';
                }
            }
        ]
    });

  // Search & Sort
    $('.search-btn-all').on('click', function () { doSearchAll(); });
    $('#btnSearchAll').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            doSearchAll();
        }
    });
    $('#btnSearchAll').on('input', function () {
        $('#searchClearBtnAll').toggle($(this).val().length > 0);
    });
    $('#searchClearBtnAll').on('click', function () {
        $('#btnSearchAll').val(''); $(this).hide();
        reloadAllTable('/Employee/GetAllEmployees');
    });
    $('#txtSortByAll, #txtSortByStatus').on('change', function () { doSearchAll(); });

    function doSearchAll() {
        let url = buildAllUrl();
        console.log(url);
        reloadAllTable(url);
    }
    function buildAllUrl() {
        let p = [];
        let search = $('#btnSearchAll').val().trim();
        let sortBy = $('#txtSortByAll').val();
        let status = $('#txtSortByStatus').val();

        if (search) p.push('searchAll=' + encodeURIComponent(search));
        if (sortBy) p.push('sortByAll=' + encodeURIComponent(sortBy));
        if (status) p.push('Status=' + encodeURIComponent(status)); // must match controller param name
        return '/Employee/GetAllEmployees' + (p.length ? '?' + p.join('&') : '');
    }

    function reloadAllTable(url) {
        $.ajax({
            url: url,
            type: 'GET',
            success: function (data) { $('#tblAllEmployeeInfo').bootstrapTable('load', data); },
            error: function (xhr) { Swal.fire('Error!', 'Could not load. Status: ' + xhr.status, 'error'); }
        });
    }

    // view emp read only
    window.handleView = function (id, status) {
        _suppressReset = true;
        isViewMode = true;

        $.get('/Employee/GetEmployeeById?id=' + id, function (res) {
            if (!res.success) { _suppressReset = false; isViewMode = false; return; }

            const emp = res.employee;

            // Populate fields
            $('#EmployeeId').val(emp.employeeId);
            $('#txtFirstName').val(emp.firstName);
            $('#txtLastName').val(emp.lastName);
            $('#Gender').val(emp.gender);
            $('#dateOfBirth').val(emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '');
            $('#txtEmail').val(emp.email);
            $('#PhoneNumber').val(emp.phoneNumber);
            $('#txtAddress').val(emp.address);
            $('#HireDate').val(emp.hireDate ? emp.hireDate.split('T')[0] : '');
            $('#Status').val(emp.status);

            if (emp.profilePhoto) {
                $('#imagePreview')
                    .css({
                        'background-image': 'url(' + emp.profilePhoto + ')',
                        'background-size': 'cover', 'background-position': 'center'
                    })
                    .find('span').hide();
            }

            // Disable ALL inputs and selects — this is view only
            $('#employeeModal input, #employeeModal select').prop('disabled', true);

            // Remove any leftover restore button
            $('#btnRestoreFromView').remove();

            // Inactive — show Restore button
            if (status === 'Inactive') {
                $('#EmployeeInfo').append(
                    '<div id="btnRestoreFromView" class="text-center mt-3">' +
                    '<button class="btn btn-success px-4" onclick="handleRestore(' + id + ')">' +
                    '<i class="fas fa-undo me-1"></i> Restore Employee</button>' +
                    '</div>'
                );
                $('#exampleModalLabel').text('View Employee (Inactive)');
            } else {
                // Active — view only, no restore
                $('#exampleModalLabel').text('View Employee');
            }

            // Load position tab data (read-only)
            loadPositionReadOnly(emp.employeeId);

            // Load documents (read-only)
            loadDocumentsReadOnly(emp.employeeId);

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById('employeeModal')
            ).show();

        }).fail(function () {
            _suppressReset = false;
            isViewMode = false;
            Swal.fire('Error!', 'Could not load employee.', 'error');
        });
    };

    
    const deptData = {
        1: { positions: [{ id: 1, name: 'Software Developer' }, { id: 2, name: 'System Administrator' }, { id: 3, name: 'Network Engineer' }, { id: 4, name: 'IT Support Specialist' }] },
        2: { positions: [{ id: 5, name: 'Accountant' }, { id: 6, name: 'Financial Analyst' }, { id: 7, name: 'Credit Officer' }, { id: 8, name: 'Banking Operations Officer' }] },
        3: { positions: [{ id: 9, name: 'HR Officer' }, { id: 10, name: 'Recruitment Specialist' }, { id: 11, name: 'Payroll Officer' }, { id: 12, name: 'Training Coordinator' }] },
        4: { positions: [{ id: 13, name: 'Marketing Executive' }, { id: 14, name: 'Sales Representative' }, { id: 15, name: 'Digital Marketing Specialist' }, { id: 16, name: 'Business Development Officer' }] },
        5: { positions: [{ id: 17, name: 'Operations Officer' }, { id: 18, name: 'Supply Chain Coordinator' }, { id: 19, name: 'Logistics Officer' }, { id: 20, name: 'Project Coordinator' }] },
        6: { positions: [{ id: 21, name: 'Customer Service Representative' }, { id: 22, name: 'Call Center Agent' }, { id: 23, name: 'Client Support Officer' }, { id: 24, name: 'Customer Success Specialist' }] },
        7: { positions: [{ id: 25, name: 'Research Analyst' }, { id: 26, name: 'Product Development Officer' }, { id: 27, name: 'Innovation Specialist' }, { id: 28, name: 'Quality Assurance Analyst' }] }
    };

    function loadPositionReadOnly(employeeId) {
        $.get('/Employee/GetPosition?employeeId=' + employeeId, function (res) {
            if (!res.success || !res.employeePosition) return;
            const pos = res.employeePosition;
            const dept = deptData[pos.departmentId];

            $('#DepartmentId').val(pos.departmentId);
            $('#txtPositionName').html('<option value="" selected disabled>Select Position</option>');
            if (dept) {
                dept.positions.forEach(function (p) {
                    $('#txtPositionName').append('<option value="' + p.id + '">' + p.name + '</option>');
                });
            }
            $('#txtPositionName').val(pos.positionId);
            $('#StartDate').val(pos.startDate ? pos.startDate.split('T')[0] : '');
            $('#txtSalary').val(pos.salary);
            $('#EndDate').val(pos.endDate ? pos.endDate.split('T')[0] : '');
            $('#txtUpdatePromote').hide(); // never show promote in view mode
        });
    }

    // Document TAB (read-only load)
    function loadDocumentsReadOnly(employeeId) {
        $.get('/Employee/GetDocument?employeeId=' + employeeId, function (res) {
            if (res.success && res.documents && res.documents.length > 0) {
               
                displayDocumentsReadOnly(res.documents);
            } else {
                $('#documentPreviewArea').html('<p class="text-muted small">No documents uploaded yet.</p>');
            }
        });
    }

    function displayDocumentsReadOnly(documents) {
        let doc = documents[0];
        $('#txtDocumentName').val(doc.documentName || '');
        $('#txtExpiryDate').val(doc.expiryDate ? doc.expiryDate.split('T')[0] : '');
        $('#txtNotes').val(doc.notes || '');
        $('#txtDocumentType').val('');
            
        let html = '<div class="border rounded p-3 bg-light"><h6 class="mb-3"><strong>Uploaded Documents</strong></h6>';

        documents.forEach(function (doc) {
            let filePath = doc.documentType || '';
            let actualFile = filePath.split('/').pop();
            let fileExt = actualFile.split('.').pop().toLowerCase();
            let labelName = (doc.documentName && doc.documentName.trim()) ? doc.documentName : actualFile;
            let docId = doc.documentStorageId || doc.documentId;
            let expiryVal = doc.expiryDate ? doc.expiryDate.split('T')[0] : 'N/A';
            let notesVal = doc.notes || 'N/A';
            let safeLabel = labelName.replace(/'/g, "\\'");
            let badgeColor = fileExt === 'pdf' ? '#dc3545' : ['jpg', 'jpeg', 'png'].includes(fileExt) ? '#0d6efd' : '#6c757d';

            html += '<div class="d-flex align-items-center gap-3 border rounded p-2 mb-2 bg-white shadow-sm">';

            // Thumbnail
            html += '<div style="width:64px;height:64px;flex-shrink:0;border-radius:8px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">';
            if (['jpg', 'jpeg', 'png'].includes(fileExt))
                html += '<img src="' + filePath + '" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="openImagePreview(\'' + filePath + '\',\'' + safeLabel + '\')">';
            else if (fileExt === 'pdf')
                html += '<a href="' + filePath + '" target="_blank"><i class="fas fa-file-pdf fa-2x text-danger"></i></a>';
            else
                html += '<i class="fas fa-file fa-2x text-secondary"></i>';
            html += '</div>';

            // Info
            html += '<div class="flex-grow-1" style="min-width:0;">';
            html += '<div class="fw-semibold text-truncate">' + labelName + '</div>';
            html += '<div><span class="badge rounded-pill text-white me-1" style="background:' + badgeColor + ';font-size:10px;">' + fileExt.toUpperCase() + '</span><small class="text-muted">' + actualFile + '</small></div>';
            html += '<div class="mt-1"><small class="text-muted me-2"><i class="fas fa-calendar-alt me-1"></i>' + expiryVal + '</small><small class="text-muted"><i class="fas fa-sticky-note me-1"></i>' + notesVal + '</small></div>';
            html += '</div>';

            // Download only — no delete in view mode
            html += '<div style="flex-shrink:0;">';
            html += '<button class="btn btn-sm btn-primary" onclick="downloadDoc(' + docId + ')" title="Download"><i class="fas fa-download"></i></button>';
            html += '</div>';

            html += '</div>';
        });

        html += '</div>';
        $('#documentPreviewArea').html(html);
    }

    window.downloadDoc = function (docId) {
        window.location.href = '/Employee/DownloadDocument?documentId=' + docId;
    };

    window.openImagePreview = function (imagePath, documentName) {
        Swal.fire({
            title: documentName, imageUrl: imagePath, imageAlt: documentName,
            width: '80%', showCloseButton: true,
            showConfirmButton: true, confirmButtonText: '<i class="fas fa-download"></i> Download',
            confirmButtonColor: '#3085d6'
        }).then(function (result) {
            if (result.isConfirmed) {
                let l = document.createElement('a'); l.href = imagePath; l.download = documentName; l.click();
            }
        });
    };

    
    // modal close cleanup restore flow
    document.getElementById('employeeModal').addEventListener('hidden.bs.modal', function () {

        // Always re-enable inputs and clean up
        $('#employeeModal input, #employeeModal select').prop('disabled', false);
        $('#btnRestoreFromView').remove();
        $('#documentPreviewArea').html('');
        isViewMode = false;

        // Restore pending — show SweetAlert now that modal is fully gone
        if (_pendingRestoreId !== null) {
            var restoreId = _pendingRestoreId;
            _pendingRestoreId = null;
            _suppressReset = false;

            Swal.fire({
                title: 'Restore Employee?',
                text: 'This will set the employee back to Active.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#198754',
                confirmButtonText: 'Yes, Restore!',
                cancelButtonText: 'Cancel'
            }).then(function (result) {
                if (!result.isConfirmed) return;
                $.post('/Employee/RestoreEmployee', { id: restoreId }, function (res) {
                    if (res.success) {
                        Swal.fire('Restored!', res.message || 'Employee is now Active.', 'success');
                        reloadAllTable('/Employee/GetAllEmployees');
                    } else {
                        Swal.fire('Failed!', res.message, 'error');
                    }
                }).fail(function () { Swal.fire('Error!', 'Something went wrong.', 'error'); });
            });
            return;
        }

        if (_suppressReset) { _suppressReset = false; return; }
    });

    
    // RESTORE (sets pending, hides modal cleanly)
    window.handleRestore = function (id) {
        _pendingRestoreId = id;
        _suppressReset = true;
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById('employeeModal')
        ).hide();
    };

    // Expose helpers to global scope (used by inline onclick handlers)
    window.displayExistingDocuments = displayExistingDocuments;
    window.refreshDocumentList = refreshDocumentList;
    window.downloadDocument = downloadDocument;
    window.deleteDocument = deleteDocument;
    window.openImageModal = openImageModal;
    
} (jQuery));