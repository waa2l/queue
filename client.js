// Client Page JavaScript
class ClientManager {
    constructor() {
        this.selectedClinic = null;
        this.yourNumber = null;
        this.currentNumber = 0;
        this.clinicListener = null;
        this.callListener = null;
        this.notificationSettings = {
            email: null,
            phone: null
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.loadClinics();
        this.loadNotificationSettings();
        
        // Update time every second
        setInterval(() => this.updateDateTime(), 1000);
    }

    setupEventListeners() {
        // Set Your Number button
        document.getElementById('setYourNumber').addEventListener('click', () => {
            this.showNumberModal();
        });

        // Number Modal
        document.getElementById('cancelSetNumber').addEventListener('click', () => {
            this.hideNumberModal();
        });

        document.getElementById('confirmSetNumber').addEventListener('click', () => {
            this.setYourNumber();
        });

        document.getElementById('modalYourNumber').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setYourNumber();
            }
        });

        // Notification Settings
        document.getElementById('saveNotificationSettings').addEventListener('click', () => {
            this.saveNotificationSettings();
        });

        // Complaint Form
        document.getElementById('complaintForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComplaint();
        });

        // Character counter
        document.getElementById('complaintText').addEventListener('input', (e) => {
            const length = e.target.value.length;
            document.getElementById('charCount').textContent = length;
        });

        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-EG');
        const dateString = now.toLocaleDateString('ar-EG');
        
        document.getElementById('currentTime').textContent = timeString;
        document.getElementById('currentDate').textContent = dateString;
    }

    async loadClinics() {
        try {
            const clinicsSnapshot = await collections.clinics.get();
            const clinicsList = document.getElementById('clinicsList');
            
            clinicsList.innerHTML = clinicsSnapshot.docs.map(doc => {
                const clinic = doc.data();
                return `
                    <div class="clinic-card bg-gray-50 p-4 rounded-lg border cursor-pointer hover:bg-blue-50 transition duration-300" 
                         onclick="clientManager.selectClinic('${doc.id}', ${clinic.number}, '${clinic.name}')">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-semibold text-gray-800">${clinic.name}</h4>
                            <div class="w-3 h-3 rounded-full ${clinic.active ? 'bg-green-500' : 'bg-gray-400'}"></div>
                        </div>
                        <div class="text-sm text-gray-600">
                            <div>رقم العيادة: ${toArabicNumber(clinic.number)}</div>
                            <div>الحالة: ${clinic.active ? 'نشطة' : 'متوقفة'}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    selectClinic(clinicId, clinicNumber, clinicName) {
        this.selectedClinic = {
            id: clinicId,
            number: clinicNumber,
            name: clinicName
        };

        // Update UI
        document.getElementById('selectedClinicName').textContent = clinicName;
        document.getElementById('queueSection').style.display = 'block';
        document.getElementById('notificationSection').style.display = 'block';

        // Setup real-time listener
        this.setupClinicListener();
        
        // Load current number
        this.loadCurrentNumber();
        
        // Setup call listener
        this.setupCallListener();
    }

    async loadCurrentNumber() {
        if (!this.selectedClinic) return;

        try {
            const snapshot = await realtimeRefs.clinicStatus
                .child(this.selectedClinic.number)
                .once('value');
            
            const clinicData = snapshot.val();
            if (clinicData) {
                this.currentNumber = clinicData.current || 0;
                this.updateQueueDisplay();
            }
        } catch (error) {
            console.error('Error loading current number:', error);
        }
    }

    setupClinicListener() {
        if (!this.selectedClinic || this.clinicListener) return;

        this.clinicListener = realtimeRefs.clinicStatus
            .child(this.selectedClinic.number)
            .on('value', (snapshot) => {
                const clinicData = snapshot.val();
                if (clinicData) {
                    this.currentNumber = clinicData.current || 0;
                    this.updateQueueDisplay();
                    
                    // Check if it's your turn
                    if (this.yourNumber && this.currentNumber === this.yourNumber) {
                        this.showYourTurnNotification();
                    }
                }
            });
    }

    setupCallListener() {
        if (!this.selectedClinic || this.callListener) return;

        this.callListener = realtimeRefs.currentCalls
            .orderByChild('clinicNumber')
            .equalTo(this.selectedClinic.number)
            .on('child_added', (snapshot) => {
                const call = snapshot.val();
                if (call.clientNumber === this.yourNumber) {
                    this.showYourTurnNotification();
                }
            });
    }

    updateQueueDisplay() {
        document.getElementById('currentNumber').textContent = toArabicNumber(this.currentNumber);
        
        if (this.yourNumber) {
            const waitingCount = Math.max(0, this.yourNumber - this.currentNumber - 1);
            document.getElementById('waitingCount').textContent = toArabicNumber(waitingCount);
            
            // Update progress
            const progress = this.yourNumber > 0 ? Math.min(100, (this.currentNumber / this.yourNumber) * 100) : 0;
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('progressText').textContent = toArabicNumber(Math.round(progress)) + '٪';
            
            // Update estimated time (assuming 3 minutes per client)
            const estimatedMinutes = Math.max(0, waitingCount * 3);
            document.getElementById('estimatedMinutes').textContent = toArabicNumber(estimatedMinutes);
        }
    }

    showNumberModal() {
        document.getElementById('numberModal').classList.remove('hidden');
        document.getElementById('numberModal').classList.add('flex');
        document.getElementById('modalYourNumber').focus();
    }

    hideNumberModal() {
        document.getElementById('numberModal').classList.add('hidden');
        document.getElementById('numberModal').classList.remove('flex');
        document.getElementById('modalYourNumber').value = '';
    }

    setYourNumber() {
        const number = parseInt(document.getElementById('modalYourNumber').value);
        
        if (!number || number <= 0) {
            this.showNotification('الرجاء إدخال رقم صحيح', 'error');
            return;
        }

        this.yourNumber = number;
        document.getElementById('yourNumber').textContent = toArabicNumber(number);
        document.getElementById('setYourNumber').innerHTML = '<i class="fas fa-edit ml-2"></i>تعديل الرقم';
        
        this.hideNumberModal();
        this.updateQueueDisplay();
        
        this.showNotification('تم تعيين رقمك بنجاح', 'success');
    }

    showYourTurnNotification() {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('دورك قد حان!', {
                body: `العميل رقم ${toArabicNumber(this.yourNumber)}، يرجى التوجه إلى ${this.selectedClinic.name}`,
                icon: '/favicon.ico'
            });
        }

        // Show in-page notification
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notificationText.textContent = `دورك قد حان! يرجى التوجه إلى ${this.selectedClinic.name}`;
        notification.classList.remove('hidden');
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 10000);

        // Vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
    }

    async saveNotificationSettings() {
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        
        this.notificationSettings = { email, phone };
        
        // Save to localStorage
        localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
        
        this.showNotification('تم حفظ إعدادات التنبيهات', 'success');
    }

    loadNotificationSettings() {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            this.notificationSettings = JSON.parse(saved);
            document.getElementById('email').value = this.notificationSettings.email || '';
            document.getElementById('phone').value = this.notificationSettings.phone || '';
        }
    }

    async submitComplaint() {
        const name = document.getElementById('complainantName').value;
        const type = document.getElementById('complaintType').value;
        const text = document.getElementById('complaintText').value;
        const additionalNotes = document.getElementById('additionalNotes').value;
        
        if (!type || !text) {
            this.showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        if (text.length > 140) {
            this.showNotification('النص يجب ألا يتجاوز 140 حرف', 'error');
            return;
        }

        try {
            await collections.complaints.add({
                name: name || 'Anonymous',
                type: type,
                text: text,
                additionalNotes: additionalNotes,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getClientIP()
            });
            
            // Reset form
            document.getElementById('complaintForm').reset();
            document.getElementById('charCount').textContent = '0';
            
            this.showNotification('تم إرسال شكواك/اقتراحك بنجاح', 'success');
            
        } catch (error) {
            console.error('Error submitting complaint:', error);
            this.showNotification('خطأ في إرسال الشكوى', 'error');
        }
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error getting IP:', error);
            return 'Unknown';
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

    // Cleanup listeners when page unloads
    cleanup() {
        if (this.clinicListener) {
            realtimeRefs.clinicStatus.child(this.selectedClinic.number).off('value', this.clinicListener);
        }
        if (this.callListener) {
            realtimeRefs.currentCalls.orderByChild('clinicNumber').equalTo(this.selectedClinic.number).off('child_added', this.callListener);
        }
    }
}

// Initialize client manager
const clientManager = new ClientManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clientManager.cleanup();
});