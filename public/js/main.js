const table = document.getElementById('data-table');
const pageMenu = document.getElementById('page-links');
const loadSpinner = document.getElementById('pageload-spinner');
const loadPark = document.getElementById('loadpark');
const dispCard = document.getElementById('disp-card');
const dispCardCase = document.getElementById('disp-card-case');

const dataName = 'questions',
    rowsPerPage = 50,
    pagesPerBatch = 10,
    rowsPerBatch = rowsPerPage*pagesPerBatch;

function loadTablePage(pageNumber, datarows, show) {
    const pageId = 'page-' + pageNumber;
    let tbody = document.createElement('tbody');
    
    tbody.setAttribute("id", pageId);
    if (!show) tbody.className = 'd-none';
    table.appendChild(tbody);

    datarows.forEach(question => {
        insertPageRow(pageId, question);
    });
}

function getAndSetData(sort='id', batchNumber=1, showAll=false) {
    hideDisplayCard();
    clearTable();
    const upArrow = '&#9650',
          downArrow = '&#9660;';
    let show = false;

    setWaitNotification(table);

    const sizeQuery = showAll ? 'all=1' : 'batchsize=' + rowsPerBatch;

    fetch(`/api/questions?sort=${sort}&batch=${batchNumber}&${sizeQuery}`)
    .then( response => response.json() )
    .then( data => {
        clearWaitNotification();

        if (data && data.constructor === Array && data.length > 0) {
            const numPages = showAll ? 1 : Math.ceil(data.length/rowsPerPage);
            const pageStart = (batchNumber-1) * pagesPerBatch + 1;
            
            for (let i = 0; i < numPages; i++) {
                linkNote = '';
                let sliceStart = i*rowsPerPage,
                    sliceEnd = sliceStart + rowsPerPage,
                    pageNumber = pageStart + i,
                    pageItems = showAll ? data : data.slice(sliceStart, sliceEnd),
                    show = i == 0 ? true : false;
                
                loadTablePage(pageNumber, pageItems, show);

                if (i == 0 && batchNumber > 1) linkNote = 'showprev';
                else if (i + 1 == numPages && pageItems.length == rowsPerPage) linkNote = 'shownext';
                const isActive = show;
                
                loadPageLink(pageNumber, linkNote, sort, batchNumber, isActive);
            }
        
        }

        const column_arrows = document.querySelectorAll(".col-arrow");
        const clicked_header_arrow = document.querySelector("#col-arrow-" + sort);

        column_arrows.forEach(column_header => {
            column_header.innerHTML = '';
        });
        clicked_header_arrow.innerHTML = `<small>${downArrow}<small>`;
        
    })
    .catch(error => {
        console.log(error);
    });
}

function loadDetail(id) {
    hideDisplayCard();
    setWaitNotification(dispCardCase);
    
    fetch(`/api/questions/${id}`)
    .then( response => response.json() )
    .then( data => {
        clearWaitNotification();
        
        if (typeof data === 'object') {console.log(Object.entries(data));
            for (let [key, value] of Object.entries(data)) {
                let displayElement = document.getElementById('disp-' + key);
    
                if (displayElement) displayElement.innerHTML = value;
            }

            showDisplayCard();
        }
        
    })
    .catch(error => {
        console.log(error);
    });
}

function insertPageRow(pageId, rowData) {
    let page = document.getElementById(pageId),
        newRow = page.insertRow();
    
    let id = newRow.insertCell(0),
        category = newRow.insertCell(1),
        prize = newRow.insertCell(2),
        question = newRow.insertCell(3);
    
    newRow.className = "data-row";
    newRow.id = rowData.id;
    newRow.setAttribute("onclick", "loadDetail(this.id)");
    
    id.setAttribute("scope", "row");
    id.innerHTML = rowData.id;
    category.innerHTML = rowData.category;
    prize.innerHTML = '$' + rowData.value;
    question.innerHTML = rowData.question;
}

function hideDisplayCard() {
    if (!dispCard.classList.contains('d-none')) {
        dispCard.classList.add('d-none');    
    }
}

function showDisplayCard() {
    dispCard.classList.remove('d-none');
}

function clearTable() {
    while ( table.lastChild && table.lastChild.nodeName =='TBODY' ) table.removeChild( table.lastChild );
    while ( pageMenu.lastChild) pageMenu.removeChild( pageMenu.lastChild );
}

function setWaitNotification(element) {
    element.appendChild(loadSpinner);
    loadSpinner.classList.remove('d-none');
}

function clearWaitNotification() {
    loadPark.appendChild(loadSpinner);
    loadSpinner.classList.add('d-none');
}

function loadPageLink (pageNumber, linkNote, sort, batchNumber, isActive=false) {
    const active_str = isActive ? ' active' : '';
    let pageLinkStr = ``;

    if (linkNote == 'showprev') {
        pageLinkStr += `<li class="page-item">
        <a class="page-link" href="#" aria-label="Previous" onClick="getAndSetData('${sort}', ${batchNumber-1})">
            <span aria-hidden="true">&laquo;</span>
            <span class="sr-only">Previous</span>
        </a>
        </li>`;
    }
    pageLinkStr += `<li class="page-item${active_str}">
        <a class="page-link" href="#" onClick="showPage('page-${pageNumber}', this)">${pageNumber}</a>
    </li>`;
    if (linkNote == 'shownext') {
        pageLinkStr += `<li class="page-item">
        <a class="page-link" href="#" aria-label="Next" onClick="getAndSetData('${sort}', ${batchNumber+1})">
            <span aria-hidden="true">&raquo;</span>
            <span class="sr-only">Next</span>
        </a>
        </li>`;
    }
    pageMenu.innerHTML += pageLinkStr;
}

function showPage(pageId, clickedLink) {
    const pages = document.querySelectorAll("tbody");
    const targetPage = document.getElementById(pageId);
    const activeLink = document.querySelector("#page-links li.active");

    hideDisplayCard();

    pages.forEach(page => {
        if (!page.classList.contains('d-none')) page.className = 'd-none';
    });
    targetPage.className = '';

    if (activeLink) {
        activeLink.classList.remove("active");
    }
    clickedLink.parentElement.classList.add("active");
}

getAndSetData();