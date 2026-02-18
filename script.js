document.addEventListener('DOMContentLoaded', function() {
    const generateQRButton = document.getElementById('generateQR');
    const createPDFButton = document.getElementById('createPDF');

    // Escape all non-ASCII characters to \uXXXX sequences so the QR code
    // contains only ASCII bytes. This avoids UTF-8 vs ISO-8859-1 misinterpretation
    // by barcode scanners that follow the QR spec default (ISO-8859-1 for byte mode).
    // JSON.parse() on the receiving end automatically decodes \uXXXX back to Unicode.
    function escapeNonAscii(str) {
        return str.replace(/[^\x20-\x7E]/g, function(ch) {
            return '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4);
        });
    }

    function createQRCode(elementId, data) {
        const container = document.getElementById(elementId);
        container.innerHTML = ''; // Clear previous QR code

        // Convert data to ASCII-safe JSON string (non-ASCII chars escaped as \uXXXX)
        const jsonString = escapeNonAscii(JSON.stringify(data));

        // Create QR code with maximum capacity and UTF-8 support
        const qrcode = kjua({
            text: jsonString,
            size: 400,
            mode: 'byte',
            render: 'canvas',
            crisp: true,
            minVersion: 1,
            maxVersion: 40,
            ecLevel: 'L',
            back: '#ffffff',
            fill: '#000000',
            quiet: 2,
            ratio: 1
        });

        container.appendChild(qrcode);
    }

    generateQRButton.addEventListener('click', function() {
        // Collect personal data
        const personalData = {
            fn: document.getElementById('vorname').value,
            ln: document.getElementById('name').value,
            bd: document.getElementById('geb').value,
            st: document.getElementById('strasse').value,
            pc: document.getElementById('plz').value,
            ct: document.getElementById('ort').value,
            ds1: document.getElementById('reiseland1').value,
            ds2: document.getElementById('reiseland2').value,
            ds3: document.getElementById('reiseland3').value,
            ds4: document.getElementById('reiseland4').value,
            ds5: document.getElementById('reiseland5').value,
            ds6: document.getElementById('reiseland6').value,
            mc: document.getElementById('more_countries').checked,
            dd: document.getElementById('abreisetermin').value.split('-').reverse().join('.'),
            dr: document.getElementById('reisedauer_number').value + ' ' + document.getElementById('reisedauer_unit').value,
            em: document.getElementById('email').value,
            ph: document.getElementById('telefon').value,
            rs: document.getElementById('reisestil').value
        };

        // Collect medical data
        const medicalData = {
            q1: document.querySelector('input[name="q1"]:checked')?.value || '',
            q1d: document.getElementById('q1_detail').value,
            q2: document.querySelector('input[name="q2"]:checked')?.value || '',
            q2d: document.getElementById('q2_detail').value,
            q3: document.querySelector('input[name="q3"]:checked')?.value || '',
            q4: document.querySelector('input[name="q4"]:checked')?.value || '',
            q5: document.querySelector('input[name="q5"]:checked')?.value || '',
            q6: document.querySelector('input[name="q6"]:checked')?.value || '',
            q7: document.querySelector('input[name="q7"]:checked')?.value || '',
            q7d: document.getElementById('q7_detail').value,
            q8: document.querySelector('input[name="q8"]:checked')?.value || '',
            q9: document.querySelector('input[name="q9"]:checked')?.value || '',
            q9d: document.getElementById('q9_detail').value,
            q10: document.querySelector('input[name="q10"]:checked')?.value || '',
            q11: document.querySelector('input[name="q11"]:checked')?.value || '',
            q12: document.querySelector('input[name="q12"]:checked')?.value || ''
        };

        // Generate QR codes
        createQRCode('personalQR', personalData);
        createQRCode('medicalQR', medicalData);
    });

    createPDFButton.addEventListener('click', function() {
        // Create PDF document
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Set font and colors
        doc.setFont('helvetica', 'bold');

        // Add title
        doc.setFontSize(18);
        doc.setTextColor(0, 100, 0);  // Dark green color
        doc.text('Reisemedizinische Beratung / Impfung', 105, 20, { align: 'center' });

        // Add subtitle
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text('Bitte vor jeder Impfung/Beratung ausfüllen und dem Arzt/der Ärztin übergeben.', 105, 28, { align: 'center' });

        // Function to draw a colored background block
        function drawBlock(y, height, color) {
            doc.setFillColor(...color);
            doc.rect(0, y, 210, height, 'F');
        }

        // Block 1: Personal Information (light green)
        drawBlock(35, 50, [232, 245, 233]); // #e8f5e9
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Persönliche Daten', 20, 43);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Name: ${document.getElementById('name').value}`, 20, 50);
        doc.text(`Vorname: ${document.getElementById('vorname').value}`, 20, 56);
        doc.text(`Geburtsdatum: ${document.getElementById('geb').value}`, 20, 62);
        doc.text(`Adresse: ${document.getElementById('strasse').value}`, 20, 68);
        doc.text(`${document.getElementById('plz').value} ${document.getElementById('ort').value}`, 20, 74);
        doc.text(`E-Mail: ${document.getElementById('email').value}`, 20, 80);
        doc.text(`Tel./Mobil: ${document.getElementById('telefon').value}`, 110, 80);

        // Block 2: Travel Information (light yellow)
        drawBlock(90, 50, [255, 253, 231]); // Light yellow
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Reiseinformationen', 20, 98);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const destinations = [
            document.getElementById('reiseland1').value,
            document.getElementById('reiseland2').value,
            document.getElementById('reiseland3').value,
            document.getElementById('reiseland4').value,
            document.getElementById('reiseland5').value,
            document.getElementById('reiseland6').value
        ].filter(d => d).join(', ');

        // Handle long destination text with word wrap
        const maxWidth = 170;
        const wrappedDestinations = doc.splitTextToSize(`Reiseländer: ${destinations}`, maxWidth);
        doc.text(wrappedDestinations, 20, 105);

        const moreCountries = document.getElementById('more_countries').checked;
        doc.text(`Mehr als 6 Länder: ${moreCountries ? 'Ja' : 'Nein'}`, 20, 118);
        doc.text(`Abreisetermin: ${document.getElementById('abreisetermin').value}`, 20, 124);
        doc.text(`Reisedauer: ${document.getElementById('reisedauer_number').value} ${document.getElementById('reisedauer_unit').value}`, 20, 130);
        const reisestil = document.getElementById('reisestil').value;
        if (reisestil) {
            doc.text(`Reisestil: ${document.querySelector(`#reisestil option[value="${reisestil}"]`).textContent}`, 20, 136);
        }

        // Block 3: Medical Information (light grey)
        drawBlock(145, 115, [245, 245, 245]); // Light grey - increased height
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Medizinische Informationen', 20, 153);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8); // Reduced font size
        function getQuestionAnswer(questionName) {
            const radioButton = document.querySelector(`input[name="${questionName}"]:checked`);
            return radioButton ? radioButton.value : 'Keine Angabe';
        }

        const questions = [
            { q: 'Akute/chronische Erkrankung:', a: getQuestionAnswer('q1') },
            { q: 'Detail:', a: document.getElementById('q1_detail').value },
            { q: 'Medikamente:', a: getQuestionAnswer('q2') },
            { q: 'Detail:', a: document.getElementById('q2_detail').value },
            { q: 'Immunsuppression:', a: getQuestionAnswer('q3') },
            { q: 'Thymusdrüse entfernt:', a: getQuestionAnswer('q4') },
            { q: 'Psychische Erkrankung oder Krampfanfälle:', a: getQuestionAnswer('q5') },
            { q: 'Hühnereiweißallergie:', a: getQuestionAnswer('q6') },
            { q: 'Allergien:', a: getQuestionAnswer('q7') },
            { q: 'Detail:', a: document.getElementById('q7_detail').value },
            { q: 'Gelbfieber-Aufklärungsblatt gelesen:', a: getQuestionAnswer('q8') },
            { q: 'Impfungen letzte 4 Wochen:', a: getQuestionAnswer('q9') },
            { q: 'Detail:', a: document.getElementById('q9_detail').value },
            { q: 'Impfsynkope:', a: getQuestionAnswer('q10') },
            { q: 'Medikamentenunverträglichkeit:', a: getQuestionAnswer('q11') },
            { q: 'Schwangerschaft/Stillen:', a: getQuestionAnswer('q12') }
        ];

        let yPos = 160;
        const lineHeight = 5; // Reduced line height
        questions.forEach(q => {
            // Always show the question and its answer, even if it's 'Keine Angabe'
            const text = `${q.q} ${q.a}`;
            if (yPos + lineHeight <= 255) {  // Increased max height to allow more content
                // Handle long text with word wrap
                const wrappedText = doc.splitTextToSize(text, maxWidth);
                doc.text(wrappedText, 20, yPos);
                yPos += (wrappedText.length * lineHeight);
            }
        });

        // Add signature boxes at the bottom
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);

        // Datum box
        doc.setFontSize(10);
        doc.text('Datum:', 20, 250);
        doc.rect(20, 255, 70, 20);

        // Unterschrift box
        doc.text('Unterschrift:', 110, 250);
        doc.rect(110, 255, 70, 20);

        // Add new page for QR codes (keep existing QR code page implementation)
        doc.addPage();

        // Generate QR codes first
        const personalQR = document.getElementById('personalQR').querySelector('canvas');
        const medicalQR = document.getElementById('medicalQR').querySelector('canvas');

        if (personalQR && medicalQR) {
            // Add personal QR code at the top
            doc.addImage(personalQR.toDataURL(), 'PNG', 20, 20, 80, 80);
            doc.text('Personal Data QR', 60, 110, { align: 'center' });

            // Add medical QR code at the bottom with spacing
            doc.addImage(medicalQR.toDataURL(), 'PNG', 20, 140, 80, 80);
            doc.text('Medical Data QR', 60, 230, { align: 'center' });
        }

        // Save the PDF
        doc.save('medical-consultation-form.pdf');
    });
});