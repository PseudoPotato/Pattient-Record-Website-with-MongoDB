document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("form");

  form.addEventListener("submit", async (event) => {
      event.preventDefault();

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
          Swal.fire({
              icon: 'warning',
              title: 'Incomplete Form',
              text: 'Please fill in all required fields.',
              confirmButtonColor: '#4CAF50'
          });
          return;
      }

      try {
          // Send form data to the server via POST request
          const response = await fetch("/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                  name, 
                  age, 
                  gender, 
                  medicalHistory, 
                  allergies, 
                  height, 
                  weight, 
                  disease 
              }),
          });

          const data = await response.text();

          if (response.ok) {
              Swal.fire({
                  icon: 'success',
                  title: 'Success!',
                  text: data,
                  confirmButtonColor: '#4CAF50'
              });
              form.reset();
          } else {
              throw new Error(data);
          }
      } catch (error) {
          Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Failed to save patient data.',
              confirmButtonColor: '#FF5722'
          });
          console.error("Error:", error);
      }
  });
});