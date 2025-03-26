document.addEventListener('DOMContentLoaded', () => {
    // Fetch statistics and update dashboard
    async function updateDashboard() {
        try {
            // Fetch statistics
            const statsResponse = await fetch('/stats');
            const statsData = await statsResponse.json();

            // Update total patients
            document.getElementById('totalPatients').textContent = statsData.totalPatients;

            // Disease Chart
            const diseaseCtx = document.getElementById('diseaseChart').getContext('2d');
            new Chart(diseaseCtx, {
                type: 'pie',
                data: {
                    labels: statsData.diseaseWise.map(d => d._id),
                    datasets: [{
                        data: statsData.diseaseWise.map(d => d.count),
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(153, 102, 255, 0.6)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

            // Demography Chart (Gender Distribution)
            const genderResponse = await fetch('/gender-stats');
            const genderData = await genderResponse.json();
            const demogCtx = document.getElementById('demographyChart').getContext('2d');
            new Chart(demogCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(genderData),
                    datasets: [{
                        data: Object.values(genderData),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

            // Fetch and display recent patients
            const recentResponse = await fetch('/recent-patients');
            const recentPatients = await recentResponse.json();
            const recentPatientsContainer = document.getElementById('recentPatients');
            recentPatientsContainer.innerHTML = recentPatients.map(patient => `
                <div class="bg-white p-4 rounded-lg shadow-md">
                    <h3 class="text-lg font-semibold text-green-600">${patient.name}</h3>
                    <p class="text-gray-600">Age: ${patient.age} | Gender: ${patient.gender}</p>
                    <p class="text-gray-500">Disease: ${patient.disease}</p>
                    <small class="text-gray-400">${new Date(patient.timestamp).toLocaleDateString()}</small>
                </div>
            `).join('');
        } catch (error) {
            console.error('Dashboard update failed:', error);
        }
    }

    updateDashboard();
});