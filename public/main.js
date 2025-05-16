
// search 기능  done


const searchInput = document.getElementById("search-input")

let culturalEventItems = []
let keywordFiltered = []
let userValue = ""
//totalResults
let totalResults = 0
//pageSize 12
const pageSize = 12
// totalPage
let totalPage = 0
//groupSize 5
const groupSize = 5
//page
let page =1



searchInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    searchKeyword();
  }
});

const filterUpComingEvents = (items) =>{
    let today = new Date()
    return items.filter((item)=> new Date(item.STRTDATE) >= today)
}

const sortEventDate =(items) => {
    return items.sort((a , b )=> new Date (a.STRTDATE) - new Date(b.STRTDATE) )
}


const getList = (list, page) =>{

    const start = (page-1) *pageSize
    const end = page * pageSize
    return list.slice(start, end)
}

const getCulturalEvent = async () => {
    let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/1000/`) 
    const response = await fetch(url)
    const data = await response.json()
    culturalEventItems = data.culturalEventInfo.row
    culturalEventItems = sortEventDate(filterUpComingEvents(culturalEventItems))
    keywordFiltered = [...culturalEventItems]
    totalResults = culturalEventItems.length


    
    console.log(culturalEventItems)
    renderEvent()
    renderPagination()
}


const searchKeyword = () => {

    console.log("keyword")
    const keyword = searchInput.value.trim(); 
    keywordFiltered = culturalEventItems.filter(item => 
    item.TITLE.includes(keyword) );


    
    // 결과 업데이트

  totalResults = keywordFiltered.length;
  page = 1; 

   
  

  renderEvent();
  renderPagination();

}


const renderEvent = () =>{

    const culturalList = getList(keywordFiltered,page) 
    const culturalEventHTML = culturalList.map((eItems)=> 
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
    //pageSize 12
    // totalPage
    let totalPage = Math.ceil(totalResults/pageSize)
    console.log("totalPage", totalPage)
    //groupSize 5
    //page
    //pageGroup 
    let pageGroup = Math.ceil(page/groupSize)
    //lastPage
    let lastPage = pageGroup *groupSize
    if (lastPage > totalPage){
        lastPage = totalPage
    }
    //firstPage
    let firstPage = (lastPage - (groupSize-1)) <= 0 ? 1:(lastPage - (groupSize-1)) 


    let pageHTML = ""

    if (firstPage > 1) {
        pageHTML +=`<li class="page-item" onclick="moveToPage(${firstPage-1})"><a class="page-link">&laquo;</a></li>`
    } 


    for (let i= firstPage; i<= lastPage; i++) {
        pageHTML +=`<li class="page-item ${page === i ? "active" : ""}" onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>` 
    }

    if (lastPage < totalPage) {
        pageHTML +=`<li class="page-item" onclick="moveToPage(${lastPage +1})"><a class="page-link">&raquo;</a></li>`
    }

    document.querySelector(".pagination").innerHTML = pageHTML

}


const moveToPage = (pageNum) => {
    page = pageNum
    getCulturalEvent()

}

getCulturalEvent()