(function () {
    'use strict';

    // ===========================
    // FIELD ERROR HELPERS
    // ===========================

    /**
     * Highlight a field as invalid and show a SweetAlert warning.
     * The red border clears automatically on the next user input.
     */
    function showError(message, fieldSelector) {
        if (fieldSelector) {
            $(fieldSelector)
                .addClass('is-invalid')
                .one('input change', function () {
                    $(this).removeClass('is-invalid');
                });
        }
        Swal.fire({
            icon: 'warning',
            title: 'Validation',
            text: message,
            timer: 2500,
            showConfirmButton: false
        });
    }

    /** Strip all red borders after a successful save */
    function clearFieldErrors() {
        $('.is-invalid').removeClass('is-invalid');
    }

    // ===========================
    // TAB 1 — EMPLOYEE PROFILE
    // Fields: firstName, lastName, gender, dateOfBirth,
    //         email, phoneNumber, address, hireDate, status
    // ===========================
    function validateEmployeeForm() {
        const first = $('#txtFirstName').val().trim();
        const last = $('#txtLastName').val().trim();
        const gender = $('#Gender').val();
        const dob = $('#dateOfBirth').val();
        const email = $('#txtEmail').val().trim();
        const phone = $('#PhoneNumber').val().trim();
        const hire = $('#HireDate').val();
        const status = $('#Status').val();

        if (!first) {
            showError('First name is required.', '#txtFirstName');
            return false;
        }
        if (!last) {
            showError('Last name is required.', '#txtLastName');
            return false;
        }
        if (!gender) {
            showError('Please select a gender.', '#Gender');
            return false;
        }
        if (!dob) {
            showError('Date of birth is required.', '#dateOfBirth');
            return false;
        }

        // Must be 18 or older
        const today = new Date();
        const birthDate = new Date(dob);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const isUnder18 = age < 18 || (age === 18 && monthDiff < 0) ||
            (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate());
        if (isUnder18) {
            showError('Employee must be at least 18 years old.', '#dateOfBirth');
            return false;
        }

        // Email format
        const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            showError('Email is required.', '#txtEmail');
            return false;
        }
        if (!emailRx.test(email)) {
            showError('Enter a valid email address.', '#txtEmail');
            return false;
        }

        // Phone — digits only, 7–15 characters
        const phoneRx = /^[0-9]{7,15}$/;
        if (!phone) {
            showError('Phone number is required.', '#PhoneNumber');
            return false;
        }
        if (!phoneRx.test(phone)) {
            showError('Phone must contain 7–15 digits only.', '#PhoneNumber');
            return false;
        }

        if (!hire) {
            showError('Hire date is required.', '#HireDate');
            return false;
        }

        // Hire date must not be in the future
        const hireDate = new Date(hire);
        hireDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (hireDate > today) {
            showError('Hire date cannot be in the future.', '#HireDate');
            return false;
        }

        if (!status) {
            showError('Please select a status.', '#Status');
            return false;
        }

        return true;
    }

    // ===========================
    // TAB 2 — POSITION
    // Fields: positionId, departmentId, startDate
    // ===========================
    function validatePositionForm() {
        const posId = Number($('#txtPositionName').val());
        const deptId = Number($('#DepartmentId').val());
        const start = $('#StartDate').val();

        if (!posId || posId <= 0) {
            showError('Please select a position.', '#txtPositionName');
            return false;
        }
        if (!deptId || deptId <= 0) {
            showError('Please select a department.', '#DepartmentId');
            return false;
        }
        if (!start) {
            showError('Start date is required.', '#StartDate');
            return false;
        }

        return true;
    }

    // ===========================
    // TAB 3 — DOCUMENT STORAGE
    // Fields: documentName, file(s), expiryDate (optional)
    // ===========================
    function validateDocumentForm(documentMode) {
        const name = $('#txtDocumentName').val().trim();
        const fileInput = $('#txtDocumentType')[0];
        const files = fileInput ? fileInput.files : null;
        const expiry = $('#txtExpiryDate').val();

        if (!name) {
            showError('Document name is required.', '#txtDocumentName');
            return false;
        }

        // File required only on ADD (documentMode === 0)
        if (documentMode === 0 && (!files || files.length === 0)) {
            showError('Please select at least one document file.', '#txtDocumentType');
            return false;
        }

        // Allowed file types
        const allowedExt = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const ext = files[i].name.split('.').pop().toLowerCase();
                if (!allowedExt.includes(ext)) {
                    showError('Only PDF, JPG, PNG, DOC, DOCX files are allowed.', '#txtDocumentType');
                    return false;
                }
                // Max 5 MB per file
                if (files[i].size > 5 * 1024 * 1024) {
                    showError('Each file must be under 5 MB.', '#txtDocumentType');
                    return false;
                }
            }
        }

        // Expiry date — optional, but must not be in the past if provided
        if (expiry) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(expiry) < today) {
                showError('Expiry date cannot be in the past.', '#txtExpiryDate');
                return false;
            }
        }

        return true;
    }

    // ===========================
    // EXPOSE to main script
    // ===========================
    window.EmployeeValidation = {
        employee: validateEmployeeForm,
        position: validatePositionForm,
        document: validateDocumentForm,
        clearErrors: clearFieldErrors
    };

})();