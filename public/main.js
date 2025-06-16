// 문화 행사 카드(리스트)를 렌더링할 DOM 요소를 가져옴
const content = document.getElementById("cultural-Card-id")
// 검색어 입력 필드를 가져옴
const searchInput = document.getElementById("search-input")
// 로딩 스피너를 가져옴
const spinner = document.getElementById("loading-spinner")
// '진행 중' 버튼을 가져옴
const onGoing = document.getElementById("onGoing-id")
// 오른쪽 이벤트 리스트 패널 요소를 가져옴
const panel = document.getElementById("event-list-panel")
// 맨 위로 이동 버튼을 가져옴
const scrollToTopBtn = document.getElementById("scrollToTopBtn");

// 카테고리별 분류 기준을 담은 객체
const categoryMap = {
  '공연': ['연극', '클래식', '뮤지컬', '국악', '콘서트', '무용'], // 공연 키워드
  '전시': ['전시', '미술', '사진', '디자인', '공예'],             // 전시 키워드
  '행사': ['축제', '행사', '문화체험', '교육']                 // 행사 키워드
};

// 스크롤 시 맨 위로 버튼을 보이거나 숨김
window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {                          // 스크롤 위치가 200px 이상이면
    scrollToTopBtn.style.display = "block";            // 버튼을 보이게 함
  } else {
    scrollToTopBtn.style.display = "none";             // 아니면 숨김
  }
});

// 맨 위로 버튼 클릭 시 부드럽게 최상단으로 이동
scrollToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

// 로딩 스피너를 표시하고 콘텐츠를 숨기는 함수
const showSpinner = () => {
    if (spinner && content) {                                  // 스피너와 콘텐츠가 있을 때만
        spinner.style.display = "block"                        // 스피너 보이기
        content.classList.remove("fade-in")                    // fade-in 효과 제거
        content.classList.add("fade-out")                      // fade-out 효과 적용
        document.getElementById("calendar").style.display = "none";         // 달력 숨김
        document.getElementById("event-list-panel").style.display = "none"; // 오른쪽 패널 숨김
    }
}

// 로딩 스피너를 숨기고 콘텐츠를 보여주는 함수
const hideSpinner = () =>{
    spinner.style.display = "none"                             // 스피너 숨기기
    content.classList.remove("fade-out")                       // fade-out 효과 제거
    content.classList.add("fade-in")                           // fade-in 효과 적용
    document.getElementById("calendar").style.display = "block";        // 달력 다시 보이기
    document.getElementById("event-list-panel").style.display = "block";// 오른쪽 패널 다시 보이기
}

// 검색창에서 Enter키 입력 시 검색 실행
searchInput.addEventListener("keydown", (e)=>{
    if(e.key == "Enter"){            // 엔터키 누르면
        searchKeyword()              // 검색 함수 실행
    }
})

// DOM이 로드되면 FullCalendar 달력과 오른쪽 패널 초기화
document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');    // 달력 DOM 요소 가져옴
    calendar = new FullCalendar.Calendar(calendarEl, {         // FullCalendar 객체 생성
        initialView: 'dayGridMonth',                           // 월간(dayGridMonth) 뷰로 시작
        aspectRatio: 1.4,           // 일정한 비율 유지
        contentHeight: 'auto',      // 자동 높이
        fixedWeekCount: false,      // 마지막 주 숨김 가능
        events: [],                 // 초기엔 이벤트 없음

        eventContent: function (arg) {
            return {
                html: '<div class="dot-marker"></div>'         // 각 날짜에 ● 점만 표시
            };
        },

        dateClick: (info) =>{                                 // 날짜 클릭 시
            renderEventListPanel(info.dateStr);               // 오른쪽 패널에 이벤트 리스트 표시
        },
    });
    calendar.render();                                        // 달력 렌더링

    renderEventListPanel(formatDateToYMD(new Date()));        // 오늘 날짜 기준으로 오른쪽 패널 초기화
});


// ===================== 데이터, 상태 변수 ====================

// 전체 이벤트 데이터를 담을 배열
let culturalItems = []
// 전체 데이터를 복사한 배열 (필터링용)
let copyCulturalItems = []
// 현재 필터/검색된 이벤트만 담을 배열
let filteredEventItems = []
// 현재 페이지에서 보여줄 이벤트만 담을 배열
let pageEvent = []

let today = new Date()             // 오늘 날짜 객체
let calendar;                      // FullCalendar 전역 참조

let totalResults = 0               // 필터/검색 결과 전체 개수
let totalPage = 0                  // 전체 페이지 개수
const pageSize = 12                // 한 페이지당 보여줄 이벤트 개수
let page = 1                       // 현재 페이지 번호
const groupSize = 5                // 한 번에 보여줄 페이지네이션 버튼 개수

// ===================== 데이터 전처리, 유틸 함수 ====================

// 시작일이 오늘 이후인 이벤트만 필터링하는 함수
const filterUpComingEvents = (items) => {
    return items.filter((item)=>new Date(item.STRTDATE) >= today)
}

// 이벤트 시작일 기준 오름차순 정렬
const sortEventDate = (items) =>{
    return items.sort((a,b)=> new Date(a.STRTDATE) - new Date(b.STRTDATE))
}

// 페이지별로 데이터를 잘라서 반환하는 함수
const getPage = (list,page) =>{
    const start = (page-1)*pageSize             // 시작 인덱스 계산
    const end = page*pageSize                   // 끝 인덱스 계산
    return list.slice(start, end)               // 해당 구간만 반환
}

// ===================== 검색, 필터 함수 ====================

// 키워드 검색 함수
const searchKeyword = () =>{

    let keyword = searchInput.value.trim();      // 입력값 양쪽 공백 제거
    let todayStr = new Date(formatDateToYMD(today));   // 오늘 날짜 문자열

    // 제목에 키워드 포함 + 종료일이 오늘 이후인 데이터만 필터
    filteredEventItems = sortEventDate(
        copyCulturalItems.filter((items) =>
            items.TITLE.includes(keyword) &&
            new Date(formatDateToYMD(items.END_DATE)) >= todayStr
        )
    );

    // 검색 결과 개수 반영
    totalResults = filteredEventItems.length;

    if (filteredEventItems.length == 0) {                // 검색 결과 없으면
        renderError(`"${keyword}"의 검색결과가 없습니다`) // 에러 메시지
        return
    }
    page = 1                                             // 1페이지로 초기화
    renderEvent()                                        // 카드 렌더링
    renderPagination()                                   // 페이지네이션 렌더링
}

// ===================== 날짜 및 문자열 포맷 함수 ====================

// YYYY-MM-DD 요일로 반환
const formatDateWithDay = (dateTimeStr) => {
    const eventDate = dateTimeStr.split(" ")[0]           // 날짜만 추출
    const dateObj = new Date(eventDate)                   // Date 객체로 변환
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
    const dayName = days[dateObj.getDay()]                // 요일 한글 반환
    return `${eventDate}, (${dayName})`
}

// YYYY-MM-DD 형식으로 통일하는 함수
const formatDateToYMD = (dateStr) => {
    if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;                // 이미 YYYY-MM-DD면 그대로 반환
    if (/\d{8}/.test(dateStr)) {                                          // YYYYMMDD면
        return dateStr.slice(0,4) + '-' + dateStr.slice(4,6) + '-' + dateStr.slice(6,8);
    }
    return new Date(dateStr).toISOString().slice(0,10);                   // 그 외 형식 Date → 문자열 반환
}

// ===================== 카테고리 필터 ====================

// 카테고리 필터 함수 (공연/전시/행사/전체)
const filterByCategory = (category) => {
  // 버튼 UI 스타일 처리
  document.querySelectorAll('.filter-group .btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.innerText === category) {
      btn.classList.add('active');
    }
  });

  // '전체'면 전체에서 오늘 이후 데이터만
  if (category === '전체') {
    filteredEventItems = sortEventDate(filterUpComingEvents(copyCulturalItems));
  } else {
    const codenameList = categoryMap[category] || []; // 키워드 배열 가져오기
    // CODENAME 속성에 포함된 데이터만 남김
    filteredEventItems = sortEventDate(
      filterUpComingEvents(copyCulturalItems).filter(item =>
        codenameList.some(codename => item.CODENAME.includes(codename))
      )
    );
  }

  // 필터링 결과 개수 갱신
  totalResults = filteredEventItems.length;

  if (filteredEventItems.length === 0) {
    renderError(`"${category}"에 해당하는 이벤트가 없습니다`);
    return;
  }

  page = 1;           // 첫 페이지로
  renderEvent();      // 카드 렌더링
  renderPagination(); // 페이지네이션 렌더링
};

// ===================== API fetch 및 초기 렌더링 ====================

// 서울시 문화행사 API로 데이터 받아오기
const getCulturalEvent =async ()=>{
    showSpinner()                                                // 로딩 시작
    try {
        //  let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
        // const response = await fetch(url)


        //-------------------------- 이 아래 부분 vercel 배포 시 주석 해제 
        const response = await fetch('/api/getEvents');  
        //-----------------------------------
        // 데이터 fetch
        const data = await response.json()                       // JSON 파싱
        culturalItems = data.culturalEventInfo.row               // 전체 데이터 저장
        copyCulturalItems = [...culturalItems]                   // 복사본 저장
        filteredEventItems = sortEventDate(filterUpComingEvents(copyCulturalItems)) // 오늘 이후만
        totalResults = filteredEventItems.length                 // 결과 개수 저장
        console.log("filteredEventItems",filteredEventItems)

        renderEvent()                                            // 카드 렌더링
        renderPagination()                                       // 페이지네이션
        hideSpinner()                                            // 로딩 종료

        // 날짜별로 중복 없이 한 건씩만 점 이벤트 생성
        const eventDateMap = {};
        culturalItems.forEach(item => {
            const dateStr = formatDateToYMD(item.STRTDATE);      // 시작일 문자열
            if (!eventDateMap[dateStr]) {                        // 처음 등장한 날짜면
                eventDateMap[dateStr] = {
                    title: '이벤트 있음',
                    start: dateStr,
                    allDay: true
                };
            }
        });

        // 객체를 배열로 변환
        const eventDots = Object.values(eventDateMap);

        calendar.removeAllEventSources();                        // 기존 이벤트 지우고
        calendar.addEventSource(eventDots);                      // 새 점 이벤트 소스 추가

        // 오른쪽 패널도 오늘 날짜로 초기화
        renderEventListPanel(formatDateToYMD(today));

    } catch (error) {
        console.error("Error Message", error)
    }
}

// ===================== 진행 중 버튼 (종료일 기준) ====================

const inProgress = () =>{
    console.log("inprogress")
    // 종료일이 오늘 이후인 데이터만
    filteredEventItems = sortEventDate(copyCulturalItems.filter((item)=>new Date(item.END_DATE)>= today))
    renderEvent()
    renderPagination()
}

// '진행 중' 버튼 클릭 시 위 함수 실행
onGoing.addEventListener("click", inProgress)

// ===================== 오른쪽 패널 렌더링 ====================

// 날짜 클릭 시 오른쪽 패널에 해당 날짜의 이벤트 리스트 표시
const renderEventListPanel = (clickedDate) => {

    // 오늘 끝나는 이벤트도 나온다
    const clickedYMD = formatDateToYMD(clickedDate);
    culturalItems = culturalItems.sort((a,b)=>new Date(a.END_DATE) - new Date(b.END_DATE))
    const todayYMD = formatDateToYMD(today);

    // 오늘 이후이면서 시작일이 클릭 날짜 이후인 데이터만
    const events = culturalItems.filter(item => {
        const start = formatDateToYMD(item.STRTDATE);
        const end = formatDateToYMD(item.END_DATE);

        return start >= clickedYMD && end >= todayYMD;
    });

    // HTML 조립 시작
    let html = `
        <div class="event-list-header">
            <h3>${formatDateWithDay(clickedDate)} 일정</h3>
            <p class="event-count">총 ${events.length}개의 이벤트</p>
        </div>`;

    if (!events.length) {
        html += '<div class="no-events">이 날짜에는 예정된 이벤트가 없습니다.</div>';
    } else {
        html += '<div class="event-list">';
        events.forEach(item => {
            html += `
                <div class="event-item border">
                    <div class="event-header"><span class="event-emoji">🟩</span><h4>${item.TITLE}</h4></div>
                    <div class="event-details">
                        <p><i class="fas fa-map-marker-alt"></i> ${item.PLACE}</p>
                        <p><i class="fas fa-clock"></i> ${formatDateWithDay(item.STRTDATE)} ~ ${formatDateWithDay(item.END_DATE)}</p>
                        ${item.USE_FEE ? `<p><i class="fas fa-ticket-alt"></i> ${item.USE_FEE}</p>` : ''}
                    </div>
                    <a href="${item.ORG_LINK}" class="event-link" target="_blank"><i class="fas fa-external-link-alt"></i> 자세히 보기</a>
                </div>
            `;
        });
        html += '</div>';
    }
    // 생성된 HTML을 패널 요소에 삽입
    if (panel){
        panel.scrollTop = 0;                               // 스크롤 최상단
        panel.classList.remove('show');
        panel.classList.add('fade-transition');             // 페이드 아웃
        panel.innerHTML = html;                             // 패널 내용 변경
        panel.scrollTo({ top: 0, behavior: 'smooth' });     // 스크롤 부드럽게 최상단

        setTimeout(() => {                                  // 약간의 시간 후
            panel.classList.add('show');                    // show로 페이드 인
        }, 50);
    } else {
        console.error('event-list-panel DOM not found!');   // 패널 없으면 에러
    }
}

// ===================== 메인 카드(리스트) 렌더링 ====================

const renderEvent = () =>{
    pageEvent = getPage(filteredEventItems, page)               // 현재 페이지 데이터 슬라이싱
    const culturalEventHTML = pageEvent.map((eItems)=>
        `<div class="card col-lg-3 col-md-6 col-sm-12" >
            <img src="${eItems.MAIN_IMG || 'default.jpg'}" class="card-img-top" alt="이미지 없음">
            <div class="card-body">
                <h5 class="card-title">${eItems.TITLE}</h5>
                <p>📅 ${formatDateWithDay(eItems.STRTDATE)} ~ ${formatDateWithDay(eItems.END_DATE)}</p>
                <p class="card-text">📍 ${eItems.PLACE}</p>
                ${eItems.USE_FEE ? `<p>💰 ${eItems.USE_FEE}</p>` : ''}
                <a href="${eItems.ORG_LINK}" class="btn btn-outline-primary" target="_blank" rel="noopener noreferrer"><span>홈페이지&nbsp</span> <span>바로가기</span></a>
            </div>
        </div>`
    ).join('');
    content.innerHTML = culturalEventHTML;                    // 결과를 DOM에 출력
}

// ===================== 페이지네이션 ====================

const renderPagination = () =>{
    totalPage = Math.ceil(totalResults/pageSize)             // 전체 페이지 수 계산
    let pageGroup = Math.ceil(page/groupSize)                // 현재 페이지 그룹 번호
    let lastPage = pageGroup*groupSize                       // 그룹의 마지막 페이지
    if(lastPage > totalPage){
        lastPage = totalPage
    }
    let firstPage = lastPage - (groupSize-1) <=0 ? 1:lastPage - (groupSize-1)  // 그룹의 첫 페이지

    let pageHTML = ""

    if (pageGroup > 1 ){
        pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo</a></li>`
    }

    for (let i=firstPage; i<=lastPage; i++) {
        pageHTML += `<li class="page-item ${page == i ? "active": ""} " onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>`
    }

    if (lastPage < totalPage) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${lastPage + 1})"><a class="page-link">&raquo</a></li>`
    }

    document.querySelector(".pagination").innerHTML = pageHTML // 페이지네이션 DOM에 출력
}

// ===================== 페이지 이동 ====================

const moveToPage = (pageNum)=>{
    page = pageNum
    renderEvent()
    renderPagination()
}

// ===================== 에러 메시지 ====================

const renderError = (errorMessage) =>{
    const errorHTML = `
        <div class="alert alert-danger" role="alert">
            ${errorMessage}
        </div>`
    content.innerHTML = errorHTML
}

// ===================== 앱 진입점(초기 실행) ====================

getCulturalEvent()



