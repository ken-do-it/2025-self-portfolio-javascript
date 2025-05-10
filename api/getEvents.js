// api/getEvents.js
export default async function handler(req, res) {
  const API_KEY = process.env.API_KEY;

  let url = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "데이터 요청 실패", detail: err });
  }
}
