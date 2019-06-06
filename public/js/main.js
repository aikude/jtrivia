const table = document.getElementById('data-table'),
    pageMenu = document.getElementById('page-links'),
    loadSpinner = document.getElementById('pageload-spinner'),
    loadPark = document.getElementById('loadpark'),
    dispCard = document.getElementById('disp-card'),
    dispCardCase = document.getElementById('disp-card-case'),
    dataName = 'questions',
    rowsPerPage = 20,
    pagesPerBatch = 10,
    rowsPerBatch = rowsPerPage*pagesPerBatch;

// Fetch data rows from API, process and save into Table and pagination
function getAndSetData(sortColumn='id', batchNumber=1, showAll=false, reverse=false) {
    hideDisplayCard();
    clearTable();

    setWaitNotification(table);

    let queryEnd = showAll ? 'all=1' : 'batchsize=' + rowsPerBatch;
    if (reverse) queryEnd += '&reverse=1'

    fetch(`/api/questions?sort=${sortColumn}&batch=${batchNumber}&${queryEnd}`)
    .then( response => response.json() )
    .then( data => {
        clearWaitNotification();

        // If data looks like a result set, do the following
        if (data && data.constructor === Array && data.length > 0) {
            const pageStart = (batchNumber-1) * pagesPerBatch + 1;
            
            // Slice data into pages, and load 1 table page (tbody) plus 1 link for each page
            // Or if showAll, load just 1 page with all the retrieved data
            const numPages = showAll ? 1 : Math.ceil(data.length/rowsPerPage);
            
            for (let i = 0; i < numPages; i++) {
                linkNote = '';
                let sliceStart = i*rowsPerPage,
                    sliceEnd = sliceStart + rowsPerPage,
                    pageNumber = pageStart + i,
                    pageItems = showAll ? data : data.slice(sliceStart, sliceEnd),
                    showPage = i == 0 ? true : false;
                
                loadTablePage(pageNumber, pageItems, showPage);

                if (i == 0 && batchNumber > 1) linkNote = 'showprev';
                else if (i + 1 == numPages && pageItems.length == rowsPerPage) linkNote = 'shownext';
                
                loadPageLink(pageNumber, linkNote, sortColumn, batchNumber, showPage, reverse);
            }
        
        }

        loadPageElements(sortColumn, showAll, reverse);
        
    })
    .catch(error => {
        console.log(error);
    });
}

// Update page elements after new results (sort-links, footer button)
function loadPageElements(sortColumn, showAll, reverse) {
    const columnArrows = document.querySelectorAll(".col-arrow"),
        columnSortLinks = document.querySelectorAll(".colhead"),
        clickedHeaderArrow = document.querySelector("#col-arrow-" + sortColumn),
        footerBtn = document.querySelector("#footer-btn"),
        footerBtnText = showAll ? 'Show Less' : 'Show All',
        toggleLinksShowAll = showAll ? false : true,
        upArrow = '&#9660;',
        downArrow = '&#9650';

    columnArrows.forEach(columnArrow => {
        columnArrow.innerHTML = '';
    });

    columnSortLinks.forEach(sortLink => {
        let columnId = sortLink.id.replace("colhead-","");
        let reverseThis = columnId == sortColumn ? !reverse : false;
        sortLink.setAttribute("onclick", `getAndSetData('${columnId}', 1, ${showAll}, ${reverseThis})`);
    });

    clickedHeaderArrow.innerHTML = `<small>${reverse ? upArrow : downArrow}<small>`;
    footerBtn.setAttribute("onclick", `getAndSetData('${sortColumn}', 1, ${toggleLinksShowAll}, ${reverse})`);
    footerBtn.innerHTML = footerBtnText;
}

// Fetch one question from API and show its details in display card
function loadDetail(clicked_row) {
    hideDisplayCard();
    setWaitNotification(dispCardCase);
    
    fetch(`/api/questions/${clicked_row.id}`)
    .then( response => response.json() )
    .then( data => {
        clearWaitNotification();
        
        if (typeof data === 'object') {
            for (let [key, value] of Object.entries(data)) {
                let displayElement = document.getElementById('disp-' + key);
                
                if (displayElement) displayElement.innerHTML = value;
            }

            showDisplayCard();
            highlightRow(clicked_row.id, 'bg-success text-white');
        }
        
    })
    .catch(error => {
        console.log(error);
    });
}

// Load data rows into a specified dynamic page (tbody) of the HTML table
function loadTablePage(pageNumber, datarows, showPage) {
    const pageId = 'page-' + pageNumber;
    let tbody = document.createElement('tbody');
    
    tbody.setAttribute("id", pageId);
    if (!showPage) tbody.className = 'd-none';
    table.appendChild(tbody);

    datarows.forEach(question => {
        insertPageRow(pageId, question);
    });
}

// Insert one table row (tr) into a given page on the HTML table
function insertPageRow(pageId, rowData) {
    let page = document.getElementById(pageId),
        newRow = page.insertRow();
    
    let id = newRow.insertCell(0),
        category = newRow.insertCell(1),
        prize = newRow.insertCell(2),
        question = newRow.insertCell(3);
    
    newRow.className = "data-row";
    newRow.id = rowData.id;
    newRow.setAttribute("onclick", "loadDetail(this)");
    
    id.setAttribute("scope", "row");
    id.innerHTML = rowData.id;
    category.innerHTML = rowData.category;
    prize.innerHTML = '$' + rowData.value;
    question.innerHTML = rowData.question;
}

// Insert one link into the pagination box, plus the << or >> button when necessary
function loadPageLink (pageNumber, linkNote, sort, batchNumber, isActive=false, reverse=false) {
    const active_str = isActive ? ' active' : '';
    let pageLinkStr = ``;

    if (linkNote == 'showprev') {
        pageLinkStr += `<li class="page-item">
        <a class="page-link" href="#" aria-label="Previous" onClick="getAndSetData('${sort}', ${batchNumber-1}, false, ${reverse})">
            <span aria-hidden="true">&laquo;</span>
            <span class="sr-only">Previous</span>
        </a>
        </li>`;
    }
    pageLinkStr += `<li class="page-item${active_str}">
        <a class="page-link" href="#" onClick="showTablePage('page-${pageNumber}', this)">${pageNumber}</a>
    </li>`;
    if (linkNote == 'shownext') {
        pageLinkStr += `<li class="page-item">
        <a class="page-link" href="#" aria-label="Next" onClick="getAndSetData('${sort}', ${batchNumber+1}, false, ${reverse})">
            <span aria-hidden="true">&raquo;</span>
            <span class="sr-only">Next</span>
        </a>
        </li>`;
    }
    pageMenu.innerHTML += pageLinkStr;
}

// Show the table page of results selected by clicking a numbered pagination link
function showTablePage(pageId, clickedLink) {
    const tablePages = document.querySelectorAll("tbody");
    const targetTablePage = document.getElementById(pageId);
    const activeLink = document.querySelector("#page-links li.active");

    hideDisplayCard();

    tablePages.forEach(tablePage => {
        if (!tablePage.classList.contains('d-none')) tablePage.className = 'd-none';
    });
    targetTablePage.className = '';

    if (activeLink) {
        activeLink.classList.remove("active");
    }
    clickedLink.parentElement.classList.add("active");
}

// Show single result display box
function showDisplayCard() {
    const clientWidth = window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth;

    if (clientWidth && clientWidth > 767) {
        const scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
        dispCard.style.marginTop = scrollTop + 'px';
    }
    else {
        window.scrollTo(0,0);
    }
    dispCard.classList.remove('d-none');
}

// Hide single result display box
function hideDisplayCard() {
    if (!dispCard.classList.contains('d-none')) {
        dispCard.classList.add('d-none');    
    }
}

// Clear results table and pagination (usually before loading fresh results)
function clearTable() {
    while ( table.lastChild && table.lastChild.nodeName =='TBODY' ) table.removeChild( table.lastChild );
    while ( pageMenu.lastChild) pageMenu.removeChild( pageMenu.lastChild );
}

// Show "loading" notification in specified element (usually while results are loading)
function setWaitNotification(element) {
    element.appendChild(loadSpinner);
    loadSpinner.classList.remove('d-none');
}

// Remove "loading" notification
function clearWaitNotification() {
    loadPark.appendChild(loadSpinner);
    loadSpinner.classList.add('d-none');
}

// Highlight given row using given string of classes
function highlightRow(rowId, class_string) {
    const tableRows = document.querySelectorAll("tr.data-row");
    const highlightClasses = class_string.split(" ");

    tableRows.forEach(tableRow => {
        if (tableRow.id == rowId) {
            for (highlightClass of highlightClasses) {
                if (!tableRow.classList.contains(highlightClass)) tableRow.classList.add(highlightClass);
            }
        }
        else if (tableRow.id != rowId) {
            for (highlightClass of highlightClasses) {
                if (tableRow.classList.contains(highlightClass)) tableRow.classList.remove(highlightClass);
            }
        }
    });
}

// Run this on page load
getAndSetData();