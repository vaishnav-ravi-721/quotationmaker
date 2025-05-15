let rowCounter = 1;
      let currentlyEditingRowId = null;
      let historyStack = [];
      let historyIndex = -1;

      // Theme cycling variables
      const themes = ['blue', 'green', 'red', 'purple', 'orange', 'dark'];
      let currentThemeIndex = 0;

      // Initialize history and load saved data/theme when page loads
      document.addEventListener('DOMContentLoaded', function() {
        loadFromLocalStorage(); // Load saved bill data first
        loadHistoryFromLocalStorage(); // Load saved history
        loadSavedTheme(); // Load saved theme
        saveStateToHistory(); // Save the initial state to history

        // Automatically set the current date in dd-mm-yyyy format
        const dateInput = document.getElementById('billDate');
        if (dateInput && !dateInput.value) { // Only set if the input is empty
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            const year = today.getFullYear();
            dateInput.value = `${day}-${month}-${year}`;
            saveToLocalStorage(); // Save the date to local storage
        }
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

        // Add dimensions to the item name for display
        itemName += `<p class="sizes"> W ${width}${measurement} x H ${height}${measurement} x D ${depth}${measurement} </p>`;

        if (isNaN(width) || isNaN(height) || isNaN(rate) || isNaN(quantity) || !itemName) {
          alert("Please enter all the inputs.");
          return;
        }

        // Calculate area in square feet
        let area = convertToFeet(width, measurement) * convertToFeet(height, measurement);
        // Calculate total amount for the item
        let amount = (Number(area) * Number(rate)) * Number(quantity);
        const id = 'row-' + rowCounter++; // Generate unique ID for the row

        // Create rows for both display tables
        const row1 = createTableRow(id, itemName, area, rate, quantity, amount);
        const row2 = createTableRow(id, itemName, area, rate, quantity, amount);

        // Append rows to the tbody of both tables
        document.getElementById("createList").querySelector('tbody').appendChild(row1);
        document.getElementById("copyList").querySelector('tbody').appendChild(row2);


        // Update UI and save state
        updateSerialNumbers();
        updateTotal();
        saveToLocalStorage();
        saveStateToHistory();

        // Clear input fields
        ["width", "height", "depth", "rate", "quantity", "itemName"].forEach(id => {
          document.getElementById(id).value = "";
        });

        // Set focus back to the first input
        document.getElementById("width").focus();
      }

      function updateRow() {
        // Ensure a row is currently being edited
        if (!currentlyEditingRowId) return;

        // Get updated values from input fields
        let width = parseFloat(document.getElementById("width").value.trim());
        let height = parseFloat(document.getElementById("height").value.trim());
        let depth = parseFloat(document.getElementById("depth").value.trim());
        let rate = parseFloat(document.getElementById("rate").value.trim());
        let quantity = parseInt(document.getElementById("quantity").value.trim());
        let itemName = document.getElementById("itemName").value.trim();
        let measurement = document.getElementById("selectMeasurement").value.trim();

        // Add dimensions to the item name for display
        itemName += `<p class="sizes"> W ${width}${measurement} x H ${height}${measurement} x D ${depth}${measurement} </p>`;

        // Validate inputs
        if (isNaN(width) || isNaN(height) || isNaN(rate) || isNaN(quantity) || !itemName) {
          alert("Please enter all the inputs.");
          return;
        }

        // Recalculate area and amount
        let area = convertToFeet(width, measurement) * convertToFeet(height, measurement);
        let amount = (Number(area) * Number(rate)) * Number(quantity);

        // Update rows in both tables based on the stored ID
        const rows1 = document.querySelectorAll(`#createList tr[data-id="${currentlyEditingRowId}"]`);
        const rows2 = document.querySelectorAll(`#copyList tr[data-id="${currentlyEditingRowId}"]`);

        rows1.forEach(row => {
          const cells = row.children;
          cells[1].innerHTML = itemName; // Update item name and sizes
          cells[2].textContent = area.toFixed(2) + ' ft²'; // Update area
          cells[3].textContent = rate.toFixed(2); // Update rate
          cells[4].textContent = quantity; // Update quantity
          cells[5].textContent = amount.toFixed(2); // Update amount
        });

        rows2.forEach(row => {
          const cells = row.children;
          cells[1].innerHTML = itemName; // Update item name and sizes
          cells[2].textContent = area.toFixed(2) + ' ft²'; // Update area
          cells[3].textContent = rate.toFixed(2); // Update rate
          cells[4].textContent = quantity; // Update quantity
          cells[5].textContent = amount.toFixed(2); // Update amount
        });

        // Update UI and save state
        updateSerialNumbers();
        updateTotal();
        saveToLocalStorage();
        saveStateToHistory();

        // Reset form
        ["width", "height", "depth", "rate", "quantity", "itemName"].forEach(id => {
          document.getElementById(id).value = "";
        });

        // Switch back to add mode and clear the currently editing ID
        document.getElementById("addItemBtn").style.display = "inline-block";
        document.getElementById("updateItemBtn").style.display = "none";
        currentlyEditingRowId = null;

        // Set focus back to the first input
        document.getElementById("width").focus();
      }

      // Helper function to create a table row element
      function createTableRow(id, itemName, area, rate, quantity, amount) {
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", id); // Store the unique ID
        // Add click listener to enable editing
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

      // Function to populate the input fields for editing a row
      function editRow(id) {
        const row = document.querySelector(`#createList tr[data-id="${id}"]`);
        if (!row) return; // Exit if row not found

        currentlyEditingRowId = id; // Store the ID of the row being edited

        // Extract data from the row's cells
        const cells = row.children;
        const itemNameHtml = cells[1].innerHTML;

        // Extract the main item name (text before the sizes paragraph)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = itemNameHtml;
        const itemName = tempDiv.childNodes[0].textContent.trim();

        // Extract dimensions from the sizes paragraph using regex
        const sizesText = tempDiv.querySelector('.sizes')?.textContent || '';
        const dimensions = sizesText.match(/W ([\d.]+)([a-z]+) x H ([\d.]+)([a-z]+) x D ([\d.]+)([a-z]+)/);

        // Populate dimension inputs if dimensions are found
        if (dimensions) {
          document.getElementById("width").value = dimensions[1];
          document.getElementById("height").value = dimensions[3];
          document.getElementById("depth").value = dimensions[5];
          // Assuming all dimensions use the same unit, set the measurement dropdown
          document.getElementById("selectMeasurement").value = dimensions[2];
        }

        // Populate other input fields
        document.getElementById("rate").value = cells[3].textContent;
        document.getElementById("quantity").value = cells[4].textContent;
        document.getElementById("itemName").value = itemName;

        // Switch button display to show "Update Item"
        document.getElementById("addItemBtn").style.display = "none";
        document.getElementById("updateItemBtn").style.display = "inline-block";
      }


      // Function to remove a row based on its ID
      function removeRow(id) {
        // Remove rows with the matching data-id from both tables
        document.querySelectorAll(`tr[data-id="${id}"]`).forEach(row => row.remove());
        // Update UI and save state after removal
        updateSerialNumbers();
        updateTotal();
        saveToLocalStorage();
        saveStateToHistory();
      }

      // Function to update the serial numbers in the first column of both tables
      function updateSerialNumbers() {
        // Iterate through both tables
        ['createList', 'copyList'].forEach(tableId => {
          // Select all rows with a data-id attribute within the tbody
          const rows = document.querySelectorAll(`#${tableId} tbody tr[data-id]`);
          // Update the text content of the first cell (serial number) for each row
          rows.forEach((row, i) => {
            row.querySelector('.sr-no').textContent = i + 1;
          });
        });
      }

      // Function to calculate and update the total amount in both tables
      function updateTotal() {
        // Calculate total for the first table by summing the 'amount' cells within tbody
        const total1 = Array.from(document.querySelectorAll('#createList tbody .amount'))
          .reduce((sum, cell) => sum + parseFloat(cell.textContent || 0), 0);

        // Calculate total for the second table by summing the 'amount' cells within tbody
        const total2 = Array.from(document.querySelectorAll('#copyList tbody .amount'))
          .reduce((sum, cell) => sum + parseFloat(cell.textContent || 0), 0);

        // Update the text content of the total amount cells
        document.getElementById("createTotalAmount").textContent = total1.toFixed(2);
        document.getElementById("copyTotalAmount").textContent = total2.toFixed(2);
      }

      // Function to save the current state of the bill to local storage
      function saveToLocalStorage() {
        const data = {
          items: [], // Array to store item details
          company: { // Object to store company details
            name: document.getElementById("companyName").textContent,
            address: document.getElementById("companyAddr").textContent,
            phone: document.getElementById("companyPhone").textContent
          },
          customer: { // Object to store customer details
            name: document.getElementById("custName").value,
            billNo: document.getElementById("billNo").value,
            address: document.getElementById("custAddr").value,
            date: document.getElementById("billDate").value,
            phone: document.getElementById("custPhone").value
          }
        };

        // Iterate through items in the 'createList' table and add them to the data object
        document.querySelectorAll('#createList tbody tr[data-id]').forEach(row => {
          const cells = row.children;
          data.items.push({
            id: row.dataset.id, // Store the row's unique ID
            item: cells[1].innerHTML, // Store item name and sizes HTML
            area: cells[2].textContent, // Store area text
            rate: cells[3].textContent, // Store rate text
            qty: cells[4].textContent, // Store quantity text
            amt: cells[5].textContent // Store amount text
          });
        });

        // Save the data object as a JSON string in local storage
        localStorage.setItem("billData", JSON.stringify(data));
      }

      // Function to load the saved bill data from local storage
      function loadFromLocalStorage() {
        const saved = localStorage.getItem("billData");
        if (!saved) return; // Exit if no data is found

        const data = JSON.parse(saved); // Parse the JSON string back into an object

        // Restore company details
        document.getElementById("companyName").textContent = data.company.name;
        document.getElementById("companyAddr").textContent = data.company.address;
        document.getElementById("companyPhone").textContent = data.company.phone;

        // Restore customer details
        document.getElementById("custName").value = data.customer.name;
        document.getElementById("billNo").value = data.customer.billNo;
        document.getElementById("custAddr").value = data.customer.address;
        document.getElementById("billDate").value = data.customer.date;
        document.getElementById("custPhone").value = data.customer.phone;

        // Find the highest row ID to continue counting from there
        let maxId = 0;
        data.items.forEach(row => {
          const idNum = parseInt(row.id.split('-')[1]); // Extract the number from the ID
          if (idNum > maxId) maxId = idNum;
        });
        rowCounter = maxId + 1; // Set rowCounter to the next available number

        // Clear existing tbody content before loading
        document.getElementById("createList").querySelector('tbody').innerHTML = '';
        document.getElementById("copyList").querySelector('tbody').innerHTML = '';

        // Restore items by creating and appending rows to the tbody of both tables
        data.items.forEach(row => {
          // Note: parseFloat and parseInt are used here to ensure correct data types when recreating rows
          const row1 = createTableRow(row.id, row.item, parseFloat(removeOuterQuotes(row.area)), parseFloat(removeOuterQuotes(row.rate)), parseInt(removeOuterQuotes(row.qty)), parseFloat(removeOuterQuotes(row.amt)));
          const row2 = createTableRow(row.id, row.item, parseFloat(removeOuterQuotes(row.area)), parseFloat(removeOuterQuotes(row.rate)), parseInt(removeOuterQuotes(row.qty)), parseFloat(removeOuterQuotes(row.amt)));

          document.getElementById("createList").querySelector('tbody').appendChild(row1);
          document.getElementById("copyList").querySelector('tbody').appendChild(row2);
        });

        // Update UI after loading
        updateSerialNumbers();
        updateTotal();
      }

      // Function to clear all data (customer details and items)
      function clearAllData() {
         // Save the current state to history before clearing
         saveToHistory();

         // Clear customer details input fields
        document.getElementById("custName").value = "";
        document.getElementById("billNo").value = "";
        document.getElementById("custAddr").value = "";
        document.getElementById("billDate").value = "";
        document.getElementById("custPhone").value = "";

        // Clear items from both tables (clear tbody content)
         document.getElementById("createList").querySelector('tbody').innerHTML = '';
         document.getElementById("copyList").querySelector('tbody').innerHTML = '';

        // Reset row counter
        rowCounter = 1;

        // Update UI after clearing
        updateSerialNumbers();
        updateTotal();

        // Save the cleared state and add to history
        saveToLocalStorage();
        saveStateToHistory();
      }


      // Function to trigger the browser's print dialog (not used for PDF download)
      function printBill() {
        window.print();
      }

      // Function to download the bill as a PDF
      function downloadPDF() {
        const billContainer = document.getElementById("bill-container");
        const addItemContainer = document.getElementById("add-item-container");
        const tools = document.getElementById("tools");
        const historySidebar = document.getElementById("history-sidebar");
        const historyOverlay = document.getElementById("history-overlay");
        const copyListTable = document.getElementById("copyList");

        // Store initial display states
        const initialBillDisplay = billContainer.style.display;
        const initialAddItemDisplay = addItemContainer.style.display;
        const initialToolsDisplay = tools.style.display;
        const initialHistorySidebarDisplay = historySidebar.style.display;
        const initialHistoryOverlayDisplay = historyOverlay.style.display;

        // 1. Show the bill container and hide the add item container
        billContainer.style.display = "block";
        addItemContainer.style.display = "none";

        // Hide elements that should not appear in the PDF
        // Hide the "Remove" column in the copyList table before generating PDF
        hideTableColumn(copyListTable, 6, "none");

        if(historySidebar) historySidebar.style.display = "none"; // Hide history sidebar if it exists
        if(historyOverlay) historyOverlay.style.display = "none"; // Hide history overlay if it exists
        if(tools) tools.style.display = "none"; // Hide tool buttons if it exists


        // Configuration options for html2pdf
        const opt = {
          margin: 0.5, // Add some margin for better appearance
          filename: 'bill.pdf', // Output filename
          image: { type: 'jpeg', quality: 100 }, // Image quality
          html2canvas: {
              scale: 5, // Increase scale for better resolution
              useCORS: true,
              logging: true, // Enable logging for debugging
              allowTaint: true // Allow tainting for cross-origin images if any (use with caution)
          },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } // jsPDF options
        };

        // Generate and save the PDF
        html2pdf().set(opt).from(billContainer).save().then(() => {
            // Use setTimeout to revert display states after PDF generation is complete
            setTimeout(() => {
                // Restore initial display states
                billContainer.style.display = initialBillDisplay;
                addItemContainer.style.display = initialAddItemDisplay;
                if(tools) tools.style.display = initialToolsDisplay;
                if(historySidebar) historySidebar.style.display = initialHistorySidebarDisplay;
                if(historyOverlay) historyOverlay.style.display = initialHistoryOverlayDisplay;

                // Restore the "Remove" column in the copyList table
                hideTableColumn(copyListTable, 6, "table-cell");
            }, 100); // A small delay to ensure PDF saving is complete
        });
      }

      // Undo/Redo functionality

      // Function to save the current state of the application to the history stack
      function saveStateToHistory() {
        // If not at the end of history, discard future states to prevent branching
        if (historyIndex < historyStack.length - 1) {
          historyStack = historyStack.slice(0, historyIndex + 1);
        }

        // Create a state object containing the current data
        const state = {
          items: Array.from(document.querySelectorAll('#createList tbody tr[data-id]')).map(row => {
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

        // Push the current state (as a JSON string) onto the history stack
        historyStack.push(JSON.stringify(state));
        // Update the history index to point to the latest state
        historyIndex = historyStack.length - 1;
      }

      // Function to restore the application state from the history stack
      function restoreStateFromHistory() {
        // Check if the history index is valid
        if (historyIndex < 0 || historyIndex >= historyStack.length) return;

        // Parse the state from the history stack
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

        // Clear current items from both tables (clear tbody content)
        document.getElementById("createList").querySelector('tbody').innerHTML = '';
        document.getElementById("copyList").querySelector('tbody').innerHTML = '';

        // Find the highest row ID from the loaded data to continue counting from there
        let maxId = 0;
        state.items.forEach(row => {
          const idNum = parseInt(row.id.split('-')[1]);
          if (idNum > maxId) maxId = idNum;
        });
        rowCounter = maxId + 1;

        // Restore items by creating and appending rows to the tbody of both tables
        state.items.forEach(row => {
           // Note: parseFloat and parseInt are used here to ensure correct data types when recreating rows
          const row1 = createTableRow(row.id, row.item, parseFloat(removeOuterQuotes(row.area)), parseFloat(removeOuterQuotes(row.rate)), parseInt(removeOuterQuotes(row.qty)), parseFloat(removeOuterQuotes(row.amt)));
          const row2 = createTableRow(row.id, row.item, parseFloat(removeOuterQuotes(row.area)), parseFloat(removeOuterQuotes(row.rate)), parseInt(removeOuterQuotes(row.qty)), parseFloat(removeOuterQuotes(row.amt)));

          document.getElementById("createList").querySelector('tbody').appendChild(row1);
          document.getElementById("copyList").querySelector('tbody').appendChild(row2);
        });

        // Update UI after restoring state
        updateSerialNumbers();
        updateTotal();
        // Save the restored state to local storage (optional, but keeps local storage in sync)
        saveToLocalStorage();
      }

      // Function to undo the last action by moving back in history
      function undoAction() {
        // Move back in history if not at the beginning
        if (historyIndex > 0) {
          historyIndex--;
          restoreStateFromHistory(); // Restore the state at the new index
        }
      }

      // Function to redo the last undone action by moving forward in history
      function redoAction() {
        // Move forward in history if not at the end
        if (historyIndex < historyStack.length - 1) {
          historyIndex++;
          restoreStateFromHistory(); // Restore the state at the new index
        }
      }

      // History sidebar functionality

      // Function to save the current bill data to the history sidebar in local storage
      function saveToHistory() {
        // Get customer details for the history item title
        const customerName = document.getElementById("custName").value.trim() || "Unnamed Bill";
        const billNo = document.getElementById("billNo").value.trim() || "No Bill Number";
        const date = document.getElementById("billDate").value.trim() || new Date().toLocaleDateString();

        // Create a history data object
        const historyData = {
          id: Date.now().toString(), // Unique ID based on timestamp
          title: `${customerName} - ${billNo}`, // Title for the history item
          date: date, // Date of the bill
          data: localStorage.getItem("billData") // Store the current bill data from local storage
        };

        // Get existing history from local storage or initialize an empty array
        let history = JSON.parse(localStorage.getItem("billHistory") || "[]");

        // Prevent saving duplicate history entries if no changes have been made
        if (history.length > 0) {
            const latestHistoryData = JSON.parse(history[0].data);
            const currentData = JSON.parse(historyData.data);
            // Simple comparison: check if the JSON strings are identical
            if (JSON.stringify(latestHistoryData) === JSON.stringify(currentData)) {
                return; // Don't save if the data hasn't changed
            }
        }


        history.unshift(historyData); // Add the new history item to the beginning of the array
        localStorage.setItem("billHistory", JSON.stringify(history)); // Save the updated history back to local storage

        // Add the new history item to the sidebar UI
        addHistoryItemToSidebar(historyData);
      }

      // Function to load history items from local storage and display them in the sidebar
      function loadHistoryFromLocalStorage() {
        const history = JSON.parse(localStorage.getItem("billHistory") || "[]"); // Get history from local storage
        const historyList = document.getElementById("history-list"); // Get the history list element

        historyList.innerHTML = ""; // Clear the current list

        // Add each history item to the sidebar UI
        history.forEach(item => {
          addHistoryItemToSidebar(item);
        });
      }

      // Function to add a single history item to the sidebar UI
      function addHistoryItemToSidebar(item) {
        const historyList = document.getElementById("history-list"); // Get the history list element
        const historyItem = document.createElement("div"); // Create a new div for the history item
        historyItem.className = "history-item"; // Add the history-item class
        historyItem.innerHTML = `
          <div class="history-item-title">${item.title}</div>
          <div class="history-item-date">${item.date}</div>
          <button class="history-item-remove" onclick="removeHistoryItem('${item.id}', event)">×</button>
        `;

        // Add a click listener to load the history item (unless the remove button was clicked)
        historyItem.addEventListener('click', function(e) {
          if (!e.target.classList.contains('history-item-remove')) {
            loadFromHistory(item);
          }
        });

        // Insert the new history item at the beginning of the list
        historyList.insertBefore(historyItem, historyList.firstChild);
      }

      // Function to load a specific history item's data into the main bill interface
      function loadFromHistory(item) {
        if (!item.data) return; // Exit if the history item has no data

        const data = JSON.parse(item.data); // Parse the saved data

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

        // Clear current items from both tables (clear tbody content)
        document.getElementById("createList").querySelector('tbody').innerHTML = '';
        document.getElementById("copyList").querySelector('tbody').innerHTML = '';

        // Find the highest row ID from the loaded data to continue counting from there
        let maxId = 0;
        data.items.forEach(row => {
          const idNum = parseInt(row.id.split('-')[1]);
          if (idNum > maxId) maxId = idNum;
        });
        rowCounter = maxId + 1;

        // Restore items by creating and appending rows to the tbody of both tables
        data.items.forEach(row => {
           // Note: parseFloat and parseInt are used here to ensure correct data types when recreating rows
          const row1 = createTableRow(row.id, row.item, parseFloat(removeOuterQuotes(row.area)), parseFloat(removeOuterQuotes(row.rate)), parseInt(removeOuterQuotes(row.qty)), parseFloat(removeOuterQuotes(row.amt)));
          const row2 = createTableRow(row.id, row.item, parseFloat(removeOuterQuotes(row.area)), parseFloat(removeOuterQuotes(row.rate)), parseInt(removeOuterQuotes(row.qty)), parseFloat(removeOuterQuotes(row.amt)));

          document.getElementById("createList").querySelector('tbody').appendChild(row1);
          document.getElementById("copyList").querySelector('tbody').appendChild(row2);
        });

        // Update UI after loading history
        updateSerialNumbers();
        updateTotal();
        saveToLocalStorage(); // Save the loaded history item as the current state
        toggleHistorySidebar(); // Close the history sidebar
      }

      // Function to remove a history item from local storage and the sidebar UI
      function removeHistoryItem(id, event) {
        event.stopPropagation(); // Prevent the click event from bubbling up to the parent history item

        // Get history from local storage, filter out the item with the matching ID
        let history = JSON.parse(localStorage.getItem("billHistory") || "[]");
        history = history.filter(item => item.id !== id);
        localStorage.setItem("billHistory", JSON.stringify(history)); // Save the updated history

        // Remove the history item from the UI
        const historyItems = document.querySelectorAll('.history-item');
        historyItems.forEach(item => {
          // Find the history item element based on the remove button's onclick attribute
          if (item.querySelector('.history-item-remove').getAttribute('onclick').includes(id)) {
            item.remove(); // Remove the element from the DOM
          }
        });
      }

      // Helper function to convert a value from a given unit to feet
      function convertToFeet(value, unit) {
        switch (unit.toLowerCase()) {
          case 'ft':
            return value; // Already in feet
          case 'inch':
            return value / 12; // Convert inches to feet
          case 'cm':
            return value / 30.48; // Convert centimeters to feet
          case 'mm':
            return value / 304.8; // Convert millimeters to feet
          default:
            // Throw an error for invalid units
            throw new Error('Invalid unit. Use "ft", "inch", "cm", or "mm".');
        }
      }

      // Helper function to hide or show a specific column in a table
      function hideTableColumn(table, columnIndex, display) {
        // Check if the table and its rows exist
        if (!table || !table.rows) return;
        // Iterate through each row in the table
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
             // Check if the row has enough cells to include the target column
            if (row.cells.length > columnIndex) {
              row.cells[columnIndex].style.display = display;
            }
        }
      }

      // Helper function to remove outer quotes from a string
      function removeOuterQuotes(str) {
        // Check if the string exists and remove outer single or double quotes
        return str ? str.replace(/^["'](.*)["']$/, '$1') : '';
      }

      // Function to cycle through themes
      function cycleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        changeTheme(themes[currentThemeIndex]);
      }

      // Function to change the theme based on the theme name
      function changeTheme(theme) {
        const root = document.documentElement;

        switch(theme) {
          case 'blue':
            root.style.setProperty('--primary-color', '#3498db');
            root.style.setProperty('--secondary-color', '#2980b9');
            root.style.setProperty('--text-color', '#333');
            root.style.setProperty('--bg-color', '#f9f9f9');
            root.style.setProperty('--border-color', '#ddd');
            root.style.setProperty('--highlight-color', '#f1c40f');
            root.style.setProperty('--total-bg', '#ecf0f1');
            break;
          case 'green':
            root.style.setProperty('--primary-color', '#2ecc71');
            root.style.setProperty('--secondary-color', '#27ae60');
            root.style.setProperty('--text-color', '#333');
            root.style.setProperty('--bg-color', '#f9f9f9');
            root.style.setProperty('--border-color', '#ddd');
            root.style.setProperty('--highlight-color', '#f1c40f');
            root.style.setProperty('--total-bg', '#eafaf1');
            break;
          case 'red':
            root.style.setProperty('--primary-color', '#e74c3c');
            root.style.setProperty('--secondary-color', '#c0392b');
            root.style.setProperty('--text-color', '#333');
            root.style.setProperty('--bg-color', '#f9f9f9');
            root.style.setProperty('--border-color', '#ddd');
            root.style.setProperty('--highlight-color', '#f1c40f');
            root.style.setProperty('--total-bg', '#fdedec');
            break;
          case 'purple':
            root.style.setProperty('--primary-color', '#9b59b6');
            root.style.setProperty('--secondary-color', '#8e44ad');
            root.style.setProperty('--text-color', '#333');
            root.style.setProperty('--bg-color', '#f9f9f9');
            root.style.setProperty('--border-color', '#ddd');
            root.style.setProperty('--highlight-color', '#f1c40f');
            root.style.setProperty('--total-bg', '#f5eef8');
            break;
          case 'orange':
            root.style.setProperty('--primary-color', '#f26d38');
            root.style.setProperty('--secondary-color', '#e67e22');
            root.style.setProperty('--text-color', '#333');
            root.style.setProperty('--bg-color', '#f9f9f9');
            root.style.setProperty('--border-color', '#ddd');
            root.style.setProperty('--highlight-color', '#f1c40f');
            root.style.setProperty('--total-bg', '#fef5e7');
            break;
          case 'dark':
            root.style.setProperty('--primary-color', '#34495e');
            root.style.setProperty('--secondary-color', '#2c3e50');
            root.style.setProperty('--text-color', '#000');
            root.style.setProperty('--bg-color', '#fff');
            root.style.setProperty('--border-color', '#34495e');
            root.style.setProperty('--highlight-color', '#f1c40f');
            root.style.setProperty('--total-bg', '#e1e1e1');
            break;
        }
        // Save the current theme preference to local storage
        localStorage.setItem('selectedTheme', theme);
      }

      // Function to load the saved theme from local storage
      function loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && themes.includes(savedTheme)) {
          currentThemeIndex = themes.indexOf(savedTheme);
          changeTheme(savedTheme);
        } else {
          // Apply default theme if none saved or invalid
          changeTheme(themes[0]);
        }
      }
