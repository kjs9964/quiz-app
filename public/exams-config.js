// exams-config.js - 시험 데이터 구조 설정 파일
// 구조: 대분류(분야) → 중분류(시험명) → 소분류(회차)

const EXAM_STRUCTURE = {
    "재난안전": {
        displayName: "재난안전",
        icon: "🌪️",
        color: "#e74c3c",
        exams: {
            "방재기사": {
                displayName: "방재기사",
                icon: "🏗️",
                sessions: [
                    // 예시: { year: 2023, session: 1, fileName: "disaster_management_2023_1.csv", questionCount: 100 }
                ]
            },
            "방재안전직(국가9급)": {
                displayName: "방재안전직(국가9급)",
                icon: "👨‍✈️",
                sessions: []
            },
            "방재안전직(국가7급)": {
                displayName: "방재안전직(국가7급)",
                icon: "👨‍✈️",
                sessions: []
            },
            "방재안전직(지방9급)": {
                displayName: "방재안전직(지방9급)",
                icon: "👨‍✈️",
                sessions: []
            }
        }
    },
    
    "산업안전": {
        displayName: "산업안전",
        icon: "⚙️",
        color: "#3498db",
        exams: {
            "산업위생관리기사": {
                displayName: "산업위생관리기사",
                icon: "🔬",
                sessions: []
            },
            "산업위생관리산업기사": {
                displayName: "산업위생관리산업기사",
                icon: "🔬",
                sessions: []
            },
            "위험물기능장": {
                displayName: "위험물기능장",
                icon: "⚠️",
                sessions: []
            },
            "위험물산업기사": {
                displayName: "위험물산업기사",
                icon: "⚠️",
                sessions: []
            },
            "위험물기능사": {
                displayName: "위험물기능사",
                icon: "⚠️",
                sessions: []
            },
            "산업안전지도사": {
                displayName: "산업안전지도사",
                icon: "👷",
                sessions: []
            },
            "인간공학기사": {
                displayName: "인간공학기사",
                icon: "🧠",
                sessions: []
            },
            "건설안전기사": {
                displayName: "건설안전기사",
                icon: "🏗️",
                sessions: [
                    {
                        year: 2003,
                        session: 1,
                        fileName: "constructionsafety20031.csv",
                        questionCount: 120
                    },
                    {
                        year: 2003,
                        session: 2,
                        fileName: "constructionsafety20032.csv",
                        questionCount: 120
                    },
                    {
                        year: 2003,
                        session: 4,
                        fileName: "constructionsafety20034.csv",
                        questionCount: 120
                    }
                ]
            },
            "건설안전산업기사": {
                displayName: "건설안전산업기사",
                icon: "🏗️",
                sessions: []
            },
            "산업안전기사": {
                displayName: "산업안전기사",
                icon: "👷",
                sessions: []
            },
            "산업안전산업기사": {
                displayName: "산업안전산업기사",
                icon: "👷",
                sessions: []
            }
        }
    },
    
    "소방안전": {
        displayName: "소방안전",
        icon: "🔥",
        color: "#e67e22",
        exams: {
            "소방공무원(공개, 경력)": {
                displayName: "소방공무원(공개, 경력)",
                icon: "👨‍🚒",
                sessions: []
            },
            "화재감식평가기사": {
                displayName: "화재감식평가기사",
                icon: "🔍",
                sessions: []
            },
            "화재감식산업기사": {
                displayName: "화재감식산업기사",
                icon: "🔍",
                sessions: []
            },
            "소방안전교육사": {
                displayName: "소방안전교육사",
                icon: "👨‍🏫",
                sessions: []
            },
            "경비지도사(소방학)": {
                displayName: "경비지도사(소방학)",
                icon: "🛡️",
                sessions: []
            },
            "소방시설관리사": {
                displayName: "소방시설관리사",
                icon: "🏢",
                sessions: []
            },
            "소방설비산업기사(전기)": {
                displayName: "소방설비산업기사(전기)",
                icon: "⚡",
                sessions: []
            },
            "소방설비산업기사(기계)": {
                displayName: "소방설비산업기사(기계)",
                icon: "⚙️",
                sessions: []
            },
            "소방설비기사(전기)": {
                displayName: "소방설비기사(전기)",
                icon: "⚡",
                sessions: []
            },
            "소방설비기사(기계)": {
                displayName: "소방설비기사(기계)",
                icon: "⚙️",
                sessions: []
            }
        }
    }
};

// 유틸리티 함수들
const ExamUtils = {
    // 모든 대분류(분야) 목록 가져오기
    getAllCategories() {
        return Object.keys(EXAM_STRUCTURE).map(categoryKey => ({
            key: categoryKey,
            name: EXAM_STRUCTURE[categoryKey].displayName,
            icon: EXAM_STRUCTURE[categoryKey].icon,
            color: EXAM_STRUCTURE[categoryKey].color
        }));
    },
    
    // 특정 대분류의 시험 목록 가져오기
    getExamsByCategory(categoryKey) {
        if (!EXAM_STRUCTURE[categoryKey]) return [];
        
        const category = EXAM_STRUCTURE[categoryKey];
        return Object.keys(category.exams).map(examKey => {
            const exam = category.exams[examKey];
            const sessionCount = exam.sessions ? exam.sessions.length : 0;
            
            return {
                key: examKey,
                name: exam.displayName,
                icon: exam.icon,
                sessionCount: sessionCount,
                hasData: sessionCount > 0
            };
        });
    },
    
    // 특정 시험의 회차 목록 가져오기
    getSessions(categoryKey, examKey) {
        if (!EXAM_STRUCTURE[categoryKey]?.exams[examKey]) return [];
        
        const sessions = EXAM_STRUCTURE[categoryKey].exams[examKey].sessions || [];
        return sessions.map(session => ({
            ...session,
            displayName: `${session.year}년 ${session.session}회`,
            id: `${categoryKey}_${examKey}_${session.year}_${session.session}`
        }));
    },
    
    // 년도별 회차 그룹핑
    getSessionsByYear(categoryKey, examKey) {
        const sessions = this.getSessions(categoryKey, examKey);
        const grouped = {};
        
        sessions.forEach(session => {
            if (!grouped[session.year]) {
                grouped[session.year] = [];
            }
            grouped[session.year].push(session);
        });
        
        return grouped;
    },
    
    // 특정 회차 정보 가져오기
    getSessionInfo(categoryKey, examKey, year, session) {
        const sessions = this.getSessions(categoryKey, examKey);
        return sessions.find(s => s.year === year && s.session === session);
    },
    
    // 전체 통계
    getOverallStats() {
        let totalCategories = Object.keys(EXAM_STRUCTURE).length;
        let totalExams = 0;
        let totalSessions = 0;
        let totalQuestions = 0;
        
        Object.values(EXAM_STRUCTURE).forEach(category => {
            totalExams += Object.keys(category.exams).length;
            
            Object.values(category.exams).forEach(exam => {
                if (exam.sessions) {
                    exam.sessions.forEach(session => {
                        totalSessions++;
                        totalQuestions += session.questionCount || 0;
                    });
                }
            });
        });
        
        return {
            totalCategories,
            totalExams,
            totalSessions,
            totalQuestions
        };
    },
    
    // 특정 대분류 통계
    getCategoryStats(categoryKey) {
        if (!EXAM_STRUCTURE[categoryKey]) return null;
        
        const exams = EXAM_STRUCTURE[categoryKey].exams;
        let totalSessions = 0;
        let totalQuestions = 0;
        
        Object.values(exams).forEach(exam => {
            if (exam.sessions) {
                exam.sessions.forEach(session => {
                    totalSessions++;
                    totalQuestions += session.questionCount || 0;
                });
            }
        });
        
        return {
            categoryName: EXAM_STRUCTURE[categoryKey].displayName,
            examCount: Object.keys(exams).length,
            totalSessions,
            totalQuestions
        };
    }
};

// localStorage 저장용 헬퍼
const ExamStorage = {
    // 선택한 시험 정보 저장
    saveSelection(categoryKey, examKey, sessionInfo) {
        const selection = {
            category: categoryKey,
            exam: examKey,
            session: sessionInfo,
            selectedAt: new Date().toISOString()
        };
        localStorage.setItem('currentExamSelection', JSON.stringify(selection));
    },
    
    // 선택한 시험 정보 불러오기
    getSelection() {
        const saved = localStorage.getItem('currentExamSelection');
        return saved ? JSON.parse(saved) : null;
    },
    
    // 시험별 학습 기록 저장
    saveStudyRecord(categoryKey, examKey, year, session, record) {
        const key = `study_${categoryKey}_${examKey}_${year}_${session}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        history.push({
            ...record,
            timestamp: new Date().toISOString()
        });
        
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        localStorage.setItem(key, JSON.stringify(history));
    },
    
    // 시험별 학습 기록 조회
    getStudyRecords(categoryKey, examKey, year, session) {
        const key = `study_${categoryKey}_${examKey}_${year}_${session}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
};

// export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EXAM_STRUCTURE, ExamUtils, ExamStorage };
} else {
    window.EXAM_STRUCTURE = EXAM_STRUCTURE;
    window.ExamUtils = ExamUtils;
    window.ExamStorage = ExamStorage;
}