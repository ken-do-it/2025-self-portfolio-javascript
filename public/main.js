
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

searchInput.addEventListener("keydown",(e)=> {
    if (e.key==="Enter"){
        e.preventDefault()
        searchKeyword()
    }
})
    
let culturalItems = []
let filteredEvents = []
let keywordFiltered = []

    //total Results
    let totalResults = 0
    //pageSize 12
    const pageSize = 9
    //totalPage
    //groupSize 5
    const groupSize = 5
    //page 1
    let page = 1

const filterUpComingEvents =(items)=>{
    let today = new Date()
    return items.filter((item)=> new Date(item.STRTDATE) >= today)
}

const sortEventDate = (items)=>{
    return items.sort((a,b)=> new Date(a.STRTDATE) - new Date(b.STRTDATE))
}


const getList=(list, page)=>{
    const start = (page-1) * pageSize
    const end = page* pageSize
    return list.slice(start, end)
}


const getCulturalEvent = async () => {
    // let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
    // const response = await fetch(url)



     //-------------------------- 이 아래 부분 vercel 배포 시 주석 해제 
    const response = await fetch('/api/getEvents');  
    //-----------------------------------
    const data = await response.json()
    totalResults = data.culturalEventInfo.list_total_count

    culturalItems = data.culturalEventInfo.row

    culturalItems= sortEventDate(filterUpComingEvents(culturalItems))
    filteredEvents = [...culturalItems]

    

    console.log("culturalItems",culturalItems)
    console.log("filteredEvents",filteredEvents)

    renderEvent()
    renderPagination()
}



const searchKeyword = () => {
    const keyword = searchInput.value.trim()
    filteredEvents = culturalItems.filter((items)=> items.TITLE.includes(keyword))
    console.log("keyword",filteredEvents)
    renderEvent()
    renderPagination()
}

window.searchKeyword = searchKeyword;



const renderEvent = ()=>{
    // filteredEvents = getList(filteredEvents, page) ❌

    const pageItems = getList(filteredEvents, page);  // ❗ 원본 유지
    
    console.log("culturalItems",culturalItems)
    console.log("filteredEvents",filteredEvents)

    const culturalEventHTML = pageItems.map((eItems)=> 
        `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
            <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="이미지 없음">
            <div class="card-body">
                <h5 class="card-title">${eItems.TITLE}</h5>
                <p>📅 ${eItems.DATE}</p>
                <p class="card-text">📍 ${eItems.PLACE}</p>
                ${eItems.USE_FEE ? `<p>💰 ${eItems.USE_FEE}</p>` : ''}
                <a href="${eItems.ORG_LINK}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
            </div>
            </div>`
        ).join('');

    document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML;
}

const renderPagination = ()=>{
    //total Results
    //pageSize 12
    //totalPage
    let totalPage = Math.ceil(filteredEvents.length/pageSize)
    //groupSize 5
    //page 1
    //pageGroup
    let pageGroup = Math.ceil(page/groupSize)
    //lastPage
    let lastPage = pageGroup*groupSize
    if (lastPage > totalPage) {
        lastPage = totalPage
    }

    console.log("totalPage", totalPage)
    console.log("lastPage", lastPage)
    //firstPage
    let firstPage = (lastPage - (groupSize - 1)) <=0 ? 1:(lastPage - (groupSize - 1))
    console.log("first",firstPage)



    let pageHTML = ""

    if (pageGroup > 1) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo;</a></li>`;
    } 

    for (let i = firstPage; i <= lastPage; i++){
        pageHTML += `<li class="page-item ${page == i ? "active": ""}" onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>`
    }

    if (lastPage < totalPage) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${lastPage + 1})"><a class="page-link">&raquo;</a></li>`;
    } 

    document.querySelector(".pagination").innerHTML = pageHTML

}

const moveToPage = (pageNum) => {
    page = pageNum
    getCulturalEvent()
     window.scrollTo({ top: 0, behavior: "smooth" }); // 👈 화면 상단으로 스크롤
}

getCulturalEvent()