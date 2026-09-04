$(document).ready(function () {


    


    // Fetch data using AJAX
    $.ajax({
        url: '/Inventory/GetInventoryData', // Controller endpoint
        type: 'GET',
        success: function (data) {
            // Loop through the data and create table rows
            data.forEach(function (item) {
                const daysLeft = calculateDaysLeft(item.expireDate);
                $('#Product-list').append(
                    `<tr class="bg-white">
                         <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.productName}</td>
                         <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.quantity}</td>
                         <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">${daysLeft}</td>
                         <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">     
                             <button 
                                 class="openOverlayBtn w-[80px] h-[40px] rounded-[10px] bg-blue-600 text-[15px] text-white font-semibold shadow-md hover:shadow-lg" 
                                 data-name="${item.productName}" 
                                 data-quantity="${item.quantity}">
                                 Add
                             </button>
                         </td>
                       </tr>`
                );

            });
        },
        error: function (xhr, status, error) {
            console.log('Error fetching data:', error);
        }
    });




    // Function to calculate the days left until expiration
    function calculateDaysLeft(expireDate) {
        const today = new Date();
        const expiryDate = new Date(expireDate);
        const timeDiff = expiryDate - today;
        const daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
        return daysLeft <= 0 ? "Expired" : `${daysLeft} days`;
    }

    $.ajax({
        url: '/Inventory/GetStore',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            const stores = Array.isArray(data) ? data : [data];
            console.log("this is store");
            
            console.log(stores)

            $.each(stores, function (index, store) {
                const storeOption = `
                        <Option>${store.storeName}</Option>
                    `;

                $('#Store-Option').append(storeOption);
            });
        },
        error: function (xhr, status, error) {
            console.error("Error fetching store data:", error);
        }
    });

    console.log($('#openOverlayBtn'))


    

    let selectedProduct = null;

    $(document).on('click', '.openOverlayBtn', function () {
        const name = $(this).data('name');
        const quantity = $(this).data('quantity');

        selectedProduct = { name, quantity }; // store current row data

        $('#overlayProductName').text(name);
        $('#overlayAvailableQty').text(quantity);
        $('#requestedQty').val('');
        $('#overlay').removeClass('hidden');
    });

    $('#cancelBtn').click(function () {
        $('#overlay').addClass('hidden');
    });

    // Handle "Add" button
    $('#addBtn').click(function () {
        const requestedQty = parseInt($('#requestedQty').val());

        if (!requestedQty || requestedQty <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }

        const availableQty = parseInt(selectedProduct.quantity);

        if (requestedQty > availableQty) {
            alert('Requested quantity exceeds available quantity!');
            return;
        }

        // Append to new table
        $('#request-item-table').append(`
        <tr class="bg-white">
            <td class="px-6 py-4 text-sm text-gray-900">${selectedProduct.name}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${requestedQty}</td>
            <td class="px-6 py-4 text-sm text-green-600">
            <button class="openOverlayBtn w-[80px] h-[40px] rounded-[10px] bg-blue-600 text-[15px] text-white font-semibold shadow-md hover:shadow-lg">
                                 edit
            </button>

             <button class=" w-[80px] h-[40px] rounded-[10px] bg-red-600 text-[15px] text-white font-semibold shadow-md hover:shadow-lg"> 
                                 delete
            </button>

             </td>
        </tr>
    `);

        $('#overlay').addClass('hidden');
    });


});



