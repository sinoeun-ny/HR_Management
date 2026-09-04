(function ($) {
    'use strict';

    $(function () {
        var departmentId = new URLSearchParams(
            window.location.search
        ).get('id');

        function getErrorMessage(xhr, fallback) {
            return xhr.responseJSON?.message ||
                xhr.responseText ||
                fallback;
        }

        function currentSearch() {
            return $('#btnSearchAll').val().trim();
        }

        function currentSort() {
            return $('#txtSortByAll').val();
        }

        if (!departmentId) {
            Swal.fire(
                'Error!',
                'No department selected.',
                'error'
            );
            return;
        }

        // Initialize employee table.
        $('#tblViewDept').bootstrapTable({
            data: [],
            uniqueId: 'employeeId',
            pagination: true,
            sidePagination: 'client',
            pageSize: 10,
            pageList: [10, 25, 50],
            search: false,
            columns: [
                {
                    field: 'employeeId',
                    title: 'Emp ID',
                    width: 70
                },
                {
                    field: 'fullName',
                    title: 'Full Name'
                },
                {
                    field: 'positionName',
                    title: 'Position'
                },
                {
                    field: 'salary',
                    title: 'Salary',
                    formatter: function (value) {
                        return '$' + Number(value || 0)
                            .toLocaleString();
                    }
                },
                {
                    field: 'startDate',
                    title: 'Start Date',
                    formatter: function (value) {
                        return value || '—';
                    }
                },
                {
                    field: 'status',
                    title: 'Status',
                    align: 'center',
                    formatter: function (value) {
                        if (value === 'Active') {
                            return '<span class="badge bg-success">' +
                                'Active</span>';
                        }

                        return '<span class="badge bg-danger">' +
                            (value || 'Inactive') +
                            '</span>';
                    }
                },
                {
                    field: 'employeeId',
                    title: 'Action',
                    align: 'center',
                    formatter: function (employeeId) {
                        return `
                            <button type="button"
                                    class="btn btn-sm btn-primary view-employee-btn"
                                    data-employee-id="${employeeId}">
                                <i class="fas fa-eye me-1"></i>View
                            </button>`;
                    }
                }
            ]
        });

        function loadDepartment() {
            $.ajax({
                url: '/Department/GetDeptById',
                type: 'GET',
                dataType: 'json',
                data: {
                    id: departmentId
                }
            })
                .done(function (res) {
                    if (!res.success) {
                        Swal.fire(
                            'Error!',
                            res.message || 'Could not load department.',
                            'error'
                        );
                        return;
                    }

                    $('#deptTitle').text(
                        res.departmentName || 'Department'
                    );

                    $('#cardEmpTotal').text(
                        Number(res.employeeTotal || 0)
                    );

                    $('#cardPosTotal').text(
                        Number(res.positionTotal || 0)
                    );

                    $('#cardAbbr').text(
                        res.abbreviation || '—'
                    );

                    $('#cardDesc').text(
                        res.description || '—'
                    );
                })
                .fail(function (xhr) {
                    Swal.fire(
                        'Error!',
                        getErrorMessage(
                            xhr,
                            'Failed to load department.'
                        ),
                        'error'
                    );
                });
        }

        function loadEmployees(search, sort) {
            $.ajax({
                url: '/Department/GetEmployeesByDept',
                type: 'GET',
                dataType: 'json',
                data: {
                    departmentId: departmentId,
                    search: search || null,
                    sortBy: sort || null
                }
            })
                .done(function (res) {
                    if (!res.success) {
                        Swal.fire(
                            'Error!',
                            res.message || 'Could not load employees.',
                            'error'
                        );
                        return;
                    }

                    var employees = Array.isArray(res.data)
                        ? res.data
                        : [];

                    $('#tblViewDept').bootstrapTable(
                        'load',
                        employees
                    );
                })
                .fail(function (xhr) {
                    $('#tblViewDept').bootstrapTable('load', []);

                    Swal.fire(
                        'Error!',
                        getErrorMessage(
                            xhr,
                            'Failed to load employees.'
                        ),
                        'error'
                    );
                });
        }

        loadDepartment();
        loadEmployees('', '');

        $(document).on(
            'click',
            '.view-employee-btn',
            function () {
                var employeeId = $(this).data('employee-id');

                window.location.href =
                    '/Employee/Index?openEmployee=' +
                    encodeURIComponent(employeeId);
            }
        );

        $(document).on(
            'click',
            '.search-btn-all',
            function () {
                loadEmployees(
                    currentSearch(),
                    currentSort()
                );
            }
        );

        $(document).on(
            'keydown',
            '#btnSearchAll',
            function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();

                    loadEmployees(
                        currentSearch(),
                        currentSort()
                    );
                }
            }
        );

        $(document).on(
            'input',
            '#btnSearchAll',
            function () {
                $('#searchClearBtnAll').toggle(
                    $(this).val().length > 0
                );
            }
        );

        $(document).on(
            'click',
            '#searchClearBtnAll',
            function () {
                $('#btnSearchAll').val('');
                $(this).hide();

                loadEmployees(
                    '',
                    currentSort()
                );
            }
        );

        $(document).on(
            'change',
            '#txtSortByAll',
            function () {
                loadEmployees(
                    currentSearch(),
                    currentSort()
                );
            }
        );
    });
})(jQuery);
