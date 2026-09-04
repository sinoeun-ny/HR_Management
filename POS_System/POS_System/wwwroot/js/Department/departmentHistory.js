; (function ($) {
    'use strict';

    function actionBadge(type) {
        var map = {
            'Insert': '<span class="badge bg-success">Created</span>',
            'Update': '<span class="badge bg-warning text-dark">Updated</span>',
            'Delete': '<span class="badge bg-danger">Deleted</span>'
        };
        return map[type] || '<span class="badge bg-secondary">' + (type || '—') + '</span>';
    }

    function snapRowFull(label, value) {
        return `<div class="col-12 mb-3">
            <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">${label}</div>
            <div style="padding:8px 12px; background:#f8f9fa; border-radius:6px;">${value || '—'}</div>
        </div>`;
    }

    function snapRow(label, value) {
        return `<div class="col-md-6 mb-3">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
            <div style="padding:8px 12px;background:#f8f9fa;border-radius:6px;">${value || '—'}</div>
        </div>`;
    }

    // ── Load history ──────────────────────────────────────────
    function loadDeptHistory(search, sortBy) {
        var p = [];
        if (search) p.push('search=' + encodeURIComponent(search));
        if (sortBy) p.push('sortBy=' + encodeURIComponent(sortBy));
        var url = '/Department/GetDeptHistory' + (p.length ? '?' + p.join('&') : '');

        $.get(url, function (res) {
            if (!res.success) { Swal.fire('Error!', res.message, 'error'); return; }
            $('#tblEmployeeHistory').bootstrapTable('load', res.data);
            // ✅ Update badge
            var badge = document.getElementById('badgeDept');
            if (badge) badge.textContent = res.data.length;
        }).fail(function (xhr) {
            Swal.fire('Error!', 'Could not load history. Status: ' + xhr.status, 'error');
        });
    }

    // ── Table ──────────────────────────────────────────────────
    $('#tblEmployeeHistory').bootstrapTable({
        data: [],
        uniqueId: 'historyId',
        pagination: true,
        sidePagination: 'client',
        pageSize: 10,
        columns: [
            { field: 'historyId', title: 'His ID', width: 70 },
            { field: 'departmentId', title: 'Dept ID', width: 80 },
            { field: 'departmentName', title: 'Department' },
            { field: 'abbreviation', title: 'Abbreviation' },
            {
                field: 'changedBy', title: 'Change By', align: 'center',
                formatter: function (v) { return actionBadge(v); }
            },
            { field: 'updateUID', title: 'Update By' },
            { field: 'changedDate', title: 'Changed Date' },
            {
                field: 'actions', title: 'Action', align: 'center',
                formatter: function (v, row) {
                    return '<button class="btn btn-sm btn-primary" onclick="viewDeptSnapshot(' + row.historyId + ')">' +
                        '<i class="fas fa-eye me-1"></i>View</button>';
                }
            }
        ]
    });

    loadDeptHistory();

    // ── Search button ──────────────────────────────────────────
    $('#btnDoSearchEmp').on('click', function () {
        loadDeptHistory($('#btnSearchEmp').val().trim(), $('#txtSortByEmp').val());
    });

    // ── Search input (Enter key) ─────────────────────────────
    $('#btnSearchEmp').on('keydown', function (e) {
        if (e.key === 'Enter') {
            loadDeptHistory($(this).val().trim(), $('#txtSortByEmp').val());
        }
    });

    // ── Show/hide clear button ───────────────────────────────
    $('#btnSearchEmp').on('input', function () {
        $('#searchClearBtnEmp').toggle($(this).val().length > 0);
    });

    // ── Clear search ──────────────────────────────────────────
    $('#searchClearBtnEmp').on('click', function () {
        $('#btnSearchEmp').val('');
        $(this).hide();
        loadDeptHistory();
    });

    // ✅ FIX 1: Sort dropdown change
    $('#txtSortByEmp').on('change', function () {
        loadDeptHistory($('#btnSearchEmp').val().trim(), $(this).val());
    });

    // ── Snapshot modal ─────────────────────────────────────────
    window.viewDeptSnapshot = function (historyId) {
        $('#snapshotBody').html('<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i></div>');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('snapshotModal')).show();

        $.get('/Department/GetDeptHisAll?id=' + historyId, function (res) {
            if (!res.success) {
                $('#snapshotBody').html('<p class="text-danger">Could not load snapshot.</p>');
                return;
            }

            var d = res.snapshot;
            $('#snapshotTitle').text('Department History — ' + d.departmentName);

            var html = `
            <div class="row">
                ${snapRow('History ID', d.historyId)}
                ${snapRow('Department ID', d.departmentId)}
                ${snapRow('Department', d.departmentName)}
                ${snapRow('Abbreviation', d.abbreviation)}
            </div>
            <div class="row mt-2">
                <div class="col-12 mb-3">
                    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Description</div>
                    <div style="padding:8px 12px;background:#f8f9fa;border-radius:6px;">${d.description || '—'}</div>
                </div>
            </div>
            <br><hr><br>
            <div class="row">
                ${snapRow('Changed By', actionBadge(d.changedBy))}
                ${snapRow('Changed Date', d.changedDate)}
                ${snapRowFull('Update By', d.updateUID)}
            </div>`;

            $('#snapshotBody').html(html);
        }).fail(function () {
            $('#snapshotBody').html('<p class="text-danger">Failed to load snapshot.</p>');
        });
    };

}(jQuery));