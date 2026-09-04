
window.ajaxHandleRequest = function (controller, action, param_values, onSuccess, method) {
    var myDefer = $.Deferred();
    var hasCallBack = false;

    if (!method) {
        method = "POST";
    }
    if (typeof onSuccess == 'function') hasCallBack = true;

    // Check if param_values is a FormData object
    if (param_values instanceof FormData) {
        // Handle file upload
        $.ajax({
            type: method,
            url: ['/', controller, '/', action].join(''),
            data: param_values,
            processData: false, // Prevent jQuery from processing the data
            contentType: false, // Prevent jQuery from setting a Content-Type
            success: function (response) {
                if (hasCallBack) {
                    onSuccess(response);
                } else {
                    myDefer.resolve(response);
                }
            },
            error: function (request, status, err) {
                window.location.href = "/Login/Index";
                return;
            }
        });
    } else {
        // Handle standard JSON request
        if (method == "POST") {
            $.ajax({
                type: method,
                url: ['/', controller, '/', action].join(''),
                data: param_values,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (hasCallBack) {
                        onSuccess(response);
                    } else {
                        myDefer.resolve(response);
                    }
                },
                error: function (request, status, err) {
                    window.location.href = "/Login/Index";
                    return;
                }
            });
        } else {
            $.ajax({
                type: method,
                url: ['/', controller, '/', action, '?', param_values].join(''),
                data: param_values,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (response) {
                    if (hasCallBack) {
                        onSuccess(response);
                    } else {
                        myDefer.resolve(response);
                    }
                },
                error: function (request, status, err) {
                    window.location.href = "/Login/Index";
                    return;
                }
            });
        }
    }

    return myDefer.promise();
}
$.ajax({
    url: '/YourController/SearchDepartment',
    type: 'POST',
    data: { query: searchTerm },
    success: function (response) {
        $('#searchResults').html(response.success ? response.data : 'No results found.');
    },
    error: function () {
        alert('Search failed. Try again.');
    }
});
//HOW TO USE This FUNCTION in another file:
//just call the name of this function in your file everything work!

//  HOW TO USE ajaxHandleRequest FUNCTION

//  CALLBACK METHOD EXAMPLES:

// POST request with data and callback
//ajaxHandleRequest("Controller_name", "Action_name", JSON.stringify({ key: value, key: value }), function (response) {
//    console.log("Request success:", response);
//});

// File upload using FormData with callback(POST)
//let formData = new FormData();
//formData.append("image", document.getElementById("fileInput").files[0]);

//ajaxHandleRequest("Upload", "Image", formData, function (res) {
//    alert("Image uploaded successfully");
//});


// PROMISE METHOD EXAMPLES:

// GET request with promise
//ajaxHandleRequest("User", "GetAll", "", null, "GET").then(function (data) {
//    console.log("All users:", data);
//});


// POST request using promise
//ajaxHandleRequest("Product", "Create", JSON.stringify({ name: "Mouse", price: 20 }), null, "POST")
//    .then(function (res) {
//        console.log("Product created:", res);
//    });

// GET request with query params (as string)
//ajaxHandleRequest("Order", "Details", "id=5", null, "GET").then(function (order) {
//    console.log("Order info:", order);
//});
//url might look like : /User/Details?id=5

