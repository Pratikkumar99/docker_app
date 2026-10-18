
const form = document.getElementById("userForm");
const userList = document.getElementById("userList");
const message = document.getElementById("message");
const refreshBtn = document.getElementById("refreshBtn");

// Create user
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();

  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not create user");
    }

    message.textContent = "User created successfully!";
    form.reset();

    await loadUsers();
  } catch (error) {
    message.textContent = error.message;
  }
});

// Fetch and display all users
async function loadUsers() {
  try {
    const response = await fetch("/api/users");

    if (!response.ok) {
      throw new Error("Could not fetch users");
    }

    const users = await response.json();
    userList.replaceChildren();

    if (users.length === 0) {
      const item = document.createElement("li");
      item.textContent = "No users found.";
      userList.appendChild(item);
      return;
    }

    users.forEach((user) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      const email = document.createElement("p");

      name.textContent = user.name;
      email.textContent = user.email;

      item.append(name, email);
      userList.appendChild(item);
    });
  } catch (error) {
    message.textContent = error.message;
  }
}

refreshBtn.addEventListener("click", loadUsers);

// Load existing users on page open
loadUsers();
