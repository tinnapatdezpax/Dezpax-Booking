// --- Google Apps Script Web App URL for fetching data ---
// REPLACE THIS with your actual deployed Apps Script Web App URL (the one for doGet)
const GET_DATA_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxE3i-eSQ1R2T6OBT8cqjpYRV_4qsfXAZ1ADYmXJyjebsmd_J08HVl23ecHVooz6Qsn/exec'; 

const deliveryTableBody = document.getElementById('deliveryTableBody');
const loadingMessage = document.getElementById('loading');
const errorMessage = document.getElementById('error');
const currentDateDisplay = document.getElementById('currentDateDisplay');

function displayDate() {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    currentDateDisplay.textContent = `${day} ${monthNames[month]} ${year + 543}`; // Buddhist Era
}

async function fetchDeliveryData() {
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    deliveryTableBody.innerHTML = ''; // Clear existing table data

    try {
        const response = await fetch(GET_DATA_WEB_APP_URL, {
            method: 'GET',
            mode: 'cors', // Ensure CORS is enabled for the request
            cache: 'no-cache'
        });
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            loadingMessage.style.display = 'none';
            if (result.data.length === 0) {
                deliveryTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">ไม่มีข้อมูลการจัดส่งสำหรับวันนี้</td></tr>';
                return;
            }
            
            // Get today's date in a comparable format (YYYY-MM-DD)
            const today = new Date();
            const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            let order = 0;
            result.data.forEach((row) => {
                // Column indices based on how doGet returns data from Google Sheet
                // Assuming data order from sheet:
                // [ชื่อบริษัท, หมายเลขเอกสาร PO, ชื่อผู้ติดต่อ, เบอร์โทร, จำนวนรถส่งสินค้า, วันที่จัดส่ง, เวลาจัดส่ง, หมายเหตุ, Timestamp]
                // Make sure your Apps Script's doGet sends these columns in this order (or adjust indices below)
                
                const deliveryDateCell = row[5]; // 'วันที่จัดส่ง' (Column F)
                const deliveryTimeCell = row[6]; // 'เวลาจัดส่ง' (Column G)
                const companyNameCell = row[0]; // 'ชื่อบริษัท' (Column A)
                const poNumberCell = row[1]; // 'หมายเลขเอกสาร PO' (Column B)

                // Convert delivery date from DD/MM/YYYY to YYYY-MM-DD for comparison
                let compareDate = '';
                if (deliveryDateCell && typeof deliveryDateCell === 'string') {
                    const parts = deliveryDateCell.split('/');
                    if (parts.length === 3) {
                        compareDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                } else if (deliveryDateCell instanceof Date) { // If Apps Script sends actual Date objects
                    compareDate = `${deliveryDateCell.getFullYear()}-${String(deliveryDateCell.getMonth() + 1).padStart(2, '0')}-${String(deliveryDateCell.getDate()).padStart(2, '0')}`;
                }


                // Only show entries for today's date
                if (compareDate === todayFormatted) {
                    order++;
                    const rowElement = document.createElement('tr');
                    if (order === 1) { // Highlight the first row from the filtered list
                        rowElement.classList.add('highlighted');
                    }
                    rowElement.innerHTML = `
                        <td data-label="ลำดับ">${order}</td>
                        <td data-label="เวลา">${deliveryTimeCell || ''}</td>
                        <td data-label="ชื่อบริษัท">${companyNameCell || ''}</td>
                        <td data-label="PO Number">${poNumberCell || ''}</td>
                    `;
                    deliveryTableBody.appendChild(rowElement);
                }
            });

            if (order === 0) { // If no deliveries for today were found
                deliveryTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">ไม่มีข้อมูลการจัดส่งสำหรับวันนี้</td></tr>';
            }


        } else {
            errorMessage.textContent = `เกิดข้อผิดพลาดในการดึงข้อมูล: ${result.message || 'ไม่ทราบสาเหตุ'}`;
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching delivery data:', error);
        errorMessage.textContent = 'ไม่สามารถเชื่อมต่อเพื่อดึงข้อมูลได้ กรุณาลองใหม่ภายหลัง';
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// Initial calls
document.addEventListener('DOMContentLoaded', () => {
    displayDate();
    fetchDeliveryData();
});