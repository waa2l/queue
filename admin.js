// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'general';
        this.editingScreenId = null;
        this.editingClinicId = null;
        this.editingDoctorId = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.showSection(section);
            });
        });

        // Sidebar toggle for mobile
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('translate-x-0');
            sidebar.classList.toggle('-translate-x-full');
        });

        // General settings form
        document.getElementById('generalSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
        });

        // Screen management
        document.getElementById('addScreenBtn').addEventListener('click', () => {
            this.showScreenModal();
        });

        document.getElementById('screenForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveScreen();
        });

        document.getElementById('cancelScreen').addEventListener('click', () => {
            this.hideScreenModal();
        });

        // Clinic management
        document.getElementById('addClinicBtn').addEventListener('click', () => {
            this.showClinicModal();
        });

        // Video management
        document.getElementById('addVideoLink').addEventListener('click', () => {
            this.addVideoLink();
        });

        // Video controls
        document.getElementById('playVideo').addEventListener('click', () => {
            this.controlVideo('play');
        });

        document.getElementById('pauseVideo').addEventListener('click', () => {
            this.controlVideo('pause');
        });

        document.getElementById('stopVideo').addEventListener('click', () => {
            this.controlVideo('stop');
        });

        document.getElementById('nextVideo').addEventListener('click', () => {
            this.controlVideo('next');
        });

        // Call controls
        document.getElementById('callSpecificClient').addEventListener('click', () => {
            this.callSpecificClient();
        });

        document.getElementById('emergencyAlert').addEventListener('click', () => {
            this.sendEmergencyAlert();
        });

        document.getElementById('skipQueue').addEventListener('click', () => {
            this.skipQueue();
        });

        document.getElementById('resetAllClinics').addEventListener('click', () => {
            this.resetAllClinics();
        });

        // Audio recording
        document.getElementById('startRecording').addEventListener('click', () => {
            this.startRecording();
        });

        document.getElementById('stopRecording').addEventListener('click', () => {
            this.stopRecording();
        });

        // Doctor management
        document.getElementById('addDoctorBtn').addEventListener('click', () => {
            this.showDoctorModal();
        });
    }

    async checkAuthState() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadAdminData();
                this.showAdminInterface();
            } else {
                this.showLoginModal();
            }
        });
    }

    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            await auth.signInWithEmailAndPassword(email, password);
            errorDiv.classList.add('hidden');
        } catch (error) {
            errorDiv.textContent = 'خطأ في البريد الإلكتروني أو كلمة المرور';
            errorDiv.classList.remove('hidden');
        }
    }

    async logout() {
        try {
            await auth.signOut();
            this.showLoginModal();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showLoginModal() {
        document.getElementById('loginModal').classList.add('show');
        document.getElementById('adminInterface').classList.add('hidden');
    }

    showAdminInterface() {
        document.getElementById('loginModal').classList.remove('show');
        document.getElementById('adminInterface').classList.remove('hidden');
        document.getElementById('adminName').textContent = this.currentUser.email;
        
        this.loadAllData();
    }

    async loadAdminData() {
        try {
            // Load general settings
            const settingsDoc = await collections.settings.doc('general').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                document.getElementById('centerName').value = settings.centerName || '';
                document.getElementById('alertDuration').value = settings.alertDuration || 5;
                document.getElementById('speechSpeed').value = settings.speechSpeed || 1;
                document.getElementById('audioPath').value = settings.audioPath || './audio/';
                document.getElementById('newsTicker').value = settings.newsTicker || '';
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }

    async loadAllData() {
        await Promise.all([
            this.loadScreens(),
            this.loadClinics(),
            this.loadVideoLinks(),
            this.loadDoctors()
        ]);
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;
    }

    async saveGeneralSettings() {
        const settings = {
            centerName: document.getElementById('centerName').value,
            alertDuration: parseInt(document.getElementById('alertDuration').value),
            speechSpeed: parseFloat(document.getElementById('speechSpeed').value),
            audioPath: document.getElementById('audioPath').value,
            newsTicker: document.getElementById('newsTicker').value,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await collections.settings.doc('general').set(settings);
            this.showNotification('تم حفظ الإعدادات بنجاح', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('خطأ في حفظ الإعدادات', 'error');
        }
    }

    async loadScreens() {
        try {
            const screensSnapshot = await collections.screens.get();
            const screensList = document.getElementById('screensList');
            
            screensList.innerHTML = screensSnapshot.docs.map(doc => {
                const screen = doc.data();
                return `
                    <div class="bg-gray-50 p-4 rounded-lg border">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-semibold text-gray-800">شاشة رقم ${toArabicNumber(screen.number)}</h4>
                            <div class="flex space-x-2 space-x-reverse">
                                <button onclick="admin.editScreen('${doc.id}')" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="admin.deleteScreen('${doc.id}')" class="text-red-600 hover:text-red-800">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600">كلمة السر: ${screen.password}</p>
                        <p class="text-sm text-gray-600">الحالة: ${screen.active ? 'نشطة' : 'معطلة'}</p>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading screens:', error);
        }
    }

    showScreenModal(screenId = null) {
        this.editingScreenId = screenId;
        const modal = document.getElementById('screenModal');
        
        if (screenId) {
            // Load screen data for editing
            this.loadScreenData(screenId);
        } else {
            // Clear form for new screen
            document.getElementById('screenForm').reset();
        }
        
        modal.classList.add('show');
    }

    hideScreenModal() {
        document.getElementById('screenModal').classList.remove('show');
        this.editingScreenId = null;
    }

    async loadScreenData(screenId) {
        try {
            const doc = await collections.screens.doc(screenId).get();
            if (doc.exists) {
                const screen = doc.data();
                document.getElementById('screenNumber').value = screen.number;
                document.getElementById('screenPassword').value = screen.password;
            }
        } catch (error) {
            console.error('Error loading screen data:', error);
        }
    }

    async saveScreen() {
        const screenData = {
            number: parseInt(document.getElementById('screenNumber').value),
            password: document.getElementById('screenPassword').value,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (this.editingScreenId) {
                await collections.screens.doc(this.editingScreenId).update(screenData);
            } else {
                await collections.screens.add(screenData);
            }
            
            this.hideScreenModal();
            await this.loadScreens();
            this.showNotification('تم حفظ بيانات الشاشة', 'success');
        } catch (error) {
            console.error('Error saving screen:', error);
            this.showNotification('خطأ في حفظ بيانات الشاشة', 'error');
        }
    }

    async deleteScreen(screenId) {
        if (confirm('هل أنت متأكد من حذف هذه الشاشة؟')) {
            try {
                await collections.screens.doc(screenId).delete();
                await this.loadScreens();
                this.showNotification('تم حذف الشاشة', 'success');
            } catch (error) {
                console.error('Error deleting screen:', error);
                this.showNotification('خطأ في حذف الشاشة', 'error');
            }
        }
    }

    async loadClinics() {
        try {
            const clinicsSnapshot = await collections.clinics.get();
            const clinicsList = document.getElementById('clinicsList');
            
            clinicsList.innerHTML = clinicsSnapshot.docs.map(doc => {
                const clinic = doc.data();
                return `
                    <div class="bg-gray-50 p-4 rounded-lg border">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-semibold text-gray-800">${clinic.name}</h4>
                            <div class="flex space-x-2 space-x-reverse">
                                <button onclick="admin.editClinic('${doc.id}')" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="admin.deleteClinic('${doc.id}')" class="text-red-600 hover:text-red-800">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600">رقم العيادة: ${toArabicNumber(clinic.number)}</p>
                        <p class="text-sm text-gray-600">رقم الشاشة: ${toArabicNumber(clinic.screenNumber)}</p>
                        <p class="text-sm text-gray-600">الحالة: ${clinic.active ? 'نشطة' : 'معطلة'}</p>
                    </div>
                `;
            }).join('');

            // Update clinic dropdowns
            this.updateClinicDropdowns();
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    updateClinicDropdowns() {
        const dropdowns = ['callClinicNumber'];
        
        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                // Clear existing options except the first one
                dropdown.innerHTML = '<option value="">اختر العيادة</option>';
                
                // Add clinic options
                collections.clinics.get().then(snapshot => {
                    snapshot.docs.forEach(doc => {
                        const clinic = doc.data();
                        const option = document.createElement('option');
                        option.value = clinic.number;
                        option.textContent = clinic.name;
                        dropdown.appendChild(option);
                    });
                });
            }
        });
    }

    async loadVideoLinks() {
        try {
            const videoLinksSnapshot = await collections.videoLinks.get();
            const videoLinksList = document.getElementById('videoLinksList');
            
            videoLinksList.innerHTML = videoLinksSnapshot.docs.map(doc => {
                const link = doc.data();
                return `
                    <div class="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span class="text-sm text-gray-700 truncate flex-1">${link.url}</span>
                        <button onclick="admin.deleteVideoLink('${doc.id}')" class="text-red-600 hover:text-red-800 ml-2">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading video links:', error);
        }
    }

    async addVideoLink() {
        const url = document.getElementById('newVideoLink').value;
        
        if (!url) {
            this.showNotification('الرجاء إدخال رابط الفيديو', 'error');
            return;
        }

        try {
            await collections.videoLinks.add({
                url: url,
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            document.getElementById('newVideoLink').value = '';
            await this.loadVideoLinks();
            this.showNotification('تم إضافة رابط الفيديو', 'success');
        } catch (error) {
            console.error('Error adding video link:', error);
            this.showNotification('خطأ في إضافة رابط الفيديو', 'error');
        }
    }

    async deleteVideoLink(linkId) {
        try {
            await collections.videoLinks.doc(linkId).delete();
            await this.loadVideoLinks();
            this.showNotification('تم حذف رابط الفيديو', 'success');
        } catch (error) {
            console.error('Error deleting video link:', error);
            this.showNotification('خطأ في حذف رابط الفيديو', 'error');
        }
    }

    controlVideo(action) {
        // Send video control command to display page
        realtimeRefs.videoControl.set({
            action: action,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        this.showNotification(`تم إرسال أمر ${action} إلى مشغل الفيديو`, 'success');
    }

    async callSpecificClient() {
        const clientNumber = document.getElementById('callClientNumber').value;
        const clinicNumber = document.getElementById('callClinicNumber').value;
        
        if (!clientNumber || !clinicNumber) {
            this.showNotification('الرجاء إدخال رقم العميل واختيار العيادة', 'error');
            return;
        }

        try {
            // Add to current calls
            await realtimeRefs.currentCalls.push({
                clientNumber: parseInt(clientNumber),
                clinicNumber: parseInt(clinicNumber),
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                type: 'specific'
            });
            
            this.showNotification(`تم نداء العميل رقم ${toArabicNumber(clientNumber)}`, 'success');
            
            // Clear form
            document.getElementById('callClientNumber').value = '';
            document.getElementById('callClinicNumber').value = '';
        } catch (error) {
            console.error('Error calling client:', error);
            this.showNotification('خطأ في إرسال النداء', 'error');
        }
    }

    async sendEmergencyAlert() {
        if (confirm('هل أنت متأكد من إرسال تنبيه طوارئ؟')) {
            try {
                await realtimeRefs.announcements.push({
                    type: 'emergency',
                    message: 'تنبيه طوارئ - يرجى الانتباه',
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                
                this.showNotification('تم إرسال تنبيه الطوارئ', 'success');
            } catch (error) {
                console.error('Error sending emergency alert:', error);
                this.showNotification('خطأ في إرسال تنبيه الطوارئ', 'error');
            }
        }
    }

    async skipQueue() {
        const clinicNumber = document.getElementById('callClinicNumber').value;
        
        if (!clinicNumber) {
            this.showNotification('الرجاء اختيار العيادة', 'error');
            return;
        }

        try {
            await realtimeRefs.currentCalls.push({
                clinicNumber: parseInt(clinicNumber),
                action: 'skip',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.showNotification('تم تخطي الطابور للعيادة المحددة', 'success');
        } catch (error) {
            console.error('Error skipping queue:', error);
            this.showNotification('خطأ في تخطي الطابور', 'error');
        }
    }

    async resetAllClinics() {
        if (confirm('هل أنت متأكد من تصفير جميع العيادات؟')) {
            try {
                // Reset all clinic counters
                const clinicsSnapshot = await collections.clinics.get();
                const updates = {};
                
                clinicsSnapshot.docs.forEach(doc => {
                    const clinic = doc.data();
                    updates[`clinicStatus/${clinic.number}/current`] = 0;
                    updates[`clinicStatus/${clinic.number}/lastCalled`] = null;
                });
                
                await db.ref().update(updates);
                
                this.showNotification('تم تصفير جميع العيادات', 'success');
            } catch (error) {
                console.error('Error resetting clinics:', error);
                this.showNotification('خطأ في تصفير العيادات', 'error');
            }
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                // Handle recorded audio - save or broadcast
                this.broadcastRecordedAudio(audioBlob);
            };
            
            this.mediaRecorder.start();
            
            document.getElementById('startRecording').disabled = true;
            document.getElementById('stopRecording').disabled = false;
            document.getElementById('recordingStatus').textContent = 'جاري التسجيل...';
            
            // Auto stop after 10 seconds
            setTimeout(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.stopRecording();
                }
            }, 10000);
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showNotification('خطأ في بدء التسجيل', 'error');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            document.getElementById('startRecording').disabled = false;
            document.getElementById('stopRecording').disabled = true;
            document.getElementById('recordingStatus').textContent = 'جاهز للتسجيل';
        }
    }

    async broadcastRecordedAudio(audioBlob) {
        try {
            // Convert audio blob to base64 and broadcast
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Audio = e.target.result;
                
                await realtimeRefs.announcements.push({
                    type: 'audio',
                    audioData: base64Audio,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                
                this.showNotification('تم بث التسجيل الصوتي', 'success');
            };
            reader.readAsDataURL(audioBlob);
        } catch (error) {
            console.error('Error broadcasting audio:', error);
            this.showNotification('خطأ في بث التسجيل الصوتي', 'error');
        }
    }

    async loadDoctors() {
        try {
            const doctorsSnapshot = await collections.doctors.get();
            const doctorsList = document.getElementById('doctorsList');
            
            doctorsList.innerHTML = doctorsSnapshot.docs.map(doc => {
                const doctor = doc.data();
                return `
                    <div class="bg-gray-50 p-4 rounded-lg border">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-semibold text-gray-800">${doctor.name}</h4>
                            <div class="flex space-x-2 space-x-reverse">
                                <button onclick="admin.editDoctor('${doc.id}')" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="admin.deleteDoctor('${doc.id}')" class="text-red-600 hover:text-red-800">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600">التخصص: ${doctor.specialty}</p>
                        <p class="text-sm text-gray-600">رقم الهاتف: ${doctor.phone}</p>
                        <p class="text-sm text-gray-600">أيام العمل: ${doctor.workDays}</p>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading doctors:', error);
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

// Initialize admin panel
const admin = new AdminPanel();