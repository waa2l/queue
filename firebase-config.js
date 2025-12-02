// Firebase Configuration for Medical Queue Management System
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvrOrtDrcvgp7Z2iJ1Ha4Jjj2-dl0rR9E",
  authDomain: "queue-bb674.firebaseapp.com",
  databaseURL: "https://queue-bb674-default-rtdb.firebaseio.com",
  projectId: "queue-bb674",
  storageBucket: "queue-bb674.firebasestorage.app",
  messagingSenderId: "74148025688",
  appId: "1:74148025688:web:c70208c78e6b34b9fd012d",
  measurementId: "G-4RVFXJ8HFH"
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
