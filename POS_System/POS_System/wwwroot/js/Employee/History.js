; (function ($) {
    'use strict';



    $('#DepartmentId').on('change', function () {
        var deptId = $(this).val();
        $('#txtPositionName').html('<option value="" selected disabled>Loading...</option>');
        ;
        $.get('/Employee/GetPositionsByDept?departmentId=' + deptId, function (data) {
            $('#txtPositionName').html('<option value="" selected disabled>Select Position</option>');
            data.forEach(function (p) {
                $('#txtPositionName').append('<option value="' + p.positionId + '"> ' + p.positionName + '</option>');
            });
        });
    });
    function actionBadge(type) {
        var map = {
            'Active': '<span class="badge bg-success">Active</span>',
            'Inactive': '<span class="badge bg-danger">Inactive</span>',
            'Promoted': '<span class="badge bg-primary">Promoted</span>',
            'Expired': '<span class="badge bg-danger">Expired</span>',
            'Restored': '<span class="badge bg-success">Restored</span>',
            'Insert': '<span class="badge bg-success">Create</span>',
            'Inserted': '<span class="badge bg-success">Create</span>',
            'Updated': '<span class="badge bg-warning text-dark">Update</span>',
            'Update': '<span class="badge bg-warning text-dark">Update</span>',
            '': '<span class="badge bg-danger text-dark">Null</span>',
            'Null': '<span class="badge bg-danger text-dark">Null</span>',
            'null': '<span class="badge bg-danger text-dark">Null</span>',
            "": '<span class="badge bg-danger text-dark">Null</span>',
            'Delete' : '<span class="badge bg-danger text-White">Delete</span>'



        };
        return map[type] || '<span class="badge bg-secondary">' + (type || '—') + '</span>';
    }



    function viewBtn(historyId, type) {
        return '<button class="btn btn-sm btn-primary" onclick="viewSnapshot(' + historyId + ',\'' + type + '\')">' +
            '<i class="fas fa-eye me-1"></i>View</button>';
    }

    //   SNAPSHOT MODAL  
    function snapRow(label, value) {
        return `<div class="col-md-6 mb-3">
            <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">${label}</div>
            <div style="padding:8px 12px; background:#f8f9fa; border-radius:6px;">${value || '—'}</div>
        </div>`;
    }

    function snapRowFull(label, value) {
        return `<div class="col-12 mb-3">
            <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">${label}</div>
            <div style="padding:8px 12px; background:#f8f9fa; border-radius:6px;">${value || '—'}</div>
        </div>`;
    }

    window.viewSnapshot = function (historyId, type) {
        var urlMap = {
            profile: '/Employee/GetEmpHisAll?id=',
            position: '/Employee/GetPositionHisAll?id=',
            document: '/Employee/GetDocHisAll?id='
        };

        $('#snapshotBody').html('<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i></div>');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('snapshotModal')).show();

        $.get(urlMap[type] + historyId, function (res) {
            if (!res.success) {
                $('#snapshotBody').html('<p class="text-danger">Could not load snapshot.</p>');
                return;
            }

            var html = '';

            if (type === 'profile') {
                var d = res.snapshot;
                $('#snapshotTitle').text('Employee Profile History — ' + d.fullName);

                var photoHtml = d.profilePhoto
                    ? `<img src="${d.profilePhoto}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid #0d6efd;" onerror="this.style.display='none'">`
                    : `<div style="width:80px;height:80px;border-radius:50%;background:#e9ecef;display:flex;align-items:center;justify-content:center;"><i class="fas fa-user fa-2x text-muted"></i></div>`;

                html = `
                    <div class="text-center mb-4">${photoHtml}</div>
                    <div class="row">
                        ${snapRow('Employee ID', d.employeeId)}
                        ${snapRow('Full Name', d.fullName)}
                        ${snapRow('Status', actionBadge(d.status))}
                        ${snapRow('Gender', d.gender)}
                        ${snapRow('Date of Birth', d.dateOfBirth)}
                        ${snapRow('Hire Date', d.hireDate)}
                        ${snapRow('Email', d.email)}
                        ${snapRow('Phone', d.phoneNumber)}
                        ${snapRowFull('Address', d.address)}
                    </div>
                    <br><hr><br>
                    <div class="row">
                        ${snapRow('Changed By', actionBadge(d.changedBy))}
                        ${snapRow('Changed Date', d.changedDate)}
                        ${snapRowFull('Update By', d.updateUID)}
                    </div>`;

            } else if (type === 'position') {
                var d = res.snapshot;
                $('#snapshotTitle').text('Position History - ' + d.fullName);
                html = `
                    <div class="row">
                        ${snapRow('Employee ID', d.employeeId)}
                        ${snapRow('Full Name', d.fullName)}
                        ${snapRow('Department', d.departmentName)}
                        ${snapRow('Position', d.positionName)}
                        ${snapRow('Salary', '$' + Number(d.salary || 0).toLocaleString())}
                        ${snapRow('Start Date', d.startDate)}
                        ${snapRow('End Date', d.endDate)}
                        ${snapRow('Is Promoted', d.isPromoted ? '<span class="badge bg-primary">Yes</span>' : '<span class="badge bg-secondary">No</span>')}
                    </div>
                    <br><hr><br>
                    <div class="row">
                        ${snapRow('Changed By',actionBadge( d.changedBy))}
                        ${snapRow('Changed Date', d.changedDate)}
                        ${snapRowFull('Update By', d.updateUID)}
                    </div>`;

            } else if (type === 'document') {
                var d = res.snapshot;
                var docs = res.allDocuments || [];
                $('#snapshotTitle').text('Documents History - ' + d.fullName);

                var docCardsHtml = '';

                if (docs.length > 0) {
                    docs.forEach(function (doc) {
                        docCardsHtml += buildDocCard(doc);
                    });
                } else {
                    docCardsHtml = buildDocCard(d);
                }

                html = `
                    <div class="row">
                        ${snapRow('Employee ID', d.employeeId)}
                        ${snapRow('Full Name', d.fullName)}
                        ${snapRow('Document Name', d.documentName)}
                        ${snapRow('Document Locate', d.documentType)}
                        ${snapRow('Expiry Date', d.expiryDate)}
                        ${snapRow('Upload Date', d.uploadDate)}
                        ${snapRowFull('Note', d.notes)}
                    </div>
                    <br><hr><br>
                    <div class="fw-bold mb-2" style="font-size:13px;">
                        <i class="fas fa-folder-open me-2 text-primary"></i>
                        All Documents (${docs.length || 1})
                    </div>
                    <div class="border rounded p-3 bg-light">
                        ${docCardsHtml}
                    </div>
                    <br><hr><br>
                    <div class="row">
                        ${snapRow('Changed By', actionBadge(d.changedBy))}
                        ${snapRow('Changed Date', d.changedDate)}
                        ${snapRowFull('Update By', d.updateUID)}
                    </div>`;
            }

            $('#snapshotBody').html(html);
        }).fail(function () {
            $('#snapshotBody').html('<p class="text-danger">Failed to load snapshot.</p>');
        });
    };

    //   DOCUMENT HELPERS                      
    function openImageModal(imagePath, documentName) {
        Swal.fire({
            title: documentName,
            imageUrl: imagePath,
            imageAlt: documentName,
            width: '80%',
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: '<i class="fas fa-download"></i> Download',
            confirmButtonColor: '#3085d6'
        }).then(function (result) {
            if (result.isConfirmed) {
                let link = document.createElement('a');
                link.href = imagePath;
                link.download = documentName;
                link.click();
            }
        });
    }

    function buildDocCard(d) {
        var filePath = d.documentType || '';
        var actualFile = filePath.split('/').pop();
        var fileExt = actualFile.split('.').pop().toLowerCase();
        var labelName = (d.documentName && d.documentName.trim()) ? d.documentName : actualFile;
        var safeLabel = labelName.replace(/'/g, "\\'");
        var expiryVal = d.expiryDate || 'No Expiry';
        var notesVal = d.notes || 'N/A';
        var uploadVal = d.uploadDate || '—';
        var badgeColor = fileExt === 'pdf' ? '#dc3545' : ['jpg', 'jpeg', 'png'].includes(fileExt) ? '#0d6efd' : '#6c757d';

        var thumb = '';
        if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
            thumb = '<img src="' + filePath + '" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="openImageModal(\'' + filePath + '\',\'' + safeLabel + '\')">';
        } else if (fileExt === 'pdf') {
            thumb = '<a href="' + filePath + '" target="_blank"><i class="fas fa-file-pdf fa-2x text-danger"></i></a>';
        } else {
            thumb = '<i class="fas fa-file fa-2x text-secondary"></i>';
        }

        return `
            <div class="d-flex align-items-center gap-3 border rounded p-2 mb-2 bg-white shadow-sm">
                <div style="width:64px;height:64px;flex-shrink:0;border-radius:8px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">
                    ${thumb}
                </div>
                <div class="flex-grow-1" style="min-width:0;">
                    <div class="fw-semibold text-truncate">${labelName}</div>
                    <div>
                        <span class="badge rounded-pill text-white me-1" style="background:${badgeColor};font-size:10px;">${fileExt.toUpperCase()}</span>
                        <small class="text-muted">${actualFile}</small>
                    </div>
                    <div class="mt-1">
                        <small class="text-muted me-3"><i class="fas fa-upload me-1"></i>Uploaded: ${uploadVal}</small>
                        <small class="text-muted me-3"><i class="fas fa-calendar-alt me-1"></i>Expiry: ${expiryVal}</small>
                        <small class="text-muted"><i class="fas fa-sticky-note me-1"></i>${notesVal}</small>
                    </div>
                </div>
                <div style="flex-shrink:0;">
                    <a href="${filePath}" download="${labelName}" class="btn btn-sm btn-primary" title="Download">
                        <i class="fas fa-download"></i>
                    </a>
                </div>
            </div>`;
    }

    //   EMPLOYEE PROFILE HISTORY TABLE              
    function loadEmpHistory(search, sort) {
        var p = [];
        if (search) p.push('searchEmp=' + encodeURIComponent(search));
        if (sort) p.push('sortByEmp=' + encodeURIComponent(sort));
        var url = '/Employee/GetEmpHis' + (p.length ? '?' + p.join('&') : '');
        $.get(url, function (data) {
            $('#tblEmployeeHistory').bootstrapTable('load', data);
            var badge = document.getElementById('badgeProfile');
            if (badge) badge.textContent = data ? data.length : 0;
        });
    }

    $('#tblEmployeeHistory').bootstrapTable({
        data: [],
        uniqueId: 'historyId',
        pagination: true,
        sidePagination: 'client',
        pageSize: 10,
        columns: [
            { field: 'historyId', title: 'His ID', width: 60, sortable: true },
            { field: 'employeeId', title: 'Emp ID', width: 70 },
            { field: 'fullName', title: 'Full Name' },
            { field: 'status', title: 'Status', align: 'center', formatter: function (v) { return actionBadge(v); } },
            { field: 'changedBy', title: 'Changed By' , align : 'center' , formatter: function (v) { return actionBadge(v); } },
            { field: 'changedDate', title: 'Changed Date' },
            { field: 'updateUID', title: 'Update By' }, 
            { field: 'actions', title: 'Action', align: 'center', formatter: function (v, row) { return viewBtn(row.historyId, 'profile'); } }
        ]
    });

    loadEmpHistory();

    $('#btnDoSearchEmp').on('click', function () {
        loadEmpHistory($('#btnSearchEmp').val().trim(), $('#txtSortByEmp').val());
    });
    $('#btnSearchEmp').on('keydown', function (e) {
        if (e.key === 'Enter') loadEmpHistory($(this).val().trim(), $('#txtSortByEmp').val());
    });
    $('#btnSearchEmp').on('input', function () {
        $('#searchClearBtnEmp').toggle($(this).val().length > 0);
    });
    $('#searchClearBtnEmp').on('click', function () {
        $('#btnSearchEmp').val('');
        $(this).hide();
        loadEmpHistory();
    });
    $('#txtSortByEmp').on('change', function () {
        loadEmpHistory($('#btnSearchEmp').val().trim(), $(this).val());
    });

    //   POSITION HISTORY TABLE                  
    function loadPosHistory(search, sort) {
        var p = [];
        if (search) p.push('searchPos=' + encodeURIComponent(search));
        if (sort) p.push('sortByPos=' + encodeURIComponent(sort));
        var url = '/Employee/GetPosHis' + (p.length ? '?' + p.join('&') : '');
        $.get(url, function (data) {
            $('#tblPositionHistory').bootstrapTable('load', data);
        });
    }

    $('#tblPositionHistory').bootstrapTable({
        data: [],
        uniqueId: 'historyId',
        pagination: true,
        sidePagination: 'client',
        pageSize: 10,
        columns: [
            { field: 'historyId', title: 'His ID', width: 60, sortable: true },
            { field: 'employeeId', title: 'Emp ID', width: 70, sortable: true },
            { field: 'fullName', title: 'Full Name' },
            { field: 'departmentName', title: 'Department Name' },
            { field: 'positionName', title: 'Position' },
            { field: 'changedBy', title: 'Changed By', sortable: true ,  align : 'center ' , formatter: function (v) { return actionBadge(v); } },
            { field: 'changedDate', title: 'Changed Date', sortable: true },
            { field: 'updateUID', title: 'Update By' }, 
            { field: 'actions', title: 'Action',  align: 'center', formatter: function (v, row) { return viewBtn(row.historyId, 'position'); } }
        ]
    });

    loadPosHistory();

    $('#btnDoSearchPos').on('click', function () {
        loadPosHistory($('#btnSearchPos').val().trim(), $('#txtSortByPos').val());
    });
    $('#btnSearchPos').on('keydown', function (e) {
        if (e.key === 'Enter') loadPosHistory($(this).val().trim(), $('#txtSortByPos').val());
    });
    $('#btnSearchPos').on('input', function () {
        $('#searchClearBtnPos').toggle($(this).val().length > 0);
    });
    $('#searchClearBtnPos').on('click', function () {
        $('#btnSearchPos').val('');
        $(this).hide();
        loadPosHistory();
    });
    $('#txtSortByPos').on('change', function () {
        loadPosHistory($('#btnSearchPos').val().trim(), $(this).val());
    });

    //   DOCUMENT HISTORY TABLE                  
    function loadDocHistory(search, sort) {
        var p = [];
        if (search) p.push('searchDoc=' + encodeURIComponent(search));
        if (sort) p.push('sortByDoc=' + encodeURIComponent(sort));
        var url = '/Employee/GetDocHis' + (p.length ? '?' + p.join('&') : '');
        $.get(url, function (data) {
            $('#tblDocumentHistory').bootstrapTable('load', data);
            var badge = document.getElementById('badgeDocument');
            if (badge) badge.textContent = data ? data.length : 0;
        });
    }

    $('#tblDocumentHistory').bootstrapTable({
        data: [],
        uniqueId: 'historyId',
        pagination: true,
        sidePagination: 'client',
        pageSize: 10,
        columns: [
            { field: 'historyId', title: 'His ID', width: 60, sortable: true },
            { field: 'employeeId', title: 'Emp ID', width: 70, sortable: true },
            { field: 'fullName', title: 'Full Name' },
            { field: 'documentName', title: 'Document' },
            { field: 'expiryDate', title: 'Expiry', sortable: true },
            { field: 'changedBy', align: 'center', title: 'Changed By', formatter: function (v) { return actionBadge(v); } },
            { field: 'changedDate', title: 'Changed Date' },
            { field: 'updateUID', title: 'Update By' }, 
            { field: 'historyId', title: 'Action', align: 'center',sortable: true ,  formatter: function (v, row) { return viewBtn(row.historyId, 'document'); } }
        ]
    });

    loadDocHistory();

    $('#btnDoSearchDoc').on('click', function () {
        loadDocHistory($('#btnSearchDoc').val().trim(), $('#txtSortByDoc').val());
    });
    $('#btnSearchDoc').on('keydown', function (e) {
        if (e.key === 'Enter') loadDocHistory($(this).val().trim(), $('#txtSortByDoc').val());
    });
    $('#btnSearchDoc').on('input', function () {
        $('#searchClearBtnDoc').toggle($(this).val().length > 0);
    });
    $('#searchClearBtnDoc').on('click', function () {
        $('#btnSearchDoc').val('');
        $(this).hide();
        loadDocHistory();
    });
    $('#txtSortByDoc').on('change', function () {
        loadDocHistory($('#btnSearchDoc').val().trim(), $(this).val());
    });

    //   TAB SWITCHING  ─
    var activeSection = 'profile';
    var tabColors = {
        profile: '#0d6efd',
        position: '#0d6efd',
        document: '#0d6efd'
    };

    window.showHistory = function (type) {
        var sections = { profile: 'sectionProfile', position: 'sectionPosition', document: 'sectionDocument' };
        var cards = { profile: 'cardProfile', position: 'cardPosition', document: 'cardDocument' };

        if (activeSection === type) {
            $('#' + sections[type]).slideUp(200);
            $('#' + cards[type]).removeClass('active-tab').css('background', 'rgb(108 117 125)');
            activeSection = null;
            return;
        }

        Object.keys(sections).forEach(function (k) {
            $('#' + sections[k]).slideUp(200);
            $('#' + cards[k]).removeClass('active-tab').css('background', 'rgb(108 117 125)');
        });

        activeSection = type;
        $('#' + cards[type]).addClass('active-tab').css('background', tabColors[type]);
        $('#' + sections[type]).slideDown(300);

        setTimeout(function () {
            document.getElementById(sections[type]).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    };

    window.openImageModal = openImageModal;
}(jQuery));