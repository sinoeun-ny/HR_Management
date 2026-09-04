$(document).ready(function () {
    $("#submitSupplierBtn").click(function () {
        alert("button submit is clicked!")
        var supplierName = $("#Supplier_name").val().trim();
        var address = $("#Address").val().trim();
        var phone = $("#Phone").val().trim();
        var userid = "961e11e97c57";

        if (!supplierName || !address || !phone) {
            alert("Please fill in all fields.");
            return;
        }

        var data = JSON.stringify({
            Supplier_name: supplierName,
            Address: address,
            Phone: 12121,
            CreateId: phone
        });
        console.log(data);
        ajaxHandleRequest("Supplier", "add", data, function (response) {
            alert("Supplier added successfully!");
            
            // Optionally clear inputs:
            $("#Supplier_name").val('');
            $("#Address").val('');
            $("#Phone").val('');
            console.log(response)
            // Optionally close modal here if you want
        }, "POST");
    });
});