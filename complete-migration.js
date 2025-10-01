// complete-migration.js - 전체 데이터베이스 마이그레이션 자동화 스크립트
// 하위 폴더 재귀 탐색 버전
// 사용법: node complete-migration.js

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// ========================================
// 경로 설정
// ========================================
const DATABASE_DIR = './public/data/database';
const OUTPUT_DIR = './public/data';
const CONFIG_OUTPUT = './public/exams-config.js';

// ========================================
// 시험명 매핑
// ========================================
const EXAM_MAP = {
  '건설안전기사': 'const-safety',
  '건설안전산업기사': 'const-safety-ind',
  '산업안전기사': 'ind-safety',
  '산업안전산업기사': 'ind-safety-ind',
  '산업위생관리기사': 'ind-hygiene',
  '산업위생관리산업기사': 'ind-hygiene-ind',
  '인간공학기사': 'ergonomics',
  '산업안전지도사': 'ind-safety-advisor',
  
  // 위험물
  '위험물기능장': 'hazmat-master',
  '위험물산업기사': 'hazmat-ind',
  '위험물기능사': 'hazmat-tech',
  
  // 소방
  '소방설비기사(기계분야)': 'fire-equip-mech',
  '소방설비기사(기계)': 'fire-equip-mech',
  '소방설비기사(전기분야)': 'fire-equip-elec',
  '소방설비기사(전기)': 'fire-equip-elec',
  '소방설비산업기사(기계)': 'fire-equip-ind-mech',
  '소방설비산업기사(전기)': 'fire-equip-ind-elec',
  '소방시설관리사': 'fire-facility-mgr',
  '소방안전교육사': 'fire-safety-edu',
  '소방공무원(공개, 경력)': 'firefighter',
  '화재감식평가기사': 'fire-investigation',
  '화재감식산업기사': 'fire-investigation-ind',
  '경비지도사(소방학)': 'security-fire',
  
  // 방재
  '방재기사': 'disaster-prev',
  '방재안전직(국가9급)': 'nat-9-disaster',
  '방재안전직(국가7급)': 'nat-7-disaster',
  '방재안전직(지방9급)': 'local-9-disaster'
};

// 카테고리 매핑
const CATEGORY_MAP = {
  '재난안전': ['방재기사', '방재안전직(국가9급)', '방재안전직(국가7급)', '방재안전직(지방9급)'],
  '산업안전': [
    '건설안전기사', '건설안전산업기사', '산업안전기사', '산업안전산업기사',
    '산업위생관리기사', '산업위생관리산업기사', '인간공학기사', '산업안전지도사',
    '위험물기능장', '위험물산업기사', '위험물기능사'
  ],
  '소방안전': [
    '소방설비기사(기계분야)', '소방설비기사(기계)', '소방설비기사(전기)', '소방설비산업기사(기계)', '소방설비산업기사(전기)',
    '소방시설관리사', '소방안전교육사', '소방공무원(공개, 경력)', 
    '화재감식평가기사', '화재감식산업기사', '경비지도사(소방학)'
  ]
};

// 아이콘 매핑
const ICON_MAP = {
  '건설안전기사': '🏗️', '건설안전산업기사': '🏗️',
  '산업안전기사': '👷', '산업안전산업기사': '👷',
  '산업위생관리기사': '🔬', '산업위생관리산업기사': '🔬',
  '인간공학기사': '🧠', '산업안전지도사': '👷',
  '위험물기능장': '⚠️', '위험물산업기사': '⚠️', '위험물기능사': '⚠️',
  '소방설비기사(기계분야)': '⚙️', '소방설비기사(기계)': '⚙️', '소방설비기사(전기)': '⚡',
  '소방설비산업기사(기계)': '⚙️', '소방설비산업기사(전기)': '⚡',
  '소방시설관리사': '🏢', '소방안전교육사': '👨‍🏫',
  '소방공무원(공개, 경력)': '👨‍🚒',
  '화재감식평가기사': '🔍', '화재감식산업기사': '🔍',
  '경비지도사(소방학)': '🛡️',
  '방재기사': '🏗️',
  '방재안전직(국가9급)': '👨‍✈️',
  '방재안전직(국가7급)': '👨‍✈️',
  '방재안전직(지방9급)': '👨‍✈️'
};

// ========================================
// 파일명 변환 함수들
// ========================================

// 일반 패턴: 2003_건설안전기사_1회.csv
function convertStandardPattern(originalName) {
  const match = originalName.match(/^(\d{4})_(.+?)_(\d+)회\.csv$/);
  if (!match) return null;
  
  const [_, year, examName, session] = match;
  const examCode = EXAM_MAP[examName];
  
  if (!examCode) {
    console.warn(`⚠️  시험명 매핑 없음: ${examName}`);
    return null;
  }
  
  return { fileName: `${examCode}-${year}-${session}.csv`, examName, year, session };
}

// 통합 패턴: 2020_건설안전기사_1,2회_통합.csv
function convertMergedPattern(originalName) {
  const match = originalName.match(/^(\d{4})_(.+?)_(\d+),(\d+)회[_\s]*(통합|통합기출문제)?\.csv$/);
  if (!match) return null;
  
  const [_, year, examName, session1] = match;
  const examCode = EXAM_MAP[examName];
  
  if (!examCode) return null;
  
  return { fileName: `${examCode}-${year}-${session1}.csv`, examName, year, session: session1 };
}

// 추가시험 패턴: 2005_산업안전기사_1회추가.csv
function convertExtraPattern(originalName) {
  const match = originalName.match(/^(\d{4})_(.+?)_(\d+)회추가\.csv$/);
  if (!match) return null;
  
  const [_, year, examName, session] = match;
  const examCode = EXAM_MAP[examName];
  
  if (!examCode) return null;
  
  return { fileName: `${examCode}-${year}-${session}-extra.csv`, examName, year, session: `${session}-extra` };
}

// 국가직/지방직 과목별 패턴: 2015_국가7급_도시계획-3.csv
function convertGovExamPattern(originalName) {
  const match = originalName.match(/^(\d{4})_(국가|지방)(\d+)급_(.+?)-(.)\.csv$/);
  if (!match) return null;
  
  const [_, year, type, grade, subject, sessionCode] = match;
  
  // 시험명 매핑
  let examName;
  if (type === '국가' && grade === '7') examName = '방재안전직(국가7급)';
  else if (type === '국가' && grade === '9') examName = '방재안전직(국가9급)';
  else if (type === '지방' && grade === '9') examName = '방재안전직(지방9급)';
  else return null;
  
  const examCode = EXAM_MAP[examName];
  if (!examCode) return null;
  
  // 과목명 영어 변환
  const subjectMap = {
    '도시계획': 'urban',
    '방재관계법규': 'law',
    '안전관리론': 'safety',
    '재난관리론': 'disaster'
  };
  
  const subjectCode = subjectMap[subject] || subject;
  
  // 회차 코드 변환 (가나다 -> 1,2,3)
  const sessionMap = {
    '가': '1', '나': '2', '다': '3', '라': '4', '마': '5',
    'A': '1', 'B': '2', 'C': '3', 'D': '4',
    '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
    '사': '4'
  };
  
  const session = sessionMap[sessionCode] || sessionCode;
  
  return { 
    fileName: `${examCode}-${year}-${session}-${subjectCode}.csv`, 
    examName, 
    year, 
    session,
    subject 
  };
}

// 방재기사 패턴: 2019_방재기사_5회.csv
function convertDisasterPattern(originalName) {
  return convertStandardPattern(originalName);
}

// 모든 패턴 시도
function convertFileName(originalName) {
  return convertStandardPattern(originalName) ||
         convertMergedPattern(originalName) ||
         convertExtraPattern(originalName) ||
         convertGovExamPattern(originalName) ||
         convertDisasterPattern(originalName);
}

// ========================================
// 재귀적 파일 탐색
// ========================================
function getAllCsvFiles(dir) {
  let results = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 재귀적으로 하위 폴더 탐색
      results = results.concat(getAllCsvFiles(fullPath));
    } else if (file.toLowerCase().endsWith('.csv')) {
      results.push(fullPath);
    }
  });
  
  return results;
}

// ========================================
// 파일 처리 및 복사
// ========================================
function processAndCopyFiles() {
  console.log('📂 파일 마이그레이션 시작...\n');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const allCsvFiles = getAllCsvFiles(DATABASE_DIR);
  console.log(`총 ${allCsvFiles.length}개의 CSV 파일 발견\n`);
  
  let successCount = 0;
  let failCount = 0;
  const processedFiles = [];
  
  allCsvFiles.forEach(fullPath => {
    const fileName = path.basename(fullPath);
    const converted = convertFileName(fileName);
    
    if (converted) {
      const destPath = path.join(OUTPUT_DIR, converted.fileName);
      
      // 중복 체크
      if (processedFiles.includes(converted.fileName)) {
        console.warn(`⚠️  중복 파일명: ${converted.fileName} (원본: ${fileName})`);
      }
      
      fs.copyFileSync(fullPath, destPath);
      console.log(`✅ ${fileName} → ${converted.fileName}`);
      processedFiles.push(converted.fileName);
      successCount++;
    } else {
      console.warn(`❌ 변환 실패: ${fileName}`);
      failCount++;
    }
  });
  
  console.log(`\n📊 결과: 성공 ${successCount}개, 실패 ${failCount}개\n`);
  return successCount;
}

// ========================================
// CSV 파일 분석
// ========================================
function analyzeCSVFiles() {
  console.log('📊 CSV 파일 분석 중...\n');
  
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.csv'));
  const examData = {};
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf8');
      const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: true
      });
      
      // 파일명 파싱
      const parts = file.replace('.csv', '').split('-');
      
      // 패턴별 처리
      let examCode, year, session;
      
      if (parts.length >= 3) {
        // 일반 패턴: const-safety-2003-1.csv
        if (/^\d{4}$/.test(parts[parts.length - 2])) {
          session = parts[parts.length - 1];
          year = parts[parts.length - 2];
          examCode = parts.slice(0, parts.length - 2).join('-');
        } else {
          // 다른 패턴들
          year = parts.find(p => /^\d{4}$/.test(p));
          session = parts[parts.length - 1];
          examCode = parts.slice(0, parts.indexOf(year)).join('-');
        }
      }
      
      // 원래 시험명 찾기
      const examName = Object.keys(EXAM_MAP).find(key => EXAM_MAP[key] === examCode);
      
      if (!examName) {
        console.warn(`⚠️  시험명 역매핑 실패: ${file}`);
        return;
      }
      
      if (!examData[examName]) {
        examData[examName] = [];
      }
      
      examData[examName].push({
        year: parseInt(year) || 0,
        session: session,
        fileName: file,
        questionCount: parsed.data.length
      });
      
    } catch (error) {
      console.error(`❌ 파일 분석 실패 (${file}):`, error.message);
    }
  });
  
  return examData;
}

// ========================================
// exams-config.js 생성
// ========================================
function generateExamsConfig(examData) {
  console.log('🔧 exams-config.js 생성 중...\n');
  
  const structure = {};
  
  // 카테고리별 구조 생성
  Object.keys(CATEGORY_MAP).forEach(category => {
    structure[category] = {
      displayName: category,
      icon: category === '재난안전' ? '🌪️' : category === '산업안전' ? '⚙️' : '🔥',
      color: category === '재난안전' ? '#e74c3c' : category === '산업안전' ? '#3498db' : '#e67e22',
      exams: {}
    };
    
    CATEGORY_MAP[category].forEach(examName => {
      structure[category].exams[examName] = {
        displayName: examName,
        icon: ICON_MAP[examName] || '📚',
        sessions: examData[examName] ? 
          examData[examName].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return String(b.session).localeCompare(String(a.session));
          }) : []
      };
    });
  });
  
  const utilityFunctions = `
// 유틸리티 함수들
const ExamUtils = {
    getAllCategories() {
        return Object.keys(EXAM_STRUCTURE).map(categoryKey => ({
            key: categoryKey,
            name: EXAM_STRUCTURE[categoryKey].displayName,
            icon: EXAM_STRUCTURE[categoryKey].icon,
            color: EXAM_STRUCTURE[categoryKey].color
        }));
    },
    
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
                sessions: exam.sessions || []
            };
        });
    },
    
    getSessionsByExam(categoryKey, examKey) {
        if (!EXAM_STRUCTURE[categoryKey] || !EXAM_STRUCTURE[categoryKey].exams[examKey]) {
            return [];
        }
        return EXAM_STRUCTURE[categoryKey].exams[examKey].sessions || [];
    },
    
    getStatistics() {
        let totalExams = 0;
        let totalSessions = 0;
        let totalQuestions = 0;
        
        Object.values(EXAM_STRUCTURE).forEach(category => {
            const exams = Object.values(category.exams);
            totalExams += exams.length;
            
            exams.forEach(exam => {
                if (exam.sessions) {
                    totalSessions += exam.sessions.length;
                    exam.sessions.forEach(session => {
                        totalQuestions += session.questionCount || 0;
                    });
                }
            });
        });
        
        return { totalExams, totalSessions, totalQuestions };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EXAM_STRUCTURE, ExamUtils };
}
`;
  
  const configContent = `// exams-config.js - 시험 데이터 구조 설정 파일
// 자동 생성됨 - ${new Date().toLocaleString('ko-KR')}

const EXAM_STRUCTURE = ${JSON.stringify(structure, null, 4)};

${utilityFunctions}`;
  
  fs.writeFileSync(CONFIG_OUTPUT, configContent, 'utf8');
  console.log(`✅ exams-config.js 생성 완료\n`);
}

// ========================================
// 통계 출력
// ========================================
function printStatistics(examData) {
  console.log('📊 ===== 마이그레이션 완료 통계 =====\n');
  
  let totalSessions = 0;
  let totalQuestions = 0;
  
  Object.keys(CATEGORY_MAP).forEach(category => {
    console.log(`\n📁 ${category}`);
    
    CATEGORY_MAP[category].forEach(examName => {
      const sessions = examData[examName] || [];
      const questionCount = sessions.reduce((sum, s) => sum + s.questionCount, 0);
      
      if (sessions.length > 0) {
        console.log(`   └─ ${examName}: ${sessions.length}회차, ${questionCount}문제`);
        totalSessions += sessions.length;
        totalQuestions += questionCount;
      }
    });
  });
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`총 시험 종류: ${Object.keys(examData).length}개`);
  console.log(`총 회차: ${totalSessions}개`);
  console.log(`총 문제 수: ${totalQuestions}문제`);
  console.log(`${'='.repeat(50)}\n`);
}

// ========================================
// 메인 실행
// ========================================
function main() {
  console.log('🚀 전체 데이터베이스 마이그레이션 시작\n');
  console.log(`원본 폴더: ${DATABASE_DIR}`);
  console.log(`출력 폴더: ${OUTPUT_DIR}\n`);
  
  try {
    const fileCount = processAndCopyFiles();
    
    if (fileCount === 0) {
      console.error('❌ 처리된 파일이 없습니다.');
      return;
    }
    
    const examData = analyzeCSVFiles();
    generateExamsConfig(examData);
    printStatistics(examData);
    
    console.log('✅ 모든 마이그레이션 작업이 완료되었습니다!\n');
    console.log('다음 단계:');
    console.log('1. git add public/data/*.csv public/exams-config.js');
    console.log('2. git commit -m "feat: 전체 데이터베이스 마이그레이션 완료"');
    console.log('3. git push origin main');
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}