(function ($) {
    'use strict';

    $(function () {
        var modalElement = document.getElementById('deptModal');
        var departmentModal = bootstrap.Modal.getOrCreateInstance(modalElement);

        // Prevent values from being treated as HTML.
        function escapeHtml(value) {
            return $('<div>')
                .text(value == null ? '' : String(value))
                .html();
        }

        function getErrorMessage(xhr, fallbackMessage) {
            return xhr.responseJSON?.message ||
                xhr.responseText ||
                fallbackMessage;
        }

        function currentSearch() {
            return $('#btnSearch').val().trim();
        }

        // Build one department card.
        function buildCard(dept) {
            var departmentId = Number(dept.departmentId);
            var departmentName = escapeHtml(dept.departmentName || '');
            var abbreviation = escapeHtml(dept.abbreviation || '—');
            var description = escapeHtml(dept.description || '—');
            var employeeTotal = Number(dept.employeeTotal || 0);
            var positionTotal = Number(dept.positionTotal || 0);

            return `
                <div class="card" id="deptCard-${departmentId}">
                    <h3 class="departmentName">${departmentName}</h3>

                    <p class="abbreviation">
                        Abbreviation: <span>${abbreviation}</span>
                    </p>

                    <p class="totalEmployee">
                        Employee total: <span>${employeeTotal}</span>
                    </p>

                    <p class="positionTotal">
                        Position total: <span>${positionTotal}</span>
                    </p>

                    <p class="description">
                        Description: <span>${description}</span>
                    </p>

                    <div class="card-buttons">
                        <button type="button"
                                class="btn btn-primary view-detail-btn"
                                data-dept-id="${departmentId}">
                            View
                        </button>

                        <button type="button"
                                class="btn btn-warning edit-btn text-white"
                                data-dept-id="${departmentId}">
                            Edit
                        </button>

                        <button type="button"
                                class="btn bg-danger delete-btn text-white"
                                data-dept-id="${departmentId}">
                            Delete
                        </button>
                    </div>
                </div>`;
        }

        // Load departments from the database.
        function loadDepartments(searchTerm) {
            var url = '/Department/GetDepartments';

            if (searchTerm) {
                url += '?searchDept=' + encodeURIComponent(searchTerm);
            }

            $('.cards').html(
                '<p class="text-muted">Loading departments...</p>'
            );

            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json'
            })
                .done(function (res) {
                    if (!res.success) {
                        Swal.fire(
                            'Error!',
                            res.message || 'Could not load departments.',
                            'error'
                        );
                        return;
                    }

                    if (!Array.isArray(res.data) || res.data.length === 0) {
                        $('.cards').html(
                            '<p class="text-muted">No departments found.</p>'
                        );
                        return;
                    }

                    var html = '';

                    res.data.forEach(function (dept) {
                        html += buildCard(dept);
                    });

                    $('.cards').html(html);
                })
                .fail(function (xhr) {
                    $('.cards').html(
                        '<p class="text-danger">Failed to load departments.</p>'
                    );

                    Swal.fire(
                        'Error!',
                        getErrorMessage(
                            xhr,
                            'Could not load departments.'
                        ),
                        'error'
                    );
                });
        }

        function clearDepartmentForm() {
            $('#deptIdInput').val('');
            $('#deptNameInput').val('');
            $('#txtAbbreviation').val('');
            $('#deptDescInput').val('');
        }

        function resetSaveButton() {
            $('#saveDeptBtn')
                .prop('disabled', false)
                .html(
                    '<i class="bi bi-check-circle me-2"></i>Save'
                );
        }

        // Initial department load.
        loadDepartments('');

        // Search button.
        $(document).on('click', '.search-btn', function () {
            loadDepartments(currentSearch());
        });

        // Search using Enter.
        $(document).on('keydown', '#btnSearch', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                loadDepartments(currentSearch());
            }
        });

        // Show or hide the clear-search button.
        $(document).on('input', '#btnSearch', function () {
            $('#searchClearBtn').toggle(
                $(this).val().length > 0
            );
        });

        // Clear search.
        $(document).on('click', '#searchClearBtn', function () {
            $('#btnSearch').val('');
            $(this).hide();
            loadDepartments('');
        });

        // Open Add Department modal.
        $(document).on('click', '#addDeptBtn', function () {
            clearDepartmentForm();

            $('#deptModalTitle').text('Add Department');
            resetSaveButton();

            departmentModal.show();

            modalElement.addEventListener(
                'shown.bs.modal',
                function () {
                    $('#deptNameInput').trigger('focus');
                },
                { once: true }
            );
        });

        // Open Edit Department modal.
        $(document).on('click', '.edit-btn', function () {
            var departmentId = $(this).data('dept-id');
            var card = $('#deptCard-' + departmentId);

            if (!card.length) {
                Swal.fire(
                    'Error!',
                    'Department card was not found.',
                    'error'
                );
                return;
            }

            var abbreviation = card
                .find('.abbreviation span')
                .text()
                .trim();

            var description = card
                .find('.description span')
                .text()
                .trim();

            $('#deptIdInput').val(departmentId);

            $('#deptNameInput').val(
                card.find('.departmentName').text().trim()
            );

            $('#txtAbbreviation').val(
                abbreviation === '—' ? '' : abbreviation
            );

            $('#deptDescInput').val(
                description === '—' ? '' : description
            );

            $('#deptModalTitle').text('Edit Department');

            $('#saveDeptBtn')
                .prop('disabled', false)
                .html(
                    '<i class="bi bi-check-circle me-2"></i>Update'
                );

            departmentModal.show();
        });

        // Add or update department.
        $(document).on('click', '#saveDeptBtn', function () {
            var saveButton = $(this);

            var departmentId = $('#deptIdInput').val();
            var departmentName = $('#deptNameInput').val().trim();
            var abbreviation = $('#txtAbbreviation').val().trim();
            var description = $('#deptDescInput').val().trim();

            if (!departmentName) {
                Swal.fire(
                    'Warning!',
                    'Department name is required.',
                    'warning'
                );

                $('#deptNameInput').trigger('focus');
                return;
            }

            var isUpdate = departmentId !== '';

            var requestUrl = isUpdate
                ? '/Department/UpdateDept'
                : '/Department/AddDepartment';

            var requestData = {
                departmentName: departmentName,
                abbreviation: abbreviation,
                description: description
            };

            if (isUpdate) {
                requestData.departmentId = departmentId;
            }

            saveButton
                .prop('disabled', true)
                .html(
                    '<span class="spinner-border spinner-border-sm me-2"></span>' +
                    (isUpdate ? 'Updating...' : 'Saving...')
                );

            $.ajax({
                url: requestUrl,
                type: 'POST',
                data: requestData,
                dataType: 'json'
            })
                .done(function (res) {
                    if (!res.success) {
                        Swal.fire(
                            'Failed!',
                            res.message || 'The operation failed.',
                            'error'
                        );
                        return;
                    }

                    departmentModal.hide();
                    clearDepartmentForm();
                    resetSaveButton();
                    loadDepartments(currentSearch());

                    setTimeout(function () {
                        Swal.fire({
                            icon: 'success',
                            title: isUpdate ? 'Updated!' : 'Added!',
                            text: isUpdate
                                ? departmentName + ' department updated successfully.'
                                : departmentName + ' department created successfully.',
                            confirmButtonText: 'OK',
                            confirmButtonColor: isUpdate ? '#0d6efd' : '#198754'
                        });
                    }, 300);
                })

                .fail(function (xhr) {
                    Swal.fire(
                        'Error!',
                        getErrorMessage(
                            xhr,
                            isUpdate
                                ? 'Failed to update department.'
                                : 'Failed to add department.'
                        ),
                        'error'
                    );
                })
                .always(function () {
                    // Modal hidden event also resets this after success.
                    if ($(modalElement).hasClass('show')) {
                        saveButton
                            .prop('disabled', false)
                            .html(
                                '<i class="bi bi-check-circle me-2"></i>' +
                                (isUpdate ? 'Update' : 'Save')
                            );
                    }
                });
        });

        // Delete department.
        $(document).on('click', '.delete-btn', function () {
            var departmentId = $(this).data('dept-id');

            Swal.fire({
                title: 'Are you sure?',
                text: 'This will delete the department.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#dc3545'
            })
                .then(function (result) {
                    if (!result.isConfirmed) {
                        return;
                    }

                    $.ajax({
                        url: '/Department/DeleteDept',
                        type: 'POST',
                        data: {
                            id: departmentId
                        },
                        dataType: 'json'
                    })
                        .done(function (res) {
                            if (!res.success) {
                                Swal.fire(
                                    'Failed!',
                                    res.message || 'Delete failed.',
                                    'error'
                                );
                                return;
                            }

                            loadDepartments(currentSearch());

                            Swal.fire(
                                'Deleted!',
                                res.message || 'Department deleted.',
                                'success'
                            );
                        })
                        .fail(function (xhr) {
                            Swal.fire(
                                'Error!',
                                getErrorMessage(
                                    xhr,
                                    'Failed to delete department.'
                                ),
                                'error'
                            );
                        });
                });
        });

        // View department details.
        $(document).on(
            'click',
            '.view-detail-btn',
            function () {
                var departmentId = $(this).data('dept-id');

                window.location.href =
                    '/Department/ViewDept?id=' +
                    encodeURIComponent(departmentId);
            }
        );

        // Reset form when modal closes.
        $(modalElement).on('hidden.bs.modal', function () {
            clearDepartmentForm();
            resetSaveButton();
        });
    });
})(jQuery);
