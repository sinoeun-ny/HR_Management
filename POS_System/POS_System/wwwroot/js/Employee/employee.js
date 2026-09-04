; (function ($) {
    'use strict';

 
    // SECTION 1 — STATE VARIABLES
    let modalSessionMode = 0;
    let employeeMode = 0;
    let positionMode = 0;
    let documentMode = 0;
    let currentEmployeeId = 0;
    let currentEditDocumentId = 0;
    let isPromoting = false;
    let positionInserted = false;
    let documentInserted = false;
    let documentLoadPending = false;

    const modalEl = document.getElementById('employeeModal');

 
    // SECTION 2 — DEPARTMENT & POSITION DROPDOWNS
    function loadPositionsByDepartment(departmentId, selectedPositionId) {
        const $positionSelect = $('#txtPositionName');

        if (!departmentId) {
            $positionSelect.html('<option value="" selected disabled>Select Position</option>');
            return;
        }

        $positionSelect.html('<option value="" selected disabled>Loading...</option>');

        $.get('/Employee/GetPositionsByDept?departmentId=' + encodeURIComponent(departmentId))
            .done(function (data) {
                $positionSelect.html('<option value="" selected disabled>Select Position</option>');
                if (Array.isArray(data)) {
                    data.forEach(function (position) {
                        $positionSelect.append($('<option>', {
                            value: position.positionId,
                            text: position.positionName
                        }));
                    });
                }
                if (selectedPositionId) $positionSelect.val(String(selectedPositionId));
            })
            .fail(function () {
                $positionSelect.html('<option value="" selected disabled>Error loading positions</option>');
            });
    }

    $('#DepartmentId').on('change', function () {
        loadPositionsByDepartment($(this).val());
    });

 
    // SECTION 3 — TABLE INITIALIZATION & HISTORY
    function loadEmpHistory(search, sort) {
        const params = [];
        if (search) params.push('searchEmp=' + encodeURIComponent(search));
        if (sort) params.push('sortByEmp=' + encodeURIComponent(sort));
        const url = '/Employee/GetEmpHis' + (params.length ? '?' + params.join('&') : '');

        $.get(url, function (data) {
            $('#tblEmployeeHistory').bootstrapTable('load', data);
            const badge = document.getElementById('badgeProfile');
            if (badge) badge.textContent = Array.isArray(data) ? data.length : 0;
        });
    }

    $('#tblEmployeeInfo').bootstrapTable({
        url: '/Employee/GetEmployees',
        uniqueId: 'employeeId',
        pagination: true,
        pageSize: 5,
        search: false,
        columns: [
            { field: 'employeeId', title: 'Employee ID', sortable: true },
            { field: 'firstName', title: 'First Name' },
            { field: 'lastName', title: 'Last Name' },
            { field: 'departmentName', title: 'Department' },
            { field: 'positionName', title: 'Position' },
            {
                field: 'status', title: 'Status', align: 'center',
                formatter: function (value, row) {
                    return row.status === 'Active'
                        ? '<span class="status active">Active</span>'
                        : '<span class="status inactive">Inactive</span>';
                }
            },
            {
                field: 'actions', title: 'Actions', align: 'center',
                formatter: function (value, row) {
                    return (
                        '<button class="btn btn-sm btn-warning btn-edit-emp" data-id="' + row.employeeId + '">Edit</button> ' +
                        '<button class="btn btn-sm btn-danger btn-delete-emp" data-id="' + row.employeeId + '">Delete</button>'
                    );
                }
            }
        ]
    });

 
    // SECTION 4 — SEARCH FUNCTIONALITY
    function reloadTable(url) {
        $.get(url)
            .done(function (data) { $('#tblEmployeeInfo').bootstrapTable('load', data); })
            .fail(function () { Swal.fire('Error!', 'Could not load employees.', 'error'); });
    }
    function refreshTable() { reloadTable('/Employee/GetEmployees'); }
    function doSearch() {
        const search = $('#btnSearch').val().trim();
        const url = '/Employee/GetEmployees' + (search ? '?search=' + encodeURIComponent(search) : '');
        reloadTable(url);
    }
    function toggleClearBtn() { $('#searchClearBtn').toggle($('#btnSearch').val().length > 0); }

    $('.search-btn').on('click', doSearch);
    $('#btnSearch')
        .on('keydown', function (event) {
            if (event.key === 'Enter') { event.preventDefault(); doSearch(); }
        })
        .on('input', toggleClearBtn);

    $('#searchClearBtn').on('click', function () {
        $('#btnSearch').val('');
        toggleClearBtn();
        refreshTable();
    });

    $('#txtSortBy').on('change', function () {
        const sortBy = $(this).val();
        const url = '/Employee/GetEmployees' + (sortBy ? '?sortBy=' + encodeURIComponent(sortBy) : '');
        reloadTable(url);
    });


 
    // SECTION 5 — FORM CLEARING & RESET
    function clearEmployeeForm() {
        $('#txtFirstName, #txtLastName, #Gender, #dateOfBirth, #txtEmail, #PhoneNumber, #txtAddress, #HireDate, #Status, #ProfilePhoto').val('');
        $('#imagePreview').html('<span>Click to upload</span>').css('background-image', 'none');
        $('#removeImage').hide();
        $('#btnSaveUsers').prop('disabled', false).text('Save');
    }

    function clearPositionForm() {
        $('#StartDate, #DepartmentId, #txtSalary, #EndDate, #txtUpdate').val('');
        $('#txtPositionName').html('<option value="" selected disabled>Select Position</option>');
        $('#btnSaveEmployeePosition').prop('disabled', false).text('Save');
        $('#txtUpdatePromote').hide();
        isPromoting = false;
    }

    function clearDocumentForm() {
        $('#txtDocumentType').val('');
        $('#txtDocumentName').val('');
        $('#txtExpiryDate').val('');
        $('#txtNotes').val('');
        $('#BtnSaveDocument').prop('disabled', false).text('Save');
        currentEditDocumentId = 0;
        documentMode = 0;
    }

    function clearDocumentPreviewArea() {
        $('#documentPreviewArea').empty();
    }

    function resetToAddMode() {
        modalSessionMode = 0;
        employeeMode = 0;
        positionMode = 0;
        documentMode = 0;
        currentEmployeeId = 0;
        currentEditDocumentId = 0;
        isPromoting = false;

        positionInserted = false;
        documentInserted = false;

        $('#EmployeeId').val(0);
        $('#exampleModalLabel').text('Add Employee');

        clearEmployeeForm();
        clearPositionForm();
        clearDocumentForm();
        clearDocumentPreviewArea();

        if (typeof EmployeeValidation !== 'undefined' && typeof EmployeeValidation.clearErrors === 'function')  {
            EmployeeValidation.clearErrors();
        }

        $('#employeeModal input, #employeeModal select, #employeeModal textarea').removeClass('is-Invalid');
        $('#employeeModal .invalid-feedback, #employeeModal .text-danger').html('').hide();
    }

 
    // SECTION 6 — MODAL EVENTS
    $('#btnAddEmployee').on('click', function () {
        resetToAddMode();
    });

    //if (modalEl) {
    //    modalEl.addEventListener('hide.bs.modal', function (event) {
    //        if (modalSessionMode !== 0) return;

    //        if (currentEmployeeId === 0 || employeeMode === 0) return;

    //        if (!positionInserted) {
    //            event.preventDefault();
    //            Swal.fire('Hold on!', 'Please add the employee position before closing.', 'warning');
    //            return;
    //        }
    //        if (!documentInserted) {
    //            event.preventDefault();
    //            Swal.fire('Hold on!', 'Please add employee document before closing.', 'warning');
    //            return;
    //        }
    //    });
    //    modalEl.addEventListener('hidden.bs.modal', function () {
    //        resetToAddMode();
    //    });
    //}

 
    // SECTION 7 — EMPLOYEE CRUD
    window.handleEdit = function (id) {
        const employeeId = Number(id);
        if (!employeeId || employeeId <= 0) { Swal.fire('Error!', 'Invalid employee ID.', 'error'); return; }

        modalSessionMode = 1;
        employeeMode = 1;
        positionMode = 0;
        documentMode = 0;
        currentEmployeeId = employeeId;
        currentEditDocumentId = 0;

        $.get('/Employee/GetEmployeeById?id=' + encodeURIComponent(employeeId))
            .done(function (res) {
                if (!res.success || !res.employee) {
                    Swal.fire('Error!', res.message || 'Could not load employee.', 'error');
                    return;
                }
                const employee = res.employee;

                $('#EmployeeId').val(employee.employeeId);
                $('#txtFirstName').val(employee.firstName);
                $('#txtLastName').val(employee.lastName);
                $('#Gender').val(employee.gender);
                $('#dateOfBirth').val(employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '');
                $('#txtEmail').val(employee.email);
                $('#PhoneNumber').val(employee.phoneNumber);
                $('#txtAddress').val(employee.address);
                $('#HireDate').val(employee.hireDate ? employee.hireDate.split('T')[0] : '');
                $('#Status').val(employee.status);

                if (employee.profilePhoto) {
                    $('#imagePreview')
                        .css({ 'background-image': 'url("' + employee.profilePhoto + '")', 'background-size': 'cover', 'background-position': 'center' })
                        .find('span').hide();
                    $('#removeImage').show();
                } else {
                    $('#imagePreview').html('<span>Click to upload</span>').css('background-image', 'none');
                    $('#removeImage').hide();
                }

                $('#exampleModalLabel').text('Edit Employee');
                $('#btnSaveUsers').text('Update');

                if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
            })
            .fail(function () { Swal.fire('Error!', 'Could not load employee.', 'error'); });
    };

    window.handleDelete = function (id) {
        const employeeId = Number(id);
        if (!employeeId || employeeId <= 0) { Swal.fire('Error!', 'Invalid employee ID.', 'error'); return; }

        Swal.fire({
            title: 'Are you sure?',
            text: 'This will mark the employee as inactive.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(function (result) {
            if (!result.isConfirmed) return;
            $.post('/Employee/DeleteEmployee', { id: employeeId })
                .done(function (res) {
                    if (res.success) {
                        Swal.fire('Deleted!', res.message || 'Employee was marked inactive.', 'success');
                        refreshTable();
                    } else {
                        Swal.fire('Failed!', res.message || 'Could not delete employee.', 'error');
                    }
                })
                .fail(function () { Swal.fire('Error!', 'Something went wrong.', 'error'); });
        });
    };

    $('#btnSaveUsers').on('click', function (event) {
        event.preventDefault();

        if (typeof EmployeeValidation !== 'undefined' && !EmployeeValidation.employee()) return;

        const wasAdding = employeeMode === 0;
        const formData = new FormData();
        const $button = $('#btnSaveUsers');

        if (!wasAdding) formData.append('EmployeeId', currentEmployeeId);

        formData.append('firstName', $('#txtFirstName').val());
        formData.append('lastName', $('#txtLastName').val());
        formData.append('gender', $('#Gender').val());
        formData.append('dateOfBirth', $('#dateOfBirth').val());
        formData.append('email', $('#txtEmail').val());
        formData.append('phoneNumber', $('#PhoneNumber').val());
        formData.append('address', $('#txtAddress').val());
        formData.append('hireDate', $('#HireDate').val());
        formData.append('status', $('#Status').val());

        const profileInput = $('#ProfilePhoto')[0];
        const profileFile = profileInput && profileInput.files ? profileInput.files[0] : null;
        if (profileFile) formData.append('ProfilePhoto', profileFile);

        const url = wasAdding ? '/Employee/CreateUser' : '/Employee/UpdateEmployeeProfile';

        $button.prop('disabled', true).text(wasAdding ? 'Saving...' : 'Updating...');

        $.ajax({ url: url, type: 'POST', data: formData, processData: false, contentType: false })
            .done(function (res) {
                if (!res.success) { Swal.fire('Failed!', res.message || 'Operation failed.', 'error'); return; }

                if (typeof EmployeeValidation !== 'undefined') EmployeeValidation.clearErrors();

                if (wasAdding) {
                    const newEmployeeId = Number(res.employeeId);
                    if (!newEmployeeId || newEmployeeId <= 0) {
                        Swal.fire('Warning!', 'The employee was saved, but no employee ID was returned.', 'warning');
                        refreshTable();
                        return;
                    }
                    employeeMode = 1;
                    currentEmployeeId = newEmployeeId;
                    $('#EmployeeId').val(newEmployeeId);
                    $('#exampleModalLabel').text('Add Employee');
                }

                Swal.fire({
                    icon: 'success',
                    title: wasAdding ? 'Success!' : 'Updated!',
                    text: res.message || 'Employee saved successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });

                refreshTable();
            })
            .fail(function (xhr) {
                const message = xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : 'Something went wrong while saving the employee.';
                Swal.fire('Error!', message, 'error');
            })
            .always(function () {
                $button.prop('disabled', false).text(modalSessionMode === 0 ? 'Save' : 'Update');
            });
    });

 
    // SECTION 8 — PROFILE PHOTO UPLOAD
    $('#imagePreview').on('click', function () { $('#ProfilePhoto').trigger('click'); });

    $('#ProfilePhoto').on('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (readerEvent) {
            const image = new Image();
            image.onload = function () {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                const size = 200;
                canvas.width = size; canvas.height = size;
                context.drawImage(image, 0, 0, size, size);
                $('#imagePreview')
                    .css({ 'background-image': 'url("' + canvas.toDataURL('image/jpeg') + '")', 'background-size': 'cover', 'background-position': 'center' })
                    .find('span').hide();
                $('#removeImage').show();
            };
            image.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    });

    $('#removeImage').on('click', function (event) {
        event.stopPropagation();
        $('#ProfilePhoto').val('');
        $('#imagePreview').html('<span>Click to upload</span>').css('background-image', 'none');
        $(this).hide();
    });

 
    // SECTION 9 — POSITION TAB
    function applyPositionModeToUi() {
        if (modalSessionMode === 1 && positionMode === 1) {
            $('#btnSaveEmployeePosition').text('Update');
            $('#txtUpdatePromote').show();
        } else {
            $('#btnSaveEmployeePosition').text('Save');
            $('#txtUpdatePromote').hide();
            $('#txtUpdate').val('');
        }
    }

    $('#employee-position-tab').on('click', function () {
        window.setTimeout(function () {
            const employeeId = Number($('#EmployeeId').val());
            if (!employeeId || employeeId <= 0) {
                clearPositionForm();
                positionMode = 0;
                return;
            }
            $.get('/Employee/GetPosition?employeeId=' + encodeURIComponent(employeeId))
                .done(function (res) {
                    if (!res.success || !res.employeePosition) {
                        clearPositionForm();
                        positionMode = 0;
                        applyPositionModeToUi();
                        return;
                    }
                    const position = res.employeePosition;
                    $('#DepartmentId').val(position.departmentId);
                    loadPositionsByDepartment(position.departmentId, position.positionId);
                    $('#StartDate').val(position.startDate ? position.startDate.split('T')[0] : '');
                    $('#txtSalary').val(position.salary);
                    $('#EndDate').val(position.endDate ? position.endDate.split('T')[0] : '');
                    positionMode = 1;
                    applyPositionModeToUi();
                })
                .fail(function () {
                    clearPositionForm();
                    positionMode = 0;
                    applyPositionModeToUi();
                });
        }, 100);
    });

    function doSavePosition(employeeId) {
        const positionIdValue = $('#txtPositionName').val();
        const departmentIdValue = $('#DepartmentId').val();
        const salaryValue = $('#txtSalary').val().trim();
        const wasAddingPosition = positionMode === 0;
        const wasPromoting = isPromoting;
        const $button = $('#btnSaveEmployeePosition');

        if (!positionIdValue) { Swal.fire('Warning!', 'Please select a Position.', 'warning'); isPromoting = false; return; }
        if (!departmentIdValue) { Swal.fire('Warning!', 'Please select a Department.', 'warning'); isPromoting = false; return; }

        const data = {
            EmployeeId: employeeId,
            PositionId: Number(positionIdValue),
            DepartmentId: Number(departmentIdValue),
            StartDate: $('#StartDate').val() || null,
            EndDate: $('#EndDate').val() || null,
            Salary: salaryValue !== '' ? Number(salaryValue) : 0,
            IsPromoted: wasPromoting
        };

        const url = wasAddingPosition ? '/Employee/CreateEmpPosition' : '/Employee/UpdateEmpPosition';

        $button.prop('disabled', true).text(wasAddingPosition ? 'Saving...' : 'Updating...');

        $.ajax({ url: url, type: 'POST', data: JSON.stringify(data), contentType: 'application/json' })
            .done(function (res) {
                if (!res.success) { Swal.fire('Failed!', res.message || 'Could not save position.', 'error'); return; }

                positionMode = 1;
                positionInserted = true;

                Swal.fire({
                    icon: 'success',
                    title: wasPromoting ? 'Promoted!' : (wasAddingPosition ? 'Success!' : 'Updated!'),
                    text: res.message || 'Position saved successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
                refreshTable();
            })
            .fail(function (xhr) {
                let errorMessage = 'Something went wrong on the server.';
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.message) errorMessage = xhr.responseJSON.message;
                    else if (xhr.responseJSON.errors) errorMessage = Object.values(xhr.responseJSON.errors).flat().join('<br>');
                } else if (xhr.responseText) {
                    try { const parsed = JSON.parse(xhr.responseText); if (parsed.message) errorMessage = parsed.message; }
                    catch (e) { console.error('Failed to parse position error response.', e); }
                }
                Swal.fire({ title: 'Validation Error', html: errorMessage, icon: 'error' });
            })
            .always(function () {
                isPromoting = false;
                $button.prop('disabled', false);
                applyPositionModeToUi();
            });
    }

    $('#btnSaveEmployeePosition').on('click', function () {
        const employeeId = Number($('#EmployeeId').val());
        if (!employeeId || employeeId <= 0) { Swal.fire('Error!', 'Please save employee profile first.', 'warning'); return; }

        if (modalSessionMode === 1 && positionMode === 1) {
            const updateOption = $('#txtUpdate').val();
            if (!updateOption) { Swal.fire('Warning!', 'Please select Update or Promote.', 'warning'); return; }
            if (updateOption === 'Promote') {
                isPromoting = true;
                Swal.fire({
                    title: 'Are you sure?',
                    text: 'You are about to promote this employee.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'Cancel'
                }).then(function (result) {
                    if (!result.isConfirmed) { isPromoting = false; return; }
                    if (typeof EmployeeValidation !== 'undefined' && !EmployeeValidation.position()) { isPromoting = false; return; }
                    doSavePosition(employeeId);
                });
                return;
            }
        }

        if (typeof EmployeeValidation !== 'undefined' && !EmployeeValidation.position()) return;
        doSavePosition(employeeId);
    });

 
    // SECTION 10 — DOCUMENT TAB
 
    $('#document-storage-tab').on('click', function () {
        setTimeout(function () {
            const employeeId = Number($('#EmployeeId').val());
            if (!employeeId || employeeId <= 0) {
                clearDocumentForm();
                clearDocumentPreviewArea();
                return;
            }
            $.get('/Employee/GetDocument?employeeId=' + employeeId, function (res) {
                if (res.success && res.documents && res.documents.length > 0) {
                    const first = res.documents[0];
                    $('#txtDocumentName').val(first.documentName || '');
                    $('#txtExpiryDate').val(first.expiryDate ? first.expiryDate.split('T')[0] : '');
                    $('#txtNotes').val(first.notes || '');
                    $('#txtDocumentType').val('');
                    documentMode = 1;
                    $('#BtnSaveDocument').text('Update');
                    displayExistingDocuments(res.documents);
                } else {
                    clearDocumentForm();
                    documentMode = 0;
                    $('#documentPreviewArea').html('<p class="text-muted small">No documents uploaded yet.</p>');
                }
            }).fail(function () { clearDocumentForm(); documentMode = 0; });
        }, 100);
    });

    // Append pending files instead of overwriting existing files
    $('#txtDocumentType').on('change', function () {
        const input = this;
        if (!input.files || input.files.length === 0) return;

        // Find or create the pending files container
        let $pendingWrap = $('#pendingFilesWrap');
        if ($pendingWrap.length === 0) {
            $pendingWrap = $('<div id="pendingFilesWrap" class="border rounded p-3 bg-light mb-3"><h6 class="mb-3"><strong>Pending Files</strong></h6></div>');
            $('#documentPreviewArea').prepend($pendingWrap);
        }

        const fileList = Array.from(input.files);

        fileList.forEach(function (file, index) {
            const fileName = file.name;
            const ext = fileName.split('.').pop().toLowerCase();
            const previewId = 'pending-' + index + '-' + Date.now();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
            const isPdf = ext === 'pdf';
            const badgeColor = isPdf ? '#dc3545' : isImage ? '#0d6efd' : '#6c757d';

            const $row = $(
                '<div class="d-flex align-items-center gap-3 border rounded p-2 mb-2 bg-white shadow-sm" id="' + previewId + '">' +
                '<div style="width:64px;height:64px;flex-shrink:0;border-radius:8px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;" class="pending-thumb"></div>' +
                '<div class="flex-grow-1" style="min-width:0;">' +
                '<div class="fw-semibold text-truncate">' + fileName + '</div>' +
                '<div><span class="badge rounded-pill text-white me-1" style="background:' + badgeColor + ';font-size:10px;">' + ext.toUpperCase() + '</span>' +
                '<small class="text-muted">' + (file.size / 1024).toFixed(1) + ' KB</small></div>' +
                '</div>' +
                '<div class="d-flex flex-column gap-1" style="flex-shrink:0;">' +
                '<button class="btn btn-sm btn-danger btn-remove-pending" data-id="' + previewId + '" data-name="' + fileName.replace(/"/g, '&quot;') + '" title="Remove"><i class="fas fa-times"></i></button>' +
                '</div>' +
                '</div>'
            );

            $pendingWrap.append($row);

            const $thumb = $row.find('.pending-thumb');

            if (isImage) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    $thumb.html('<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;">');
                };
                reader.readAsDataURL(file);
            } else if (isPdf) {
                $thumb.html('<i class="fas fa-file-pdf fa-2x text-danger"></i>');
            } else {
                $thumb.html('<i class="fas fa-file fa-2x text-secondary"></i>');
            }
        });

        // Ensure button text stays correct based on current mode
        $('#BtnSaveDocument').text(documentMode === 1 ? 'Update' : 'Save');
    });

    $('#BtnSaveDocument').on('click', function () {
        const employeeId = Number($('#EmployeeId').val());
        if (!employeeId || employeeId <= 0) { Swal.fire('Error!', 'Please save employee profile first.', 'warning'); return; }

        const fileInput = $('#txtDocumentType')[0];
        const files = fileInput ? fileInput.files : null;

        if (typeof EmployeeValidation !== 'undefined' && !EmployeeValidation.document(documentMode)) return;

        const formData = new FormData();
        formData.append('EmployeeId', employeeId);
        formData.append('DocumentName', $('#txtDocumentName').val() || '');
        formData.append('ExpiryDate', $('#txtExpiryDate').val() || '');
        formData.append('Notes', $('#txtNotes').val() || '');

        const wasAdding = documentMode === 0;

        if (wasAdding) {
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) formData.append('Files', files[i]);
            }
        } else {
            if (files && files.length > 0) {
                const addData = new FormData();
                addData.append('EmployeeId', employeeId);
                addData.append('DocumentName', $('#txtDocumentName').val() || '');
                addData.append('ExpiryDate', $('#txtExpiryDate').val() || '');
                addData.append('Notes', $('#txtNotes').val() || '');
                for (let i = 0; i < files.length; i++) addData.append('Files', files[i]);
                $.ajax({ url: '/Employee/AddDocument', type: 'POST', data: addData, processData: false, contentType: false });
            }
        }

        const url = wasAdding ? '/Employee/AddDocument' : '/Employee/UpdateDocument';

        $.ajax({
            url: url, type: 'POST', data: formData, processData: false, contentType: false,
            success: function (res) {
                if (!res.success) { Swal.fire('Failed!', res.message || 'Could not save document.', 'error'); return; }

                documentInserted = true;

                Swal.fire({
                    icon: 'success',
                    title: wasAdding ? 'Success!' : 'Updated!',
                    text: wasAdding
                        ? (res.filesUploaded || 1) + ' file(s) saved successfully.'
                        : 'Documents updated successfully.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(function () {
                    //  Auto-close modal in Add Mode after document is inserted
                    if (modalSessionMode === 0) {
                        if (modalEl) {
                            const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                            if (modalInstance) {
                                modalInstance.hide();
                            }
                            // Fallback cleanup just in case backdrop gets stuck
                            document.querySelectorAll('.modal-backdrop').forEach(function (el) { el.remove(); });
                            document.body.classList.remove('modal-open');
                            document.body.style.overflow = '';
                            document.body.style.paddingRight = '';
                        }
                        return;
                    }

                    // For Edit Mode: clear file input and refresh list
                    $('#txtDocumentType').val('');
                    $('#pendingFilesWrap').remove();

                    // Refresh the list from the server to show both old and newly added files
                    $.get('/Employee/GetDocument?employeeId=' + employeeId, function (docRes) {
                        if (docRes.success && docRes.documents && docRes.documents.length > 0) {
                            const first = docRes.documents[0];
                            $('#txtDocumentName').val(first.documentName || '');
                            $('#txtExpiryDate').val(first.expiryDate ? first.expiryDate.split('T')[0] : '');
                            $('#txtNotes').val(first.notes || '');

                            displayExistingDocuments(docRes.documents);
                        } else {
                            $('#txtDocumentName').val('');
                            $('#txtExpiryDate').val('');
                            $('#txtNotes').val('');

                            documentMode = 0;
                            $('#BtnSaveDocument').text('Save');

                            $('#documentPreviewArea').html('<p class="text-muted small">No documents uploaded yet.</p>');
                        }
                    });
                });
            },
            error: function () { Swal.fire('Error!', 'Something went wrong.', 'error'); }
        });
    });

 
    // SECTION 11 — DOCUMENT HELPERS
    function refreshDocumentList(employeeId) {
        $.get('/Employee/GetDocument?employeeId=' + employeeId, function (res) {
            if (res.success && res.documents && res.documents.length > 0) {
                const first = res.documents[0];
                $('#txtDocumentName').val(first.documentName || '');
                $('#txtExpiryDate').val(first.expiryDate ? first.expiryDate.split('T')[0] : '');
                $('#txtNotes').val(first.notes || '');
                $('#txtDocumentType').val('');
                documentMode = 1;
                $('#BtnSaveDocument').text('Update');
                displayExistingDocuments(res.documents);
            } else {
                $('#txtDocumentName').val('');
                $('#txtExpiryDate').val('');
                $('#txtNotes').val('');
                documentMode = 0;
                $('#BtnSaveDocument').text('Save');
                $('#documentPreviewArea').html('<p class="text-muted small">No documents uploaded yet.</p>');
            }
        });
    }

    function displayExistingDocuments(documents) {
        // Preserve any pending files the user is currently adding
        const $pending = $('#pendingFilesWrap').detach();

        let html = '<div class="border rounded p-3 bg-light"><h6 class="mb-3"><strong>Uploaded Documents</strong></h6>';
        documents.forEach(function (doc) {
            const filePath = doc.documentType || '';
            const actualFile = filePath.split('/').pop();
            const fileExt = actualFile.split('.').pop().toLowerCase();
            const labelName = (doc.documentName && doc.documentName.trim() !== '') ? doc.documentName : actualFile;
            const docId = doc.documentStorageId || doc.documentId;
            const expiryVal = doc.expiryDate ? doc.expiryDate.split('T')[0] : 'N/A';
            const notesVal = doc.notes || 'N/A';
            const safeLabelName = labelName.replace(/'/g, "\\'");
            const badgeColor = fileExt === 'pdf' ? '#dc3545' : ['jpg', 'jpeg', 'png'].includes(fileExt) ? '#0d6efd' : '#6c757d';

            html += '<div class="d-flex align-items-center gap-3 border rounded p-2 mb-2 bg-white shadow-sm">';
            html += '<div style="width:64px;height:64px;flex-shrink:0;border-radius:8px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">';
            if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
                html += '<img src="' + filePath + '" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="openImageModal(\'' + filePath + '\',\'' + safeLabelName + '\')">';
            } else if (fileExt === 'pdf') {
                html += '<a href="' + filePath + '" target="_blank"><i class="fas fa-file-pdf fa-2x text-danger"></i></a>';
            } else {
                html += '<i class="fas fa-file fa-2x text-secondary"></i>';
            }
            html += '</div>';

            html += '<div class="flex-grow-1" style="min-width:0;">';
            html += '<div class="fw-semibold text-truncate">' + labelName + '</div>';
            html += '<div><span class="badge rounded-pill text-white me-1" style="background:' + badgeColor + ';font-size:10px;">' + fileExt.toUpperCase() + '</span><small class="text-muted text-truncate">' + actualFile + '</small></div>';
            html += '<div class="mt-1"><small class="text-muted me-2"><i class="fas fa-calendar-alt me-1"></i>' + expiryVal + '</small><small class="text-muted"><i class="fas fa-sticky-note me-1"></i>' + notesVal + '</small></div>';
            html += '</div>';

            html += '<div class="d-flex flex-column gap-1" style="flex-shrink:0;">';
            html += '<button class="btn btn-sm btn-primary" onclick="downloadDocument(' + docId + ')" title="Download"><i class="fas fa-download"></i></button>';
            html += '<button class="btn btn-sm btn-danger"   onclick="deleteDocument(' + docId + ')"  title="Delete"><i class="fas fa-trash"></i></button>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        $('#documentPreviewArea').html(html);

        // Put pending files back at the top if they exist
        if ($pending.length) {
            $('#documentPreviewArea').prepend($pending);
        }
    }

 
    // SECTION 12 — BELL NOTIFICATIONS
    function loadProbationAlerts() {
        $.get('/Employee/GetProbationAlerts', function (res) {
            if (!res.success) return;
            const count = Number(res.count) || 0;
            const alerts = Array.isArray(res.alerts) ? res.alerts : [];
            const badge = document.getElementById('bellBadge');

            if (badge) {
                if (count > 0) { badge.style.display = 'flex'; badge.textContent = count > 99 ? '99+' : count; }
                else { badge.style.display = 'none'; }
            }

            const list = document.getElementById('bellList');
            if (!list) return;

            if (count === 0) {
                list.innerHTML = '<div style="padding:16px;text-align:center;color:#6c757d;font-size:13px;"><i class="fas fa-check-circle text-success me-1"></i>No pending reviews</div>';
                return;
            }

            const $list = $(list).empty();
            alerts.forEach(function (a) {
                const color = a.alertLevel === 'new' ? '#198754' : (a.alertLevel === 'warning' ? '#ffc107' : '#dc3545');
                const icon = a.alertLevel === 'new' ? 'fa-clock' : (a.alertLevel === 'warning' ? 'fa-exclamation-triangle' : 'fa-fire');
                const bgColor = a.alertLevel === 'new' ? '#f0fff4' : (a.alertLevel === 'warning' ? '#fffdf0' : '#fff5f5');

                const item = $('<div>', {
                    class: 'bell-alert-item',
                    'data-employee-id': a.employeeId,
                    css: { padding: '10px 14px', borderBottom: '1px solid #f0f0f0', background: bgColor, cursor: 'pointer' }
                });

                const heading = $('<div>', { css: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } });
                heading.append($('<span>', { text: a.fullName, css: { fontWeight: 600, fontSize: '13px' } }));
                heading.append($('<span>', { text: a.daysOverdue + 'd overdue', css: { fontSize: '10px', color: color, fontWeight: 600 } }).prepend('<i class="fas ' + icon + ' me-1"></i>'));
                item.append(heading);

                item.append($('<div>', { text: (a.positionName || '') + ' — ' + (a.departmentName || ''), css: { fontSize: '11px', color: '#6c757d', marginBottom: '4px' } }).prepend('<i class="fas fa-briefcase me-1"></i>'));
                item.append($('<div>', { text: a.alertMessage, css: { fontSize: '11px', color: color, marginBottom: '4px' } }).prepend('<i class="fas fa-info-circle me-1"></i>'));

                const details = $('<div>', { css: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6c757d' } });
                details.append($('<span>', { text: 'Probation ended: ' + a.probationEndDate }).prepend('<i class="fas fa-calendar me-1"></i>'));
                details.append($('<span>', { text: Number(a.salary || 0).toLocaleString() }).prepend('<i class="fas fa-dollar-sign me-1"></i>'));
                item.append(details);
                item.append($('<div>', { text: 'Click to open employee', css: { fontSize: '10px', color: '#adb5bd', marginTop: '4px' } }).prepend('<i class="fas fa-mouse-pointer me-1"></i>'));
                $list.append(item);
            });
        });
    }

    window.openEmployeeFromBell = function (employeeId) {
        const dropdown = document.getElementById('bellDropdown');
        if (dropdown) dropdown.style.display = 'none';
        window.handleEdit(employeeId);
    };

    const bellWrapper = document.getElementById('bellWrapper');
    if (bellWrapper) {
        bellWrapper.addEventListener('click', function (e) {
            e.stopPropagation();
            const dropdown = document.getElementById('bellDropdown');
            if (dropdown) dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
    }
    document.addEventListener('click', function () {
        const dropdown = document.getElementById('bellDropdown');
        if (dropdown) dropdown.style.display = 'none';
    });

    loadProbationAlerts();
    setInterval(loadProbationAlerts, 5 * 60 * 1000);

 
    // SECTION 13 — DOCUMENT HELPERS & EVENT DELEGATION
    window.removePendingFile = function (previewId, fileName) {
        $('#' + previewId).remove();
        const input = $('#txtDocumentType')[0];
        if (!input || !input.files) return;
        const dt = new DataTransfer();
        let removed = false;
        Array.from(input.files).forEach(function (f) {
            if (!removed && f.name === fileName) { removed = true; return; }
            dt.items.add(f);
        });
        input.files = dt.files;

        // If no pending files remain, clean up the wrapper
        if (input.files.length === 0) {
            $('#pendingFilesWrap').remove();
            if ($('#documentPreviewArea').is(':empty')) {
                $('#documentPreviewArea').html('<p class="text-muted small">No documents uploaded yet.</p>');
            }
        }
    };

    window.downloadDocument = function (docId) {
        window.location.href = '/Employee/DownloadDocument?documentId=' + encodeURIComponent(docId);
    };

    window.deleteDocument = function (docId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(function (result) {
            if (!result.isConfirmed) return;
            $.post('/Employee/DeleteDocFile', { documentId: docId })
                .done(function (res) {
                    if (res.success) {
                        Swal.fire('Deleted!', 'Document has been deleted.', 'success');
                        const empId = Number($('#EmployeeId').val());
                        if (empId > 0) refreshDocumentList(empId);
                    } else {
                        Swal.fire('Error!', res.message || 'Could not delete document.', 'error');
                    }
                })
                .fail(function () { Swal.fire('Error!', 'Failed to delete document.', 'error'); });
        });
    };

    window.openImageModal = function (imagePath, documentName) {
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
                const link = document.createElement('a');
                link.href = imagePath;
                link.download = documentName;
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        });
    };

    $(document).on('click', '.btn-edit-emp', function () { window.handleEdit($(this).data('id')); });
    $(document).on('click', '.btn-delete-emp', function () { window.handleDelete($(this).data('id')); });
    $(document).on('click', '.btn-remove-pending', function () {
        window.removePendingFile($(this).data('id'), $(this).data('name'));
    });
    $(document).on('click', '.btn-download-doc', function () { window.downloadDocument($(this).data('id')); });
    $(document).on('click', '.btn-delete-doc', function () { window.deleteDocument($(this).data('id')); });
    $(document).on('click', '.doc-image-preview', function () {
        window.openImageModal($(this).data('path'), $(this).data('name'));
    });
    $(document).on('click', '.bell-alert-item', function () {
        window.openEmployeeFromBell($(this).data('employee-id'));
    });

    // URL parameter support
    const parameters = new URLSearchParams(window.location.search);
    const openEmployeeId = Number(parameters.get('openEmployee'));
    if (openEmployeeId > 0) window.handleEdit(openEmployeeId);

}(jQuery));