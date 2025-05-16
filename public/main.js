// main.js 예시 (Vercel 호환)

let culturalEventItems = [];
let keywordFiltered = [];
let totalResults = 0;
const pageSize = 12;
const groupSize = 5;
let page = 1;

const searchInput = document.getElementById("search-input");
searchInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    searchKeyword();
  }
});

const getList = (list, page) => {
  const start = (page - 1) * pageSize;
  const end = page * pageSize;
  return list.slice(start, end);
};

const filterUpComingEvents = (items) => {
  let today = new Date();
  return items.filter((item) => new Date(item.STRTDATE) >= today);
};

const sortEventDate = (items) => {
  return items.sort(
    (a, b) => new Date(a.STRTDATE) - new Date(b.STRTDATE)
  );
};

const getCulturalEvent = async () => {
  const response = await fetch("/api/getEvents");
  const data = await response.json();
  culturalEventItems = sortEventDate(filterUpComingEvents(data.culturalEventInfo.row));
  keywordFiltered = [...culturalEventItems];
  totalResults = keywordFiltered.length;
  renderEvent();
  renderPagination();
};

const searchKeyword = () => {
  const keyword = searchInput.value.trim();
  keywordFiltered = culturalEventItems.filter((item) =>
    item.TITLE.includes(keyword)
  );
  totalResults = keywordFiltered.length;
  page = 1;
  renderEvent();
  renderPagination();
};

const renderEvent = () => {
  const culturalList = getList(keywordFiltered, page);
  const culturalEventHTML = culturalList
    .map(
      (eItems) => `
    <div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
      <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="이미지 없음">
      <div class="card-body">
        <h5 class="card-title">${eItems.TITLE}</h5>
        <p>📅 ${eItems.STRTDATE}</p>
        <p class="card-text">📍 ${eItems.PLACE}</p>
        ${eItems.USE_FEE ? `<p>💰 ${eItems.USE_FEE}</p>` : ""}
        <a href="${eItems.ORG_LINK}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
      </div>
    </div>`
    )
    .join("");
  document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML;
};

const renderPagination = () => {
  const totalPage = Math.ceil(totalResults / pageSize);
  const pageGroup = Math.ceil(page / groupSize);
  let lastPage = pageGroup * groupSize;
  if (lastPage > totalPage) lastPage = totalPage;
  const firstPage = lastPage - (groupSize - 1) <= 0 ? 1 : lastPage - (groupSize - 1);

  let pageHTML = "";
  if (firstPage > 1) {
    pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo;</a></li>`;
  }
  for (let i = firstPage; i <= lastPage; i++) {
    pageHTML += `<li class="page-item ${page === i ? "active" : ""}" onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>`;
  }
  if (lastPage < totalPage) {
    pageHTML += `<li class="page-item" onclick="moveToPage(${lastPage + 1})"><a class="page-link">&raquo;</a></li>`;
  }

  document.querySelector(".pagination").innerHTML = pageHTML;
};

// 전역 등록
window.moveToPage = function (pageNum) {
  page = pageNum;
  renderEvent();
  renderPagination();
};

getCulturalEvent();
