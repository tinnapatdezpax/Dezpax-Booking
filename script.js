// --- Google Apps Script Web App URL for submitting data ---
// REPLACE THIS with your actual deployed Apps Script Web App URL (the one for doPost)
const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxE3i-eSQ1R2T6OBT8cqjpYRV_4qsfXAZ1ADYmXJyjebsmd_J08HVl23ecHVooz6Qsn/exec'; 

// --- Global Variables ---
const calendarGrid = document.querySelector('.calendar-grid');
const currentMonthYearElem = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const deliveryDateInput = document.getElementById('deliveryDate');
const deliveryTimeInput = document.getElementById('deliveryTime');
const timeModal = document.getElementById('timeModal');
const closeButton = document.querySelector('.close-button');
const confirmTimeBtn = document.getElementById('confirmTime');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const deliveryForm = document.getElementById('deliveryForm');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null; // Store the selected date object

// --- Calendar Functions ---
function renderCalendar() {
    calendarGrid.innerHTML = ''; // Clear previous days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday...

    currentMonthYearElem.textContent = `${getMonthName(currentMonth)} ${currentYear}`;

    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day', 'current-month');
        dayDiv.textContent = day;
        dayDiv.dataset.date = day; // Store day for easy access

        const today = new Date();
        const isToday = (day === today.getDate() &&
                         currentMonth === today.getMonth() &&
                         currentYear === today.getFullYear());

        if (isToday) {
            dayDiv.classList.add('today');
        }

        // Highlight selected date
        if (selectedDate &&
            day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear()) {
            dayDiv.classList.add('selected');
        }

        dayDiv.addEventListener('click', () => {
            // Remove 'selected' from previously selected day
            const previouslySelected = document.querySelector('.calendar-day.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }

            // Add 'selected' to the newly clicked day
            dayDiv.classList.add('selected');
            selectedDate = new Date(currentYear, currentMonth, day);

            // Format date for input field: DD/MM/YYYY
            const formattedDate = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
            deliveryDateInput.value = formattedDate;

            // Show the time selection modal
            openTimeModal();
        });
        calendarGrid.appendChild(dayDiv);
    }
}

function getMonthName(monthIndex) {
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return monthNames[monthIndex];
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// --- Modal Functions ---
function openTimeModal() {
    timeModal.style.display = 'flex'; // Use flex to center the modal
    // Optional: Reset time inputs to current time or empty
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    startTimeInput.value = currentTime;
    endTimeInput.value = currentTime; // Or some default like 30 min later
}

function closeTimeModal() {
    timeModal.style.display = 'none';
}

// --- Event Listeners ---
prevMonthBtn.addEventListener('click', () => changeMonth(-1));
nextMonthBtn.addEventListener('click', () => changeMonth(1));
closeButton.addEventListener('click', closeTimeModal);

// Close modal if click outside content
window.addEventListener('click', (event) => {
    if (event.target === timeModal) {
        closeTimeModal();
    }
});

confirmTimeBtn.addEventListener('click', () => {
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;

    if (startTime && endTime) {
        // Basic validation: ensure end time is not before start time
        if (startTime > endTime) {
            alert('เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่มต้น!');
            return;
        }
        deliveryTimeInput.value = `${startTime} - ${endTime}`;
        closeTimeModal();
    } else {
        alert('กรุณาระบุเวลาเริ่มต้นและเวลาสิ้นสุด');
    }
});

// --- Form Submission Logic (Using Fetch API) ---
deliveryForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    const submitBtn = deliveryForm.querySelector('.submit-btn');
    submitBtn.textContent = 'กำลังส่งข้อมูล...';
    submitBtn.disabled = true;

    // Get all form data
    const formData = new FormData(deliveryForm);
    const urlEncodedData = new URLSearchParams(formData).toString();

    let messageDiv = document.getElementById('message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        deliveryForm.parentNode.insertBefore(messageDiv, deliveryForm.nextSibling);
    }
    messageDiv.style.display = 'none'; // Hide previous messages

    try {
        const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors', // Ensure CORS is enabled for the request
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: urlEncodedData
        });

        const result = await response.json();

        if (result.status === 'success') {
            messageDiv.className = 'success';
            messageDiv.textContent = 'ส่งข้อมูลสำเร็จแล้ว!';
            messageDiv.style.display = 'block';
            deliveryForm.reset(); // Clear the form
            selectedDate = null; // Reset selected date
            renderCalendar(); // Re-render calendar to clear selection
        } else {
            messageDiv.className = 'error';
            messageDiv.textContent = `เกิดข้อผิดพลาด: ${result.message || 'ไม่ทราบสาเหตุ'}`;
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        messageDiv.className = 'error';
        messageDiv.textContent = `เกิดข้อผิดพลาดในการส่งข้อมูล: ${error.message || 'โปรดตรวจสอบคอนโซล'}`;
        messageDiv.style.display = 'block';
    } finally {
        submitBtn.textContent = 'ส่งข้อมูล';
        submitBtn.disabled = false;
    }
});

// --- Initial Render ---
document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
});