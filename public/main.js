//let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/5/`) 

let culturalEventItems = [];
let filteredItems = [];
let totalResults = 0;
let page = 1;
let pageSize = 12;
let groupSize = 5;

// ✅ 오늘 이후 행사만 필터
const filterUpcomingEvents = (items) => {
  const today = new Date();
  return items.filter(item => new Date(item.STRTDATE) >= today);
};

// ✅ 시작일 기준 오름차순 정렬
const sortByStartDate = (items) => {
  return items.sort((a, b) => new Date(a.STRTDATE) - new Date(b.STRTDATE));
};

// ✅ 날짜 포맷 (요일 포함)
const formatDateWithDay = (datetimeStr) => {
  const datePart = datetimeStr.split(" ")[0];
  const [year, month, day] = datePart.split("-");
  const dateObj = new Date(`${year}-${month}-${day}`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = days[dateObj.getDay()];
  return `${year}.${month}.${day} (${dayName})`;
};

// ✅ 서버에서 데이터 받아오기
const getActives = async () => {

// --- 배포할때는 아래 2개 주석처리  이부분은 로컬용 
    let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
    const response = await fetch(url)
//-----------


//-------------------------- 이 아래 부분 vercel 배포 시 주석 해제 
//   const response = await fetch('/api/getEvents');  
//-----------------------------------
  const data = await response.json();

  let rows = data.culturalEventInfo.row;
  rows = filterUpcomingEvents(rows);
  rows = sortByStartDate(rows);

  culturalEventItems = rows;
  filteredItems = [...culturalEventItems];
  totalResults = filteredItems.length;

  console.log(filteredItems)

  renderCulturalEvent();
  getPagination();
};

// ✅ 카드 렌더링
const renderCulturalEvent = () => {
  const startIdx = (page - 1) * pageSize;
  const endIdx = page * pageSize;
  const pageItems = filteredItems.slice(startIdx, endIdx);

  const culturalEventHTML = pageItems.map((eItems) =>
    `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
      <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="이미지 없음">
      <div class="card-body">
        <h5 class="card-title">${eItems.TITLE}</h5>
        <p>📅 ${formatDateWithDay(eItems.STRTDATE)} ~ ${formatDateWithDay(eItems.END_DATE)}</p>
        <p class="card-text">📍 ${eItems.PLACE}</p>
        ${eItems.USE_FEE ? `<p>💰 ${eItems.USE_FEE}</p>` : ''}
        <a href="${eItems.ORG_LINK}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
      </div>
    </div>`
  ).join('');

  document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML;
};

// ✅ 페이지네이션 렌더링
const getPagination = () => {
  const totalPage = Math.ceil(filteredItems.length / pageSize);
  const pageGroup = Math.ceil(page / groupSize);
  let lastPage = pageGroup * groupSize;
  if (lastPage > totalPage) lastPage = totalPage;
  let firstPage = lastPage - (groupSize - 1) <= 0 ? 1 : lastPage - (groupSize - 1);

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


// ✅ main.js 하단에 추가하세요
window.moveToPage = (pageNum) => {
  page = pageNum;
  renderCulturalEvent();
  getPagination();
};
// // ✅ 페이지 이동
// const moveToPage = (pageNum) => {
//   page = pageNum;
//   renderCulturalEvent();
//   getPagination();
// };

// ✅ 초기 실행
getActives();


// sample
// aaaHTML = `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
//                         <img src="..." class="card-img-top" alt="...">
//                         <div class="card-body">
//                             <h5 class="card-title">Card title_1</h5>
//                             <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card’s content.</p>
//                             <a href="#" class="btn btn-primary">Go somewhere_1</a>
//                         </div>
//                     </div>`

//     document.getElementById("culturalEvent")

// {/* <p>📅 ${formatDate(eItems.startDate)} - ${formatDate(eItems.endDate)}</p> */}