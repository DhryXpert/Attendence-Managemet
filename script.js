let students = [];
let currentDate = new Date().toLocaleDateString();

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('classStudents');
    if (saved) {
        students = JSON.parse(saved);
        updateStudentsList();
        updateAttendanceList();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('classStudents', JSON.stringify(students));
}

// Show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${isError ? 'error' : ''} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'attendance') {
        updateAttendanceList();
        updateSummary();
    }
}

// Import from Excel
function importExcel() {
    const file = document.getElementById('excel-file').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data;
            
            if (file.name.toLowerCase().endsWith('.csv')) {
                // Handle CSV
                const text = e.target.result;
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                
                data = lines.slice(1).filter(line => line.trim()).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    return row;
                });
            } else {
                // Handle Excel
                const workbook = XLSX.read(e.target.result, {type: 'binary'});
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                data = XLSX.utils.sheet_to_json(firstSheet);
            }

            // Process the data
            let importedCount = 0;
            let duplicateCount = 0;

            data.forEach(row => {
                // Try different possible column names
                const name = row.Name || row.name || row.StudentName || row['Student Name'] || 
                           row['Full Name'] || row.fullname || '';
                const enrollment = row.Enrollment || row.enrollment || row.EnrollmentNo || 
                                     row['Enrollment No'] || row.enrollmentno || row.EN || row.en || '';
                const roll = row.Roll || row.roll || row.RollNo || row['Roll No'] || 
                           row.rollno || row.RollNumber || row['Roll Number'] || '';

                if (name && enrollment && roll) {
                    // Check for duplicates
                    const exists = students.find(s => 
                        s.enrollment === enrollment.toString() || 
                        s.roll === roll.toString()
                    );

                    if (!exists) {
                        students.push({
                            name: name.toString().trim(),
                            enrollment: enrollment.toString().trim(),
                            roll: roll.toString().trim()
                        });
                        importedCount++;
                    } else {
                        duplicateCount++;
                    }
                }
            });

            saveData();
            updateStudentsList();
            updateAttendanceList();

            let message = `✅ Imported ${importedCount} students successfully!`;
            if (duplicateCount > 0) {
                message += ` (${duplicateCount} duplicates skipped)`;
            }
            showNotification(message);

        } catch (error) {
            console.error('Import error:', error);
            showNotification('❌ Error importing file. Please check the format.', true);
        }
    };

    if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

// Add student manually
function addStudent() {
    const name = document.getElementById('student-name').value.trim();
    const enrollment = document.getElementById('enrollment-no').value.trim();
    const roll = document.getElementById('roll-no').value.trim();

    if (!name || !enrollment || !roll) {
        showNotification('❌ Please fill all fields!', true);
        return;
    }

    // Check for duplicates
    const exists = students.find(s => 
        s.enrollment === enrollment || s.roll === roll
    );

    if (exists) {
        showNotification('❌ Student with same enrollment or roll number already exists!', true);
        return;
    }

    students.push({ name, enrollment, roll });
    saveData();
    updateStudentsList();
    updateAttendanceList();

    // Clear inputs
    document.getElementById('student-name').value = '';
    document.getElementById('enrollment-no').value = '';
    document.getElementById('roll-no').value = '';

    showNotification(`✅ Student ${name} added successfully!`);
}

// Update students list
function updateStudentsList() {
    const container = document.getElementById('students-list');
    document.getElementById('student-count').textContent = students.length;

    if (students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No students added yet. Import from Excel or add manually.
            </div>
        `;
        return;
    }

    container.innerHTML = students.map((student, index) => `
        <div class="student-item">
            <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="student-details">Roll: ${student.roll} | Enrollment: ${student.enrollment}</div>
            </div>
            <button class="delete-btn" onclick="deleteStudent(${index})">🗑️</button>
        </div>
    `).join('');
}

// Update attendance list
function updateAttendanceList() {
    const container = document.getElementById('attendance-list');
    
    if (students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                Please add students first in the Students tab.
            </div>
        `;
        document.getElementById('attendance-summary').style.display = 'none';
        return;
    }

    document.getElementById('attendance-summary').style.display = 'block';
    
    container.innerHTML = students.map((student, index) => `
        <div class="student-item">
            <div class="checkbox-container">
                <input type="checkbox" class="checkbox" id="check-${index}" onchange="updateSummary()">
            </div>
            <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="student-details">Roll: ${student.roll} | Enrollment: ${student.enrollment}</div>
            </div>
        </div>
    `).join('');

    updateSummary();
}

// Update summary
function updateSummary() {
    const total = students.length;
    const present = document.querySelectorAll('input[type="checkbox"]:checked').length;
    const absent = total - present;

    document.getElementById('total-students').textContent = total;
    document.getElementById('present-count').textContent = present;
    document.getElementById('absent-count').textContent = absent;
}

// Delete student
function deleteStudent(index) {
    if (confirm(`Delete ${students[index].name}?`)) {
        students.splice(index, 1);
        saveData();
        updateStudentsList();
        updateAttendanceList();
        showNotification('✅ Student deleted successfully!');
    }
}

// Clear all students
function clearAllStudents() {
    if (confirm('Are you sure you want to delete all students?')) {
        students = [];
        saveData();
        updateStudentsList();
        updateAttendanceList();
        showNotification('✅ All students cleared!');
    }
}

// Select all checkboxes
function selectAll() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
    updateSummary();
}

// Clear all checkboxes
function clearAll() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSummary();
}

// Generate attendance report
function generateReport() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const presentStudents = [];
    const presentRolls = [];
    const absentStudents = [];

    students.forEach((student, index) => {
        if (checkboxes[index] && checkboxes[index].checked) {
            presentStudents.push(student);
            presentRolls.push(student.roll);
        } else {
            absentStudents.push(student);
        }
    });

    // Sort roll numbers numerically
    presentRolls.sort((a, b) => parseInt(a) - parseInt(b));

    const currentTime = new Date().toLocaleString();
    
    let report = `📅 ATTENDANCE REPORT\n`;
    report += `Date: ${currentTime}\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `📊 SUMMARY:\n`;
    report += `Total Students: ${students.length}\n`;
    report += `Present: ${presentStudents.length}\n`;
    report += `Absent: ${absentStudents.length}\n`;
    report += `Attendance Rate: ${((presentStudents.length / students.length) * 100).toFixed(1)}%\n\n`;
    
    report += `✅ PRESENT STUDENTS ROLL NUMBERS (Copy this for teacher):\n`;
    report += `${presentRolls.join(', ')}\n\n`;
    
    report += `✅ PRESENT STUDENTS DETAILS:\n`;
    presentStudents.forEach(student => {
        report += `• ${student.name} (Roll: ${student.roll}, EN: ${student.enrollment})\n`;
    });
    
    if (absentStudents.length > 0) {
        report += `\n❌ ABSENT STUDENTS:\n`;
        absentStudents.forEach(student => {
            report += `• ${student.name} (Roll: ${student.roll}, EN: ${student.enrollment})\n`;
        });
    }

    document.getElementById('output').textContent = report;
    showNotification('📊 Attendance report generated!');
}

// Copy roll numbers to clipboard
function copyRollNumbers() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const presentRolls = [];

    students.forEach((student, index) => {
        if (checkboxes[index] && checkboxes[index].checked) {
            presentRolls.push(student.roll);
        }
    });

    if (presentRolls.length === 0) {
        showNotification('❌ No students marked as present!', true);
        return;
    }

    // Sort roll numbers numerically
    presentRolls.sort((a, b) => parseInt(a) - parseInt(b));
    const rollList = presentRolls.join(', ');

    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(rollList).then(() => {
            showNotification(`📋 Copied to clipboard: ${rollList}`);
        }).catch(() => {
            fallbackCopy(rollList);
        });
    } else {
        fallbackCopy(rollList);
    }
}

// Fallback copy method
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification(`📋 Copied to clipboard: ${text}`);
    } catch (err) {
        showNotification('❌ Could not copy to clipboard', true);
    }
    
    document.body.removeChild(textArea);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});
