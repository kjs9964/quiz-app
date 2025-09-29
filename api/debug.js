const path = require("path");
const fs = require("fs");

const dataDir = path.join(process.cwd(), "data");

export default function handler(req, res) {
  const { method, query } = req;
  
  if (method === 'GET') {
    const { endpoint } = query;
    
    if (endpoint === 'files') {
      try {
        if (!fs.existsSync(dataDir)) {
          return res.json({ 
            error: "data 폴더가 존재하지 않습니다.", 
            files: [],
            dataDir: dataDir,
            cwd: process.cwd()
          });
        }
        
        const files = fs.readdirSync(dataDir);
        const csvFiles = files.filter(f => f.toLowerCase().endsWith(".csv"));
        
        res.json({
          dataDir: dataDir,
          cwd: process.cwd(),
          allFiles: files,
          csvFiles: csvFiles,
          csvFilesWithEncoding: csvFiles.map(f => ({
            original: f,
            encoded: encodeURIComponent(path.parse(f).name),
            decoded: decodeURIComponent(encodeURIComponent(path.parse(f).name))
          }))
        });
      } catch (e) {
        console.error('Error in /api/debug:', e);
        res.status(500).json({ 
          error: "파일 목록 확인 중 오류가 발생했습니다.",
          errorMessage: e.message,
          dataDir: dataDir,
          cwd: process.cwd()
        });
      }
    } else {
      res.status(404).json({ error: "Invalid debug endpoint" });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}