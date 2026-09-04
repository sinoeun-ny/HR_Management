$(document).ready(function () {
    // Function to calculate the days left until expiration
    function calculateDaysLeft(expireDate) {
        const today = new Date();
        const expiryDate = new Date(expireDate);
        const timeDiff = expiryDate - today;
        const daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
        return daysLeft <= 0 ? "Expired" : daysLeft + " days";
    }

    // Fetch inventory data
    ajaxHandleRequest(
        "Inventory",
        "GetInventoryData",
        null,
        function (data) {
            data.forEach(function (item) {
                const daysLeft = calculateDaysLeft(item.expireDate);
                $('#inventoryTableBody').append(
                    '<tr class="bg-white">' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + item.productName + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + item.categoryName + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + item.quantity + ' units</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">' + daysLeft + '</td>' +
                    '</tr>'
                );
            });
        },
        "GET"
    );

    // Fetch store data
    ajaxHandleRequest(
        "Inventory",
        "GetStore",
        null,
        function (data) {
            const stores = Array.isArray(data) ? data : [data];
            console.log("Store data:", stores);

            $.each(stores, function (index, store) {
                const storeCard =
                    '<div class="store-card w-[380px] h-[66px] bg-white rounded-lg shadow-[1px_1px_5px_1px_rgba(0,0,0,0.10)] flex justify-between items-center px-2 mb-2">' +
                    '<div>' +
                    '<h1 class="font-bold text-[18px] text-black">' + store.storeName + '</h1>' +
                    '<p class="font-regular text-[12px] text-gray-500">' + store.location + '</p>' +
                    '</div>' +
                    '<button class="rounded-full py-1 px-2.5 border border-blue-600 text-center text-sm transition-all shadow-sm hover:shadow hover:bg-blue-600 hover:text-white">' +
                    'view detail' +
                    '</button>' +
                    '</div>';

                $('#store-container').append(storeCard);
            });
        },
        "GET"
    );

    // Fetch expiration product data
    ajaxHandleRequest(
        "Inventory",
        "GetExpirationProduct",
        null,
        function (data) {
            console.log("Expiration product data:", data);
            data.forEach(function (item) {
                const daysLeft = calculateDaysLeft(item.expireDate);
                $('#inventoryTableBody').append(
                    '<tr class="bg-white">' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + item.productName + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + item.categoryName + '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + item.quantity + ' units</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">' + daysLeft + '</td>' +
                    '</tr>'
                );
            });
        },
        "GET"
    );
});