// Consultation and Booking JavaScript
class ConsultationManager {
    constructor() {
        this.selectedTimeSlot = null;
        this.selectedClinic = null;
        this.selectedDoctor = null;
        this.selectedDate = null;
        this.selectedShift = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadConsultationTypes();
        this.loadClinics();
        this.setupDateRestrictions();
        this.generateTimeSlots();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitBooking();
        });

        // Clinic selection
        document.getElementById('clinicSelect').addEventListener('change', (e) => {
            this.selectedClinic = e.target.value;
            this.loadDoctorsForClinic();
        });

        // Doctor selection
        document.getElementById('doctorSelect').addEventListener('change', (e) => {
            this.selectedDoctor = e.target.value;
        });

        // Date selection
        document.getElementById('appointmentDate').addEventListener('change', (e) => {
            this.selectedDate = e.target.value;
            this.updateTimeSlots();
        });

        // Shift selection
        document.querySelectorAll('input[name="shift"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.selectedShift = e.target.value;
                this.updateTimeSlots();
            });
        });

        // My Appointments button
        document.getElementById('myAppointmentsBtn').addEventListener('click', () => {
            this.showMyAppointments();
        });

        // Modal controls
        document.getElementById('closeAppointments').addEventListener('click', () => {
            this.hideAppointmentsModal();
        });

        document.getElementById('closeSuccess').addEventListener('click', () => {
            this.hideSuccessModal();
        });
    }

    loadConsultationTypes() {
        const consultationTypes = [
            {
                title: 'استشارة أولية',
                description: 'فحص أولي وتشخيص حالة المريض',
                icon: 'fas fa-stethoscope',
                color: 'bg-blue-100 text-blue-600'
            },
            {
                title: 'متابعة',
                description: 'متابعة حالة سابقة أو علاج مستمر',
                icon: 'fas fa-notes-medical',
                color: 'bg-green-100 text-green-600'
            },
            {
                title: 'فحص دوري',
                description: 'فحص دوري ووقائي',
                icon: 'fas fa-heartbeat',
                color: 'bg-purple-100 text-purple-600'
            },
            {
                title: 'طوارئ',
                description: 'حالات طارئة تحتاج لعناية فورية',
                icon: 'fas fa-exclamation-triangle',
                color: 'bg-red-100 text-red-600'
            },
            {
                title: 'استشارة أونلاين',
                description: 'استشارة عن بعد عبر الفيديو',
                icon: 'fas fa-video',
                color: 'bg-indigo-100 text-indigo-600'
            },
            {
                title: 'تحاليل وأشعة',
                description: 'طلب تحاليل أو أشعة تشخيصية',
                icon: 'fas fa-microscope',
                color: 'bg-yellow-100 text-yellow-600'
            }
        ];

        const container = document.getElementById('consultationTypes');
        container.innerHTML = consultationTypes.map(type => `
            <div class="consultation-card ${type.color} p-6 rounded-lg cursor-pointer" onclick="consultationManager.selectConsultationType('${type.title}')">
                <div class="text-center">
                    <i class="${type.icon} text-4xl mb-4"></i>
                    <h3 class="text-lg font-bold mb-2">${type.title}</h3>
                    <p class="text-sm">${type.description}</p>
                </div>
            </div>
        `).join('');
    }

    selectConsultationType(type) {
        // Highlight selected consultation type
        document.querySelectorAll('.consultation-card').forEach(card => {
            card.classList.remove('ring-4', 'ring-blue-300');
        });
        event.currentTarget.classList.add('ring-4', 'ring-blue-300');
        
        // Scroll to booking form
        document.getElementById('bookingForm').scrollIntoView({ behavior: 'smooth' });
        
        // Pre-fill visit reason
        document.getElementById('visitReason').value = type;
    }

    async loadClinics() {
        try {
            const clinicsSnapshot = await collections.clinics.get();
            const clinicSelect = document.getElementById('clinicSelect');
            
            clinicSelect.innerHTML = '<option value="">-- اختر العيادة --</option>';
            
            clinicsSnapshot.docs.forEach(doc => {
                const clinic = doc.data();
                if (clinic.active) {
                    const option = document.createElement('option');
                    option.value = clinic.number;
                    option.textContent = clinic.name;
                    clinicSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    async loadDoctorsForClinic() {
        if (!this.selectedClinic) return;

        try {
            const doctorsSnapshot = await collections.doctors
                .where('active', '==', true)
                .get();
            
            const doctorSelect = document.getElementById('doctorSelect');
            doctorSelect.innerHTML = '<option value="">-- اختر الطبيب --</option>';
            
            doctorsSnapshot.docs.forEach(doc => {
                const doctor = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${doctor.name} - ${doctor.specialty}`;
                doctorSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    setupDateRestrictions() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateInput = document.getElementById('appointmentDate');
        dateInput.min = tomorrow.toISOString().split('T')[0];
        
        // Set default to tomorrow
        dateInput.value = tomorrow.toISOString().split('T')[0];
        this.selectedDate = dateInput.value;
    }

    generateTimeSlots() {
        const timeSlotsContainer = document.getElementById('timeSlots');
        const slots = [];
        
        // Generate 30-minute slots from 8:00 to 20:00
        for (let hour = 8; hour < 20; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        
        timeSlotsContainer.innerHTML = slots.map((time, index) => `
            <div class="time-slot bg-gray-100 p-2 rounded text-center text-sm" 
                 data-time="${time}" onclick="consultationManager.selectTimeSlot('${time}')">
                ${this.formatTime(time)}
            </div>
        `).join('');
    }

    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour12 = hours > 12 ? hours - 12 : hours;
        const period = hours >= 12 ? 'م' : 'ص';
        return `${hour12}:${minutes} ${period}`;
    }

    selectTimeSlot(time) {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Select new time slot
        const slotElement = document.querySelector(`[data-time="${time}"]`);
        if (slotElement && !slotElement.classList.contains('booked')) {
            slotElement.classList.add('selected');
            this.selectedTimeSlot = time;
        }
    }

    updateTimeSlots() {
        if (!this.selectedDate || !this.selectedShift) return;
        
        // Reset time slots
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('booked');
            slot.onclick = () => this.selectTimeSlot(slot.dataset.time);
        });
        
        // Load booked slots for this date and shift
        this.loadBookedSlots();
    }

    async loadBookedSlots() {
        if (!this.selectedDate || !this.selectedShift) return;

        try {
            const bookedSlotsSnapshot = await collections.appointments
                .where('date', '==', this.selectedDate)
                .where('shift', '==', this.selectedShift)
                .where('status', 'in', ['pending', 'confirmed'])
                .get();
            
            bookedSlotsSnapshot.docs.forEach(doc => {
                const appointment = doc.data();
                const slotElement = document.querySelector(`[data-time="${appointment.time}"]`);
                if (slotElement) {
                    slotElement.classList.add('booked');
                    slotElement.onclick = null;
                }
            });
        } catch (error) {
            console.error('Error loading booked slots:', error);
        }
    }

    async submitBooking() {
        // Validate all required fields
        if (!this.validateForm()) {
            return;
        }

        const bookingData = {
            patientName: document.getElementById('patientName').value,
            nationalId: document.getElementById('nationalId').value,
            phone: document.getElementById('patientPhone').value,
            email: document.getElementById('patientEmail').value,
            clinicNumber: parseInt(this.selectedClinic),
            doctorId: this.selectedDoctor || null,
            date: this.selectedDate,
            time: this.selectedTimeSlot,
            shift: this.selectedShift,
            visitReason: document.getElementById('visitReason').value,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Check if appointment already exists
            const existingAppointment = await collections.appointments
                .where('nationalId', '==', bookingData.nationalId)
                .where('date', '==', bookingData.date)
                .where('status', 'in', ['pending', 'confirmed'])
                .get();
            
            if (!existingAppointment.empty) {
                this.showNotification('لديك موعد محجوز مسبقاً في هذا اليوم', 'error');
                return;
            }

            // Add appointment
            const docRef = await collections.appointments.add(bookingData);
            
            // Show success modal
            this.showSuccessModal(bookingData, docRef.id);
            
            // Reset form
            this.resetForm();
            
        } catch (error) {
            console.error('Error submitting booking:', error);
            this.showNotification('خطأ في حجز الموعد', 'error');
        }
    }

    validateForm() {
        const requiredFields = [
            'patientName',
            'nationalId',
            'patientPhone',
            'clinicSelect',
            'appointmentDate'
        ];

        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            } else {
                field.classList.remove('border-red-500');
            }
        });

        if (!this.selectedTimeSlot) {
            this.showNotification('الرجاء اختيار وقت الموعد', 'error');
            isValid = false;
        }

        if (!this.selectedShift) {
            this.showNotification('الرجاء اختيار الشيفت', 'error');
            isValid = false;
        }

        return isValid;
    }

    showSuccessModal(bookingData, appointmentId) {
        const modal = document.getElementById('successModal');
        const details = document.getElementById('bookingDetails');
        
        // Format appointment details
        const appointmentDate = new Date(bookingData.date).toLocaleDateString('ar-EG');
        const appointmentTime = this.formatTime(bookingData.time);
        
        details.innerHTML = `
            <div class="bg-gray-50 p-4 rounded-lg text-right">
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>رقم الموعد:</strong> ${appointmentId.substring(0, 8)}</div>
                    <div><strong>التاريخ:</strong> ${appointmentDate}</div>
                    <div><strong>الوقت:</strong> ${appointmentTime}</div>
                    <div><strong>الشيفت:</strong> ${bookingData.shift === 'morning' ? 'صباحي' : 'مسائي'}</div>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    }

    hideSuccessModal() {
        document.getElementById('successModal').classList.remove('show');
    }

    resetForm() {
        document.getElementById('bookingForm').reset();
        this.selectedTimeSlot = null;
        this.selectedClinic = null;
        this.selectedDoctor = null;
        this.selectedShift = null;
        
        // Reset time slots
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Reset date to tomorrow
        this.setupDateRestrictions();
    }

    async showMyAppointments() {
        const nationalId = prompt('الرجاء إدخال الرقم القومي للبحث عن مواعيدك:');
        
        if (!nationalId) return;

        try {
            const appointmentsSnapshot = await collections.appointments
                .where('nationalId', '==', nationalId)
                .orderBy('date', 'desc')
                .limit(10)
                .get();
            
            const appointmentsList = document.getElementById('appointmentsList');
            
            if (appointmentsSnapshot.empty) {
                appointmentsList.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-600">لا توجد مواعيد محجوزة</p>
                    </div>
                `;
            } else {
                appointmentsList.innerHTML = appointmentsSnapshot.docs.map(doc => {
                    const appointment = doc.data();
                    const appointmentDate = new Date(appointment.date).toLocaleDateString('ar-EG');
                    const appointmentTime = this.formatTime(appointment.time);
                    
                    return `
                        <div class="bg-gray-50 p-4 rounded-lg border">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-gray-800">${appointment.patientName}</h4>
                                    <p class="text-sm text-gray-600">التاريخ: ${appointmentDate}</p>
                                    <p class="text-sm text-gray-600">الوقت: ${appointmentTime}</p>
                                    <p class="text-sm text-gray-600">الشيفت: ${appointment.shift === 'morning' ? 'صباحي' : 'مسائي'}</p>
                                </div>
                                <div class="text-left">
                                    <span class="px-3 py-1 rounded-full text-xs ${
                                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }">
                                        ${appointment.status === 'confirmed' ? 'مؤكد' :
                                          appointment.status === 'pending' ? 'قيد الانتظار' :
                                          'ملغي'}
                                    </span>
                                    <div class="mt-2">
                                        <button onclick="consultationManager.cancelAppointment('${doc.id}')" 
                                                class="text-red-600 hover:text-red-800 text-sm">
                                            <i class="fas fa-times ml-1"></i>إلغاء
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            document.getElementById('appointmentsModal').classList.add('show');
            
        } catch (error) {
            console.error('Error loading appointments:', error);
            this.showNotification('خطأ في تحميل المواعيد', 'error');
        }
    }

    hideAppointmentsModal() {
        document.getElementById('appointmentsModal').classList.remove('show');
    }

    async cancelAppointment(appointmentId) {
        if (!confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;

        try {
            await collections.appointments.doc(appointmentId).update({
                status: 'cancelled',
                cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showNotification('تم إلغاء الموعد', 'success');
            this.hideAppointmentsModal();
            
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            this.showNotification('خطأ في إلغاء الموعد', 'error');
        }
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

// Initialize consultation manager
const consultationManager = new ConsultationManager();