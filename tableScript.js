// --- Google Apps Script Web App URL for fetching data ---
// IMPORTANT: You'll need to deploy a NEW Apps Script Web App for fetching data,
// or modify your existing doPost to also handle GET requests.
// For simplicity, I'll assume a new Web App URL for GET request.
// If you want to use the same Apps Script, we'll need to modify Code.gs to include doGet function.
const GET_DATA_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz1dDNahOcxL3THUu-KGXNI_0AulooArUoD8ukKrGWeJkiOxCnYWsaF5PGuRDIXSleA/exec'; // <<< REPLACE THIS!

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
        const response = await fetch(GET_DATA_WEB_APP_URL);
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
            result.data.forEach((row, index) => {
                // Ensure correct column indices based on your Google Sheet
                // Make sure your Google Sheet headers are in this order:
                // Timestamp | ชื่อบริษัท | หมายเลขเอกสาร PO | ชื่อผู้ติดต่อ | เบอร์โทร | จำนวนรถส่งสินค้า | วันที่จัดส่ง | เวลาจัดส่ง | หมายเหตุ 
                
                const deliveryDateStr = row[6]; // 'วันที่จัดส่ง' is at index 6 (0-indexed)
                const deliveryTime = row[7]; // 'เวลาจัดส่ง' is at index 7
                const companyName = row[0]; // 'ชื่อบริษัท' is at index 0 (after Timestamp removed, let's adjust this for incoming data)
                const poNumber = row[1]; // 'หมายเลขเอกสาร PO' is at index 1

                // Re-adjusting indices based on how data is received from Apps Script
                // Assuming the Apps Script sends data as it appears in the sheet (including Timestamp at the end if you moved it)
                // Let's re-verify the Apps Script output. If doGet sends the full row as is from sheet.getValues(),
                // then 'ชื่อบริษัท' might be index 1, 'หมายเลขเอกสาร PO' index 2, 'วันที่จัดส่ง' index 7, 'เวลาจัดส่ง' index 8.
                // We need to verify the column order the Apps Script will provide.

                // For now, let's assume the data from Apps Script will be:
                // [Timestamp, ชื่อบริษัท, หมายเลขเอกสาร PO, ชื่อผู้ติดต่อ, เบอร์โทร, จำนวนรถส่งสินค้า, วันที่จัดส่ง, เวลาจัดส่ง, หมายเหตุ]
                // If you moved Timestamp to the end, the order will be:
                // [ชื่อบริษัท, หมายเลขเอกสาร PO, ชื่อผู้ติดต่อ, เบอร์โทร, จำนวนรถส่งสินค้า, วันที่จัดส่ง, เวลาจัดส่ง, หมายเหตุ, Timestamp]

                // Based on your previous sheet headers:
                // Column A: ชื่อบริษัท
                // Column B: หมายเลขเอกสาร PO
                // Column C: ชื่อผู้ติดต่อ
                // Column D: เบอร์โทร
                // Column E: จำนวนรถส่งสินค้า
                // Column F: วันที่จัดส่ง
                // Column G: เวลาจัดส่ง
                // Column H: หมายเหตุ
                // Column I: Timestamp (after you move it)

                // So if your Apps Script fetches data directly from the sheet, indices will be:
                // ชื่อบริษัท (index 0)
                // หมายเลขเอกสาร PO (index 1)
                // ...
                // วันที่จัดส่ง (index 5)
                // เวลาจัดส่ง (index 6)
                // หมายเหตุ (index 7)
                // Timestamp (index 8)

                const deliveryDateCell = row[5]; // Assuming 'วันที่จัดส่ง' is 6th column (index 5)
                const deliveryTimeCell = row[6]; // Assuming 'เวลาจัดส่ง' is 7th column (index 6)
                const companyNameCell = row[0]; // Assuming 'ชื่อบริษัท' is 1st column (index 0)
                const poNumberCell = row[1]; // Assuming 'หมายเลขเอกสาร PO' is 2nd column (index 1)

                // Convert delivery date from DD/MM/YYYY to YYYY-MM-DD for comparison
                let compareDate = '';
                if (deliveryDateCell) {
                    const parts = deliveryDateCell.split('/');
                    if (parts.length === 3) {
                        compareDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }

                // Only show entries for today's date
                if (compareDate === todayFormatted) {
                    order++;
                    const rowElement = document.createElement('tr');
                    // Add highlighted class for the first row, if desired (from example image)
                    if (order === 1) {
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