
const searchInput = document.getElementById("search-input")
const content = document.getElementById("cultural-Card-id")
const spinner = document.getElementById("loading-spinner")
const onGoing = document.getElementById("onGoing-id")




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


const showSpinner = () => {
    if(spinner && content ) {
        spinner.style.display = "block"
        content.classList.remove("fade-in")
        content.classList.add("fade-out")
    }
}

const hideSpinner = () => {
    if (spinner && content) {
        spinner.style.display = "none"
        content.classList.remove("fade-out")
        content.classList.add("fade-in")
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
    copyFilter = filteredEvents.filter((item)=>item.TITLE.includes(keyword))
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
    // const response = await fetch(url)


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
    } catch (error) {
        renderError(error.message)
        console.error("데이터 불러오기 실패:", error);
        
    }finally {
        hideSpinner()
    }
}   



// 날짜 포맷 + 요일
const formatDateWithDay = (datetimeStr) => {
  const [year, month, day] = datetimeStr.split(" ")[0].split("-");
  const dateObj = new Date(`${year}-${month}-${day}`);
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const dayName = days[dateObj.getDay()];
  return `${year}.${month}.${day} (${dayName})`;
};



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








