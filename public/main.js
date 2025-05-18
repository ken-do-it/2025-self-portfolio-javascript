
// let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
//culturalEventInfo
//list_total_count
//STRTDATE

// pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo;</a></li>`;


// // << 이전 그룹
//     if (firstPage > 1) {
//       pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo;</a></li>`;
//     }

//     for (let i= firstPage; i <=lastPage; i++) {
        
//         pageHTML += `<li class="page-item ${page === i ? "active" : ""}" onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>` 
//     }

//           // >> 다음 그룹
//     if (lastPage < totalPage) {
//       pageHTML += `<li class="page-item" onclick="moveToPage(${lastPage + 1})"><a class="page-link">&raquo;</a></li>`;
//     }

//     document.querySelector(".pagination").innerHTML = pageHTML



// const renderEvent = () => {
//         // ✅ 카드 렌더링
//         // const startIdx = (page - 1) * pageSize;
//         // const endIdx = page * pageSize;
//         // const pageItems = filteredItems.slice(startIdx, endIdx);

//         const culturalEventHTML = culturalItems.map((eItems) =>
//             `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
//             <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="이미지 없음">
//             <div class="card-body">
//                 <h5 class="card-title">${eItems.TITLE}</h5>
//                 <p>📅 ${formatDateWithDay(eItems.STRTDATE)} ~ ${formatDateWithDay(eItems.END_DATE)}</p>
//                 <p class="card-text">📍 ${eItems.PLACE}</p>
//                 ${eItems.USE_FEE ? `<p>💰 ${eItems.USE_FEE}</p>` : ''}
//                 <a href="${eItems.ORG_LINK}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
//             </div>
//             </div>`
//         ).join('');

//     document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML;
// } 



const searchInput = document.getElementById("search-input")
searchInput.addEventListener("keydown", (e)=>{
    e.preventDefault
    if(e.key === "Enter") {
        searchKeyword()
    }
})

const showSpinner = () => {
  document.getElementById("loading-spinner").style.display = "block";
};

const hideSpinner = () => {
  document.getElementById("loading-spinner").style.display = "none";
};


let culturalItems = []
let filteredEvents = []
let eventsItems = []
let getEventItems = []

//totalResults
let totalResults = 0
//pageSize 9
const pageSize = 9 
//totalPage

//page
let page = 1
//groupSize = 5
const groupSize = 5



const filterUpComingEvents =(items)=>{
    let today = new Date()
    return items.filter((item)=>new Date (item.STRTDATE) >= today)
}

const sortEventDate =(items)=>{
    return items.sort((a,b)=> new Date(a.STRTDATE) - new Date(b.STRTDATE))
}

const getItems =(list , page) =>{
    let start = (page-1)*pageSize
    let end = page*pageSize
    return list.slice(start, end)
}


const getCulturalEvent = async () => {

    showSpinner(); // 👉 스피너 먼저 보여주기

    try {
         // let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
        // const response = await fetch(url)



        //-------------------------- 이 아래 부분 vercel 배포 시 주석 해제 
        const response = await fetch('/api/getEvents');  
        //-----------------------------------



        const data = await response.json();
        culturalItems = data.culturalEventInfo.row;

        filteredEvents = sortEventDate(filterUpComingEvents(culturalItems));
        totalResults = filteredEvents.length;
        eventsItems = [...filteredEvents];

        renderEvent();
        renderPagination();
    } catch (error) {
        console.error("데이터 불러오기 실패:", error);
    } finally {
        hideSpinner(); // 👉 완료 후 스피너 숨기기
    }
    // let url  = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
    // const response = await fetch(url)
    // const data = await response.json()
    // culturalItems = data.culturalEventInfo.row

    // filteredEvents = sortEventDate(filterUpComingEvents(culturalItems))

    // console.log("filteredEvents", filteredEvents)
    // totalResults = filteredEvents.length
    // eventsItems = [...filteredEvents]


    renderEvent()
    renderPagination()
}


window.searchKeyword =()=>{
    
    let keyword = searchInput.value.trim()
    eventsItems = filteredEvents.filter((item)=>item.TITLE.includes(keyword))

    console.log("eventItems_1",eventsItems)
    page =1
    renderEvent()
    renderPagination()
}


const renderEvent = () =>{

    getEventItems = getItems(eventsItems, page)
    console.log("eventItems_2",eventsItems)

    const culturalEventHTML = getEventItems.map((eItems)=>
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

    document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML;
}

const renderPagination = () => {
    //totalResults
    //pageSize 9
    //totalPage
    let totalPage = Math.ceil(totalResults/pageSize)
    console.log(totalPage)
    //page
    //groupSize = 5
    //pageGroup
    let pageGroup = Math.ceil(page / groupSize)
    //lastPage
    let lastPage = pageGroup *groupSize
    if (lastPage < groupSize) {
        lastPage = groupSize
    }
    //firstPage
    let firstPage = lastPage - (groupSize - 1) <= 0 ? 1: lastPage - (groupSize - 1)

    let pageHTML = ""


    if(firstPage > 1) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo;</a></li>`;
    }

    for (let i=firstPage; i<=lastPage; i++) {
        pageHTML += `<li class="page-item ${page === i ? "active": "" } " onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>`;
    }

    if (lastPage < totalPage) {
         pageHTML += `<li class="page-item" onclick="moveToPage(${lastPage + 1})"><a class="page-link">&raquo;</a></li>`;
    }
    document.querySelector(".pagination").innerHTML = pageHTML
}

window.moveToPage=(pageNum) =>{
    page = pageNum
    getCulturalEvent()
}

getCulturalEvent()