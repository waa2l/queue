// Firebase Configuration for Medical Queue Management System
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Database references
const db = firebase.database();
const firestore = firebase.firestore();
const auth = firebase.auth();

// Firestore collections
const collections = {
    doctors: firestore.collection('doctors'),
    settings: firestore.collection('settings'),
    appointments: firestore.collection('appointments'),
    complaints: firestore.collection('complaints'),
    videoLinks: firestore.collection('videoLinks'),
    clinics: firestore.collection('clinics'),
    screens: firestore.collection('screens')
};

// Real-time database references
const realtimeRefs = {
    queueNumbers: db.ref('queueNumbers'),
    clinicStatus: db.ref('clinicStatus'),
    announcements: db.ref('announcements'),
    currentCalls: db.ref('currentCalls')
};

// Arabic number converter
function toArabicNumber(num) {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('');
}

// Audio player for announcements
class AudioPlayer {
    constructor() {
        this.audioQueue = [];
        this.isPlaying = false;
        this.audioCache = new Map();
    }

    async preloadAudio() {
        // Preload ding sound
        this.audioCache.set('ding', new Audio('audio/ding.mp3'));
        
        // Preload number audio files (1-200)
        for (let i = 1; i <= 200; i++) {
            this.audioCache.set(`num_${i}`, new Audio(`audio/${i}.mp3`));
        }
        
        // Preload clinic audio files
        for (let i = 1; i <= 20; i++) {
            this.audioCache.set(`clinic_${i}`, new Audio(`audio/clinic${i}.mp3`));
        }
    }

    async playAnnouncement(clientNumber, clinicNumber) {
        const sequence = ['ding', `num_${clientNumber}`, `clinic_${clinicNumber}`];
        
        for (const audioKey of sequence) {
            await this.playAudio(audioKey);
            await this.waitForAudioEnd();
        }
    }

    playAudio(audioKey) {
        return new Promise((resolve) => {
            const audio = this.audioCache.get(audioKey);
            if (audio) {
                audio.currentTime = 0;
                audio.play();
                audio.onended = resolve;
            } else {
                resolve();
            }
        });
    }

    waitForAudioEnd() {
        return new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Global audio player instance
const audioPlayer = new AudioPlayer();