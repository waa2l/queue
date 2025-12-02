// Doctors Management JavaScript
class DoctorsManager {
    constructor() {
        this.doctors = [];
        this.filteredDoctors = [];
        this.editingDoctorId = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadDoctors();
    }

    setupEventListeners() {
        // Add Doctor Button
        document.getElementById('addDoctorBtn').addEventListener('click', () => {
            this.showDoctorModal();
        });

        // Modal Controls
        document.getElementById('cancelDoctor').addEventListener('click', () => {
            this.hideDoctorModal();
        });

        document.getElementById('doctorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDoctor();
        });

        // Filter Controls
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.applyFilters();
        });

        document.getElementById('specialtyFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Details Modal
        document.getElementById('closeDetails').addEventListener('click', () => {
            this.hideDetailsModal();
        });
    }

    async loadDoctors() {
        try {
            const doctorsSnapshot = await collections.doctors.get();
            this.doctors = doctorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.filteredDoctors = [...this.doctors];
            this.renderDoctors();
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    renderDoctors() {
        const grid = document.getElementById('doctorsGrid');
        const noResults = document.getElementById('noResults');
        
        if (this.filteredDoctors.length === 0) {
            grid.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }
        
        noResults.classList.add('hidden');
        
        grid.innerHTML = this.filteredDoctors.map(doctor => `
            <div class="doctor-card bg-white rounded-lg shadow-md p-6 border-r-4 ${doctor.active ? 'border-green-500' : 'border-gray-400'}">
                <div class="text-center mb-4">
                    <img src="${doctor.imageUrl || 'https://via.placeholder.com/100'}" 
                         alt="${doctor.name}" 
                         class="w-20 h-20 rounded-full mx-auto mb-3 object-cover">
                    <h3 class="text-lg font-bold text-gray-800">${doctor.name}</h3>
                    <p class="text-sm text-gray-600">${doctor.specialty}</p>
                </div>
                
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-phone text-blue-600 ml-2"></i>
                        ${doctor.phone}
                    </div>
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-calendar text-green-600 ml-2"></i>
                        ${doctor.workDays || 'غير محدد'}
                    </div>
                    <div class="flex items-center text-sm">
                        <i class="fas fa-toggle-on ${doctor.active ? 'text-green-600' : 'text-gray-400'} ml-2"></i>
                        <span class="${doctor.active ? 'text-green-600' : 'text-gray-400'}">${doctor.active ? 'نشط' : 'غير نشط'}</span>
                    </div>
                </div>
                
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="doctorsManager.viewDoctorDetails('${doctor.id}')" 
                            class="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 text-sm">
                        <i class="fas fa-eye ml-1"></i>عرض
                    </button>
                    <button onclick="doctorsManager.editDoctor('${doctor.id}')" 
                            class="flex-1 bg-yellow-600 text-white py-2 px-3 rounded-lg hover:bg-yellow-700 text-sm">
                        <i class="fas fa-edit ml-1"></i>تعديل
                    </button>
                    <button onclick="doctorsManager.deleteDoctor('${doctor.id}')" 
                            class="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 text-sm">
                        <i class="fas fa-trash ml-1"></i>حذف
                    </button>
                </div>
            </div>
        `).join('');
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const specialtyFilter = document.getElementById('specialtyFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        this.filteredDoctors = this.doctors.filter(doctor => {
            const matchesSearch = !searchTerm || 
                doctor.name.toLowerCase().includes(searchTerm) ||
                doctor.specialty.toLowerCase().includes(searchTerm) ||
                doctor.phone.includes(searchTerm);
            
            const matchesSpecialty = !specialtyFilter || doctor.specialty === specialtyFilter;
            
            const matchesStatus = !statusFilter || 
                (statusFilter === 'active' && doctor.active) ||
                (statusFilter === 'inactive' && !doctor.active);
            
            return matchesSearch && matchesSpecialty && matchesStatus;
        });
        
        this.renderDoctors();
    }

    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('specialtyFilter').value = '';
        document.getElementById('statusFilter').value = '';
        
        this.filteredDoctors = [...this.doctors];
        this.renderDoctors();
    }

    showDoctorModal(doctorId = null) {
        this.editingDoctorId = doctorId;
        const modal = document.getElementById('doctorModal');
        
        if (doctorId) {
            this.loadDoctorData(doctorId);
        } else {
            this.clearForm();
        }
        
        modal.classList.add('show');
    }

    hideDoctorModal() {
        document.getElementById('doctorModal').classList.remove('show');
        this.editingDoctorId = null;
        this.clearForm();
    }

    clearForm() {
        document.getElementById('doctorForm').reset();
        document.querySelectorAll('.work-day').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.getElementById('doctorActive').checked = true;
    }

    async loadDoctorData(doctorId) {
        try {
            const doctorDoc = await collections.doctors.doc(doctorId).get();
            if (doctorDoc.exists) {
                const doctor = doctorDoc.data();
                
                document.getElementById('doctorName').value = doctor.name || '';
                document.getElementById('doctorSpecialty').value = doctor.specialty || '';
                document.getElementById('doctorPhone').value = doctor.phone || '';
                document.getElementById('doctorEmail').value = doctor.email || '';
                document.getElementById('doctorImage').value = doctor.imageUrl || '';
                document.getElementById('doctorNotes').value = doctor.notes || '';
                document.getElementById('doctorActive').checked = doctor.active !== false;
                
                // Set work days
                if (doctor.workDays) {
                    const days = doctor.workDays.split(', ');
                    document.querySelectorAll('.work-day').forEach(checkbox => {
                        checkbox.checked = days.includes(checkbox.value);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading doctor data:', error);
        }
    }

    async saveDoctor() {
        const formData = {
            name: document.getElementById('doctorName').value,
            specialty: document.getElementById('doctorSpecialty').value,
            phone: document.getElementById('doctorPhone').value,
            email: document.getElementById('doctorEmail').value,
            imageUrl: document.getElementById('doctorImage').value,
            notes: document.getElementById('doctorNotes').value,
            active: document.getElementById('doctorActive').checked,
            workDays: this.getSelectedWorkDays(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Validate required fields
        if (!formData.name || !formData.specialty || !formData.phone) {
            this.showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        try {
            if (this.editingDoctorId) {
                await collections.doctors.doc(this.editingDoctorId).update(formData);
                this.showNotification('تم تحديث بيانات الطبيب', 'success');
            } else {
                formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await collections.doctors.add(formData);
                this.showNotification('تم إضافة الطبيب بنجاح', 'success');
            }
            
            this.hideDoctorModal();
            await this.loadDoctors();
            
        } catch (error) {
            console.error('Error saving doctor:', error);
            this.showNotification('خطأ في حفظ بيانات الطبيب', 'error');
        }
    }

    getSelectedWorkDays() {
        const selectedDays = [];
        document.querySelectorAll('.work-day:checked').forEach(checkbox => {
            selectedDays.push(checkbox.value);
        });
        return selectedDays.join(', ');
    }

    async deleteDoctor(doctorId) {
        if (confirm('هل أنت متأكد من حذف هذا الطبيب؟')) {
            try {
                await collections.doctors.doc(doctorId).delete();
                this.showNotification('تم حذف الطبيب', 'success');
                await this.loadDoctors();
            } catch (error) {
                console.error('Error deleting doctor:', error);
                this.showNotification('خطأ في حذف الطبيب', 'error');
            }
        }
    }

    editDoctor(doctorId) {
        this.showDoctorModal(doctorId);
    }

    async viewDoctorDetails(doctorId) {
        try {
            const doctorDoc = await collections.doctors.doc(doctorId).get();
            if (doctorDoc.exists) {
                const doctor = doctorDoc.data();
                
                // Populate details modal
                document.getElementById('detailDoctorImage').src = doctor.imageUrl || 'https://via.placeholder.com/100';
                document.getElementById('detailDoctorName').textContent = doctor.name;
                document.getElementById('detailDoctorSpecialty').textContent = doctor.specialty;
                document.getElementById('detailDoctorPhone').textContent = doctor.phone;
                document.getElementById('detailDoctorEmail').textContent = doctor.email || 'غير محدد';
                document.getElementById('detailDoctorWorkDays').textContent = doctor.workDays || 'غير محدد';
                document.getElementById('detailDoctorNotes').textContent = doctor.notes || 'لا توجد ملاحظات';
                document.getElementById('detailDoctorStatus').textContent = doctor.active ? 'نشط' : 'غير نشط';
                
                // Show modal
                document.getElementById('detailsModal').classList.add('show');
            }
        } catch (error) {
            console.error('Error loading doctor details:', error);
        }
    }

    hideDetailsModal() {
        document.getElementById('detailsModal').classList.remove('show');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize doctors manager
const doctorsManager = new DoctorsManager();