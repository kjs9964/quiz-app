const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse/sync");

// data 폴더 경로
const dataDir = path.join(process.cwd(), "data");

export default function handler(req, res) {
  const { method, query } = req;
  
  if (method === 'GET') {
    const { id } = query;
    
    if (!id) {
      // 회차 목록 반환
      try {
        if (!fs.existsSync(dataDir)) return res.json([]);
        const files = fs
          .readdirSync(dataDir)
          .filter(f => f.toLowerCase().endsWith(".csv"))
          .map(f => ({ 
            id: encodeURIComponent(path.parse(f).name),
            filename: f 
          }));
        res.json(files);
      } catch (e) {
        console.error('Error in /api/exams:', e);
        res.status(500).json({ error: "CSV 목록을 불러오는 중 오류가 발생했습니다." });
      }
    } else {
      // 특정 회차 데이터 반환
      try {
        const examId = decodeURIComponent(id);
        const csvPath = path.join(dataDir, `${examId}.csv`);

        console.log("[REQ] examId:", examId);
        console.log("[PATH]", csvPath);

        if (!fs.existsSync(csvPath)) {
          console.log("[ERROR] File not found:", csvPath);
          return res.status(404).json({ error: "해당 회차 파일이 없습니다." });
        }

        const content = fs.readFileSync(csvPath, "utf8");

        let records = parse(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });

        const num2letter = { "1": "A", "2": "B", "3": "C", "4": "D" };

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
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}