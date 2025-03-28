document.addEventListener('DOMContentLoaded', () => {
    const patientsTableBody = document.getElementById('patientsTableBody');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('pagination');
    const recordsInfo = document.getElementById('recordsInfo');
    const editPatientModal = document.getElementById('editPatientModal');
    const editPatientForm = document.getElementById('editPatientForm');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noResults = document.getElementById('noResults');
    
    let currentPage = 1;
    let currentSearch = '';
    const itemsPerPage = 10;
    let totalRecords = 0;

    // Fetch patients with pagination and search
    async function fetchPatients(page = 1, search = '') {
        try {
            showLoading();
            
            // Build the query object
            const query = {};
            
            if (search) {
                // Handle gender search specifically
                if (['male', 'female', 'other'].includes(search)) {
                    query.gender = { $regex: new RegExp(`^${search}$`, 'i') };
                } else {
                    // For other searches, look in name and disease fields
                    const searchRegex = new RegExp(search, 'i');
                    query.$or = [
                        { name: searchRegex },
                        { disease: searchRegex }
                    ];
                }
            }
    
            const response = await fetch(`/all-patients?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}`);
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message || 'Failed to fetch patients');
            
            totalRecords = data.total;
            renderPatients(data.patients);
            setupPagination(data.total, page, data.pages);
            updateRecordsInfo(data.patients.length, data.total, page);
            
            if (data.patients.length === 0) {
                noResults.classList.remove('hidden');
                patientsTableBody.innerHTML = '';
            } else {
                noResults.classList.add('hidden');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Fetch Failed',
                text: error.message || 'Unable to load patient records'
            });
        } finally {
            hideLoading();
        }
    }

    // Show loading state
    function showLoading() {
        loadingIndicator.classList.remove('hidden');
  loadingIndicator.innerHTML = `
    <div class="flex flex-col items-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
      <p class="text-gray-600">Loading patient records...</p>
      <p class="text-sm text-gray-400 mt-2">Please wait</p>
    </div>
  `;
    }

    // Hide loading state
    function hideLoading() {
        loadingIndicator.classList.add('hidden');
    }

    // Render patients
    function renderPatients(patients) {
        patientsTableBody.innerHTML = patients.map(patient => `
            <tr class="hover:bg-gray-50 transition duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${patient.name}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${patient.age}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${patient.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 
                          patient.gender === 'Female' ? 'bg-pink-100 text-pink-800' : 
                          'bg-purple-100 text-purple-800'}">
                        ${patient.gender}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${patient.disease}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(patient.timestamp).toLocaleDateString()}
                    <div class="text-xs text-gray-400">${formatTimeSince(patient.timestamp)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="viewPatientDetails('${patient._id}')" 
                        class="text-blue-500 hover:text-blue-700 mr-3 transition duration-150" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editPatient('${patient._id}')" 
                        class="text-green-500 hover:text-green-700 mr-3 transition duration-150" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deletePatient('${patient._id}')" 
                        class="text-red-500 hover:text-red-700 transition duration-150" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Format time since
    function formatTimeSince(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
        
        return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
    }

    // Setup pagination
    function setupPagination(total, currentPage, totalPages) {
        const paginationDiv = document.getElementById('pagination');
        paginationContainer.innerHTML = '';
        
        // Create container for buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex space-x-2';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = `px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPatients(currentPage, currentSearch);
        }
    });
    buttonsContainer.appendChild(prevButton);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-3 py-1 rounded-md ${i === currentPage ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            fetchPatients(currentPage, currentSearch);
        });
        buttonsContainer.appendChild(pageButton);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = `px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchPatients(currentPage, currentSearch);
        }
    });
    buttonsContainer.appendChild(nextButton);

    // Add buttons to pagination div
    paginationDiv.appendChild(buttonsContainer);

    // Records info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'text-sm text-gray-600 mt-2';
    infoDiv.textContent = `Total records: ${total}`;
    paginationDiv.appendChild(infoDiv);
    }

    // Update records info
    function updateRecordsInfo(currentCount, total, page) {
        const start = ((page - 1) * itemsPerPage) + 1;
        const end = Math.min(page * itemsPerPage, total);
        recordsInfo.textContent = `Showing ${start}-${end} of ${total} records`;
    }

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    currentSearch = e.target.value.trim().toLowerCase();
    currentPage = 1;
    
    searchTimeout = setTimeout(() => {
        fetchPatients(currentPage, currentSearch);
    }, 500);
    });

    // View patient details
    window.viewPatientDetails = async (patientId) => {
        try {
            const response = await fetch(`/patient/${patientId}`);
            const patient = await response.json();
            
            Swal.fire({
                title: `<span class="text-green-600">${patient.name}'s Details</span>`,
                html: `
                    <div class="text-left space-y-2">
                        <div class="flex items-start">
                            <div class="w-32 font-medium text-gray-600">Name:</div>
                            <div>${patient.name}</div>
                        </div>
                        <div class="flex items-start">
                            <div class="w-32 font-medium text-gray-600">Age:</div>
                            <div>${patient.age}</div>
                        </div>
                        <div class="flex items-start">
                            <div class="w-32 font-medium text-gray-600">Gender:</div>
                            <div>${patient.gender}</div>
                        </div>
                        <div class="flex items-start">
                            <div class="w-32 font-medium text-gray-600">Condition:</div>
                            <div>${patient.disease}</div>
                        </div>
                        <div class="flex items-start">
                            <div class="w-32 font-medium text-gray-600">Height:</div>
                            <div>${patient.height} cm</div>
                        </div>
                        <div class="flex items-start">
                            <div class="w-32 font-medium text-gray-600">Weight:</div>
                            <div>${patient.weight} kg</div>
                        </div>
                        <div class="flex items-start">
                            <div class="w-32 font-medium text-gray-600">Medical History:</div>
                            <div class="flex-1">${patient.medicalHistory || 'Not specified'}</div>
                        </div>
                        <div class="flex items-start">
                            <div class="w-32 font-medium text-gray-600">Allergies:</div>
                            <div>${patient.allergies || 'None reported'}</div>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Close',
                confirmButtonColor: '#4CAF50',
                width: '600px'
            });
        } catch (error) {
            console.error('Failed to fetch patient details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Fetch Failed',
                text: 'Unable to fetch patient details.'
            });
        }
    };

    // Edit patient
    window.editPatient = async (patientId) => {
        try {
            const response = await fetch(`/patient/${patientId}`);
            const patient = await response.json();
            
            document.getElementById('editPatientId').value = patient._id;
            document.getElementById('editName').value = patient.name;
            document.getElementById('editAge').value = patient.age;
            document.getElementById('editGender').value = patient.gender;
            document.getElementById('editDisease').value = patient.disease;
            
            editPatientModal.classList.remove('hidden');
            editPatientModal.classList.add('flex');
        } catch (error) {
            console.error('Failed to fetch patient details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Fetch Failed',
                text: 'Unable to fetch patient details for editing.'
            });
        }
    };

    // Save edited patient
    editPatientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientId = document.getElementById('editPatientId').value;
        const saveButtonText = document.getElementById('saveButtonText');
        const saveButtonSpinner = document.getElementById('saveButtonSpinner');
        
        const updatedPatient = {
            name: document.getElementById('editName').value,
            age: document.getElementById('editAge').value,
            gender: document.getElementById('editGender').value,
            disease: document.getElementById('editDisease').value
        };

        try {
            // Show loading state on button
            saveButtonText.textContent = 'Saving...';
            saveButtonSpinner.classList.remove('hidden');
            
            const response = await fetch(`/patient/${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPatient)
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Patient Updated',
                    text: 'Patient record has been successfully updated.',
                    confirmButtonColor: '#4CAF50'
                });
                closeEditModal();
                fetchPatients(currentPage, currentSearch);
            } else {
                throw new Error('Failed to update patient');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Unable to update patient record.',
                confirmButtonColor: '#4CAF50'
            });
        } finally {
            saveButtonText.textContent = 'Save Changes';
            saveButtonSpinner.classList.add('hidden');
        }
    });

    // Delete patient
    window.deletePatient = async (patientId) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4CAF50',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });
        
        if (isConfirmed) {
            try {
                const response = await fetch(`/patient/${patientId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Patient record has been deleted.',
                        icon: 'success',
                        confirmButtonColor: '#4CAF50'
                    });
                    fetchPatients(currentPage, currentSearch);
                } else {
                    throw new Error('Failed to delete patient');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: 'Unable to delete patient record.',
                    confirmButtonColor: '#4CAF50'
                });
            }
        }
    };

    // Close edit modal
    window.closeEditModal = () => {
        editPatientModal.classList.remove('flex');
        editPatientModal.classList.add('hidden');
    };

    // Initial fetch
    fetchPatients(currentPage, currentSearch);
});