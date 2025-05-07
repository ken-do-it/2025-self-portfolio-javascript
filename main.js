//let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/5/`) 


let culturalEventItems = []

const getActives = async() => {
    let url = new URL(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/culturalEventInfo/1/12/%20/%20/2025`)
    const response = await fetch(url)
    console.log("response", response)
    const data = await response.json()
    console.log("data", data)
    culturalEventItems = data.culturalEventInfo.row
    console.log("culturalEventItems",culturalEventItems)
    renderCulturalEvent()
    
}




const renderCulturalEvent = () => {
    const culturalEventHTML = culturalEventItems.map((eItems)=>
        `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
            <img src="${eItems.MAIN_IMG}" class="card-img-top" alt="...">
            <div class="card-body">
                <h5 class="card-title">${eItems.TITLE}</h5>
                
                <p>📅 ${formatDateWithDay(eItems.STRTDATE)} -${formatDateWithDay(eItems.END_DATE)} </p>
                <p class="card-text">📍 ${eItems.PLACE}</p>
                ${eItems.fee ? `<p>💰 ${eItems.fee}</p>` : ''}
                ${eItems.category ? `<p>🏷️ ${eItems.category}</p>` : ''}
                <a href="${eItems.ORG_LINK}" target="_blank" rel="noopener noreferrer">홈페이지 바로가기</a>
                <a href="#" class="btn btn-primary">Go somewhere_1</a>
            </div>
        </div>`)
    document.getElementById("cultural-Card-id").innerHTML = culturalEventHTML
}


// date resolve 1
// const formatDate = (datetimeStr) => {
//     datetimeStr.split(" ")[0]; // "2025-12-21 00:00:00.0" → "2025-12-21"
//     const [year, month, day] = datetimeStr.split(" ")[0].split("-");
//     return `${year}년${month}월${day}일`;
//   };


// date resolve 2
//   const formatDate = (datetimeStr) => {
//     return datetimeStr.substring(0, 10); // 앞의 10자리만 잘라옴 → "2025-12-21"
//   };

// date resolve 3
const formatDateWithDay = (datetimeStr) => {
    const datePart = datetimeStr.split(" ")[0]; // "2025-12-21"
    const [year, month, day] = datePart.split("-");
    const dateObj = new Date(`${year}-${month}-${day}`);
  
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const dayName = days[dateObj.getDay()];
  
    return `${year}년${month}월${day}일 (${dayName})`;
  };
getActives()



// aaaHTML = `<div class="card col-lg-3 col-md-6 col-sm-12" style="width: 18rem;">
//                         <img src="..." class="card-img-top" alt="...">
//                         <div class="card-body">
//                             <h5 class="card-title">Card title_1</h5>
//                             <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card’s content.</p>
//                             <a href="#" class="btn btn-primary">Go somewhere_1</a>
//                         </div>
//                     </div>`

//     document.getElementById("culturalEvent")

{/* <p>📅 ${formatDate(eItems.startDate)} - ${formatDate(eItems.endDate)}</p> */}