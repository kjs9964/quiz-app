let currentQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let isAnswered = false;
let wrongAnswers = []; // 오답 저장 배열
let isWrongNoteMode = false; // 오답노트 모드 여부
let currentExamId = ''; // 현재 선택된 시험 ID

// 진척도 관련 변수
let totalQuestions = 0;
let answeredQuestions = 0;
let correctAnswers = 0;

// D-Day 관련 변수
let examDate = null;

// 페이지 로드시 저장된 데이터 불러오기
document.addEventListener('DOMContentLoaded', function() {
    loadWrongAnswersFromStorage();
    updateWrongNoteButton();
    loadExamDateFromStorage();
    updateDDayDisplay();
    startDDayTimer();
});

// 로컬 스토리지에서 오답노트 불러오기
function loadWrongAnswersFromStorage() {
    const saved = localStorage.getItem('wrongAnswers');
    if (saved) {
        wrongAnswers = JSON.parse(saved);
    }
}

// 로컬 스토리지에 오답노트 저장
function saveWrongAnswersToStorage() {
    localStorage.setItem('wrongAnswers', JSON.stringify(wrongAnswers));
}

// 오답노트 버튼 업데이트
function updateWrongNoteButton() {
    const wrongNoteBtn = document.getElementById('wrongNoteBtn');
    const wrongCount = wrongAnswers.length;
    
    if (wrongCount > 0) {
        wrongNoteBtn.textContent = `오답노트 (${wrongCount}개)`;
        wrongNoteBtn.style.display = 'inline-block';
    } else {
        wrongNoteBtn.textContent = '오답노트 (0개)';
        wrongNoteBtn.style.display = 'none';
    }
}

async function loadQuestions() {
    const examSelect = document.getElementById('examSelect');
    const examId = examSelect.value;
    
    if (!examId) {
        alert('회차를 선택해주세요.');
        return;
    }
    
    currentExamId = examId;
    isWrongNoteMode = false;
    
    // 진척도 초기화
    answeredQuestions = 0;
    correctAnswers = 0;
    
    try {
        const response = await fetch(`/api/exams/${examId}`);
        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }
        
        currentQuestions = data.questions;
        currentQuestionIndex = 0;
        totalQuestions = currentQuestions.length;
        
        if (currentQuestions.length === 0) {
            alert('문제가 없습니다.');
            return;
        }
        
        document.getElementById('modeTitle').textContent = `${examId} - 전체 문제`;
        displayQuestion();
        
    } catch (error) {
        console.error('Error:', error);
        alert('문제를 불러오는 중 오류가 발생했습니다.');
    }
}

// 오답노트 문제들만 불러오기
function loadWrongNoteQuestions() {
    if (wrongAnswers.length === 0) {
        alert('저장된 오답이 없습니다.');
        return;
    }
    
    currentQuestions = [...wrongAnswers];
    currentQuestionIndex = 0;
    isWrongNoteMode = true;
    
    // 진척도 초기화
    totalQuestions = currentQuestions.length;
    answeredQuestions = 0;
    correctAnswers = 0;
    
    document.getElementById('modeTitle').textContent = '오답노트 모드';
    displayQuestion();
}

function displayQuestion() {
    const questionContainer = document.getElementById('questionContainer');
    
    if (currentQuestionIndex >= currentQuestions.length) {
        let completionMessage = '<h2>모든 문제를 완료했습니다!</h2>';
        
        if (isWrongNoteMode) {
            completionMessage += '<p>오답노트 문제를 모두 풀었습니다! 🎉</p>';
            completionMessage += '<button onclick="loadWrongNoteQuestions()">오답노트 다시 풀기</button>';
        } else {
            const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            completionMessage += `<div class="final-score">최종 점수: ${correctAnswers}/${totalQuestions} (${finalScore}%)</div>`;
        }
        
        questionContainer.innerHTML = completionMessage;
        updateProgressBar(); // 진척도 바 업데이트
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    isAnswered = false;
    selectedAnswer = null;
    
    const modeIndicator = isWrongNoteMode ? 
        '<div class="mode-indicator wrong-note">📝 오답노트 모드</div>' : 
        '<div class="mode-indicator normal">📚 일반 모드</div>';
    
    const questionHTML = `
        ${modeIndicator}
        <div class="question-card">
            <h3>문제 ${currentQuestionIndex + 1}: ${question.question || question.Question || '문제 내용 없음'}</h3>
            
            <div class="options">
                <div class="option" onclick="selectAnswer('A', 1)">
                    <span class="option-label">A.</span> ${question.a || question['Option 1'] || '선택지 없음'}
                </div>
                <div class="option" onclick="selectAnswer('B', 2)">
                    <span class="option-label">B.</span> ${question.b || question['Option 2'] || '선택지 없음'}
                </div>
                <div class="option" onclick="selectAnswer('C', 3)">
                    <span class="option-label">C.</span> ${question.c || question['Option 3'] || '선택지 없음'}
                </div>
                <div class="option" onclick="selectAnswer('D', 4)">
                    <span class="option-label">D.</span> ${question.d || question['Option 4'] || '선택지 없음'}
                </div>
            </div>
            
            <div class="answer-feedback" id="answerFeedback" style="display: none;"></div>
            
            <div class="navigation">
                <button onclick="previousQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>이전 문제</button>
                <span>문제 ${currentQuestionIndex + 1} / ${currentQuestions.length}</span>
                <button onclick="nextQuestion()">다음 문제</button>
            </div>
        </div>
    `;
    
    questionContainer.innerHTML = questionHTML;
    updateProgressBar(); // 진척도 바 업데이트
}

function selectAnswer(letter, number) {
    if (isAnswered) return;
    
    const question = currentQuestions[currentQuestionIndex];
    const correctAnswer = question.answer || question.Answer;
    
    selectedAnswer = number;
    isAnswered = true;
    answeredQuestions++; // 답변한 문제 수 증가
    
    const options = document.querySelectorAll('.option');
    
    // 디버깅용 로그
    console.log('Selected:', letter, number);
    console.log('Correct Answer from CSV:', correctAnswer);
    
    // 다양한 형식으로 정답 비교
    let isCorrect = false;
    
    // 1. 숫자로 비교 (1,2,3,4)
    if (number.toString() === correctAnswer.toString()) {
        isCorrect = true;
    }
    // 2. 알파벳으로 비교 (A,B,C,D)
    else if (letter === correctAnswer.toString()) {
        isCorrect = true;
    }
    // 3. 알파벳을 숫자로 변환해서 비교
    else if (letter === 'A' && correctAnswer.toString() === '1') {
        isCorrect = true;
    }
    else if (letter === 'B' && correctAnswer.toString() === '2') {
        isCorrect = true;
    }
    else if (letter === 'C' && correctAnswer.toString() === '3') {
        isCorrect = true;
    }
    else if (letter === 'D' && correctAnswer.toString() === '4') {
        isCorrect = true;
    }
    
    if (isCorrect) {
        correctAnswers++; // 정답 수 증가
    }
    
    // 각 선택지에 결과 표시
    options.forEach((option, index) => {
        const optionNumber = index + 1;
        
        if (optionNumber === number) {
            if (isCorrect) {
                option.classList.add('correct');
                option.innerHTML += ' ✅';
            } else {
                option.classList.add('incorrect');
                option.innerHTML += ' ❌';
            }
        }
        
        if (!isCorrect && optionNumber.toString() === correctAnswer.toString()) {
            option.classList.add('correct');
            option.innerHTML += ' ✅ (정답)';
        }
        
        option.style.pointerEvents = 'none';
    });
    
    // 피드백 메시지 표시
    const feedback = document.getElementById('answerFeedback');
    if (isCorrect) {
        feedback.innerHTML = '<div class="feedback-correct">🎉 정답입니다!</div>';
        
        // 오답노트 모드에서 정답을 맞혔을 때 오답노트에서 제거
        if (isWrongNoteMode) {
            removeFromWrongAnswers(question);
            feedback.innerHTML += '<div class="feedback-removed">✨ 오답노트에서 제거되었습니다!</div>';
        }
    } else {
        feedback.innerHTML = `<div class="feedback-incorrect">❌ 틀렸습니다. 정답은 ${correctAnswer}번입니다.</div>`;
        
        // 일반 모드에서 틀렸을 때 오답노트에 추가
        if (!isWrongNoteMode) {
            addToWrongAnswers(question);
            feedback.innerHTML += '<div class="feedback-added">📝 오답노트에 저장되었습니다!</div>';
        }
    }
    
    feedback.style.display = 'block';
    updateWrongNoteButton();
    updateProgressBar(); // 진척도 바 업데이트
}

// 오답노트에 문제 추가
function addToWrongAnswers(question) {
    console.log('Adding to wrong answers:', question); // 디버깅용
    
    // 고유 식별자 만들기
    const questionText = question.question || question.Question || '';
    const questionId = `${currentExamId}_${currentQuestionIndex}_${questionText.substring(0, 50)}`;
    
    // 이미 있는 문제인지 확인 (더 정확한 중복 방지)
    const exists = wrongAnswers.some(wrong => 
        wrong.questionId === questionId
    );
    
    if (!exists) {
        const wrongQuestion = {
            ...question,
            questionId: questionId,
            examId: currentExamId,
            questionIndex: currentQuestionIndex,
            addedDate: new Date().toISOString()
        };
        wrongAnswers.push(wrongQuestion);
        saveWrongAnswersToStorage();
        console.log('Successfully added to wrong answers. Total:', wrongAnswers.length); // 디버깅용
    } else {
        console.log('Question already exists in wrong answers'); // 디버깅용
    }
}

// 오답노트에서 문제 제거
function removeFromWrongAnswers(question) {
    wrongAnswers = wrongAnswers.filter(wrong => 
        wrong.question !== question.question && wrong.Question !== question.Question
    );
    saveWrongAnswersToStorage();
}

// 오답노트 전체 삭제
function clearWrongAnswers() {
    if (confirm('오답노트를 모두 삭제하시겠습니까?')) {
        wrongAnswers = [];
        saveWrongAnswersToStorage();
        updateWrongNoteButton();
        alert('오답노트가 삭제되었습니다.');
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

// 진척도 바 업데이트 함수
function updateProgressBar() {
    const progressContainer = document.getElementById('progressContainer');
    
    if (totalQuestions === 0) {
        progressContainer.style.display = 'none';
        return;
    }
    
    progressContainer.style.display = 'block';
    
    // 진행률 계산
    const progressPercent = Math.round((currentQuestionIndex / totalQuestions) * 100);
    const accuracyPercent = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
    
    // 진척도 바 업데이트
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const accuracyText = document.getElementById('accuracyText');
    
    progressBar.style.width = progressPercent + '%';
    progressText.textContent = `진행률: ${currentQuestionIndex}/${totalQuestions} (${progressPercent}%)`;
    accuracyText.textContent = `정답률: ${correctAnswers}/${answeredQuestions} (${accuracyPercent}%)`;
    
    // 진행률에 따른 색상 변경
    if (progressPercent >= 100) {
        progressBar.className = 'progress-bar completed';
        // 완료 애니메이션
        progressBar.style.animation = 'celebrate-progress 1s ease-in-out';
    } else if (progressPercent >= 75) {
        progressBar.className = 'progress-bar high';
    } else if (progressPercent >= 50) {
        progressBar.className = 'progress-bar medium';
    } else {
        progressBar.className = 'progress-bar low';
    }
}

// ==================== D-Day 관련 함수들 ====================

// 로컬 스토리지에서 시험일 불러오기
function loadExamDateFromStorage() {
    const saved = localStorage.getItem('examDate');
    if (saved) {
        examDate = new Date(saved);
        document.getElementById('examDateInput').value = formatDateForInput(examDate);
    }
}

// 로컬 스토리지에 시험일 저장
function saveExamDateToStorage() {
    if (examDate) {
        localStorage.setItem('examDate', examDate.toISOString());
    } else {
        localStorage.removeItem('examDate');
    }
}

// 날짜를 input 형식으로 변환 (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 시험일 설정
function setExamDate() {
    const dateInput = document.getElementById('examDateInput');
    const selectedDate = dateInput.value;
    
    if (!selectedDate) {
        alert('시험일을 선택해주세요.');
        return;
    }
    
    examDate = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (examDate < today) {
        alert('오늘 이후의 날짜를 선택해주세요.');
        return;
    }
    
    saveExamDateToStorage();
    updateDDayDisplay();
    alert('시험일이 설정되었습니다!');
}

// 시험일 삭제
function clearExamDate() {
    if (confirm('설정된 시험일을 삭제하시겠습니까?')) {
        examDate = null;
        document.getElementById('examDateInput').value = '';
        saveExamDateToStorage();
        updateDDayDisplay();
        alert('시험일이 삭제되었습니다.');
    }
}

// D-Day 표시 업데이트
function updateDDayDisplay() {
    const ddayDisplay = document.getElementById('ddayDisplay');
    
    if (!examDate) {
        ddayDisplay.innerHTML = '<div class="dday-not-set">📅 시험일을 설정해주세요</div>';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const examDateOnly = new Date(examDate);
    examDateOnly.setHours(0, 0, 0, 0);
    
    const timeDiff = examDateOnly.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    let ddayText = '';
    let ddayClass = '';
    
    if (daysDiff > 0) {
        ddayText = `🎯 D-${daysDiff}`;
        ddayClass = daysDiff <= 7 ? 'dday-urgent' : daysDiff <= 30 ? 'dday-warning' : 'dday-normal';
    } else if (daysDiff === 0) {
        ddayText = '🔥 D-DAY! 시험일입니다!';
        ddayClass = 'dday-today';
    } else {
        ddayText = `✅ D+${Math.abs(daysDiff)} (시험 종료)`;
        ddayClass = 'dday-passed';
    }
    
    const examDateStr = examDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    ddayDisplay.innerHTML = `
        <div class="dday-container ${ddayClass}">
            <div class="dday-main">${ddayText}</div>
            <div class="dday-date">목표일: ${examDateStr}</div>
        </div>
    `;
}

// D-Day 실시간 업데이트 타이머
function startDDayTimer() {
    // 매일 자정에 D-Day 업데이트
    setInterval(updateDDayDisplay, 60000); // 1분마다 체크
    
    // 자정에 정확히 업데이트하기 위한 타이머
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        updateDDayDisplay();
        // 이후 매일 자정마다 업데이트
        setInterval(updateDDayDisplay, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}