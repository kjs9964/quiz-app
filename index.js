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
      .map(f => ({ id: path.parse(f).name, filename: f }));
    res.json(files);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "CSV 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

// 특정 회차 CSV → JSON 변환 API
// 클라이언트는 '/api/exams/파일명(확장자제외)' 로 요청합니다.
app.get("/api/exams/:id", (req, res) => {
  const examId = req.params.id; // 예: "2003_건설안전기사_1회"
  const csvPath = path.join(__dirname, "data", `${examId}.csv`);

  // 디버그 로그 (필요시 확인)
  // console.log("[REQ] examId:", examId);
  // console.log("[PATH]", csvPath);

  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: "해당 회차 파일이 없습니다." });
  }

  try {
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

      return {
        id: num,
        question: q,
        a: a1,
        b: a2,
        c: a3,
        d: a4,
        answer: ans,
        explanation: ""
      };
    });

    res.json({ examId, count: records.length, questions: records });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "CSV 파싱 중 오류가 발생했습니다." });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
