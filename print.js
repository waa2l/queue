// Print Page JavaScript
class PrintManager {
    constructor() {
        this.selectedClinic = null;
        this.centerName = '';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadClinics();
        this.loadSettings();
        this.updateTicketCount();
    }

    setupEventListeners() {
        document.getElementById('generateTickets').addEventListener('click', () => {
            this.generateTickets();
        });

        document.getElementById('clearTickets').addEventListener('click', () => {
            this.clearTickets();
        });

        document.getElementById('clinicSelect').addEventListener('change', (e) => {
            this.selectedClinic = e.target.value ? parseInt(e.target.value) : null;
            this.updateTicketCount();
        });

        document.getElementById('startNumber').addEventListener('input', () => {
            this.updateTicketCount();
        });

        document.getElementById('endNumber').addEventListener('input', () => {
            this.updateTicketCount();
        });
    }

    async loadClinics() {
        try {
            const clinicsSnapshot = await collections.clinics.get();
            const clinicSelect = document.getElementById('clinicSelect');
            
            clinicsSnapshot.docs.forEach(doc => {
                const clinic = doc.data();
                const option = document.createElement('option');
                option.value = clinic.number;
                option.textContent = clinic.name;
                clinicSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    async loadSettings() {
        try {
            const settingsDoc = await collections.settings.doc('general').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                this.centerName = settings.centerName || 'المركز الطبي';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.centerName = 'المركز الطبي';
        }
    }

    updateTicketCount() {
        const startNumber = parseInt(document.getElementById('startNumber').value) || 0;
        const endNumber = parseInt(document.getElementById('endNumber').value) || 0;
        const count = Math.max(0, endNumber - startNumber + 1);
        
        document.getElementById('ticketCount').textContent = count;
    }

    generateTickets() {
        const clinicNumber = this.selectedClinic;
        const startNumber = parseInt(document.getElementById('startNumber').value);
        const endNumber = parseInt(document.getElementById('endNumber').value);
        
        if (!clinicNumber) {
            this.showNotification('الرجاء اختيار العيادة', 'error');
            return;
        }
        
        if (!startNumber || !endNumber || startNumber > endNumber) {
            this.showNotification('الرجاء إدخال أرقام صحيحة', 'error');
            return;
        }

        const ticketsGrid = document.getElementById('ticketsGrid');
        const currentDate = new Date().toLocaleDateString('ar-EG');
        const currentTime = new Date().toLocaleTimeString('ar-EG');
        
        // Get clinic name
        const clinicSelect = document.getElementById('clinicSelect');
        const clinicName = clinicSelect.options[clinicSelect.selectedIndex].text;
        
        ticketsGrid.innerHTML = '';
        
        for (let i = startNumber; i <= endNumber; i++) {
            const ticket = this.createTicket(i, clinicName, currentDate, currentTime);
            ticketsGrid.appendChild(ticket);
        }
        
        this.showNotification(`تم توليد ${endNumber - startNumber + 1} تذكرة`, 'success');
    }

    createTicket(number, clinicName, date, time) {
        const ticket = document.createElement('div');
        ticket.className = 'queue-ticket';
        
        const estimatedWait = number * 3; // 3 minutes per client
        
        ticket.innerHTML = `
            <div class="text-center w-full">
                <div class="text-sm font-bold text-gray-800 mb-1">${this.centerName}</div>
                <div class="text-xs text-gray-600 mb-2">${clinicName}</div>
                <div class="text-3xl font-bold text-blue-600 arabic-number mb-2">${toArabicNumber(number)}</div>
                <div class="text-xs text-gray-600 mb-1">التاريخ: ${date}</div>
                <div class="text-xs text-gray-600 mb-2">الوقت: ${time}</div>
                <div class="text-xs text-gray-500">الوقت المتوقع: ${toArabicNumber(estimatedWait)} دقيقة</div>
            </div>
        `;
        
        return ticket;
    }

    clearTickets() {
        document.getElementById('ticketsGrid').innerHTML = '';
        document.getElementById('ticketCount').textContent = '0';
        this.showNotification('تم مسح التذاكر', 'info');
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

// Initialize print manager
const printManager = new PrintManager();

// Print-specific functionality
window.addEventListener('beforeprint', () => {
    // Hide non-print elements
    document.querySelectorAll('.no-print').forEach(el => {
        el.style.display = 'none';
    });
    
    // Optimize layout for printing
    document.body.style.background = 'white';
});

window.addEventListener('afterprint', () => {
    // Restore non-print elements
    document.querySelectorAll('.no-print').forEach(el => {
        el.style.display = '';
    });
    
    // Restore background
    document.body.style.background = '';
});