
const searchInput = document.getElementById("search-input")
const content = document.getElementById("cultural-Card-id")
const spinner = document.getElementById("loading-spinner")
const onGoing = document.getElementById("onGoing-id")
const calendarEl = document.getElementById('calendar');
const panel = document.getElementById("event-list-panel")




searchInput.addEventListener("keydown", (e)=>{
    e.preventDefault
    if (e.key === "Enter") {
        searchKeyword()
    }
})

let culturalItems = []
let filteredEvents =[]
let copyFilter = []
let PageEventList = []
const today = new Date()
let calendar; // 🔥 전역 선언

document.addEventListener('DOMContentLoaded',  ()=> {
        // const calendarEl = document.getElementById('calendar');
        calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        aspectRatio: 1.4,           // 일정한 비율 유지
        contentHeight: 'auto',      // 자동 높이
        fixedWeekCount: false,      // 마지막 주 숨김 가능
        events: [], // 초기엔 비워둠

        eventContent: function (arg) {
        return {
            html: '<div class="dot-marker"></div>'
        };
        },

         dateClick: (info) =>{ // info 객체는 클릭된 날짜 정보 등을 포함
                // info.dateStr: 클릭한 날짜 (YYYY-MM-DD 형식 문자열)
                renderEventListPanel(info.dateStr); // 클릭된 날짜로 오른쪽 이벤트 리스트 패널 업데이트
            },
        });
        calendar.render();
         syncPanelHeight();
    });



const showSpinner = () => {
    if(spinner && content ) {
        spinner.style.display = "block"
        content.classList.remove("fade-in")
        content.classList.add("fade-out")
         // 🔽 달력과 패널 숨기기
        document.getElementById("calendar").style.display = "none";
        document.getElementById("event-list-panel").style.display = "none";
    }
}

const hideSpinner = () => {
    if (spinner && content) {
        spinner.style.display = "none"
        content.classList.remove("fade-out")
        content.classList.add("fade-in")
          // 🔽 달력과 패널 다시 보이게
        document.getElementById("calendar").style.display = "block";
        document.getElementById("event-list-panel").style.display = "block";
    }
}

//totalResults
let totalResults = 0
//pageSize= 9
const pageSize = 9
//totalPage
let totalPage = 0
//page
let page =1
//groupSize = 5
const groupSize = 5

const filterUpComingEvents= (items) =>{
    let today = new Date()
    return items.filter((item)=>new Date(item.STRTDATE) >= today)
}

const sortEventDate =(items) =>{
    return items.sort((a,b)=>new Date(a.STRTDATE)-new Date(b.STRTDATE))
}


const getPage = (list, page) =>{
    let start = (page-1) * pageSize
    let end = page * pageSize
    return list.slice(start, end)
}

window.searchKeyword = () => {
    let keyword = searchInput.value.trim()
     let todayStr = new Date(formatDateToYMD(today));
    copyFilter = sortEventDate(
        filteredEvents.filter((items) =>
            items.TITLE.includes(keyword) &&
            new Date(formatDateToYMD(items.END_DATE)) >= todayStr
        )
    );
    page = 1
     if (copyFilter.length == 0) {
            renderError(`"${keyword}" 에 대한 검색 결과가 없습니다.`)
        document.querySelector(".pagination").innerHTML = ""; 
        return;
            
        }
    renderEvent()
    renderPagination()
}





const inProgress = () =>{
    console.log("ongoing")
    copyFilter = sortEventDate(culturalItems.filter((item) => new Date(item.END_DATE) >= today));

    renderEvent()
    renderPagination()
}

onGoing.addEventListener("click", inProgress)



const getCulturalEvent = async () => {
    showSpinner()
    try {
    //     let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
    //     const response = await fetch(url)


    //-------------------------- 이 아래 부분 vercel 배포 시 주석 해제 
    const response = await fetch('/api/getEvents');  
    //-----------------------------------



    const data = await response.json()
    culturalItems = data.culturalEventInfo.row
    filteredEvents = sortEventDate(filterUpComingEvents(culturalItems))
    totalResults = filteredEvents.length
    copyFilter =[...filteredEvents]

    renderEvent()
    renderPagination()
    hideSpinner()
     // ✅ 날짜별로 중복 없이 한 건씩만 이벤트 생성
        const eventDateMap = {};
           // ✅ FullCalendar에 이벤트 점 추가 (●)
        culturalItems.forEach(item => {
        const dateStr = formatDateToYMD(item.STRTDATE);
        if (!eventDateMap[dateStr]) {
            eventDateMap[dateStr] = {
            title: '이벤트 있음',
            start: dateStr,
            allDay: true
            };
        }
        });

        // ✅ 값을 배열로 변환
        const eventDots = Object.values(eventDateMap);

        // 캘린더에 추가
        calendar.removeAllEventSources();  // 혹시 중복 방지
        calendar.addEventSource(eventDots);
    } catch (error) {
        renderError(error.message)
        console.error("데이터 불러오기 실패:", error);
        
    }finally {
        hideSpinner()
    }
}   





// ===============================
// 4. 달력-패널 높이 동기화
// ===============================
// 달력의 실제 높이에 맞춰 오른쪽 패널 높이 동기화 함수
// 두 요소의 높이를 일치시켜 시각적 정렬 유지
function syncPanelHeight() {
    const cal = document.getElementById('calendar'); // 캘린더 DOM 요소
    const panel = document.getElementById('event-list-panel'); // 패널 DOM 요소
    // 두 요소 모두 존재할 경우 높이 동기화
    if (cal && panel) {
        const calHeight = cal.getBoundingClientRect().height; // 캘린더 요소의 실제 높이 측정
        panel.style.height = calHeight + 'px'; // 패널의 높이를 캘린더 높이와 같게 설정
    }
}
// 달력 렌더 후, 윈도우 리사이즈 시에도 동기화
// 윈도우 크기 변경 시 syncPanelHeight 함수를 호출하여 패널 높이를 다시 맞춤
window.addEventListener('resize', syncPanelHeight);


// 날짜 포맷 + 요일
const formatDateWithDay = (datetimeStr) => {
  const [year, month, day] = datetimeStr.split(" ")[0].split("-");
  const dateObj = new Date(`${year}-${month}-${day}`);
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const dayName = days[dateObj.getDay()];
  return `${year}.${month}.${day} (${dayName})`;
};


// Helper: format date to YYYY-MM-DD
// 다양한 날짜 형식 문자열을 'YYYY-MM-DD' 형식으로 통일하는 헬퍼 함수
// - 'YYYY-MM-DD' 형식이면 그대로 반환
// - 'YYYYMMDD' 형식이면 변환하여 반환
// - 그 외 형식은 Date 객체로 변환 후 'YYYY-MM-DD'로 반환
const formatDateToYMD = (dateStr) => {
    if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
    if (/\d{8}/.test(dateStr)) {
        return dateStr.slice(0,4) + '-' + dateStr.slice(4,6) + '-' + dateStr.slice(6,8);
    }
    return new Date(dateStr).toISOString().slice(0,10);
}




const renderEventListPanel = (clickedDate) => {
    console.log("hello",clickedDate)

    // 아래 처럼 하면 오늘 끝나는 이벤트도 나온다 

    const clickedYMD = formatDateToYMD(clickedDate);
    culturalItems = culturalItems.sort((a,b)=>new Date(a.END_DATE) - new Date(b.END_DATE))
    const todayYMD = formatDateToYMD(today);

    const events = culturalItems.filter(item => {
        const start = formatDateToYMD(item.STRTDATE);
        const end = formatDateToYMD(item.END_DATE);

        return start <= clickedYMD && end >= todayYMD;
    
// 오늘 끝나는 이벤트는 표시가 안됨
    // const target = new Date(formatDateToYMD(clickedDate));
    // culturalItems = culturalItems.sort((a,b)=>new Date(a.END_DATE) - new Date(b.END_DATE))
    // const events = culturalItems.filter(item => {
    //     const start = new Date(formatDateToYMD(item.STRTDATE));
    //     const end = new Date(formatDateToYMD(item.END_DATE));
    //     const todayStr = new Date(formatDateToYMD(today));
        // return start <= target && end >= todayStr;
    });

    
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
    if (panel) {
         // panel.innerHTML = html;
        panel.scrollTop = 0;
        // 페이드 효과 적용
        panel.classList.remove('show');
        panel.classList.add('fade-transition'); // 애니메이션 클래스 부여

        // 패널 내용 교체
        panel.innerHTML = html;

        // 스크롤 맨 위로 이동 (부드럽게)
        panel.scrollTo({ top: 0, behavior: 'smooth' });

        // 약간의 시간 후 show 클래스 추가 → 페이드 인
        setTimeout(() => {
            panel.classList.add('show');
        }, 50);
    } else {console.error('event-list-panel DOM not found!')} // 패널 요소가 없으면 오류 기록
}




const renderEvent =()=>{

    
    PageEventList = getPage(copyFilter , page)
    const culturalEventHTML = PageEventList.map((eItems)=>
        `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
            <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="이미지 없음">
            <div class="card-body">
                <h5 class="card-title">${eItems.TITLE}</h5>
                <p>📅 ${eItems.STRTDATE}</p>
                <p class="card-text">📍 ${eItems.PLACE}</p>
                ${eItems.USE_FEE ? `<p>💰 ${eItems.USE_FEE}</p>` : ''}
                <a href="${eItems.ORG_LINK}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
            </div>
            </div>`
        ).join('');

    content.innerHTML = culturalEventHTML;
}

const renderPagination =()=>{
    //totalResults
    //pageSize= 9
    //totalPage
    totalPage = Math.ceil(copyFilter.length / pageSize)
    //page
    //groupSize = 5
    //pageGroup
    let pageGroup = Math.ceil(page/groupSize)
    //lastPage
    let lastPage = pageGroup * groupSize
    if (lastPage > totalPage){
        lastPage = totalPage
    }
        
    //firstPage
    let firstPage = (lastPage - (groupSize-1)) <=0 ? 1:(lastPage - (groupSize-1))

    let pageHTML = ""

    if (pageGroup > 1)
        pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo</a></li>` 

    for (let i=firstPage; i<=lastPage; i++) {
        pageHTML += `<li class="page-item ${page === i ? "active": ""}" onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>` 
    }

    if (lastPage < totalPage) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${lastPage + 1})"><a class="page-link">&raquo</a></li>` 
    }

    document.querySelector(".pagination").innerHTML = pageHTML
}

window.moveToPage = (pageNum) =>{
    page = pageNum
    renderEvent()
    renderPagination()
}


const renderError = (errorMessage) => {

    const errorHTML = `
        <div class="alert alert-danger" role="alert">
            ${errorMessage}
        </div>`
    content.innerHTML = errorHTML

}
getCulturalEvent()








