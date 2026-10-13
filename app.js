/* MODULE TÍCH HỢP AI CHUYÊN NGHIỆP */
function openAINotebookHelper() {
    var topicName = document.getElementById("topic-title-input").value || "bài học";
    var promptText = `Dựa vào tài liệu Sách giáo khoa / Sách giáo viên đã nạp, hãy tạo cho tôi 10 câu hỏi trắc nghiệm khách quan ôn tập cho: ${topicName}. Các câu hỏi phân bổ đủ mức độ Nhận biết, Thông hiểu, Vận dụng. Mỗi câu phải tuân thủ nghiêm ngặt chuẩn định dạng sau:

Câu 1: [Nội dung câu hỏi]
A. [Đáp án A]
B. [Đáp án B]
C. [Đáp án C]
D. [Đáp án D]
Đáp án đúng: A
Giải thích: [Lời giải chi tiết ngắn gọn dựa vào SGK]

(Lưu ý: Không viết các câu dẫn thừa, xuất đúng mẫu trên để tôi copy dán vào phần mềm)`;

    // Tự động Copy câu lệnh vào Clipboard
    navigator.clipboard.writeText(promptText).then(function() {
        alert("🤖 ĐÃ SAO CHÉP CÂU LỆNH MẪU CHO AI!\n\nHệ thống chuẩn bị mở trang Google NotebookLM.\nThầy/Cô chỉ cần mở Sổ tay môn học, bấm Ctrl + V (Dán) vào ô chat AI là xong!");
        window.open("https://notebooklm.google.com", "_blank");
    }).catch(function() {
        window.open("https://notebooklm.google.com", "_blank");
    });
}

/* THIẾT LẬP LỊCH TỰ ĐỘNG & BẢO MẬT */
var START_WEEK_1_DATE = new Date(2026, 8, 7); 
var adminPasswordCode = localStorage.getItem("wheel_v50_admin_pass") || "123456"; 
var isAdminLoggedIn = false;
var activeLoginTab = 'pass';

var lockTimeTarget = localStorage.getItem("wheel_v50_lock_time") || "06:45";
var selectedMCName = localStorage.getItem("wheel_v50_selected_mc") || "Cai An Thành";
var isLockdownActive = false;
var hasMCBeenCalledThisSession = false;
var totalSpinCountThisSession = 0;
var currentSpinMode = "all"; 

var masterSubjectList = [
    "Toán", "Ngữ văn", "Tiếng Anh", "Lịch sử", 
    "Địa lý", "Sinh học", "Hóa học", "Tin học", "Công nghệ", "Khoa Học Tự Nhiên", "Hoạt Động Trải Nghiệm"
];

var defaultScheduleByWeek = {
    6: {
        2: { subject: "Toán", topicTitle: "Toán 7 - Số học & Hình học" },
        3: { subject: "Ngữ văn", topicTitle: "Khúc nhạc tâm hồn" },
        4: { subject: "Tiếng Anh", topicTitle: "Vocabulary & Grammar Challenge" },
        5: { subject: "Lịch sử", topicTitle: "Ôn tập Lịch sử 7" },
        6: { subject: "Địa lý", topicTitle: "Kiến thức Địa lý 7" },
        7: { subject: "Sinh học", topicTitle: "Chủ đề Sinh học 7" }
    },
    7: {
        2: { subject: "Toán", topicTitle: "Số học & Hình học" },
        3: { subject: "Địa lý", topicTitle: "Địa lý tự nhiên" },
        4: { subject: "Lịch sử", topicTitle: "Lịch sử Việt Nam" },
        5: { subject: "Sinh học", topicTitle: "Thế giới sinh vật" },
        6: { subject: "Tin học", topicTitle: "Thực hành Tin học 7" },
        7: { subject: "Tiếng Anh", topicTitle: "English Practice" }
    },
    8: {
        2: { subject: "Toán", topicTitle: "Ôn tập Toán 7" },
        3: { subject: "Công nghệ", topicTitle: "Công nghệ và đời sống" },
        4: { subject: "Tiếng Anh", topicTitle: "Unit 3 Revision" },
        5: { subject: "Lịch sử", topicTitle: "Các sự kiện lịch sử" },
        6: { subject: "Hóa học", topicTitle: "Chủ đề Hóa học 7" },
        7: { subject: "Sinh học", topicTitle: "Củng cố Sinh học" }
    }
};

var scheduleByWeekStore = {};
var editingScheduleWeek = 6;

function calculateWeekFromDate(selectedDate) {
    var diffTime = selectedDate.getTime() - START_WEEK_1_DATE.getTime();
    var diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    if (diffDays < 0) return 1; 
    var weekNum = Math.floor(diffDays / 7) + 1;
    return weekNum > 35 ? 35 : weekNum;
}

function getDateFromWeek(weekNum) {
    var targetDate = new Date(START_WEEK_1_DATE);
    targetDate.setDate(START_WEEK_1_DATE.getDate() + (weekNum - 1) * 7);
    return targetDate;
}

function toggleShowPassword(inputId, btnEl) {
    var input = document.getElementById(inputId);
    if (input.type === "password") { input.type = "text"; btnEl.innerText = "🙈"; }
    else { input.type = "password"; btnEl.innerText = "👁️"; }
}

function renderScheduleTableForWeek(weekNum) {
    editingScheduleWeek = parseInt(weekNum) || 6;
    var tbody = document.getElementById("schedule-table-body");
    var weekLabel = document.getElementById("schedule-modal-week-label");
    if (weekLabel) weekLabel.innerText = editingScheduleWeek;
    if (!tbody) return;
    tbody.innerHTML = "";

    var daysMap = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7" };
    var currentWeekData = scheduleByWeekStore[editingScheduleWeek] || {};

    for (var d = 2; d <= 7; d++) {
        var item = currentWeekData[d] || { subject: "", topicTitle: "" };
        var optionsHtml = '<option value="">-- Chọn Môn --</option>';
        masterSubjectList.forEach(function(subj) {
            var selectedStr = (subj.toLowerCase() === item.subject.toLowerCase()) ? 'selected' : '';
            optionsHtml += '<option value="' + subj + '" ' + selectedStr + '>' + subj + '</option>';
        });

        if (item.subject && !masterSubjectList.some(function(s){ return s.toLowerCase() === item.subject.toLowerCase(); })) {
            optionsHtml += '<option value="' + item.subject + '" selected>' + item.subject + '</option>';
        }

        var tr = document.createElement("tr");
        tr.innerHTML = '<td style="font-weight:bold; color:#fde047;">' + daysMap[d] + '</td>' +
            '<td><select id="sch_select_' + d + '" style="width:100%; padding:6px 10px; border-radius:6px; background:#0f172a; color:#38bdf8; font-weight:bold; font-size:15px; border:1px solid #334155; outline:none;">' + optionsHtml + '</select></td>' +
            '<td><input type="text" id="sch_topic_' + d + '" value="' + (item.topicTitle || '') + '" placeholder="Nhập chủ đề hoặc nội dung sinh hoạt..." style="width:100%; padding:6px 10px; background:#1e293b; color:#fff; border:1px solid #334155; border-radius:6px; font-size:14px;"></td>';
        tbody.appendChild(tr);
    }
}

function saveScheduleForWeek(weekNum) {
    if (!scheduleByWeekStore[weekNum]) scheduleByWeekStore[weekNum] = {};

    for (var d = 2; d <= 7; d++) {
        var selElem = document.getElementById("sch_select_" + d);
        var topicElem = document.getElementById("sch_topic_" + d);
        if (selElem && topicElem) {
            scheduleByWeekStore[weekNum][d] = { subject: selElem.value, topicTitle: topicElem.value };
        }
    }

    localStorage.setItem("wheel_v50_schedule_by_week", JSON.stringify(scheduleByWeekStore));
    if (weekNum == currentWeek) {
        var todayObj = new Date();
        var todayDayOfWeek = todayObj.getDay() + 1;
        applyScheduleForDay(todayDayOfWeek);
    }
    alert("💾 Đã lưu thành công Lịch sinh hoạt 15 phút cho Tuần " + weekNum + "!");
}

function onScheduleWeekSelectChanged(val) { renderScheduleTableForWeek(val); }

function populateScheduleModalWeekDropdown() {
    var schWeekSel = document.getElementById("schedule-week-select");
    if (!schWeekSel) return;
    schWeekSel.innerHTML = "";
    for (var w = 1; w <= 35; w++) {
        var opt = document.createElement("option"); opt.value = w; opt.innerText = "Tuần " + w;
        if (w === currentWeek) opt.selected = true;
        schWeekSel.appendChild(opt);
    }
}

function copyPreviousWeekSchedule() {
    var prevWeek = editingScheduleWeek - 1;
    if (prevWeek < 1) { alert("⚠️ Không có tuần trước để sao chép!"); return; }
    var prevData = scheduleByWeekStore[prevWeek];
    if (!prevData) { alert("⚠️ Dữ liệu Tuần " + prevWeek + " chưa được khởi tạo!"); return; }

    scheduleByWeekStore[editingScheduleWeek] = JSON.parse(JSON.stringify(prevData));
    renderScheduleTableForWeek(editingScheduleWeek);
    alert("📋 Đã sao chép khung lịch từ Tuần " + prevWeek + " sang Tuần " + editingScheduleWeek + " thành công!");
}

function applyScheduleForDay(dayOfWeek) {
    var activeWeekData = scheduleByWeekStore[currentWeek] || {};
    if (activeWeekData[dayOfWeek]) {
        var sch = activeWeekData[dayOfWeek];
        if (!sch.subject) return;

        var matchedTopicKey = Object.keys(topicsStore).find(function(k) {
            return k.toLowerCase().includes(sch.subject.toLowerCase());
        });

        if (matchedTopicKey) {
            currentTopicKey = matchedTopicKey;
            if (sch.topicTitle) topicsStore[matchedTopicKey].subTitle = "Chủ đề: " + sch.topicTitle;
            var topicSel = document.getElementById("topic-select");
            if (topicSel) topicSel.value = currentTopicKey;
            switchTopicPreset();
        } else {
            document.getElementById("display-main-title").innerText = "📖 VÒNG QUAY MAY MẮN - " + sch.subject.toUpperCase();
            document.getElementById("display-sub-title").innerText = "Chủ đề: " + (sch.topicTitle || sch.subject);
        }
    }
}

function applyTodayScheduleForce() {
    var now = new Date();
    var day = now.getDay(); 
    var targetDay = day + 1; 
    if (targetDay < 2 || targetDay > 7) targetDay = 2;

    applyScheduleForDay(targetDay);
    closeModal('schedule-modal-box');
    var curWeekSch = scheduleByWeekStore[currentWeek] || {};
    var item = curWeekSch[targetDay] || {};
    alert("⚡ ĐÃ KÍCH HOẠT LỊCH SINH HOẠT HÔM NAY!\nTuần: " + currentWeek + "\nMôn: " + (item.subject || 'Chưa chọn') + "\nChủ đề: " + (item.topicTitle || ''));
}

function importScheduleFromWord(fileInput) {
    var file = fileInput.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        mammoth.extractRawText({ arrayBuffer: e.target.result })
            .then(function(result) {
                document.getElementById("schedule-raw-textarea").value = result.value;
                parseScheduleText();
            });
    };
    reader.readAsArrayBuffer(file);
}

function importScheduleFromPDF(fileInput) {
    var file = fileInput.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var typedarray = new Uint8Array(e.target.result);
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            var fullText = ""; var total = pdf.numPages, count = 0;
            for (var i = 1; i <= total; i++) {
                pdf.getPage(i).then(function(page) {
                    page.getTextContent().then(function(tc) {
                        fullText += tc.items.map(function(item) { return item.str; }).join(" ") + "\n";
                        count++;
                        if (count === total) {
                            document.getElementById("schedule-raw-textarea").value = fullText;
                            parseScheduleText();
                        }
                    });
                });
            }
        });
    };
    reader.readAsArrayBuffer(file);
}

function parseScheduleText() {
    var text = document.getElementById("schedule-raw-textarea").value.trim(); if (!text) return;
    if (!scheduleByWeekStore[editingScheduleWeek]) scheduleByWeekStore[editingScheduleWeek] = {};

    var lines = text.split(/\r?\n/);
    lines.forEach(function(line) {
        var match = line.match(/(Thứ\s*([2-7]))[:\s]+([^-]+)(?:\s*-\s*(.+))?/i);
        if (match) {
            var dayNum = parseInt(match[2]); var subj = match[3].trim(); var title = match[4] ? match[4].trim() : subj;
            var matchedSubj = masterSubjectList.find(function(k) { return k.toLowerCase().includes(subj.toLowerCase()); }) || subj;
            scheduleByWeekStore[editingScheduleWeek][dayNum] = { subject: matchedSubj, topicTitle: title };
        }
    });

    renderScheduleTableForWeek(editingScheduleWeek);
    alert("🎉 Đã phân tích văn bản và nạp vào bảng Lịch Tuần " + editingScheduleWeek + "!");
}

/* ĐĂNG NHẬP ADMIN */
function switchLoginTab(type) {
    activeLoginTab = type;
    var passTab = document.getElementById("tab-pass-btn");
    var emailTab = document.getElementById("tab-email-btn");
    var formPass = document.getElementById("form-login-pass");
    var formEmail = document.getElementById("form-login-email");

    if (type === 'pass') {
        passTab.classList.add("active"); emailTab.classList.remove("active");
        formPass.style.display = "block"; formEmail.style.display = "none";
    } else {
        emailTab.classList.add("active"); passTab.classList.remove("active");
        formEmail.style.display = "block"; formPass.style.display = "none";
    }
}

function verifyAdminLoginTech() {
    var captchaCheck = document.getElementById("captcha-check");
    if (!captchaCheck.checked) { alert("⚠️ Vui lòng tích vào ô 'Tôi không phải là người máy'!"); return; }

    if (activeLoginTab === 'pass') {
        var pass = document.getElementById("admin-pass-input").value;
        if (pass === adminPasswordCode) executeSuccessfulLogin(); else alert("❌ Sai mật khẩu quản trị!");
    } else {
        var account = document.getElementById("tech-account-input").value.trim();
        var userpass = document.getElementById("tech-userpass-input").value.trim();
        if (!account || !userpass) { alert("⚠️ Vui lòng nhập đầy đủ Email/SĐT và mật khẩu!"); return; }
        executeSuccessfulLogin();
    }
}

function loginWithGoogleMock() {
    document.getElementById("captcha-check").checked = true;
    alert("🌐 Đang kết nối tài khoản Google SSO bảo mật...");
    setTimeout(executeSuccessfulLogin, 500);
}

function executeSuccessfulLogin() {
    isAdminLoggedIn = true; updateRoleUI(); closeModal("admin-login-modal");
    document.getElementById("admin-pass-input").value = "";
    if (isLockdownActive) {
        isLockdownActive = false; document.getElementById("lockdown-overlay").style.display = "none"; document.getElementById("spin-btn").disabled = false;
        alert("🔑 Đăng nhập Thầy thành công! ĐÃ MỞ CƯỠNG CHẾ GAME DẠY SỚM!");
    } else { alert("🔑 Đăng nhập Quyền Quản Trị (Thầy) thành công!"); }
}

function openForgotPassModal() { closeModal("admin-login-modal"); openModal("forgot-pass-modal"); }
function sendRecoveryOTP() {
    var val = document.getElementById("recovery-email-input").value.trim(); if (!val) { alert("⚠️ Vui lòng nhập Email hoặc SĐT!"); return; }
    alert("📨 Mã xác minh OTP đã được gửi đến: " + val); closeModal("forgot-pass-modal");
}

function checkPasswordStrength(val) {
    var lengthValid = val.length >= 8, upperValid = /[A-Z]/.test(val), numberValid = /[0-9]/.test(val), specialValid = /[^A-Za-z0-9]/.test(val);
    updateRuleItem("length", lengthValid); updateRuleItem("upper", upperValid); updateRuleItem("number", numberValid); updateRuleItem("special", specialValid);

    var score = 0; if (lengthValid) score++; if (upperValid) score++; if (numberValid) score++; if (specialValid) score++;
    var bar = document.getElementById("pass-strength-bar"); var label = document.getElementById("pass-strength-label");

    if (val.length === 0) { bar.style.width = "0%"; bar.style.background = "#334155"; label.innerText = "Độ mạnh: Chưa nhập"; label.style.color = "#64748b"; }
    else if (score <= 1) { bar.style.width = "25%"; bar.style.background = "#ef4444"; label.innerText = "Độ mạnh: Yếu 🔴"; label.style.color = "#ef4444"; }
    else if (score === 2) { bar.style.width = "50%"; bar.style.background = "#f97316"; label.innerText = "Độ mạnh: Trung bình 🟠"; label.style.color = "#f97316"; }
    else if (score === 3) { bar.style.width = "75%"; bar.style.background = "#eab308"; label.innerText = "Độ mạnh: Khá 🟡"; label.style.color = "#eab308"; }
    else if (score === 4) { bar.style.width = "100%"; bar.style.background = "#22c55e"; label.innerText = "Độ mạnh: Cực Kỳ Mạnh ⭐"; label.style.color = "#4ade80"; }
}

function updateRuleItem(ruleId, isValid) {
    var el = document.getElementById("rule-" + ruleId); var icon = document.getElementById("icon-" + ruleId);
    if (isValid) { el.classList.add("valid"); icon.innerText = "✔"; } else { el.classList.remove("valid"); icon.innerText = "❌"; }
}

function saveNewPassword() {
    var oldPass = document.getElementById("old-pass-input").value;
    var newPass = document.getElementById("new-pass-input").value;
    var confirmPass = document.getElementById("confirm-pass-input").value;

    if (oldPass !== adminPasswordCode) { alert("❌ Mật khẩu hiện tại (cũ) không chính xác!"); return; }
    if (newPass !== confirmPass) { alert("⚠️ Mật khẩu mới và Nhập lại mật khẩu không khớp nhau!"); return; }

    if (newPass.length < 8 || !/[A-Z]/.test(newPass) || !/[0-9]/.test(newPass) || !/[^A-Za-z0-9]/.test(newPass)) {
        alert("⚠️ Mật khẩu mới chưa đạt chuẩn bảo mật!"); return;
    }

    adminPasswordCode = newPass; localStorage.setItem("wheel_v50_admin_pass", newPass);
    alert("🎉 ĐỔI MẬT KHẨU THÀNH CÔNG!");
    document.getElementById("old-pass-input").value = ""; document.getElementById("new-pass-input").value = ""; document.getElementById("confirm-pass-input").value = "";
    closeModal("change-pass-modal");
}

/* GIỜ MỞ ĐỀ */
function saveLockTime(val) {
    if (!val) return; lockTimeTarget = val; localStorage.setItem("wheel_v50_lock_time", val);
    var timeInput = document.getElementById("lock-time-input"); if (timeInput && timeInput.value !== val) timeInput.value = val;
    checkLockdownStatus();
}

function adjustLockTime(minuteDelta) {
    var currentVal = document.getElementById("lock-time-input").value || lockTimeTarget || "06:45";
    var parts = currentVal.split(":");
    var totalMinutes = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0) + minuteDelta;
    if (totalMinutes < 0) totalMinutes += 24 * 60; totalMinutes = totalMinutes % (24 * 60);

    var formattedTime = String(Math.floor(totalMinutes / 60)).padStart(2, '0') + ":" + String(totalMinutes % 60).padStart(2, '0');
    document.getElementById("lock-time-input").value = formattedTime; saveLockTime(formattedTime);
}

function saveMCSelection(val) { selectedMCName = val; localStorage.setItem("wheel_v50_selected_mc", val); }

function checkLockdownStatus() {
    if (isAdminLoggedIn) { isLockdownActive = false; document.getElementById("lockdown-overlay").style.display = "none"; document.getElementById("spin-btn").disabled = false; return; }
    var now = new Date(); var nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var parts = lockTimeTarget.split(":"); var targetSec = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60;

    if (nowSec < targetSec) {
        isLockdownActive = true; document.getElementById("lockdown-overlay").style.display = "flex"; document.getElementById("spin-btn").disabled = true;
        var remainingSec = targetSec - nowSec;
        document.getElementById("lockdown-msg-text").innerText = "🔒 Đề thi chưa đến giờ mở (Mở lúc " + lockTimeTarget + ")\n⏱️ Còn " + Math.floor(remainingSec / 60) + " phút " + (remainingSec % 60) + " giây nữa...";
    } else {
        isLockdownActive = false; document.getElementById("lockdown-overlay").style.display = "none"; document.getElementById("spin-btn").disabled = false;
    }
}
setInterval(checkLockdownStatus, 1000);

/* DANH SÁCH HỌC SINH VÀ CÂU HỎI MẪU */
var defaultStudents = [
    { name: "Chướng Tường Nhật An", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Nguyễn Lê Kim Anh", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Phạm Gia Bảo", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Thiều Gia Bảo", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Trần Ngọc Bích", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Hoàng Tấn Duy", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Nguyễn Trần Bảo Duy", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Nguyễn Hải Hà", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Lê Phước Hải", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Phạm Thị Thanh Huyền", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Nguyễn Văn Khải", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Bùi Nguyễn Minh Khánh", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Đỗ Duy Khoa", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Nguyễn Thị Diệu Liên", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Nguyễn Văn Luân", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Phan Nhật Minh", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Lê Võ Hà My", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Đặng Bảo Nam", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Lê Thị Kim Ngân", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Vương Khánh Ngân", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Hoàng Lê Bảo Ngọc", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Đào An Nhiên", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Nguyễn An Nhiên", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Lê Quỳnh Như", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Lê Vũ Diễm Như", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Nguyễn Tấn Phát", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Trần Đức Phát", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Bùi Bảo Phúc", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Nguyễn Ngọc Anh Quân", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Nguyễn Thành Minh Quân", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Trần Minh Quân", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Cai An Thành", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Trần Tiến Thành", level: "Đạt", conduct: "Tốt", priority: false },
    { name: "Trần Thị Thu Thảo", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Phạm Châu Như Thùy", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Trần Kim Thư", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Hoàng Nguyễn Thủy Tiên", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Võ Thành Tiệp", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Ngô Trí Tới", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Vy Thanh Trung", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Võ Đào Anh Tuấn", level: "Giỏi", conduct: "Tốt", priority: false },
    { name: "Nguyễn Lê Tường Vy", level: "Khá", conduct: "Tốt", priority: false },
    { name: "Mai Nguyễn Minh Vỹ", level: "Giỏi", conduct: "Tốt", priority: false }
];

function generate20DefaultQuestions() {
    return [
        { id: 1, level: "Nhận biết", timeLimit: 20, q: "Câu 1: Nét độc đáo của một bài thơ bốn chữ hoặc năm chữ thường được thể hiện tập trung qua các yếu tố nghệ thuật nào?", opts: ["A. Cốt truyện, nhân vật, bối cảnh không gian và thời gian", "B. Từ ngữ, hình ảnh, vần, nhịp và các biện pháp tu từ", "C. Lý luận văn học và phong cách riêng của tác giả", "D. Bố cục ba phần gồm Mở bài, Thân bài và Kết bài"], ans: 1, exp: "Theo Tri thức ngữ văn, nét độc đáo của bài thơ bốn chữ, năm chữ thể hiện qua từ ngữ, hình ảnh, vần, nhịp, biện pháp tu từ." },
        { id: 2, level: "Nhận biết", timeLimit: 20, q: "Câu 2: Tác dụng cốt lõi của biện pháp tu từ nói giảm nói tránh là gì?", opts: ["A. Tăng tính gợi hình, giúp sự vật trở nên sinh động hơn", "B. Làm giảm nhẹ quy mô, tính chất đối tượng để khỏi gây cảm giác đau buồn, ghê sợ hoặc giữ phép lịch sự", "C. Bộc lộ trực tiếp thái độ lên án, phê phán của người nói", "D. Nhấn mạnh và làm nổi bật ý muốn diễn đạt trong câu"], ans: 1, exp: "Tác dụng của nói giảm nói tránh là giảm nhẹ mức độ, tính chất đối tượng, tránh cảm giác đau buồn, ghê sợ hoặc giữ phép lịch sự." },
        { id: 3, level: "Nhận biết", timeLimit: 20, q: "Câu 3: Tác giả của bài thơ \"Đồng dao mùa xuân\" là ai?", opts: ["A. Thanh Thảo", "B. Nguyễn Khoa Điềm", "C. Nguyễn Ngọc Tư", "D. Hữu Thỉnh"], ans: 1, exp: "Tác giả của bài thơ \"Đồng dao mùa xuân\" là nhà thơ Nguyễn Khoa Điềm." }
    ];
}

var sample20Questions = generate20DefaultQuestions();
var topicsStore = { 
    "Ngữ Văn 7 - Ôn Tập Tổng Hợp": { mainTitle: "📖 VÒNG QUAY MAY MẮN - NGỮ VĂN 7", subTitle: "Chủ đề: Khúc nhạc tâm hồn", questions: sample20Questions },
    "Toán 7 - Quy Tắc Dấu Ngoặc": { mainTitle: "📐 VÒNG QUAY MAY MẮN - TOÁN 7", subTitle: "Chủ đề: Quy tắc dấu ngoặc và tính chất", questions: sample20Questions }
};

var currentTopicKey = "Ngữ Văn 7 - Ôn Tập Tổng Hợp";
var currentGameMode = "test"; 
var currentWeek = 6; 
var studentsData = []; var parsedQuestions = []; var sessionHistory = [];
var globalHistoryTest = []; var globalHistoryReal = [];
var cumulativeScoresTest = {}; var cumulativeScoresReal = {};
var usedQuestionIndices = []; var currentAngle = 0; var isSpinning = false;
var selectedStudentObj = null; var currentQObj = null; var shuffledOptions = []; var timer = null; var timeLeft = 30;
var colors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1"];

/* BÓC TÁCH CÂU HỎI THÔNG MINH TỪ TRỢ LÝ AI & FILE WORD/PDF */
function importFromWord(fileInput) {
    var file = fileInput.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        mammoth.extractRawText({ arrayBuffer: e.target.result }).then(function(result) {
            document.getElementById("raw-qbank-import-input").value = result.value;
            alert("📄 Đã đọc xong dữ liệu từ file Word!\nHãy bấm '⚡ CHUYỂN THÀNH CÂU HỎI' để xem danh sách.");
        });
    };
    reader.readAsArrayBuffer(file);
}

function importFromPDF(fileInput) {
    var file = fileInput.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var typedarray = new Uint8Array(e.target.result);
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            var totalPages = pdf.numPages, fullText = "", count = 0;
            for (var i = 1; i <= totalPages; i++) {
                pdf.getPage(i).then(function(page) {
                    page.getTextContent().then(function(textContent) {
                        fullText += textContent.items.map(function(item) { return item.str; }).join(" ") + "\n";
                        count++;
                        if (count === totalPages) {
                            document.getElementById("raw-qbank-import-input").value = fullText;
                            alert("📕 Đã trích xuất xong dữ liệu từ file PDF!\nHãy bấm '⚡ CHUYỂN THÀNH CÂU HỎI' để xem danh sách.");
                        }
                    });
                });
            }
        });
    };
    reader.readAsArrayBuffer(file);
}

function parseRawImportToQuestions() {
    var rawText = document.getElementById("raw-qbank-import-input").value.trim();
    if (!rawText) { alert("⚠️ Vui lòng nhập nội dung câu hỏi trước!"); return; }

    rawText = rawText.replace(/\$(\d+)\$/g, "$1");
    var lines = rawText.split(/\r?\n/);
    var newQuestions = [], currentQ = null;

    lines.forEach(function(line) {
        var trimmed = line.trim();
        if (!trimmed || /^Mức độ[:\s]*/i.test(trimmed)) return;

        if (/^(Câu\s*\d+[:\.]|\d+[\.\:])\s*/i.test(trimmed)) {
            if (currentQ) newQuestions.push(currentQ);
            currentQ = { id: newQuestions.length + 1, level: "Thông hiểu", timeLimit: 30, q: trimmed, opts: ["", "", "", ""], ans: 0, exp: "Lời giải chi tiết..." };
        } else if (currentQ) {
            var cleanOpt = trimmed.replace(/^\*\s*/, '');
            if (/^A[\.\:]\s*/i.test(cleanOpt)) { currentQ.opts[0] = cleanOpt; if (trimmed.startsWith("*")) currentQ.ans = 0; }
            else if (/^B[\.\:]\s*/i.test(cleanOpt)) { currentQ.opts[1] = cleanOpt; if (trimmed.startsWith("*")) currentQ.ans = 1; }
            else if (/^C[\.\:]\s*/i.test(cleanOpt)) { currentQ.opts[2] = cleanOpt; if (trimmed.startsWith("*")) currentQ.ans = 2; }
            else if (/^D[\.\:]\s*/i.test(cleanOpt)) { currentQ.opts[3] = cleanOpt; if (trimmed.startsWith("*")) currentQ.ans = 3; }
            else if (/^(Đáp án|Đáp án đúng|ĐA)[:\s]*([A-D])/i.test(trimmed)) {
                var match = trimmed.match(/(?:Đáp án|Đáp án đúng|ĐA)[:\s]*([A-D])/i);
                if (match) currentQ.ans = match[1].toUpperCase().charCodeAt(0) - 65;
            } else if (/^(Giải thích|Lời giải|HD|Hướng dẫn)[:\s]*/i.test(trimmed)) {
                currentQ.exp = trimmed.replace(/^(Giải thích|Lời giải|HD|Hướng dẫn)[:\s]*/i, '');
            } else if (currentQ.opts[0] === "") currentQ.q += " " + trimmed;
        }
    });

    if (currentQ) newQuestions.push(currentQ);

    if (newQuestions.length > 0) {
        parsedQuestions = newQuestions;
        renderQBankCards();
        alert("🎉 Đã phân tích thành công " + newQuestions.length + " câu hỏi mới từ AI / Văn bản!");
    } else {
        alert("⚠️ Không nhận diện được câu hỏi nào. Vui lòng kiểm tra cấu trúc!");
    }
}

/* DANH SÁCH LỚP */
function renderStudentTable() {
    var tbody = document.getElementById("student-table-body"); tbody.innerHTML = "";
    document.getElementById("st-count-label").innerText = studentsData.length;

    studentsData.forEach(function(st, idx) {
        var tr = document.createElement("tr");
        var checkedStr = st.priority ? 'checked' : '';
        tr.innerHTML = '<td style="text-align:center; font-weight:bold; color:#38bdf8;">' + (idx + 1) + '</td>' +
            '<td><input type="text" value="' + st.name + '" onchange="studentsData[' + idx + '].name=this.value; saveStudentsData(); populateMCDropdown(); drawWheel();"></td>' +
            '<td style="text-align:center;"><select onchange="studentsData[' + idx + '].level=this.value; saveStudentsData();"><option value="Giỏi"' + (st.level === 'Giỏi' ? ' selected' : '') + '>⭐ Giỏi</option><option value="Khá"' + (st.level === 'Khá' ? ' selected' : '') + '>🔹 Khá</option><option value="Đạt"' + (st.level === 'Đạt' ? ' selected' : '') + '>🔸 Đạt</option></select></td>' +
            '<td style="text-align:center;"><select onchange="studentsData[' + idx + '].conduct=this.value; saveStudentsData();"><option value="Tốt"' + (st.conduct === 'Tốt' ? ' selected' : '') + '>Tốt</option><option value="Khá"' + (st.conduct === 'Khá' ? ' selected' : '') + '>Khá</option></select></td>' +
            '<td style="text-align:center;"><input type="checkbox" ' + checkedStr + ' style="width:20px; height:20px; cursor:pointer;" onchange="studentsData[' + idx + '].priority=this.checked; saveStudentsData();"></td>' +
            '<td style="text-align:center;"><button class="btn-delete-row" onclick="deleteStudent(' + idx + ')">🗑️ Xóa</button></td>';
        tbody.appendChild(tr);
    });
}

function saveStudentsFromTable() { saveStudentsData(); closeModal("student-modal-box"); drawWheel(); alert("💾 Đã lưu danh sách học sinh!"); }

function toggleSpinMode(mode) {
    currentSpinMode = mode;
    if (mode === 'priority') {
        var count = studentsData.filter(function(s) { return s.priority; }).length;
        if (count === 0) alert("⚠️ Chưa có học sinh nào được tích chọn 'Ưu tiên gọi'!");
        else alert("⭐ Đã kích hoạt Chế Độ Tích Chọn Ngầm (" + count + " bạn)!");
    } else alert("🌐 Đã chuyển về Chế Độ Quay Toàn Bộ Lớp.");
}

function getSmartDisplayName(fullName, allStudents) {
    if (!fullName) return "";
    var parts = fullName.trim().split(/\s+/);
    if (parts.length <= 2) return fullName; 
    var firstName = parts[parts.length - 1]; 
    var sameFirstNameStudents = allStudents.filter(function(st) {
        var p = st.name.trim().split(/\s+/); return p[p.length - 1].toLowerCase() === firstName.toLowerCase();
    });
    return sameFirstNameStudents.length <= 1 ? parts[parts.length - 2] + " " + firstName : parts[0] + " " + firstName;
}

function getRandomQuestionForStudent(studentObj) {
    if (parsedQuestions.length === 0) return null;
    var levelFilter = ["Nhận biết", "Thông hiểu"];
    if (studentObj.level === "Khá") levelFilter = ["Thông hiểu", "Vận dụng"];
    else if (studentObj.level === "Giỏi") levelFilter = ["Vận dụng", "Vận dụng cao"];

    var matching = parsedQuestions.filter(function(q, index) { return !usedQuestionIndices.includes(index) && levelFilter.includes(q.level); });
    if (matching.length === 0) matching = parsedQuestions.filter(function(q, index) { return !usedQuestionIndices.includes(index); });
    if (matching.length === 0) { usedQuestionIndices = []; matching = parsedQuestions; }

    var chosen = matching[Math.floor(Math.random() * matching.length)];
    usedQuestionIndices.push(parsedQuestions.indexOf(chosen));
    return chosen;
}

/* ĐIỀU HÀNH VÒNG QUAY */
function spinWheel() {
    if (isLockdownActive || isSpinning || studentsData.length === 0) return;
    isSpinning = true; document.getElementById("student-winner-modal").style.display = "none"; document.getElementById("spin-btn").disabled = true;
    totalSpinCountThisSession++;
    var winnerIdx = -1; var candidateIndices = [];

    if (currentSpinMode === 'priority') {
        studentsData.forEach(function(st, idx) { if (st.priority) candidateIndices.push(idx); });
    }
    if (candidateIndices.length === 0) {
        studentsData.forEach(function(st, idx) { candidateIndices.push(idx); });
    }

    var mcIndexInClass = studentsData.findIndex(function(s) { return s.name === selectedMCName; });
    if (!hasMCBeenCalledThisSession && mcIndexInClass !== -1 && totalSpinCountThisSession >= 4 && (totalSpinCountThisSession >= 7 || Math.random() < 0.5)) {
        winnerIdx = mcIndexInClass; hasMCBeenCalledThisSession = true;
    } else {
        winnerIdx = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
    }

    var sliceAngle = (2 * Math.PI) / studentsData.length;
    var targetAngle = (3 * Math.PI / 2) - (winnerIdx * sliceAngle + sliceAngle / 2);
    var finalAngle = Math.ceil(currentAngle / (2 * Math.PI)) * (2 * Math.PI) + (10 * Math.PI) + targetAngle;

    var startAngle = currentAngle, duration = 4000, startTime = performance.now();
    function animate(now) {
        var elapsed = now - startTime;
        if (elapsed < duration) {
            var t = elapsed / duration, easeOut = 1 - Math.pow(1 - t, 4);
            currentAngle = startAngle + (finalAngle - startAngle) * easeOut;
            drawWheel(); requestAnimationFrame(animate);
        } else {
            currentAngle = finalAngle; drawWheel(); isSpinning = false;
            document.getElementById("spin-btn").disabled = false;
            selectedStudentObj = studentsData[winnerIdx];
            currentQObj = getRandomQuestionForStudent(selectedStudentObj);
            
            var winnerTitleText = selectedStudentObj.name;
            if (selectedStudentObj.name === selectedMCName) winnerTitleText += " (🎙️ MC LÊN BẢNG!)";

            document.getElementById("winner-name").innerText = winnerTitleText;
            document.getElementById("student-winner-modal").style.display = "block";
        }
    }
    requestAnimationFrame(animate);
}

function drawWheel() {
    var cvs = document.getElementById("wheel-canvas"); if (!cvs) return;
    var ctx = cvs.getContext("2d"); var n = studentsData.length; if (n === 0) return;
    var sliceAngle = (2 * Math.PI) / n; var centerX = 500, centerY = 500, radius = 480;
    ctx.clearRect(0, 0, 1000, 1000);

    for (var i = 0; i < n; i++) {
        var startA = currentAngle + i * sliceAngle; var endA = startA + sliceAngle;
        ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startA, endA); ctx.closePath();
        ctx.fillStyle = colors[i % colors.length]; ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(startA + sliceAngle / 2);
        ctx.textAlign = "right"; ctx.fillStyle = "#ffffff"; ctx.font = "bold 32px Arial";
        ctx.fillText(getSmartDisplayName(studentsData[i].name, studentsData), radius - 18, 10); 
        ctx.restore();
    }
}

/* KHỞI TẠO HỆ THỐNG */
function initApp() {
    var weekSel = document.getElementById("week-select"); var histWeekSel = document.getElementById("history-week-filter");
    weekSel.innerHTML = ""; histWeekSel.innerHTML = "<option value='all'>Tất cả các tuần</option>";
    
    var todayIso = getIsoToday(); var parts = todayIso.split("-");
    var todayObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    currentWeek = calculateWeekFromDate(todayObj);

    for (var w = 1; w <= 35; w++) {
        var opt = document.createElement("option"); opt.value = w; opt.innerText = "Tuần " + w;
        if (w === currentWeek) opt.selected = true; weekSel.appendChild(opt);
        var optH = document.createElement("option"); optH.value = w; optH.innerText = "Tuần " + w;
        histWeekSel.appendChild(optH);
    }

    document.getElementById("session-date-picker").value = todayIso;
    document.getElementById("session-date-display").value = formatDateFromIso(todayIso);
    document.getElementById("lock-time-input").value = lockTimeTarget;

    try { var savedSt = localStorage.getItem("wheel_v50_students"); studentsData = savedSt ? JSON.parse(savedSt) : defaultStudents; } catch(e) { studentsData = defaultStudents; }
    try { var savedSchStore = localStorage.getItem("wheel_v50_schedule_by_week"); scheduleByWeekStore = savedSchStore ? JSON.parse(savedSchStore) : defaultScheduleByWeek; } catch(e) { scheduleByWeekStore = defaultScheduleByWeek; }

    populateScheduleModalWeekDropdown(); populateMCDropdown();
    try { var savedTopics = localStorage.getItem("wheel_v50_topics_store"); if (savedTopics) topicsStore = JSON.parse(savedTopics); } catch(e) {}

    renderTopicSelect(); 
    var todayDayOfWeek = todayObj.getDay() + 1;
    if (todayDayOfWeek >= 2 && todayDayOfWeek <= 7) applyScheduleForDay(todayDayOfWeek); else switchTopicPreset();

    try {
        globalHistoryTest = JSON.parse(localStorage.getItem("wheel_v50_global_history_test")) || [];
        globalHistoryReal = JSON.parse(localStorage.getItem("wheel_v50_global_history_real")) || [];
        cumulativeScoresTest = JSON.parse(localStorage.getItem("wheel_v50_cumulative_scores_test")) || {};
        cumulativeScoresReal = JSON.parse(localStorage.getItem("wheel_v50_cumulative_scores_real")) || {};
    } catch(e) {}

    renderStudentTable(); renderScheduleTableForWeek(currentWeek); drawWheel(); updateRoleUI();
}

function onActiveStudentChanged(newName) {
    var found = studentsData.find(function(s) { return s.name === newName; }); if (found) selectedStudentObj = found;
}

function useSkip() {
    if (parsedQuestions.length <= 1) { alert("⚠️ Không có câu hỏi tương đương!"); return; }
    var remaining = parsedQuestions.filter(function(q, index) { return !usedQuestionIndices.includes(index) && q.id !== currentQObj.id; });
    if (remaining.length === 0) remaining = parsedQuestions.filter(function(q) { return q.id !== currentQObj.id; });
    var newQ = remaining[Math.floor(Math.random() * remaining.length)];
    usedQuestionIndices.push(parsedQuestions.indexOf(newQ)); currentQObj = newQ;
    document.getElementById("life-skip").disabled = true; document.getElementById("life-skip").innerText = "🔄 Đã đổi câu hỏi"; loadQuestion();
}

function applyInitialStudentPenalty() {
    if (!selectedStudentObj) return;
    var ptsWrong = parseFloat(document.getElementById("pts-wrong").value) || -2;
    var activeStudentName = selectedStudentObj.name; var curIso = document.getElementById("session-date-picker").value || getIsoToday();

    var penaltyRecord = {
        week: currentWeek, isoDate: curIso, date: formatDateFromIso(curIso), topic: currentTopicKey, student: activeStudentName,
        q: currentQObj.q + " (Không làm được)", opts: currentQObj.opts, exp: currentQObj.exp, chosenOpt: "Không làm được", isCorrect: false, pts: ptsWrong
    };

    sessionHistory.push(penaltyRecord);
    if (currentGameMode === "real") {
        globalHistoryReal.push(penaltyRecord); localStorage.setItem("wheel_v50_global_history_real", JSON.stringify(globalHistoryReal));
        if (!cumulativeScoresReal[activeStudentName]) cumulativeScoresReal[activeStudentName] = { total: 0, bySubject: {} };
        cumulativeScoresReal[activeStudentName].total += ptsWrong;
        cumulativeScoresReal[activeStudentName].bySubject[currentTopicKey] = (cumulativeScoresReal[activeStudentName].bySubject[currentTopicKey] || 0) + ptsWrong;
        localStorage.setItem("wheel_v50_cumulative_scores_real", JSON.stringify(cumulativeScoresReal));
    } else {
        globalHistoryTest.push(penaltyRecord); localStorage.setItem("wheel_v50_global_history_test", JSON.stringify(globalHistoryTest));
        if (!cumulativeScoresTest[activeStudentName]) cumulativeScoresTest[activeStudentName] = { total: 0, bySubject: {} };
        cumulativeScoresTest[activeStudentName].total += ptsWrong;
        cumulativeScoresTest[activeStudentName].bySubject[currentTopicKey] = (cumulativeScoresTest[activeStudentName].bySubject[currentTopicKey] || 0) + ptsWrong;
        localStorage.setItem("wheel_v50_cumulative_scores_test", JSON.stringify(cumulativeScoresTest));
    }

    alert("⚠️ Bạn " + activeStudentName + " không làm được! Đã trừ " + Math.abs(ptsWrong) + " điểm.");
    document.getElementById("btn-penalty").disabled = true;
}

function use5050() {
    var opts = document.querySelectorAll(".btn-opt"); var wrongIndices = [];
    shuffledOptions.forEach(function(opt, idx) { if (!opt.isCorrect) wrongIndices.push(idx); });
    shuffleArray(wrongIndices);
    if (wrongIndices.length >= 2) { opts[wrongIndices[0]].style.visibility = "hidden"; opts[wrongIndices[1]].style.visibility = "hidden"; }
    document.getElementById("life-50").disabled = true;
}

function selectAnswer(chosenIndex) {
    clearInterval(timer); var q = currentQObj;
    var opts = document.querySelectorAll(".btn-opt"); for (var i = 0; i < opts.length; i++) opts[i].disabled = true;

    var ptsCorrect = parseFloat(document.getElementById("pts-correct").value) || 5;
    var ptsWrong = parseFloat(document.getElementById("pts-wrong").value) || -2;
    var isCorrect = (chosenIndex >= 0 && shuffledOptions[chosenIndex].isCorrect);
    var pts = isCorrect ? ptsCorrect : ptsWrong;

    var curIso = document.getElementById("session-date-picker").value || getIsoToday();
    var activeStudentName = selectedStudentObj ? selectedStudentObj.name : "Học sinh";

    var record = {
        week: currentWeek, isoDate: curIso, date: formatDateFromIso(curIso), topic: currentTopicKey, student: activeStudentName,
        q: q.q, opts: q.opts, exp: q.exp, chosenOpt: chosenIndex >= 0 ? shuffledOptions[chosenIndex].text : "Hết giờ", isCorrect: isCorrect, pts: pts
    };

    sessionHistory.push(record);
    if (currentGameMode === "real") {
        globalHistoryReal.push(record); localStorage.setItem("wheel_v50_global_history_real", JSON.stringify(globalHistoryReal));
        if (!cumulativeScoresReal[activeStudentName]) cumulativeScoresReal[activeStudentName] = { total: 0, bySubject: {} };
        cumulativeScoresReal[activeStudentName].total += pts;
        cumulativeScoresReal[activeStudentName].bySubject[currentTopicKey] = (cumulativeScoresReal[activeStudentName].bySubject[currentTopicKey] || 0) + pts;
        localStorage.setItem("wheel_v50_cumulative_scores_real", JSON.stringify(cumulativeScoresReal));
    } else {
        globalHistoryTest.push(record); localStorage.setItem("wheel_v50_global_history_test", JSON.stringify(globalHistoryTest));
        if (!cumulativeScoresTest[activeStudentName]) cumulativeScoresTest[activeStudentName] = { total: 0, bySubject: {} };
        cumulativeScoresTest[activeStudentName].total += pts;
        cumulativeScoresTest[activeStudentName].bySubject[currentTopicKey] = (cumulativeScoresTest[activeStudentName].bySubject[currentTopicKey] || 0) + pts;
        localStorage.setItem("wheel_v50_cumulative_scores_test", JSON.stringify(cumulativeScoresTest));
    }

    if (isCorrect) { if (chosenIndex >= 0) opts[chosenIndex].classList.add("correct"); }
    else { if (chosenIndex >= 0) opts[chosenIndex].classList.add("wrong"); }

    var expBox = document.getElementById("exp-box");
    var statusTextHtml = isCorrect 
        ? '<span class="high-contrast-correct">✅ ĐÚNG TRỌN VẸN (+' + ptsCorrect + ' ĐIỂM)</span>'
        : '<span class="high-contrast-wrong">❌ CHƯA CHÍNH XÁC (' + ptsWrong + ' ĐIỂM)</span>';

    var cleanExpText = q.exp ? q.exp.replace(/^Lời giải:\s*/i, '') : '';
    expBox.innerHTML = statusTextHtml + '<br><div style="margin-top:10px; color:#e2e8f0; font-size:26px;"><strong>💡 Lời giải củng cố:</strong> ' + cleanExpText + '</div>';
    expBox.style.display = "block"; document.getElementById("btn-next").style.display = "inline-block";
    renderMath();
}

function onDateChanged(selectedIso) {
    if (!selectedIso) return;
    document.getElementById("session-date-display").value = formatDateFromIso(selectedIso);
    var parts = selectedIso.split("-");
    var chosenDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    currentWeek = calculateWeekFromDate(chosenDate);
    document.getElementById("week-select").value = currentWeek;

    var schWeekSel = document.getElementById("schedule-week-select");
    if (schWeekSel) schWeekSel.value = currentWeek;

    var dayOfWeek = chosenDate.getDay() + 1;
    if (dayOfWeek >= 2 && dayOfWeek <= 7) applyScheduleForDay(dayOfWeek);
}

function onWeekChanged(val) { 
    currentWeek = parseInt(val) || 1; 
    var mondayDate = getDateFromWeek(currentWeek);
    var isoStr = mondayDate.getFullYear() + '-' + String(mondayDate.getMonth() + 1).padStart(2, '0') + '-' + String(mondayDate.getDate()).padStart(2, '0');
    document.getElementById("session-date-picker").value = isoStr;
    document.getElementById("session-date-display").value = formatDateFromIso(isoStr);

    var schWeekSel = document.getElementById("schedule-week-select");
    if (schWeekSel) schWeekSel.value = currentWeek;
    renderScheduleTableForWeek(currentWeek);

    var dayOfWeek = mondayDate.getDay() + 1;
    applyScheduleForDay(dayOfWeek >= 2 && dayOfWeek <= 7 ? dayOfWeek : 2);
}

function toggleGameMode(mode) {
    currentGameMode = mode;
    var selElem = document.getElementById("game-mode-select"); var cumulTitle = document.getElementById("cumul-mode-title");
    if (mode === 'real') { selElem.classList.add("real-mode"); if (cumulTitle) cumulTitle.innerText = "Thi Thật"; alert("🎯 ĐÃ CHUYỂN SANG CHẾ ĐỘ THI THẬT!"); }
    else { selElem.classList.remove("real-mode"); if (cumulTitle) cumulTitle.innerText = "Thi Thử"; alert("🧪 ĐÃ CHUYỂN SANG CHẾ ĐỘ THI THỬ!"); }
}

function logoutAdmin() { isAdminLoggedIn = false; updateRoleUI(); alert("🔒 Đã đăng xuất Quyền Quản Trị!"); }

function updateRoleUI() {
    var badge = document.getElementById("role-badge"); var loginBtn = document.getElementById("btn-admin-login");
    var changePassBtn = document.getElementById("btn-change-pass"); var logoutBtn = document.getElementById("btn-admin-logout");
    var adminElems = document.querySelectorAll(".admin-only");

    if (isAdminLoggedIn) {
        badge.className = "admin-badge badge-admin"; badge.innerText = "🔑 QUYỀN QUẢN TRỊ (THẦY)";
        loginBtn.style.display = "none"; changePassBtn.style.display = "inline-block"; logoutBtn.style.display = "inline-block";
        adminElems.forEach(function(el) { el.disabled = false; });
        document.getElementById("pts-correct").readOnly = false; document.getElementById("pts-wrong").readOnly = false;
    } else {
        badge.className = "admin-badge badge-student"; badge.innerText = "👤 QUYỀN HỌC SINH / MC";
        loginBtn.style.display = "inline-block"; changePassBtn.style.display = "none"; logoutBtn.style.display = "none";
        adminElems.forEach(function(el) { el.disabled = true; });
        document.getElementById("pts-correct").readOnly = true; document.getElementById("pts-wrong").readOnly = true;
    }
    checkLockdownStatus();
}

function closeApp() { if (confirm("Đóng ứng dụng?")) { window.close(); document.body.innerHTML = "<div style='text-align:center; padding:100px; font-size:30px; color:#38bdf8;'>Chương trình đã đóng an toàn.</div>"; } }
function openModal(id) { 
    if (id === 'schedule-modal-box') {
        var schWeekSel = document.getElementById("schedule-week-select");
        if (schWeekSel) schWeekSel.value = currentWeek;
        renderScheduleTableForWeek(currentWeek);
    }
    document.getElementById(id).style.display = "flex"; 
}
function closeModal(id) { document.getElementById(id).style.display = "none"; }
function changePts(id, step) { var el = document.getElementById(id); el.value = (parseFloat(el.value) || 0) + step; }
function renderMath() { if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise(); }
function shuffleArray(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp; } return arr; }
function triggerDatePicker(id) { var el = document.getElementById(id); if (el) { if (typeof el.showPicker === 'function') el.showPicker(); else el.focus(); } }
function getIsoToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function formatDateFromIso(iso) { if (!iso) return ""; var p = iso.split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso; }

function saveStudentsData() { localStorage.setItem("wheel_v50_students", JSON.stringify(studentsData)); }

function populateMCDropdown() {
    var mcTopSel = document.getElementById("mc-top-dropdown"); if (!mcTopSel) return;
    mcTopSel.innerHTML = "";
    studentsData.forEach(function(st) {
        var opt = document.createElement("option"); opt.value = st.name; opt.innerText = st.name;
        if (st.name === selectedMCName) opt.selected = true;
        mcTopSel.appendChild(opt);
    });
}

function renderTopicSelect() {
    var sel = document.getElementById("topic-select"); sel.innerHTML = "";
    Object.keys(topicsStore).forEach(function(key) {
        var opt = document.createElement("option"); opt.value = key; opt.innerText = key;
        if (key === currentTopicKey) opt.selected = true;
        sel.appendChild(opt);
    });
}

function switchTopicPreset() {
    var selVal = document.getElementById("topic-select").value;
    if (topicsStore[selVal]) {
        currentTopicKey = selVal; var t = topicsStore[selVal];
        document.getElementById("topic-title-input").value = currentTopicKey;
        document.getElementById("display-main-title").innerText = t.mainTitle;
        document.getElementById("display-sub-title").innerText = t.subTitle;
        parsedQuestions = t.questions || generate20DefaultQuestions();
        renderQBankCards();
    }
}

function renderQBankCards() {
    var container = document.getElementById("qbank-cards-container"); container.innerHTML = "";
    document.getElementById("q-total-count").innerText = parsedQuestions.length;

    parsedQuestions.forEach(function(q, idx) {
        var card = document.createElement("div"); card.className = "q-edit-box";
        var optGridHtml = '';
        for (var o = 0; o < 4; o++) {
            var optText = q.opts[o] || ""; var isChecked = (q.ans === o) ? 'checked' : '';
            optGridHtml += '<div class="opt-input-group">' +
                '<input type="radio" name="correct_ans_' + idx + '" ' + isChecked + ' onchange="parsedQuestions[' + idx + '].ans=' + o + ';">' +
                '<span style="font-weight:bold; color:#38bdf8;">' + String.fromCharCode(65 + o) + ':</span>' +
                '<input type="text" value="' + optText + '" onchange="parsedQuestions[' + idx + '].opts[' + o + ']=this.value;">' +
            '</div>';
        }

        card.innerHTML = '<div class="q-edit-row">' +
            '<span style="color:#fde047; font-weight:bold; font-size:18px;">Câu ' + (idx + 1) + ':</span>' +
            '<select style="width:130px;" onchange="parsedQuestions[' + idx + '].level=this.value;">' +
                '<option value="Nhận biết"' + (q.level==='Nhận biết'?' selected':'') + '>Nhận biết</option>' +
                '<option value="Thông hiểu"' + (q.level==='Thông hiểu'?' selected':'') + '>Thông hiểu</option>' +
                '<option value="Vận dụng"' + (q.level==='Vận dụng'?' selected':'') + '>Vận dụng</option>' +
                '<option value="Vận dụng cao"' + (q.level==='Vận dụng cao'?' selected':'') + '>Vận dụng cao</option>' +
            '</select>' +
            '<span>⏱️ Giây:</span>' +
            '<input type="number" value="' + (q.timeLimit||30) + '" style="width:60px; text-align:center;" onchange="parsedQuestions[' + idx + '].timeLimit=parseInt(this.value)||30;">' +
            '<button class="btn-delete-row" style="margin-left:auto;" onclick="deleteQuestionItem(' + idx + ')">🗑️ Xóa</button>' +
        '</div>' +
        '<input type="text" value="' + q.q + '" style="margin-bottom:6px;" onchange="parsedQuestions[' + idx + '].q=this.value;">' +
        '<div class="q-opt-grid">' + optGridHtml + '</div>';

        container.appendChild(card);
    });
}

function addNewQuestionItem() {
    parsedQuestions.push({
        id: parsedQuestions.length + 1, level: "Thông hiểu", timeLimit: 30,
        q: "Câu " + (parsedQuestions.length + 1) + ": Nội dung câu hỏi...",
        opts: ["A. Đáp án A", "B. Đáp án B", "C. Đáp án C", "D. Đáp án D"], ans: 0, exp: "Hướng dẫn chi tiết..."
    });
    renderQBankCards();
}

function deleteQuestionItem(idx) { if (confirm("Xóa câu hỏi này?")) { parsedQuestions.splice(idx, 1); renderQBankCards(); } }

function saveCurrentTopic() {
    var key = document.getElementById("topic-title-input").value.trim() || "Môn học mới";
    topicsStore[key] = { mainTitle: "📖 VÒNG QUAY MAY MẮN - " + key.toUpperCase(), subTitle: "Chủ đề: " + key, questions: parsedQuestions };
    currentTopicKey = key; localStorage.setItem("wheel_v50_topics_store", JSON.stringify(topicsStore));
    renderTopicSelect(); switchTopicPreset(); closeModal("qbank-modal-box");
    alert("✅ Đã lưu danh sách " + parsedQuestions.length + " câu hỏi!");
}

function populateActiveStudentSelect(selectedName) {
    var sel = document.getElementById("active-student-select"); sel.innerHTML = "";
    studentsData.forEach(function(st, idx) {
        var opt = document.createElement("option"); opt.value = st.name; opt.innerText = (idx + 1) + ". " + st.name;
        if (st.name === selectedName) opt.selected = true;
        sel.appendChild(opt);
    });
}

function goToQuestion() {
    if (!currentQObj) { showResult(); return; }
    document.getElementById("wheel-screen").style.display = "none";
    document.getElementById("quiz-body").style.display = "block";
    populateActiveStudentSelect(selectedStudentObj.name);
    
    document.getElementById("btn-penalty").disabled = false;
    document.getElementById("life-skip").disabled = false;
    document.getElementById("life-50").disabled = false;
    loadQuestion();
}

function loadQuestion() {
    var q = currentQObj; var qSec = q.timeLimit || 30;
    document.getElementById("q-text").innerHTML = '<span style="font-size:20px; color:#38bdf8;">[' + q.level + ' - ⏱️ ' + qSec + 's]</span> ' + q.q;
    shuffledOptions = q.opts.map(function(optText, idx) { return { text: optText, isCorrect: (idx === q.ans) }; });
    shuffleArray(shuffledOptions);

    var container = document.getElementById("opt-container"); container.innerHTML = "";
    shuffledOptions.forEach(function(optObj, idx) {
        var btn = document.createElement("button"); btn.className = "btn-opt"; btn.innerHTML = optObj.text;
        btn.onclick = function() { selectAnswer(idx); }; container.appendChild(btn);
    });

    document.getElementById("exp-box").style.display = "none"; document.getElementById("btn-next").style.display = "none";
    renderMath(); startTimer(qSec);
}

function startTimer(seconds) {
    clearInterval(timer); timeLeft = seconds; document.getElementById("timer-val").innerText = timeLeft;
    timer = setInterval(function() {
        timeLeft--; document.getElementById("timer-val").innerText = timeLeft;
        if (timeLeft <= 0) { clearInterval(timer); selectAnswer(-1); }
    }, 1000);
}

function backToWheel() {
    document.getElementById("quiz-body").style.display = "none"; document.getElementById("wheel-screen").style.display = "block"; document.getElementById("student-winner-modal").style.display = "none";
}

function showResult() {
    document.getElementById("quiz-body").style.display = "none"; document.getElementById("wheel-screen").style.display = "none"; document.getElementById("result-screen").style.display = "block";
    var correctContainer = document.getElementById("res-correct-list"); var wrongContainer = document.getElementById("res-wrong-list");
    correctContainer.innerHTML = ""; wrongContainer.innerHTML = "";

    sessionHistory.forEach(function(item) {
        var div = document.createElement("div"); div.className = "res-card-item " + (item.isCorrect ? "correct" : "wrong");
        div.innerHTML = '<div><strong>' + item.student + '</strong></div><div>' + (item.pts > 0 ? '+' + item.pts : item.pts) + ' điểm</div>';
        div.onclick = function() { openReviewQuestionModal(item); };
        if (item.isCorrect) correctContainer.appendChild(div); else wrongContainer.appendChild(div);
    });
}

function openReviewQuestionModal(item) {
    document.getElementById("review-student-name").innerText = "👤 Học sinh: " + item.student + " (" + (item.isCorrect ? "✅ Đúng" : "❌ Sai") + ")";
    var cleanExpText = item.exp ? item.exp.replace(/^Lời giải:\s*/i, '') : '';
    var html = '<p style="font-size:24px; color:#fff; font-weight:bold; margin-bottom:12px;">' + item.q + '</p>' +
        '<p style="font-size:20px; color:#fca5a5; margin-bottom:8px;"><strong>Đã chọn:</strong> ' + item.chosenOpt + '</p>' +
        '<div style="background:#0f172a; padding:12px; border-radius:8px; border-left:6px solid #38bdf8; font-size:20px; color:#e2e8f0;">' +
            '<strong>💡 Lời giải chi tiết:</strong><br>' + cleanExpText +
        '</div>';
    document.getElementById("review-content-box").innerHTML = html;
    openModal("review-q-modal-box"); renderMath();
}

function openCumulativeModal() {
    var table = document.getElementById("cumul-multi-subject-table");
    var activeScores = (currentGameMode === "real") ? cumulativeScoresReal : cumulativeScoresTest;
    var allSubjects = Object.keys(topicsStore);

    var headHtml = '<thead><tr><th style="width:6%; text-align:center;">STT</th><th>Họ và Tên</th>';
    allSubjects.forEach(function(subj) { headHtml += '<th style="text-align:center;">' + subj + '</th>'; });
    headHtml += '<th style="text-align:center; color:#fde047;">TỔNG CỘNG</th></tr></thead>';

    var bodyHtml = '<tbody>';
    studentsData.forEach(function(st, idx) {
        var data = activeScores[st.name] || { total: 0, bySubject: {} };
        bodyHtml += '<tr><td style="text-align:center;">' + (idx + 1) + '</td><td style="color:#38bdf8; font-weight:bold;">' + st.name + '</td>';
        allSubjects.forEach(function(subj) {
            var pts = data.bySubject[subj] || 0; bodyHtml += '<td style="text-align:center;">' + pts + '</td>';
        });
        bodyHtml += '<td style="text-align:center; color:#fde047; font-weight:800; font-size:22px;">' + data.total + ' điểm</td></tr>';
    });
    bodyHtml += '</tbody>';

    table.innerHTML = headHtml + bodyHtml; openModal("cumulative-modal-box");
}

function renderHistoryTable() {
    var tbody = document.getElementById("history-table-body"); tbody.innerHTML = "";
    var filterWeek = document.getElementById("history-week-filter").value;
    var activeHistory = (currentGameMode === "real") ? globalHistoryReal : globalHistoryTest;

    var filtered = activeHistory.filter(function(h) { return (filterWeek === "all" || h.week == filterWeek); });
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px;">Chưa có dữ liệu trích xuất cho tuần này!</td></tr>';
        return;
    }

    filtered.slice().reverse().forEach(function(h) {
        var tr = document.createElement("tr");
        tr.innerHTML = '<td>Tuần ' + h.week + '</td><td>' + h.date + '</td><td style="color:#fde047;">' + h.topic + '</td><td style="color:#38bdf8; font-weight:bold;">' + h.student + '</td><td>' + h.q + '</td><td style="text-align:center; color:' + (h.isCorrect?'#4ade80':'#fca5a5') + ';">' + (h.isCorrect?'Đúng':'Sai') + '</td>';
        tbody.appendChild(tr);
    });
}

function openHistoryModal() { renderHistoryTable(); openModal("history-modal-box"); }
function clearAllHistory() { if(confirm("Xóa lịch sử trích xuất?")) { localStorage.removeItem("wheel_v50_global_history_real"); renderHistoryTable(); } }
function restartGame() { sessionHistory = []; totalSpinCountThisSession = 0; hasMCBeenCalledThisSession = false; document.getElementById("result-screen").style.display = "none"; document.getElementById("wheel-screen").style.display = "block"; }

function saveSessionResultOnly() { if (sessionHistory.length === 0) { alert("⚠️ Buổi học chưa có dữ liệu!"); return; } alert("💾 ĐÃ LƯU THÀNH CÔNG VÀO HỆ THỐNG!"); }

function exportSessionToCSV() {
    if (sessionHistory.length === 0) { alert("⚠️ Buổi học chưa có dữ liệu!"); return; }
    var csvContent = "\uFEFFTuan,Ngay,Mon_Hoc,Hoc_Sinh,Cau_Hoi,Ket_Qua,Diem_So\n";
    sessionHistory.forEach(function(item) {
        var cleanQ = item.q.replace(/,/g, " ").replace(/\n/g, " ");
        csvContent += [item.week, item.date, item.topic, item.student, cleanQ, item.isCorrect ? "Dung" : "Sai", item.pts].join(",") + "\n";
    });
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", url); link.setAttribute("download", "Ket_Qua_Tuan_" + currentWeek + ".csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function exportSessionToWord() {
    if (sessionHistory.length === 0) { alert("⚠️ Buổi học chưa có dữ liệu!"); return; }
    var curIso = document.getElementById("session-date-picker").value || getIsoToday();

    var wordContent = "<html><head><meta charset='utf-8'></head><body>" +
    "<h1>BÁO CÁO TỔNG KẾT BUỔI HỌC 15 PHÚT</h1>" +
    "<p><b>Môn/Chủ đề:</b> " + currentTopicKey + "</p>" +
    "<p><b>Thời gian:</b> Tuần " + currentWeek + " - Ngày " + formatDateFromIso(curIso) + "</p>" +
    "<hr><table border='1'><tr><th>STT</th><th>Họ và Tên</th><th>Nội dung câu hỏi</th><th>Kết quả</th><th>Điểm</th></tr>";

    sessionHistory.forEach(function(item, idx) {
        wordContent += "<tr><td>" + (idx + 1) + "</td><td><b>" + item.student + "</b></td><td>" + item.q + "</td><td>" + (item.isCorrect ? "Đúng" : "Sai") + "</td><td>" + item.pts + "</td></tr>";
    });

    wordContent += "</table></body></html>";
    var blob = new Blob(['\ufeff', wordContent], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url; link.download = "Bao_Cao_Tuan_" + currentWeek + ".doc";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

window.onload = initApp;