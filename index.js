const express = require("express");
const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse/sync");

const app = express();
const PORT = 3000;

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, "public")));

// data 폴더 경로
const dataDir = path.join(__dirname, "data");

// 회차 목록 API
// 반환 형식: [{ id: "파일명(확장자 제외)", filename: "원본파일명.csv" }, ...]
app.get("/api/exams", (req, res) => {
  try {
    if (!fs.existsSync(dataDir)) return res.json([]);
    const files = fs
      .readdirSync(dataDir)
      .filter(f => f.toLowerCase().endsWith(".csv"))
      .map(f => ({ 
        id: encodeURIComponent(path.parse(f).name), // URL 인코딩 적용
        filename: f 
      }));
    res.json(files);
  } catch (e) {
    console.error('Error in /api/exams:', e);
    res.status(500).json({ error: "CSV 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

// 특정 회차 CSV → JSON 변환 API
// 클라이언트는 '/api/exams/파일명(확장자제외)' 로 요청합니다.
app.get("/api/exams/:id", (req, res) => {
  try {
    // URL 디코딩 적용
    const examId = decodeURIComponent(req.params.id);
    const csvPath = path.join(__dirname, "data", `${examId}.csv`);

    // 디버그 로그
    console.log("[REQ] Original examId:", req.params.id);
    console.log("[REQ] Decoded examId:", examId);
    console.log("[PATH]", csvPath);

    if (!fs.existsSync(csvPath)) {
      console.log("[ERROR] File not found:", csvPath);
      return res.status(404).json({ error: "해당 회차 파일이 없습니다." });
    }

    const content = fs.readFileSync(csvPath, "utf8");

    // 헤더가 있는 CSV 기준으로 파싱
    let records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // 1~4 → A~D 변환 테이블
    const num2letter = { "1": "A", "2": "B", "3": "C", "4": "D" };

    // 다양한 헤더명 대응하여 매핑
    records = records.map(r => {
      const num = String(
        r["Number"] ?? r["number"] ?? r["No"] ?? r["번호"] ?? r["id"] ?? ""
      );

      const q =
        r["Question"] ?? r["question"] ?? r["문제"] ?? r["질문"] ?? "";

      const a1 = r["Option 1"] ?? r["option1"] ?? r["보기1"] ?? r["a"] ?? "";
      const a2 = r["Option 2"] ?? r["option2"] ?? r["보기2"] ?? r["b"] ?? "";
      const a3 = r["Option 3"] ?? r["option3"] ?? r["보기3"] ?? r["c"] ?? "";
      const a4 = r["Option 4"] ?? r["option4"] ?? r["보기4"] ?? r["d"] ?? "";

      let ans = String(r["Answer"] ?? r["answer"] ?? r["정답"] ?? "").trim();
      if (num2letter[ans]) ans = num2letter[ans];
      ans = ans.toUpperCase();

      // 추가 필드들 처리
      const testName = r["Test Name"] ?? r["시험명"] ?? "";
      const year = r["Year"] ?? r["연도"] ?? "";
      const session = r["Session"] ?? r["회차"] ?? "";
      const subject = r["Subject"] ?? r["과목"] ?? "";
      const questionImage = r["Question_image"] ?? r["문제_이미지"] ?? "";
      const explanation = r["explanation"] ?? r["해설"] ?? "";

      return {
        id: num,
        question: q,
        questionImage: questionImage,
        a: a1,
        b: a2,
        c: a3,
        d: a4,
        answer: ans,
        explanation: explanation,
        // 메타데이터 추가
        testName: testName,
        year: year,
        session: session,
        subject: subject
      };
    });

    console.log(`[SUCCESS] Loaded ${records.length} questions from ${examId}`);
    res.json({ examId, count: records.length, questions: records });

  } catch (e) {
    console.error('Error in /api/exams/:id:', e);
    res.status(500).json({ error: "CSV 파싱 중 오류가 발생했습니다." });
  }
});

// 추가: 파일 존재 여부 확인 API (디버깅용)
app.get("/api/debug/files", (req, res) => {
  try {
    if (!fs.existsSync(dataDir)) {
      return res.json({ error: "data 폴더가 존재하지 않습니다.", files: [] });
    }
    
    const files = fs.readdirSync(dataDir);
    const csvFiles = files.filter(f => f.toLowerCase().endsWith(".csv"));
    
    res.json({
      dataDir: dataDir,
      allFiles: files,
      csvFiles: csvFiles,
      csvFilesWithEncoding: csvFiles.map(f => ({
        original: f,
        encoded: encodeURIComponent(path.parse(f).name),
        decoded: decodeURIComponent(encodeURIComponent(path.parse(f).name))
      }))
    });
  } catch (e) {
    console.error('Error in /api/debug/files:', e);
    res.status(500).json({ error: "파일 목록 확인 중 오류가 발생했습니다." });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
  console.log(`데이터 폴더: ${dataDir}`);
  
  // 시작 시 파일 목록 확인
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter(f => f.toLowerCase().endsWith(".csv"));
    console.log(`CSV 파일 ${files.length}개 발견:`, files);
  } else {
    console.log("경고: data 폴더가 존재하지 않습니다.");
  }
});