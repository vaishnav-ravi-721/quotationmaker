let rowCounter = 1;

function show() {
  const bill = document.getElementById("bill-container");
  const item = document.getElementById("add-item-container");
  const isHidden = bill.style.display === "none";
  bill.style.display = isHidden ? "block" : "none";
  item.style.display = isHidden ? "none" : "block";
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

  let area = convertToFeet(width, measurement) * convertToFeet(height, measurement) * quantity;
  let amount = area * rate * quantity;
  const id = 'row-' + rowCounter++;

  const row1 = createTableRow(id, itemName, area, rate, quantity, amount);
  const row2 = createTableRow(id, itemName, area, rate, quantity, amount);

  document.getElementById("createList").appendChild(row1);
  document.getElementById("copyList").appendChild(row2);

  updateSerialNumbers();
  updateTotal();
  saveToLocalStorage();

  ["width", "height", "depth", "rate", "quantity", "itemName"].forEach(id => {
    document.getElementById(id).value = "";
  });

  document.getElementById("width").focus();
}

function createTableRow(id, itemName, area, rate, quantity, amount) {
  const tr = document.createElement("tr");
  tr.setAttribute("data-id", id);
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

function removeRow(id) {
  document.querySelectorAll(`tr[data-id="${id}"]`).forEach(row => row.remove());
  updateSerialNumbers();
  updateTotal();
  saveToLocalStorage();
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

  data.items.forEach(row => {
    const row1 = createTableRow(row.id, row.item, parseFloat(row.area), parseFloat(row.rate), parseInt(row.qty), parseFloat(row.amt));
    const row2 = createTableRow(row.id, row.item, parseFloat(row.area), parseFloat(row.rate), parseInt(row.qty), parseFloat(row.amt));

    document.getElementById("createList").appendChild(row1);
    document.getElementById("copyList").appendChild(row2);
    rowCounter++;
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
}

function printBill() {
  const tools = document.getElementById("tools");
  const page_1 = document.getElementById("createList");
  const page_2 = document.getElementById("copyList");

  hideTableColumn(page_1, 6, "none");
  hideTableColumn(page_2, 6, "none");

  tools.style.display = "none";

  setTimeout(() => {
    tools.style.display = "block";
    hideTableColumn(page_1, 6, "table-cell");
    hideTableColumn(page_2, 6, "table-cell");
  }, 2000);

  window.print();
}

window.onload = loadFromLocalStorage;

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
  clearAllCustomerDetails();
  clearAllItems();
  // localStorage.clear();
  // location.reload(); 
}

function removeOuterQuotes(str) {
  return str ? str.replace(/^["'](.*)["']$/, '$1') : '';
}
