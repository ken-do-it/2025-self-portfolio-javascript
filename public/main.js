

const searchInput = document.getElementById("search-input")
searchInput.addEventListener ("keydown", (e)=> {
    if (e.key == "Enter") {
        e.preventDefault
        searchKeyword()
    }
})

const spinner = document.getElementById("loading-spinner")
const content = document.getElementById("cultural-Card-id")


const showSpinner = () => {
    if (spinner && content) {
        spinner.style.display = "block";
        content.classList.remove("fade-in");
        content.classList.add("fade-out");
    }
};

const hideSpinner = () => {
  if (spinner && content) {
    spinner.style.display = "none";
    content.classList.remove("fade-out");
    content.classList.add("fade-in");
  }
};

let culturalItems = []
let filteredEvents = []
let itemsList = []

//totalResults
let totalResults = 0
//pageSize= 9
const pageSize = 9
//totalPage
let totalPage = 0
//page
let page = 1
//groupSize = 5
const groupSize = 5



const filterUpComingEvents = (items) =>{
    let today = new Date()
    return items.filter((item)=>new Date(item.STRTDATE) >= today)
}

const sortEventDate = (items) =>{
    return items.sort((a,b) => new Date(a.STRTDATE) - new Date(b.STRTDATE))
}





const getCulturalEvent = async () => {
     showSpinner();
     try {
        // let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`)
        // const response = await fetch(url)

        
            //-------------------------- 이 아래 부분 vercel 배포 시 주석 해제 
            const response = await fetch('/api/getEvents');  
            //-----------------------------------

        const data = await response.json()
        console.log(data)
        culturalItems = data.culturalEventInfo.row
        filteredEvents = sortEventDate(filterUpComingEvents(culturalItems))
        
        itemsList = [...filteredEvents]
        totalResults= itemsList.length



        renderEvent()
        renderPagination()
     } catch (error) {
        console.error("데이터 불러오기 실패:", error);
     }finally {
        hideSpinner();
  }
    
}



const renderEvent = () =>{

    let eventPageList = getPage(itemsList, page)

    const culturalEventHTML = eventPageList.map((eItems)=>
        `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
            <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="이미지 없음">
            <div class="card-body">
                <h5 class="card-title">${eItems.TITLE}</h5>
                <p>📅 ${eItems.DATE} </p>
                <p class="card-text">📍 ${eItems.PLACE}</p>
                ${eItems.USE_FEE ? `<p>💰 ${eItems.USE_FEE}</p>` : ''}
                <a href="${eItems.ORG_LINK}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
            </div>
            </div>`
        ).join('');

    // document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML;
    content.innerHTML = culturalEventHTML
}


// const searchKeyword = ()=>{
    window.searchKeyword = () => {
    let keyword = searchInput.value.trim()
    console.log(keyword)
    itemsList = filteredEvents.filter((items)=>items.TITLE.includes(keyword))

    page = 1
    
    renderEvent()
    renderPagination()
}


const getPage = (list, page) =>{
    const start = (page-1)*pageSize
    const end = page*pageSize
    return list.slice(start, end)
}

const renderPagination = ()=>{
    //totalResults
    //pageSize= 9
    //totalPage
    let totalPage = Math.ceil(itemsList.length/pageSize)
    //page
    //groupSize = 5
    //pageGroup
    let pageGroup = Math.ceil(page/groupSize)
    //lastPage
    let lastPage = pageGroup * groupSize

    console.log(lastPage)
    if (lastPage < groupSize) {
        lastPage = groupSize
    }
    //firstPage
    let firstPage = (lastPage - (groupSize-1)) <= 0 ? 1:(lastPage - (groupSize-1))


    let pageHTML = ""

    if (pageGroup > 1) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${firstPage - 1})"><a class="page-link">&laquo;</a></li>`;
    }
    
    for (let i=firstPage; i<=lastPage; i++) {
        pageHTML += `<li class="page-item ${page === i } ? "active": ""}" onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>` 
    } 

    if (lastPage < totalPage) {
        pageHTML += `<li class="page-item" onclick="moveToPage(${lastPage + 1})"><a class="page-link">&raquo;</a></li>`;
    }

    document.querySelector(".pagination").innerHTML = pageHTML



}

// const moveToPage =(pageNum)=>{
window.moveToPage = (pageNum) =>{
    page = pageNum
    getCulturalEvent()
}

getCulturalEvent()