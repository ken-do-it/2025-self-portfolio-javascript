import { API_KEY } from './config.js';

let culturalEventItems = [];
let totalResults = 0;
let page = 1;
let pageSize = 12;
let groupSize = 5;

// /api/getData.js (서버 측 파일)
export default async function handler(req, res) {
  const { API_KEY } = process.env;
  const url = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/12/%20/%20/2025`;
  const result = await fetch(url);
  const data = await result.json();
  res.status(200).json(data);
}

const getActives = async () => {
  const start = (page - 1) * pageSize + 1;
  const end = start + pageSize - 1;

  const url = new URL(`https://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/${start}/${end}/`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    totalResults = data.culturalEventInfo.list_total_count;
    culturalEventItems = data.culturalEventInfo.row.reverse();

    renderCulturalEvent();
    getPagination();
  } catch (error) {
    console.error("API 요청 실패:", error);
  }
};

const renderCulturalEvent = () => {
  const culturalEventHTML = culturalEventItems.map((eItems) => `
    <div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
      <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="행사 이미지">
      <div class="card-body">
        <h5 class="card-title">${eItems.TITLE}</h5>
        <p>📅 ${eItems.DATE || "날짜 정보 없음"}</p>
        <p>📍 ${eItems.PLACE || "장소 미정"}</p>
        ${eItems.fee ? `<p>💰 ${eItems.fee}</p>` : ''}
        ${eItems.category ? `<p>🏷️ ${eItems.category}</p>` : ''}
        <a href="${eItems.ORG_LINK}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
      </div>
    </div>
  `).join('');

  document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML;
};

const getPagination = () => {
  const totalPage = Math.ceil(totalResults / pageSize);
  const pageGroup = Math.ceil(page / groupSize);
  let lastPage = pageGroup * groupSize;
  if (lastPage > totalPage) lastPage = totalPage;
  const firstPage = lastPage - groupSize + 1;

  let pageHTML = "";
  for (let i = firstPage; i <= lastPage; i++) {
    pageHTML += `<li class="page-item ${page === i ? "active" : ""}" onclick="moveToPage(${i})">
      <a class="page-link">${i}</a>
    </li>`;
  }

  document.querySelector(".pagination").innerHTML = pageHTML;
};

window.moveToPage = (pageNum) => {
  page = pageNum;
  getActives();
};

getActives();
