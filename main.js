//let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/5/`) 
// (http://openapi.seoul.go.kr:8088/sample/xml/culturalEventInfo/1/5/%20/%20/2025)
// const API_KEY = '4f5a73544c6c716939324278625a43';
// import { API_KEY } from './config.js';
// const API_KEY = import.meta.env.VITE_API_KEY;


let culturalEventItems = []

let totalResults = 0
let page = 1
let pageSize =12
let groupSize =5 




// 내가 한거 
const getActives = async() => {
    let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/12/%20/%20/2025`)
    const response = await fetch(url)
    const data = await response.json()
    totalResults = data.list_total_count
    console.log("data", data)
    culturalEventItems = data.culturalEventInfo.row
    culturalEventItems = culturalEventItems.reverse();

    console.log("culturalEventItems",culturalEventItems)
    renderCulturalEvent()
    getPagination()
    
}






// 내가 한거 
const renderCulturalEvent = () => {
    const culturalEventHTML = culturalEventItems.map((eItems)=>
        `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
            <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="...">
            <div class="card-body">
                <h5 class="card-title">${eItems.TITLE}</h5>
                
                <p>📅 ${eItems.DATE} </p>
                <p class="card-text">📍 ${eItems.PLACE}</p>
                ${eItems.fee ? `<p>💰 ${eItems.fee}</p>` : ''}
                ${eItems.category ? `<p>🏷️ ${eItems.category}</p>` : ''}
                <a href="${eItems.ORG_LINK}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
            </div>
        </div>`).join('')
    document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML
}



  
  
const getPagination =() =>{
     //total results
    //page Size 10
    //total page 
    let totalPage = Math.ceil(totalResults/pageSize) 
    //group size 5
    //page 1
    //page group
    let pageGroup = Math.ceil(page/groupSize)
    //last page
    let lastPage = Math.ceil(pageGroup*groupSize)
    if (lastPage > totalPage) {
        lastPage = totalPage
    }
    let firstPage = Math.ceil(lastPage-(groupSize-1)) <=0? 1 : lastPage-(groupSize-1)

    let pageHTML = ""
    for (let i=firstPage; i<=lastPage; i++){
        pageHTML += `<li class="page-item" onclick="moveToPage(${i})"><a class="page-link">${i}</a></li>`
    }
    document.querySelector(".pagination").innerHTML = pageHTML
}


  
const moveToPage = (pageNum) =>{
    page = pageNum
    getActives()
}

getActives()


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