
      
let rowCounter = 1;
let currentlyEditingRowId = null;
let historyStack = [];
let historyIndex = -1;

// Initialize history when page loads
document.addEventListener('DOMContentLoaded', function() {
  saveStateToHistory();
  loadHistoryFromLocalStorage();
});

function show() {
  const bill = document.getElementById("bill-container");
  const item = document.getElementById("add-item-container");
  const isHidden = bill.style.display === "none";
  bill.style.display = isHidden ? "block" : "none";
  item.style.display = isHidden ? "none" : "block";
}

function toggleHistorySidebar() {
  const sidebar = document.getElementById("history-sidebar");
  const overlay = document.getElementById("history-overlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("open");
}

function addRow() {
  let width = parseFloat(document.getElementById("width").value.trim());
  let height = parseFloat(document.getElementById("height").value.trim());
  let depth = parseFloat(document.getElementById("depth").value.trim());
  let rate = parseFloat(document.getElementById("rate").value.trim());
  let quantity = parseInt(document.getElementById("quantity").value.trim());
  let itemName = document.getElementById("itemName").value.trim();
  let measurement = document.getElementById("selectMeasurement").value.trim();

  itemName += `<p class="sizes"> W ${width}${measurement} x H ${height}${measurement} x D ${depth}${measurement} </p>`;

  if (isNaN(width) || isNaN(height) || isNaN(rate) || isNaN(quantity) || !itemName) {
    alert("Please enter all the inputs.");
    return;
  }

  let area = convertToFeet(width, measurement) * convertToFeet(height, measurement);
  let amount = (Number(area) * Number(rate)) * Number(quantity);
  const id = 'row-' + rowCounter++;

  const row1 = createTableRow(id, itemName, area, rate, quantity, amount);
  const row2 = createTableRow(id, itemName, area, rate, quantity, amount);

  document.getElementById("createList").appendChild(row1);
  document.getElementById("copyList").appendChild(row2);

  updateSerialNumbers();
  updateTotal();
  saveToLocalStorage();
  saveStateToHistory();

  ["width", "height", "depth", "rate", "quantity", "itemName"].forEach(id => {
    document.getElementById(id).value = "";
  });

  document.getElementById("width").focus();
}

function updateRow() {
  if (!currentlyEditingRowId) return;

  let width = parseFloat(document.getElementById("width").value.trim());
  let height = parseFloat(document.getElementById("height").value.trim());
  let depth = parseFloat(document.getElementById("depth").value.trim());
  let rate = parseFloat(document.getElementById("rate").value.trim());
  let quantity = parseInt(document.getElementById("quantity").value.trim());
  let itemName = document.getElementById("itemName").value.trim();
  let measurement = document.getElementById("selectMeasurement").value.trim();

  itemName += `<p class="sizes"> W ${width}${measurement} x H ${height}${measurement} x D ${depth}${measurement} </p>`;

  if (isNaN(width) || isNaN(height) || isNaN(rate) || isNaN(quantity) || !itemName) {
    alert("Please enter all the inputs.");
    return;
  }

  let area = convertToFeet(width, measurement) * convertToFeet(height, measurement);
  let amount = (Number(area) * Number(rate)) * Number(quantity);

  // Update both tables
  const rows1 = document.querySelectorAll(`#createList tr[data-id="${currentlyEditingRowId}"]`);
  const rows2 = document.querySelectorAll(`#copyList tr[data-id="${currentlyEditingRowId}"]`);

  rows1.forEach(row => {
    const cells = row.children;
    cells[1].innerHTML = itemName;
    cells[2].textContent = area.toFixed(2) + ' ft²';
    cells[3].textContent = rate.toFixed(2);
    cells[4].textContent = quantity;
    cells[5].textContent = amount.toFixed(2);
  });

  rows2.forEach(row => {
    const cells = row.children;
    cells[1].innerHTML = itemName;
    cells[2].textContent = area.toFixed(2) + ' ft²';
    cells[3].textContent = rate.toFixed(2);
    cells[4].textContent = quantity;
    cells[5].textContent = amount.toFixed(2);
  });

  updateSerialNumbers();
  updateTotal();
  saveToLocalStorage();
  saveStateToHistory();

  // Reset form
  ["width", "height", "depth", "rate", "quantity", "itemName"].forEach(id => {
    document.getElementById(id).value = "";
  });

  // Switch back to add mode
  document.getElementById("addItemBtn").style.display = "inline-block";
  document.getElementById("updateItemBtn").style.display = "none";
  currentlyEditingRowId = null;

  document.getElementById("width").focus();
}

function createTableRow(id, itemName, area, rate, quantity, amount) {
  const tr = document.createElement("tr");
  tr.setAttribute("data-id", id);
  tr.addEventListener('click', function() {
    editRow(id);
  });
  tr.innerHTML = `
    <td class="sr-no"></td>
    <td class="itemNameClass">${itemName}</td>
    <td>${area.toFixed(2)} ft<sup>2</sup></td>
    <td>${rate.toFixed(2)}</td>
    <td>${quantity}</td>
    <td class="amount">${amount.toFixed(2)}</td>
    <td><button onclick="removeRow('${id}')" class="remove-btn">Remove</button></td>
  `;
  return tr;
}

function editRow(id) {
  const row = document.querySelector(`#createList tr[data-id="${id}"]`);
  if (!row) return;

  currentlyEditingRowId = id;
  
  // Extract data from the row
  const cells = row.children;
  const itemNameHtml = cells[1].innerHTML;
  
  // Extract the main item name (before the sizes paragraph)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = itemNameHtml;
  const itemName = tempDiv.childNodes[0].textContent.trim();
  
  // Extract dimensions from the sizes paragraph
  const sizesText = tempDiv.querySelector('.sizes')?.textContent || '';
  const dimensions = sizesText.match(/W ([\d.]+)([a-z]+) x H ([\d.]+)([a-z]+) x D ([\d.]+)([a-z]+)/);
  
  if (dimensions) {
    document.getElementById("width").value = dimensions[1];
    document.getElementById("height").value = dimensions[3];
    document.getElementById("depth").value = dimensions[5];
    document.getElementById("selectMeasurement").value = dimensions[2]; // Assuming all dimensions use same unit
  }
  
  document.getElementById("rate").value = cells[3].textContent;
  document.getElementById("quantity").value = cells[4].textContent;
  document.getElementById("itemName").value = itemName;
  
  // Switch to update mode
  document.getElementById("addItemBtn").style.display = "none";
  document.getElementById("updateItemBtn").style.display = "inline-block";
}

function removeRow(id) {
  document.querySelectorAll(`tr[data-id="${id}"]`).forEach(row => row.remove());
  updateSerialNumbers();
  updateTotal();
  saveToLocalStorage();
  saveStateToHistory();
}

function updateSerialNumbers() {
  ['createList', 'copyList'].forEach(tableId => {
    const rows = document.querySelectorAll(`#${tableId} tr[data-id]`);
    rows.forEach((row, i) => {
      row.querySelector('.sr-no').textContent = i + 1;
    });
  });
}

function updateTotal() {
  const total1 = Array.from(document.querySelectorAll('#createList .amount'))
    .reduce((sum, cell) => sum + parseFloat(cell.textContent || 0), 0);

  const total2 = Array.from(document.querySelectorAll('#copyList .amount'))
    .reduce((sum, cell) => sum + parseFloat(cell.textContent || 0), 0);

  document.getElementById("createTotalAmount").textContent = total1.toFixed(2);
  document.getElementById("copyTotalAmount").textContent = total2.toFixed(2);
}

function saveToLocalStorage() {
  const data = {
    items: [],
    company: {
      name: document.getElementById("companyName").textContent,
      address: document.getElementById("companyAddr").textContent,
      phone: document.getElementById("companyPhone").textContent
    },
    customer: {
      name: document.getElementById("custName").value,
      billNo: document.getElementById("billNo").value,
      address: document.getElementById("custAddr").value,
      date: document.getElementById("billDate").value,
      phone: document.getElementById("custPhone").value
    }
  };

  document.querySelectorAll('#createList tr[data-id]').forEach(row => {
    const cells = row.children;
    data.items.push({
      id: row.dataset.id,
      item: cells[1].innerHTML,
      area: cells[2].textContent,
      rate: cells[3].textContent,
      qty: cells[4].textContent,
      amt: cells[5].textContent
    });
  });

  localStorage.setItem("billData", JSON.stringify(data));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem("billData");
  if (!saved) return;

  const data = JSON.parse(saved);

  document.getElementById("companyName").textContent = data.company.name;
  document.getElementById("companyAddr").textContent = data.company.address;
  document.getElementById("companyPhone").textContent = data.company.phone;

  document.getElementById("custName").value = data.customer.name;
  document.getElementById("billNo").value = data.customer.billNo;
  document.getElementById("custAddr").value = data.customer.address;
  document.getElementById("billDate").value = data.customer.date;
  document.getElementById("custPhone").value = data.customer.phone;

  // Find the highest row ID to continue counting from there
  let maxId = 0;
  data.items.forEach(row => {
    const idNum = parseInt(row.id.split('-')[1]);
    if (idNum > maxId) maxId = idNum;
  });
  rowCounter = maxId + 1;

  data.items.forEach(row => {
    const row1 = createTableRow(row.id, row.item, parseFloat(row.area), parseFloat(row.rate), parseInt(row.qty), parseFloat(row.amt));
    const row2 = createTableRow(row.id, row.item, parseFloat(row.area), parseFloat(row.rate), parseInt(row.qty), parseFloat(row.amt));

    document.getElementById("createList").appendChild(row1);
    document.getElementById("copyList").appendChild(row2);
  });

  updateSerialNumbers();
  updateTotal();
}

function clearAllCustomerDetails() {
  document.getElementById("custName").value = "";
  document.getElementById("billNo").value = "";
  document.getElementById("custAddr").value = "";
  document.getElementById("billDate").value = "";
  document.getElementById("custPhone").value = "";
  saveToLocalStorage();
  saveStateToHistory();
}

function clearAllItems() {
  document.getElementById("createList").innerHTML = `
    <tr>
      <th>Sr No</th>
      <th>Particulars</th>
      <th>Area</th>
      <th>Rate</th>
      <th>Qty</th>
      <th>Amount</th>
      <th>Remove</th>
    </tr>
  `;
  document.getElementById("copyList").innerHTML = `
    <tr>
      <th>Sr No</th>
      <th>Particulars</th>
      <th>Area</th>
      <th>Rate</th>
      <th>Qty</th>
      <th>Amount</th>
      <th>Remove</th>
    </tr>
  `;
  updateSerialNumbers();
  updateTotal();
  saveToLocalStorage();
  saveStateToHistory();
}

function printBill() {
  window.print();
}

function downloadPDF() {
  const element = document.body;  // Capture the entire body
  const tools = document.getElementById("tools");
  const page_1 = document.getElementById("createList");
  const page_2 = document.getElementById("copyList");
  const chooseColor = document.getElementById("chooseColor");
  const historySidebar = document.getElementById("history-sidebar");
  const historyOverlay = document.getElementById("history-overlay");

  hideTableColumn(page_1, 6, "none");
  hideTableColumn(page_2, 6, "none");
  chooseColor.style.display = "none";
  historySidebar.style.display = "none";
  historyOverlay.style.display = "none";

  tools.style.display = "none";

  setTimeout(() => {
    tools.style.display = "flex";
    hideTableColumn(page_1, 6, "table-cell");
    hideTableColumn(page_2, 6, "table-cell");
    chooseColor.style.display = "flex";
    historySidebar.style.display = "block";
    historyOverlay.style.display = "block";
  }, 2000);

  const opt = {
    margin: 0,
    filename: 'download.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

// Undo/Redo functionality
function saveStateToHistory() {
  // If we're not at the end of history, discard future states
  if (historyIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, historyIndex + 1);
  }
  
  const state = {
    items: Array.from(document.querySelectorAll('#createList tr[data-id]')).map(row => {
      const cells = row.children;
      return {
        id: row.dataset.id,
        item: cells[1].innerHTML,
        area: cells[2].textContent,
        rate: cells[3].textContent,
        qty: cells[4].textContent,
        amt: cells[5].textContent
      };
    }),
    company: {
      name: document.getElementById("companyName").textContent,
      address: document.getElementById("companyAddr").textContent,
      phone: document.getElementById("companyPhone").textContent
    },
    customer: {
      name: document.getElementById("custName").value,
      billNo: document.getElementById("billNo").value,
      address: document.getElementById("custAddr").value,
      date: document.getElementById("billDate").value,
      phone: document.getElementById("custPhone").value
    }
  };
  
  historyStack.push(JSON.stringify(state));
  historyIndex = historyStack.length - 1;
}

function restoreStateFromHistory() {
  if (historyIndex < 0 || historyIndex >= historyStack.length) return;
  
  const state = JSON.parse(historyStack[historyIndex]);
  
  // Restore company info
  document.getElementById("companyName").textContent = state.company.name;
  document.getElementById("companyAddr").textContent = state.company.address;
  document.getElementById("companyPhone").textContent = state.company.phone;
  
  // Restore customer info
  document.getElementById("custName").value = state.customer.name;
  document.getElementById("billNo").value = state.customer.billNo;
  document.getElementById("custAddr").value = state.customer.address;
  document.getElementById("billDate").value = state.customer.date;
  document.getElementById("custPhone").value = state.customer.phone;
  
  // Restore items
  document.getElementById("createList").innerHTML = `
    <tr>
      <th>Sr No</th>
      <th>Particulars</th>
      <th>Area</th>
      <th>Rate</th>
      <th>Qty</th>
      <th>Amount</th>
      <th>Remove</th>
    </tr>
  `;
  document.getElementById("copyList").innerHTML = `
    <tr>
      <th>Sr No</th>
      <th>Particulars</th>
      <th>Area</th>
      <th>Rate</th>
      <th>Qty</th>
      <th>Amount</th>
      <th>Remove</th>
    </tr>
  `;
  
  // Find the highest row ID to continue counting from there
  let maxId = 0;
  state.items.forEach(row => {
    const idNum = parseInt(row.id.split('-')[1]);
    if (idNum > maxId) maxId = idNum;
  });
  rowCounter = maxId + 1;
  
  state.items.forEach(row => {
    const row1 = createTableRow(row.id, row.item, parseFloat(row.area), parseFloat(row.rate), parseInt(row.qty), parseFloat(row.amt));
    const row2 = createTableRow(row.id, row.item, parseFloat(row.area), parseFloat(row.rate), parseInt(row.qty), parseFloat(row.amt));

    document.getElementById("createList").appendChild(row1);
    document.getElementById("copyList").appendChild(row2);
  });
  
  updateSerialNumbers();
  updateTotal();
  saveToLocalStorage();
}

function undoAction() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreStateFromHistory();
  }
}

function redoAction() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    restoreStateFromHistory();
  }
}

// History sidebar functionality
function saveToHistory() {
  const customerName = document.getElementById("custName").value.trim() || "Unnamed Bill";
  const billNo = document.getElementById("billNo").value.trim() || "No Bill Number";
  const date = document.getElementById("billDate").value.trim() || new Date().toLocaleDateString();
  
  const historyData = {
    id: Date.now().toString(),
    title: `${customerName} - ${billNo}`,
    date: date,
    data: localStorage.getItem("billData")
  };
  
  let history = JSON.parse(localStorage.getItem("billHistory") || "[]");
  history.unshift(historyData); // Add to beginning of array
  localStorage.setItem("billHistory", JSON.stringify(history));
  
  addHistoryItemToSidebar(historyData);
}

function loadHistoryFromLocalStorage() {
  const history = JSON.parse(localStorage.getItem("billHistory") || "[]");
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";
  
  history.forEach(item => {
    addHistoryItemToSidebar(item);
  });
}

function addHistoryItemToSidebar(item) {
  const historyList = document.getElementById("history-list");
  const historyItem = document.createElement("div");
  historyItem.className = "history-item";
  historyItem.innerHTML = `
    <div class="history-item-title">${item.title}</div>
    <div class="history-item-date">${item.date}</div>
    <button class="history-item-remove" onclick="removeHistoryItem('${item.id}', event)">×</button>
  `;
  
  historyItem.addEventListener('click', function(e) {
    // Don't load if the remove button was clicked
    if (!e.target.classList.contains('history-item-remove')) {
      loadFromHistory(item);
    }
  });
  
  historyList.insertBefore(historyItem, historyList.firstChild);
}

function loadFromHistory(item) {
  if (!item.data) return;
  
  const data = JSON.parse(item.data);
  
  // Restore company info
  document.getElementById("companyName").textContent = data.company.name;
  document.getElementById("companyAddr").textContent = data.company.address;
  document.getElementById("companyPhone").textContent = data.company.phone;
  
  // Restore customer info
  document.getElementById("custName").value = data.customer.name;
  document.getElementById("billNo").value = data.customer.billNo;
  document.getElementById("custAddr").value = data.customer.address;
  document.getElementById("billDate").value = data.customer.date;
  document.getElementById("custPhone").value = data.customer.phone;
  
  // Restore items
  document.getElementById("createList").innerHTML = `
    <tr>
      <th>Sr No</th>
      <th>Particulars</th>
      <th>Area</th>
      <th>Rate</th>
      <th>Qty</th>
      <th>Amount</th>
      <th>Remove</th>
    </tr>
  `;
  document.getElementById("copyList").innerHTML = `
    <tr>
      <th>Sr No</th>
      <th>Particulars</th>
      <th>Area</th>
      <th>Rate</th>
      <th>Qty</th>
      <th>Amount</th>
      <th>Remove</th>
    </tr>
  `;
  
  // Find the highest row ID to continue counting from there
  let maxId = 0;
  data.items.forEach(row => {
    const idNum = parseInt(row.id.split('-')[1]);
    if (idNum > maxId) maxId = idNum;
  });
  rowCounter = maxId + 1;
  
  data.items.forEach(row => {
    const row1 = createTableRow(row.id, row.item, parseFloat(row.area), parseFloat(row.rate), parseInt(row.qty), parseFloat(row.amt));
    const row2 = createTableRow(row.id, row.item, parseFloat(row.area), parseFloat(row.rate), parseInt(row.qty), parseFloat(row.amt));

    document.getElementById("createList").appendChild(row1);
    document.getElementById("copyList").appendChild(row2);
  });
  
  updateSerialNumbers();
  updateTotal();
  saveToLocalStorage();
  toggleHistorySidebar();
}

function removeHistoryItem(id, event) {
  event.stopPropagation(); // Prevent triggering the load function
  
  let history = JSON.parse(localStorage.getItem("billHistory") || "[]");
  history = history.filter(item => item.id !== id);
  localStorage.setItem("billHistory", JSON.stringify(history));
  
  // Remove from UI
  const historyItems = document.querySelectorAll('.history-item');
  historyItems.forEach(item => {
    if (item.querySelector('.history-item-remove').getAttribute('onclick').includes(id)) {
      item.remove();
    }
  });
}

window.onload = function() {
  loadFromLocalStorage();
  // Initialize history after loading from localStorage
  setTimeout(saveStateToHistory, 100);
};

function convertToFeet(value, unit) {
  switch (unit.toLowerCase()) {
    case 'ft':
      return value;
    case 'inch':
      return value / 12;
    case 'cm':
      return value / 30.48;
    case 'mm':
      return value / 304.8;
    default:
      throw new Error('Invalid unit. Use "ft", "inch", "cm", or "mm".');
  }
}

function hideTableColumn(table, columnIndex, display) {
  if (!table || !table.rows) return;
  for (let row of table.rows) {
    if (row.cells.length > columnIndex) {
      row.cells[columnIndex].style.display = display;
    }
  }
}

function clearLocalStorageAndReload() {
  // Save current state to history before clearing
  saveToHistory();
  
  clearAllCustomerDetails();
  clearAllItems();
  saveToLocalStorage();
  saveStateToHistory();
}

function removeOuterQuotes(str) {
  return str ? str.replace(/^["'](.*)["']$/, '$1') : '';
}

    
