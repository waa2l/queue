// Control Panel JavaScript
class ControlPanel {
    constructor() {
        this.currentClinic = null;
        this.currentNumber = 0;
        this.clinicStatus = 'active';
        this.startTime = Date.now();
        this.totalClients = 0;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadClinics();
        this.updateDateTime();
        
        // Update time every second
        setInterval(() => this.updateDateTime(), 1000);
        
        // Update statistics every minute
        setInterval(() => this.updateStatistics(), 60000);
    }

    setupEventListeners() {
        // Login form
        document.getElementById('controlLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Control buttons
        document.getElementById('nextClient').addEventListener('click', () => {
            this.nextClient();
        });

        document.getElementById('prevClient').addEventListener('click', () => {
            this.previousClient();
        });

        document.getElementById('repeatCall').addEventListener('click', () => {
            this.repeatCall();
        });

        document.getElementById('callSpecific').addEventListener('click', () => {
            this.showCallSpecificModal();
        });

        document.getElementById('callByName').addEventListener('click', () => {
            this.showCallByNameModal();
        });

        document.getElementById('transferClient').addEventListener('click', () => {
            this.showTransferModal();
        });

        document.getElementById('pauseClinic').addEventListener('click', () => {
            this.pauseClinic();
        });

        document.getElementById('resumeClinic').addEventListener('click', () => {
            this.resumeClinic();
        });

        document.getElementById('resetClinic').addEventListener('click', () => {
            this.resetClinic();
        });

        document.getElementById('emergencyAlert').addEventListener('click', () => {
            this.emergencyAlert();
        });

        document.getElementById('notifyDoctor').addEventListener('click', () => {
            this.notifyDoctor();
        });

        document.getElementById('skipQueue').addEventListener('click', () => {
            this.skipQueue();
        });

        // Modal controls
        this.setupModalListeners();
    }

    setupModalListeners() {
        // Call Specific Modal
        document.getElementById('cancelCallSpecific').addEventListener('click', () => {
            this.hideCallSpecificModal();
        });

        document.getElementById('confirmCallSpecific').addEventListener('click', () => {
            this.callSpecificNumber();
        });

        // Call By Name Modal
        document.getElementById('cancelCallByName').addEventListener('click', () => {
            this.hideCallByNameModal();
        });

        document.getElementById('confirmCallByName').addEventListener('click', () => {
            this.callByName();
        });

        // Transfer Modal
        document.getElementById('cancelTransfer').addEventListener('click', () => {
            this.hideTransferModal();
        });

        document.getElementById('confirmTransfer').addEventListener('click', () => {
            this.transferClient();
        });
    }

    async loadClinics() {
        try {
            const clinicsSnapshot = await collections.clinics.get();
            const clinicSelect = document.getElementById('clinicSelect');
            const targetClinicSelect = document.getElementById('targetClinic');
            
            clinicSelect.innerHTML = '<option value="">-- اختر العيادة --</option>';
            targetClinicSelect.innerHTML = '<option value="">اختر العيادة المستهدفة</option>';
            
            clinicsSnapshot.docs.forEach(doc => {
                const clinic = doc.data();
                const option = document.createElement('option');
                option.value = clinic.number;
                option.textContent = clinic.name;
                
                clinicSelect.appendChild(option);
                
                const targetOption = option.cloneNode(true);
                targetClinicSelect.appendChild(targetOption);
            });
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-EG');
        const dateString = now.toLocaleDateString('ar-EG');
        
        const timeElement = document.getElementById('currentTime');
        const dateElement = document.getElementById('currentDate');
        
        if (timeElement) timeElement.textContent = timeString;
        if (dateElement) dateElement.textContent = dateString;
    }

    async login() {
        const clinicNumber = parseInt(document.getElementById('clinicSelect').value);
        const password = document.getElementById('clinicPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!clinicNumber || !password) {
            errorDiv.textContent = 'الرجاء اختيار العيادة وإدخال كلمة السر';
            errorDiv.classList.remove('hidden');
            return;
        }

        try {
            // Verify clinic credentials
            const clinicDoc = await collections.clinics.where('number', '==', clinicNumber).get();
            
            if (clinicDoc.empty) {
                errorDiv.textContent = 'العيادة غير موجودة';
                errorDiv.classList.remove('hidden');
                return;
            }

            const clinic = clinicDoc.docs[0].data();
            
            if (clinic.password !== password) {
                errorDiv.textContent = 'كلمة السر غير صحيحة';
                errorDiv.classList.remove('hidden');
                return;
            }

            // Login successful
            this.currentClinic = {
                id: clinicDoc.docs[0].id,
                ...clinic
            };

            errorDiv.classList.add('hidden');
            this.showControlPanel();
            this.loadCurrentNumber();
            this.setupRealtimeListener();
            
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'خطأ في تسجيل الدخول';
            errorDiv.classList.remove('hidden');
        }
    }

    logout() {
        this.currentClinic = null;
        this.currentNumber = 0;
        
        if (this.clinicListener) {
            this.clinicListener.off();
            this.clinicListener = null;
        }
        
        this.showLoginSection();
    }

    showLoginSection() {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('controlPanel').classList.add('hidden');
        
        // Reset form
        document.getElementById('controlLoginForm').reset();
    }

    showControlPanel() {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('controlPanel').classList.remove('hidden');
        
        // Update clinic name
        document.getElementById('clinicName').textContent = this.currentClinic.name;
        
        // Update current number display
        this.updateCurrentNumberDisplay();
    }

    async loadCurrentNumber() {
        if (!this.currentClinic) return;

        try {
            const snapshot = await realtimeRefs.clinicStatus
                .child(this.currentClinic.number)
                .once('value');
            
            const clinicData = snapshot.val();
            if (clinicData) {
                this.currentNumber = clinicData.current || 0;
                this.clinicStatus = clinicData.status || 'active';
                this.updateCurrentNumberDisplay();
                this.updateClinicStatusButtons();
            }
        } catch (error) {
            console.error('Error loading current number:', error);
        }
    }

    setupRealtimeListener() {
        if (!this.currentClinic) return;

        this.clinicListener = realtimeRefs.clinicStatus
            .child(this.currentClinic.number)
            .on('value', (snapshot) => {
                const clinicData = snapshot.val();
                if (clinicData) {
                    this.currentNumber = clinicData.current || 0;
                    this.clinicStatus = clinicData.status || 'active';
                    this.updateCurrentNumberDisplay();
                    this.updateClinicStatusButtons();
                }
            });
    }

    async nextClient() {
        if (!this.currentClinic || this.clinicStatus !== 'active') return;

        this.currentNumber++;
        await this.updateClinicStatus();
        await this.callCurrentNumber();
        this.totalClients++;
        this.updateStatistics();
    }

    async previousClient() {
        if (!this.currentClinic || this.currentNumber <= 0) return;

        this.currentNumber--;
        await this.updateClinicStatus();
        await this.callCurrentNumber();
    }

    async repeatCall() {
        if (!this.currentClinic || this.currentNumber === 0) return;

        await this.callCurrentNumber();
    }

    async callCurrentNumber() {
        if (!this.currentClinic) return;

        try {
            // Show call status
            this.showCallStatus();
            
            // Add to current calls for display
            await realtimeRefs.currentCalls.push({
                clientNumber: this.currentNumber,
                clinicNumber: this.currentClinic.number,
                clinicName: this.currentClinic.name,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                type: 'normal'
            });

            // Play audio announcement
            await this.playAudioAnnouncement();
            
            // Hide call status after 3 seconds
            setTimeout(() => {
                this.hideCallStatus();
            }, 3000);

        } catch (error) {
            console.error('Error calling number:', error);
            this.showNotification('خطأ في النداء', 'error');
        }
    }

    async updateClinicStatus() {
        if (!this.currentClinic) return;

        try {
            await realtimeRefs.clinicStatus
                .child(this.currentClinic.number)
                .set({
                    current: this.currentNumber,
                    status: this.clinicStatus,
                    lastCalled: firebase.database.ServerValue.TIMESTAMP,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP
                });
        } catch (error) {
            console.error('Error updating clinic status:', error);
        }
    }

    showCallStatus() {
        const statusDiv = document.getElementById('callStatus');
        const statusText = document.getElementById('callStatusText');
        
        statusText.textContent = `جاري نداء العميل رقم ${toArabicNumber(this.currentNumber)}...`;
        statusDiv.classList.remove('hidden');
    }

    hideCallStatus() {
        document.getElementById('callStatus').classList.add('hidden');
    }

    async playAudioAnnouncement() {
        try {
            // Play ding sound
            const dingAudio = new Audio('audio/ding.mp3');
            await dingAudio.play();
            
            // Wait for ding to finish
            await new Promise(resolve => {
                dingAudio.onended = resolve;
            });
            
            // Play number
            const numberAudio = new Audio(`audio/${this.currentNumber}.mp3`);
            await numberAudio.play();
            
            // Wait for number to finish
            await new Promise(resolve => {
                numberAudio.onended = resolve;
            });
            
            // Play clinic name
            const clinicAudio = new Audio(`audio/clinic${this.currentClinic.number}.mp3`);
            await clinicAudio.play();
            
        } catch (error) {
            console.error('Error playing audio:', error);
            // Continue without audio
        }
    }

    updateCurrentNumberDisplay() {
        const numberElement = document.getElementById('currentNumber');
        const updateElement = document.getElementById('lastUpdate');
        
        if (numberElement) {
            numberElement.textContent = toArabicNumber(this.currentNumber);
        }
        
        if (updateElement) {
            updateElement.textContent = new Date().toLocaleTimeString('ar-EG');
        }
    }

    updateClinicStatusButtons() {
        const pauseBtn = document.getElementById('pauseClinic');
        const resumeBtn = document.getElementById('resumeClinic');
        
        if (this.clinicStatus === 'active') {
            pauseBtn.classList.remove('hidden');
            resumeBtn.classList.add('hidden');
        } else {
            pauseBtn.classList.add('hidden');
            resumeBtn.classList.remove('hidden');
        }
    }

    // Modal functions
    showCallSpecificModal() {
        document.getElementById('callSpecificModal').classList.remove('hidden');
        document.getElementById('callSpecificModal').classList.add('flex');
        document.getElementById('specificNumber').focus();
    }

    hideCallSpecificModal() {
        document.getElementById('callSpecificModal').classList.add('hidden');
        document.getElementById('callSpecificModal').classList.remove('flex');
        document.getElementById('specificNumber').value = '';
    }

    async callSpecificNumber() {
        const number = parseInt(document.getElementById('specificNumber').value);
        
        if (!number || number <= 0) {
            this.showNotification('الرجاء إدخال رقم صحيح', 'error');
            return;
        }

        this.currentNumber = number;
        await this.updateClinicStatus();
        await this.callCurrentNumber();
        
        this.hideCallSpecificModal();
    }

    showCallByNameModal() {
        document.getElementById('callByNameModal').classList.remove('hidden');
        document.getElementById('callByNameModal').classList.add('flex');
        document.getElementById('clientName').focus();
    }

    hideCallByNameModal() {
        document.getElementById('callByNameModal').classList.add('hidden');
        document.getElementById('callByNameModal').classList.remove('flex');
        document.getElementById('clientName').value = '';
    }

    async callByName() {
        const clientName = document.getElementById('clientName').value;
        
        if (!clientName.trim()) {
            this.showNotification('الرجاء إدخال اسم العميل', 'error');
            return;
        }

        try {
            await realtimeRefs.currentCalls.push({
                clientName: clientName,
                clinicNumber: this.currentClinic.number,
                clinicName: this.currentClinic.name,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                type: 'byName'
            });
            
            this.showNotification(`تم نداء العميل ${clientName}`, 'success');
            this.hideCallByNameModal();
            
        } catch (error) {
            console.error('Error calling by name:', error);
            this.showNotification('خطأ في النداء', 'error');
        }
    }

    showTransferModal() {
        document.getElementById('transferModal').classList.remove('hidden');
        document.getElementById('transferModal').classList.add('flex');
        document.getElementById('transferNumber').focus();
    }

    hideTransferModal() {
        document.getElementById('transferModal').classList.add('hidden');
        document.getElementById('transferModal').classList.remove('flex');
        document.getElementById('transferNumber').value = '';
        document.getElementById('targetClinic').value = '';
    }

    async transferClient() {
        const clientNumber = parseInt(document.getElementById('transferNumber').value);
        const targetClinic = parseInt(document.getElementById('targetClinic').value);
        
        if (!clientNumber || !targetClinic) {
            this.showNotification('الرجاء إدخال رقم العميل واختيار العيادة المستهدفة', 'error');
            return;
        }

        try {
            await realtimeRefs.currentCalls.push({
                clientNumber: clientNumber,
                fromClinic: this.currentClinic.number,
                toClinic: targetClinic,
                clinicName: this.currentClinic.name,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                type: 'transfer'
            });
            
            this.showNotification(`تم تحويل العميل رقم ${toArabicNumber(clientNumber)}`, 'success');
            this.hideTransferModal();
            
        } catch (error) {
            console.error('Error transferring client:', error);
            this.showNotification('خطأ في التحويل', 'error');
        }
    }

    async pauseClinic() {
        if (!this.currentClinic) return;

        this.clinicStatus = 'paused';
        await this.updateClinicStatus();
        this.updateClinicStatusButtons();
        
        this.showNotification('تم إيقاف العيادة مؤقتاً', 'info');
    }

    async resumeClinic() {
        if (!this.currentClinic) return;

        this.clinicStatus = 'active';
        await this.updateClinicStatus();
        this.updateClinicStatusButtons();
        
        this.showNotification('تم استئناف عمل العيادة', 'success');
    }

    async resetClinic() {
        if (!this.currentClinic) return;

        if (confirm('هل أنت متأكد من تصفير العيادة؟ سيتم إعادة العداد إلى الصفر.')) {
            this.currentNumber = 0;
            await this.updateClinicStatus();
            this.updateCurrentNumberDisplay();
            this.updateStatistics();
            
            this.showNotification('تم تصفير العيادة', 'success');
        }
    }

    async emergencyAlert() {
        if (!this.currentClinic) return;

        try {
            await realtimeRefs.announcements.push({
                type: 'emergency',
                message: 'تنبيه طوارئ في العيادة - يرجى الانتباه',
                clinicNumber: this.currentClinic.number,
                clinicName: this.currentClinic.name,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.showNotification('تم إرسال تنبيه الطوارئ', 'success');
        } catch (error) {
            console.error('Error sending emergency alert:', error);
            this.showNotification('خطأ في إرسال تنبيه الطوارئ', 'error');
        }
    }

    async notifyDoctor() {
        if (!this.currentClinic) return;

        try {
            await realtimeRefs.announcements.push({
                type: 'doctor_notification',
                message: `تنبيه إلى طبيب ${this.currentClinic.name}`,
                clinicNumber: this.currentClinic.number,
                clinicName: this.currentClinic.name,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.showNotification('تم إرسال تنبيه للطبيب', 'success');
        } catch (error) {
            console.error('Error notifying doctor:', error);
            this.showNotification('خطأ في إرسال تنبيه الطبيب', 'error');
        }
    }

    async skipQueue() {
        if (!this.currentClinic) return;

        try {
            await realtimeRefs.currentCalls.push({
                clinicNumber: this.currentClinic.number,
                clinicName: this.currentClinic.name,
                action: 'skip',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.showNotification('تم تخطي الطابور', 'success');
        } catch (error) {
            console.error('Error skipping queue:', error);
            this.showNotification('خطأ في تخطي الطابور', 'error');
        }
    }

    updateStatistics() {
        const now = Date.now();
        const elapsedMinutes = (now - this.startTime) / (1000 * 60);
        const avgWaitTime = this.totalClients > 0 ? Math.round(elapsedMinutes / this.totalClients) : 0;
        const currentWaitTime = Math.round(elapsedMinutes);

        document.getElementById('totalClients').textContent = this.totalClients;
        document.getElementById('avgWaitTime').textContent = avgWaitTime;
        document.getElementById('currentWaitTime').textContent = currentWaitTime;
        document.getElementById('clinicStatus').textContent = this.clinicStatus === 'active' ? 'نشطة' : 'متوقفة';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
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

// Initialize control panel
const controlPanel = new ControlPanel();