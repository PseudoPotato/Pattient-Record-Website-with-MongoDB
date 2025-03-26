// Get the form element by its ID
const form = document.getElementById("form");

// Add an event listener to handle form submission
form.addEventListener("submit", (event) => {
  event.preventDefault(); // Prevents page refresh

  // Retrieve input values from the form
  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;
  const gender = document.getElementById("gender").value;
  const medicalHistory = document.getElementById("medicalHistory").value;
  const allergies = document.getElementById("allergies").value || "None";
  const height = document.getElementById("height").value;
  const weight = document.getElementById("weight").value;
  const disease = document.getElementById("disease").value;

  // Validate input fields
  if (!name || !age || !gender || !medicalHistory || !height || !weight || !disease) {
    alert("⚠️ Please fill in all required fields.");
    return;
  }

  // Send form data to the server via POST request
  fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, age, gender, medicalHistory, allergies, height, weight, disease }),
  })
    .then((response) => response.text()) // Parse the response as plain text
    .then((data) => {
      alert(data); // Show success or error message
      form.reset(); // Clear the form after submission
    })
    .catch((error) => {
      console.error("⚠️ Error:", error);
      alert("⚠️ Failed to save data.");
    });
});
