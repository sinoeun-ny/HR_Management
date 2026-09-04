$(document).ready(function () {
    // Trigger overlay when clicking the continue button
    $('#continue').on('click', function () {
        $('#confirm_content').addClass('show');  // Show the overlay
    });

    // Close the overlay when clicking outside the content area
    $('#confirm_content').on('click', function (e) {
        // Check if the click was outside the content box
        if ($(e.target).is('#confirm_content')) {
            $('#confirm_content').removeClass('show');  // Hide the overlay
        }
    });

    // Trigger overlay when clicking the final confirm button
    $('#samifinal_confirm').on('click', function (e) {
        e.preventDefault(); // Prevent the default form submission
        $('#confirm_final').addClass('show');  // Show the final confirmation overlay
    });

    // Close the final confirmation overlay when clicking outside the content area
    $('#confirm_final').on('click', function (e) {
        // Check if the click was outside the content box
        if ($(e.target).is('#confirm_final')) {
            $('#confirm_final').removeClass('show');  // Hide the overlay
            $('#confirm_content').removeClass('show');
        }
    });
});
