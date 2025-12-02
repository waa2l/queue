// Display Page JavaScript
class DisplayManager {
    constructor() {
        this.currentScreen = 1;
        this.zoomLevel = 1;
        this.currentVideoIndex = 0;
        this.videoList = [];
        this.doctorIndex = 0;
        this.doctors = [];
        this.currentCall = null;
        this.audioPlayer = new AudioPlayer();
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.generateQRCode();
        this.loadSettings();
        this.loadClinics();
        this.loadDoctors();
        this.loadVideoPlaylist();
        
        // Update time every second
        setInterval(() => this.updateDateTime(), 1000);
        
        // Start doctor rotation
        this.startDoctorRotation();
        
        // Setup real-time listeners
        this.setupRealtimeListeners();
        
        // Preload audio files
        await this.audioPlayer.preloadAudio();
    }

    setupEventListeners() {
        // Screen selector
        document.getElementById('screenSelector').addEventListener('change', (e) => {
            this.currentScreen = parseInt(e.target.value);
            this.loadClinics();
        });

        // Fullscreen toggle
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.zoomIn();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.zoomOut();
        });

        // Video controls
        document.getElementById('playPauseVideo').addEventListener('click', () => {
            this.toggleVideoPlayback();
        });

        document.getElementById('prevVideo').addEventListener('click', () => {
            this.previousVideo();
        });

        document.getElementById('nextVideo').addEventListener('click', () => {
            this.nextVideo();
        });

        document.getElementById('muteVideo').addEventListener('click', () => {
            this.toggleVideoMute();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'f':
                case 'F':
                    if (e.ctrlKey || e.altKey) {
                        e.preventDefault();
                        this.toggleFullscreen();
                    }
                    break;
                case 'Escape':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.zoomOut();
                    break;
            }
        });
    }

    setupRealtimeListeners() {
        // Listen for queue updates
        realtimeRefs.queueNumbers.on('value', (snapshot) => {
            const queueData = snapshot.val();
            if (queueData) {
                this.updateQueueNumbers(queueData);
            }
        });

        // Listen for announcements
        realtimeRefs.announcements.on('child_added', (snapshot) => {
            const announcement = snapshot.val();
            this.handleAnnouncement(announcement);
        });

        // Listen for current calls
        realtimeRefs.currentCalls.on('child_added', (snapshot) => {
            const call = snapshot.val();
            this.handleCall(call);
        });

        // Listen for video control commands
        realtimeRefs.videoControl.on('value', (snapshot) => {
            const control = snapshot.val();
            if (control) {
                this.handleVideoControl(control);
            }
        });

        // Listen for settings updates
        collections.settings.doc('general').onSnapshot((doc) => {
            if (doc.exists) {
                const settings = doc.data();
                this.updateSettings(settings);
            }
        });
    }

    updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-EG');
        const dateString = now.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('currentTime').textContent = timeString;
        document.getElementById('currentDate').textContent = dateString;
    }

    async loadSettings() {
        try {
            const settingsDoc = await collections.settings.doc('general').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                
                // Update center name
                if (settings.centerName) {
                    document.getElementById('centerName').textContent = settings.centerName;
                }
                
                // Update news ticker
                if (settings.newsTicker) {
                    document.getElementById('newsTickerText').textContent = settings.newsTicker;
                }
                
                // Store settings for audio playback
                this.settings = settings;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    updateSettings(settings) {
        if (settings.centerName) {
            document.getElementById('centerName').textContent = settings.centerName;
        }
        if (settings.newsTicker) {
            document.getElementById('newsTickerText').textContent = settings.newsTicker;
        }
        this.settings = settings;
    }

    async loadClinics() {
        try {
            const clinicsSnapshot = await collections.clinics
                .where('screenNumber', '==', this.currentScreen)
                .get();
            
            const clinicsList = document.getElementById('clinicsList');
            
            if (clinicsSnapshot.empty) {
                clinicsList.innerHTML = '<div class="text-center text-gray-500">لا توجد عيادات لهذه الشاشة</div>';
                return;
            }

            const clinics = clinicsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Listen for real-time updates for these clinics
            this.listenToClinicUpdates(clinics);

        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    listenToClinicUpdates(clinics) {
        // Clear existing listeners
        if (this.clinicListeners) {
            this.clinicListeners.forEach(listener => listener.off());
        }

        this.clinicListeners = [];

        clinics.forEach(clinic => {
            const listener = realtimeRefs.clinicStatus
                .child(clinic.number)
                .on('value', (snapshot) => {
                    const clinicData = snapshot.val();
                    this.updateClinicDisplay(clinic, clinicData);
                });
            
            this.clinicListeners.push({
                off: () => realtimeRefs.clinicStatus.child(clinic.number).off('value', listener)
            });
        });
    }

    updateClinicDisplay(clinic, clinicData) {
        const clinicsList = document.getElementById('clinicsList');
        const existingCard = document.getElementById(`clinic-${clinic.number}`);
        
        const currentNumber = clinicData ? clinicData.current || 0 : 0;
        const lastCalled = clinicData ? clinicData.lastCalled : null;
        const status = clinicData ? clinicData.status || 'active' : 'active';

        const cardHTML = `
            <div id="clinic-${clinic.number}" class="queue-card ${status} p-4 rounded-lg border-2 ${
                status === 'active' ? 'border-green-500' : 'border-gray-400'
            }">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-lg">${clinic.name}</h4>
                    <div class="status-indicator w-3 h-3 rounded-full ${
                        status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }"></div>
                </div>
                <div class="text-center mb-2">
                    <div class="text-4xl font-bold arabic-number">${toArabicNumber(currentNumber)}</div>
                    <div class="text-sm text-gray-600">الرقم الحالي</div>
                </div>
                ${lastCalled ? `
                    <div class="text-xs text-gray-500 text-center">
                        آخر نداء: ${new Date(lastCalled).toLocaleTimeString('ar-EG')}
                    </div>
                ` : ''}
                <div class="text-xs text-center mt-2 ${
                    status === 'active' ? 'text-green-600' : 'text-gray-600'
                }">
                    ${status === 'active' ? 'نشطة' : 'متوقفة'}
                </div>
            </div>
        `;

        if (existingCard) {
            existingCard.outerHTML = cardHTML;
        } else {
            clinicsList.innerHTML += cardHTML;
        }
    }

    async loadDoctors() {
        try {
            const doctorsSnapshot = await collections.doctors.get();
            this.doctors = doctorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    startDoctorRotation() {
        if (this.doctors.length === 0) return;

        setInterval(() => {
            this.showNextDoctor();
        }, 20000); // Change doctor every 20 seconds

        // Show first doctor
        this.showNextDoctor();
    }

    showNextDoctor() {
        if (this.doctors.length === 0) return;

        const doctor = this.doctors[this.doctorIndex];
        const banner = document.getElementById('doctorBanner');
        
        document.getElementById('doctorName').textContent = doctor.name;
        document.getElementById('doctorSpecialty').textContent = doctor.specialty;
        document.getElementById('doctorSchedule').textContent = doctor.workDays;
        
        if (doctor.imageUrl) {
            document.getElementById('doctorImage').src = doctor.imageUrl;
        } else {
            document.getElementById('doctorImage').src = 'https://via.placeholder.com/80';
        }

        // Show banner
        banner.style.display = 'block';
        
        // Hide after 10 seconds (will be shown again by rotation)
        setTimeout(() => {
            banner.style.display = 'none';
        }, 10000);

        // Update index
        this.doctorIndex = (this.doctorIndex + 1) % this.doctors.length;
    }

    async loadVideoPlaylist() {
        try {
            const videoLinksSnapshot = await collections.videoLinks.get();
            this.videoList = videoLinksSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.updateVideoPlaylist();
            this.loadFirstVideo();
        } catch (error) {
            console.error('Error loading video playlist:', error);
        }
    }

    updateVideoPlaylist() {
        const playlist = document.getElementById('videoPlaylist');
        
        if (this.videoList.length === 0) {
            playlist.innerHTML = '<div class="text-gray-500 text-center">لا توجد فيديوهات</div>';
            return;
        }

        playlist.innerHTML = this.videoList.map((video, index) => `
            <div class="flex items-center justify-between p-2 rounded ${
                index === this.currentVideoIndex ? 'bg-blue-100' : 'bg-gray-100'
            } hover:bg-gray-200 cursor-pointer" onclick="displayManager.playVideo(${index})">
                <span class="text-sm truncate flex-1">${video.url}</span>
                <span class="text-xs text-gray-500">${index + 1}/${this.videoList.length}</span>
            </div>
        `).join('');
    }

    loadFirstVideo() {
        if (this.videoList.length > 0) {
            this.playVideo(0);
        }
    }

    playVideo(index) {
        if (index < 0 || index >= this.videoList.length) return;

        const video = document.getElementById('mainVideoPlayer');
        const videoData = this.videoList[index];
        
        // Update current index
        this.currentVideoIndex = index;
        
        // Update video source
        video.src = videoData.url;
        video.load();
        
        // Update playlist display
        this.updateVideoPlaylist();
        
        // Auto play
        video.play().catch(e => console.log('Auto-play failed:', e));
    }

    toggleVideoPlayback() {
        const video = document.getElementById('mainVideoPlayer');
        const button = document.getElementById('playPauseVideo');
        
        if (video.paused) {
            video.play();
            button.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            video.pause();
            button.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    previousVideo() {
        const newIndex = this.currentVideoIndex - 1;
        if (newIndex >= 0) {
            this.playVideo(newIndex);
        }
    }

    nextVideo() {
        const newIndex = this.currentVideoIndex + 1;
        if (newIndex < this.videoList.length) {
            this.playVideo(newIndex);
        } else {
            // Loop back to first video
            this.playVideo(0);
        }
    }

    toggleVideoMute() {
        const video = document.getElementById('mainVideoPlayer');
        const button = document.getElementById('muteVideo');
        
        video.muted = !video.muted;
        button.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    }

    handleVideoControl(control) {
        const video = document.getElementById('mainVideoPlayer');
        
        switch (control.action) {
            case 'play':
                video.play();
                break;
            case 'pause':
                video.pause();
                break;
            case 'stop':
                video.pause();
                video.currentTime = 0;
                break;
            case 'next':
                this.nextVideo();
                break;
        }
    }

    updateQueueNumbers(queueData) {
        // Update queue numbers display
        Object.keys(queueData).forEach(clinicNumber => {
            const clinicData = queueData[clinicNumber];
            const clinicCard = document.getElementById(`clinic-${clinicNumber}`);
            
            if (clinicCard) {
                const numberElement = clinicCard.querySelector('.arabic-number');
                if (numberElement) {
                    numberElement.textContent = toArabicNumber(clinicData.current || 0);
                }
            }
        });
    }

    async handleCall(call) {
        // Show notification
        this.showCallNotification(call);
        
        // Play audio announcement
        if (call.clientNumber && call.clinicNumber) {
            await this.audioPlayer.playAnnouncement(call.clientNumber, call.clinicNumber);
        }
        
        // Highlight clinic card
        this.highlightClinic(call.clinicNumber);
    }

    showCallNotification(call) {
        const notificationBar = document.getElementById('notificationBar');
        const notificationText = document.getElementById('notificationText');
        const notificationTime = document.getElementById('notificationTime');
        
        const message = `على العميل رقم ${toArabicNumber(call.clientNumber)} التوجه إلى ${call.clinicName || 'العيادة'}`;
        const time = new Date().toLocaleTimeString('ar-EG');
        
        notificationText.textContent = message;
        notificationTime.textContent = time;
        
        notificationBar.classList.remove('hidden');
        
        // Hide after 5 seconds
        setTimeout(() => {
            notificationBar.classList.add('hidden');
        }, 5000);
    }

    highlightClinic(clinicNumber) {
        const clinicCard = document.getElementById(`clinic-${clinicNumber}`);
        if (clinicCard) {
            clinicCard.classList.add('active');
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                clinicCard.classList.remove('active');
            }, 3000);
        }
    }

    handleAnnouncement(announcement) {
        switch (announcement.type) {
            case 'emergency':
                this.showEmergencyAlert(announcement.message);
                break;
            case 'text':
                this.showTextAlert(announcement.message);
                break;
            case 'audio':
                this.playAudioAnnouncement(announcement.audioData);
                break;
        }
    }

    showEmergencyAlert(message) {
        const notificationBar = document.getElementById('notificationBar');
        const notificationText = document.getElementById('notificationText');
        
        notificationBar.className = 'notification-bar bg-red-600 text-white text-center py-3 font-bold text-lg';
        notificationText.textContent = message;
        
        notificationBar.classList.remove('hidden');
        
        // Hide after 10 seconds
        setTimeout(() => {
            notificationBar.classList.add('hidden');
        }, 10000);
    }

    showTextAlert(message) {
        const notificationBar = document.getElementById('notificationBar');
        const notificationText = document.getElementById('notificationText');
        
        notificationBar.className = 'notification-bar bg-yellow-600 text-white text-center py-3 font-bold text-lg';
        notificationText.textContent = message;
        
        notificationBar.classList.remove('hidden');
        
        // Hide after 7 seconds
        setTimeout(() => {
            notificationBar.classList.add('hidden');
        }, 7000);
    }

    playAudioAnnouncement(audioData) {
        const audio = new Audio(audioData);
        audio.play().catch(e => console.log('Audio play failed:', e));
    }

    generateQRCode() {
        const qrCanvas = document.getElementById('qrcode');
        const clientUrl = `${window.location.origin}/client.html`;
        
        QRCode.toCanvas(qrCanvas, clientUrl, {
            width: 100,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) {
                console.error('QR Code generation failed:', error);
            }
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen failed:', err);
            });
            document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2);
        this.applyZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
        this.applyZoom();
    }

    applyZoom() {
        document.body.style.transform = `scale(${this.zoomLevel})`;
        document.body.style.transformOrigin = 'top right';
    }
}

// Initialize display manager
const displayManager = new DisplayManager();