//// Sample user data
//let users = [
//    { name: "Josh Doe", role: "Cashier", status: "Active", hireDate: "2023-12-2", email: "Josh@gmail.com", store: "superam", password: "password123" },
//    { name: "Bobby", role: "Admin", status: "Active", hireDate: "2022-05-15", email: "bobby@gmail.com", store: "superam", password: "admin123" },
//    { name: "Napple", role: "Cashier", status: "Active", hireDate: "2023-01-10", email: "napple@gmail.com", store: "superam", password: "napple123" },
//    { name: "Napple", role: "Cashier", status: "Active", hireDate: "2023-01-10", email: "napple@gmail.com", store: "superam", password: "napple123" }
//];

//let currentUserName = null; // To track the user being edited

//// Toggle active state for filter buttons
//const filterButtons = document.querySelectorAll('.btn-filter');
//filterButtons.forEach(button => {
//    button.addEventListener('click', () => {
//        filterButtons.forEach(btn => btn.classList.remove('active'));
//        button.classList.add('active');
//        filterUsers(button.textContent);
//    });
//});

//// Filter users based on role
//function filterUsers(role) {
//    const userList = document.getElementById('userList');
//    userList.innerHTML = '';

//    const filteredUsers = role === "Admin" || role === "Cashier" || role === "Checker" ? users.filter(user => user.role === role) : users;

//    filteredUsers.forEach(user => {
//        const userCard = document.createElement('div');
//        userCard.className = 'user-card';
//        userCard.innerHTML = `
//                    <div class="user-info">
//                        <span class="profile-icon">👤</span>
//                        <div class="user-details">
//                            <p class="user-name">${user.name}</p>
//                            <p class="user-role">${user.role}, ${user.status}</p>
//                        </div>
//                    </div>
//                    <button class="btn btn-outline-primary" onclick="showForm('${user.name}', '${user.hireDate}', '${user.role}', '${user.email}', '${user.status}', '${user.store}', '${user.password}')">View detail</button>
//                `;
//        userList.appendChild(userCard);
//    });
//}

//// Show the form with user details
//function showForm(name, hireDate, role, email, status, store, password) {
//    currentUserName = name; // Store the name of the user being edited
//    document.getElementById('name').value = name;
//    document.getElementById('hireDate').value = hireDate;
//    document.getElementById('role').value = role;
//    document.getElementById('email').value = email;
//    document.getElementById('status').value = status;
//    document.getElementById('store').value = store;
//    document.getElementById('password').value = password;

//    document.getElementById('formContainer').style.display = 'block';
//    document.getElementById('overlay').style.display = 'block';
//}

//// Update user data
//function updateForm() {
//    const updatedUser = {
//        name: document.getElementById('name').value,
//        hireDate: document.getElementById('hireDate').value,
//        role: document.getElementById('role').value,
//        email: document.getElementById('email').value,
//        status: document.getElementById('status').value,
//        store: document.getElementById('store').value,
//        password: document.getElementById('password').value
//    };

//    // Find the user in the array and update their data
//    const userIndex = users.findIndex(user => user.name === currentUserName);
//    if (userIndex !== -1) {
//        users[userIndex] = { ...users[userIndex], ...updatedUser };
//    }

//    // Refresh the user list
//    const activeFilter = document.querySelector('.btn-filter.active').textContent;
//    filterUsers(activeFilter);

//    // Close the form
//    document.getElementById('formContainer').style.display = 'none';
//    document.getElementById('overlay').style.display = 'none';
//}

//// Delete user
//function deleteForm() {
//    if (confirm('Are you sure you want to delete this user?')) {
//        // Remove the user from the array
//        users = users.filter(user => user.name !== currentUserName);

//        // Refresh the user list
//        const activeFilter = document.querySelector('.btn-filter.active').textContent;
//        filterUsers(activeFilter);

//        // Close the form
//        document.getElementById('formContainer').style.display = 'none';
//        document.getElementById('overlay').style.display = 'none';
//    }
//}

//// Close the form when clicking the overlay
////document.getElementById('overlay').addEventListener('click', function () {
////    document.getElementById('formContainer').style.display = 'none';
////    document.getElementById('overlay').style.display = 'none';
////});

//// Initial load: show all users
//filterUsers("Admin");