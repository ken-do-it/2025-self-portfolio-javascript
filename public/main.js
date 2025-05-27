const content = document.getElementById("cultural-Card-id")
const searchInput = document.getElementById("search-input")
const spinner = document.getElementById("loading-spinner")
const onGoing = document.getElementById("onGoing-id")

const showSpinner = () => {
    if (spinner && content) {
        spinner.style.display = "block"
        content.classList.remove("fade-in")
        content.classList.add("fade-out")
    }
}


const hideSpinner = () =>{
    if (spinner && content) {
        spinner.style.display = "none"
        content.classList.remove("fade-out")
        content.classList.add("fade-in")
    }
}


searchInput.addEventListener("keydown", (e)=>{
    e.preventDefault
    if (e.key == "Enter") {
        searchKeyword()
    }
})



let culturalItems = []
let filteredEventItems = []
let pageItems = []

//totalResults
let totalResults = 0
//totalPage
let totalPage = 0
//pageSize = 9
const pageSize = 9
//page 1 
let page = 1
//groupSize = 5
const groupSize = 5

let today = new Date()

const filterUpComingEvents = (items)=>{
    
    return items.filter((item)=>new Date(item.STRTDATE) >= today)
}

const sortEventDate = (items)=>{
    return items.sort((a,b)=> new Date(a.STRTDATE) - new Date(b.STRTDATE))
}


const getPage = (list, page) =>{
    const start = (page-1)*pageSize
    const end = page*pageSize
    return list.slice(start, end)
}



window.searchKeyword  = () => {
    let keyword = searchInput.value.trim()

    copySFItems = filteredEventItems.filter((item)=>item.TITLE.includes(keyword))
    if (copySFItems.length == 0) {
        renderError(`"${keyword}"의 검색결과가 없습니다다`)
        
        return
    }

    renderEvent()
    renderPagination()
}


const inProgress = () =>{
    copySFItems = sortEventDate(culturalItems.filter((item)=>new Date(item.END_DATE) >= today))
    renderEvent()
    renderPagination()
}


onGoing.addEventListener("click", inProgress)


const formatDateWithDay = (dateTimeStr) =>{
    const eventDate = dateTimeStr.split(" ")[0]
    const dateObj = new Date(eventDate)
    // const dateObj = eventDate.getDay()
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]

    const dayName = days[dateObj.getDay()]
    return `${eventDate} (${dayName})`
}



// ✅ 4. 캘린더 렌더 함수
const renderCalendar = (eventList) => {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ko",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,listMonth"
    },
    events: eventList.map(item => ({
      title: item.TITLE,
      start: item.STRTDATE.split(" ")[0],
      end: item.END_DATE ? item.END_DATE.split(" ")[0] : item.STRTDATE.split(" ")[0],
      allDay: true,
    }))
  });

  calendar.render();
};







const getCulturalEvent = async () => {
    showSpinner()
    try {
       //     let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
    // const response = await fetch(url)


        //-------------------------- 이 아래 부분 vercel 배포 시 주석 해제 
        const response = await fetch('/api/getEvents');  
        //-----------------------------------

        const data = await response.json()
        culturalItems = data.culturalEventInfo.row
        filteredEventItems = sortEventDate(filterUpComingEvents(culturalItems))
        copySFItems= [...filteredEventItems] 

        totalResults= copySFItems.length


        renderEvent()
        renderPagination()
        renderCalendar(copySFItems); // ✅ 캘린더 렌더링 추가
        hideSpinner()

    } catch (error) {
        // console.error("데이터 불러오기 실패:", error);
    }
    
}

const renderEvent = () =>{

    pageItems = getPage(copySFItems,page)
    const culturalEventHTML = pageItems.map((eItems)=>
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

    content.innerHTML = culturalEventHTML;
}







const renderPagination = ()=>{
    //totalPage
    totalPage = Math.ceil(totalResults / pageSize)
    //pageSize = 9
    //page 1 
    //groupSize = 5
    //pageGroup
    let pageGroup = Math.ceil(page/groupSize)
    //lastPage
    let lastPage = pageGroup*groupSize
    if (lastPage > totalPage) {
        lastPage = totalPage
    }
    //firstPage
    let firstPage = lastPage - (groupSize-1) <= 0 ? 1: lastPage - (groupSize-1)

    let pageHTML = ""

    if (pageGroup > 1) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo</a></li>` 
    }

    for (let i=firstPage; i<=lastPage; i++){
        pageHTML += `<li class="page-item ${page == i ? "active" : ""}" onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>` 
    }

    if (lastPage < totalPage) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${lastPage + 1})"><a class="page-link">&raquo</a></li>` 
    }

    document.querySelector(".pagination").innerHTML = pageHTML
}


window.moveToPage = (pageNum) => {
    page = pageNum
    renderEvent()
    renderPagination()
}

const renderError = (errorMessage) =>{


    const errorHTML = ` <div class="alert alert-danger" role="alert">${errorMessage}</div> `
    content.innerHTML = errorHTML
    document.querySelector(".pagination").innerHTML = ""
    
}

getCulturalEvent()