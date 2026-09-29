/*
 * These functions below are for various webpage functionalities. 
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 * 
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your 
 *   backend endpoints 
 * and 
 *   HTML structure.
 * 
 */


// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
    .then((text) => {
        statusElem.textContent = text;
    })
    .catch((error) => {
        statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
    });
}

 // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  function showStatus(el, message, isError) {
    el.textContent = message;
    el.className = 'status ' + (isError ? 'error' : 'success');
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  function shelterLabel(row) {
    // row = [Address, PostalCode]
    return `${row[0]} (${row[1]})`;
  }

  // ---------------------------------------------------------------
  // Load shared dropdown data
  // ---------------------------------------------------------------
  async function loadShelters(selectEl) {
    selectEl.innerHTML = '<option value="">Select a shelter…</option>';
    try {
      const res = await fetch('/shelters');
      const { data } = await res.json();
      data.forEach(row => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ address: row[0], postalCode: row[1] });
        opt.textContent = shelterLabel(row);
        selectEl.appendChild(opt);
      });
    } catch (err) {
      selectEl.innerHTML = '<option value="">Could not load shelters</option>';
    }
  }

  let animalCache = [];
  async function loadAnimals(selectEl) {
    selectEl.innerHTML = '<option value="">Select an animal…</option>';
    try {
      const res = await fetch('/animals');
      const { data } = await res.json();
      animalCache = data;
      data.forEach(row => {
        // row = [AnimalID, Breed, Gender, Age, Color, Shelter_Address, Shelter_PostalCode]
        const opt = document.createElement('option');
        opt.value = row[0];
        opt.textContent = `#${row[0]} — ${row[1]}, ${row[3]}y (${row[4]})`;
        selectEl.appendChild(opt);
      });
    } catch (err) {
      selectEl.innerHTML = '<option value="">Could not load animals</option>';
    }
  }

  // ---------------------------------------------------------------
  // INSERT
  // ---------------------------------------------------------------
  const insertShelterSelect = document.getElementById('insert-shelter');
  loadShelters(insertShelterSelect);

  document.getElementById('insert-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('insert-status');
    const shelterRaw = insertShelterSelect.value;

    if (!shelterRaw) {
      showStatus(statusEl, 'Please select a shelter.', true);
      return;
    }
    const shelter = JSON.parse(shelterRaw);

    const body = {
      animalID: document.getElementById('insert-id').value,
      breed: document.getElementById('insert-breed').value,
      gender: document.getElementById('insert-gender').value,
      age: document.getElementById('insert-age').value,
      color: document.getElementById('insert-color').value,
      shelterAddress: shelter.address,
      shelterPostalCode: shelter.postalCode
    };

    const { ok, data } = await postJSON('/insert-animal', body);
    if (ok && data.success) {
      showStatus(statusEl, 'Animal added.', false);
      e.target.reset();
      loadAnimals(document.getElementById('update-select'));
      loadAnimals(document.getElementById('delete-select'));
    } else {
      showStatus(statusEl, data.message || 'Could not add animal.', true);
    }
  });

  // ---------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------
  const updateSelect = document.getElementById('update-select');
  const updateShelterSelect = document.getElementById('update-shelter');
  loadAnimals(updateSelect);
  loadShelters(updateShelterSelect);

  // Enable/disable inputs based on checkbox
  document.querySelectorAll('.update-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const field = cb.dataset.field;
      const input = document.getElementById('update-' + field);
      input.disabled = !cb.checked;
    });
  });

  document.getElementById('update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('update-status');
    const animalID = updateSelect.value;

    if (!animalID) {
      showStatus(statusEl, 'Please select an animal first.', true);
      return;
    }

    const body = { animalID };
    let anyChecked = false;

    document.querySelectorAll('.update-toggle').forEach(cb => {
      if (cb.checked) {
        anyChecked = true;
        const field = cb.dataset.field;
        if (field === 'shelter') {
          const raw = updateShelterSelect.value;
          if (raw) {
            const shelter = JSON.parse(raw);
            body.shelterAddress = shelter.address;
            body.shelterPostalCode = shelter.postalCode;
          }
        } else {
          body[field] = document.getElementById('update-' + field).value;
        }
      }
    });

    if (!anyChecked) {
      showStatus(statusEl, 'Check at least one field to update.', true);
      return;
    }

    const { ok, data } = await postJSON('/update-animal', body);
    if (ok && data.success) {
      showStatus(statusEl, 'Animal updated.', false);
      loadAnimals(updateSelect);
      loadAnimals(document.getElementById('delete-select'));
    } else {
      showStatus(statusEl, data.message || 'Update failed.', true);
    }
  });

  // ---------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------
  const deleteSelect = document.getElementById('delete-select');
  loadAnimals(deleteSelect);

  document.getElementById('delete-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('delete-status');
    const animalID = deleteSelect.value;

    if (!animalID) {
      showStatus(statusEl, 'Please select an animal first.', true);
      return;
    }

    const confirmed = confirm(`Remove animal #${animalID} and all related records? This cannot be undone.`);
    if (!confirmed) return;

    const { ok, data } = await postJSON('/delete-animal', { animalID });
    if (ok && data.success) {
      showStatus(statusEl, 'Animal removed.', false);
      loadAnimals(deleteSelect);
      loadAnimals(updateSelect);
    } else {
      showStatus(statusEl, data.message || 'Delete failed.', true);
    }
  });

  // ---------------------------------------------------------------
  // DIVISION
  // ---------------------------------------------------------------
  document.getElementById('division-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('division-status');
    const table = document.getElementById('division-table');
    const body = document.getElementById('division-body');
    const emptyNote = document.getElementById('division-empty');

    statusEl.className = 'status';
    table.style.display = 'none';
    emptyNote.style.display = 'none';

    try {
      const res = await fetch('/donors-all-categories');
      const { data } = await res.json();
      body.innerHTML = '';

      if (!data || data.length === 0) {
        emptyNote.style.display = 'block';
        return;
      }

      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row[0]}</td><td>${row[1]}</td>`;
        body.appendChild(tr);
      });
      table.style.display = 'table';
    } catch (err) {
      showStatus(statusEl, 'Could not load results.', true);
    }
  });


// ----------------------- Sujin's Script -------------------------------------------
// SELECTION

function addAttribute() {
    const attributeList = document.getElementById("attributeList");

    const newLine = document.createElement("div");
    newLine.className = "attributeLine";

    newLine.innerHTML = `
        <select class="logic">
            <option value="and">AND</option>
            <option value="or">OR</option>
        </select> 
        <select class="attr">
            <option value="breed">Breed</option>
            <option value="gender">Gender</option>
            <option value="age">Age</option>
            <option value="color">Color</option>
            <option value="shelter">Shelter</option>
        </select>
        <input class="selectionInput" placeholder="Enter value" maxlength="20" required>
        <button type="button" class="deleteButton">delete</button>
        <br><br>
    `
    attributeList.appendChild(newLine);

    const deleteButton = newLine.querySelector(".deleteButton");
    const selectedAttr = newLine.querySelector(".attr");

    deleteButton.addEventListener("click", deleteAttribute);
    selectedAttr.addEventListener("change",(e) => {updateSelectionInput(newLine, e.target.value)});
}

function updateSelectionInput(line, selectedAttr) {
    const currentSelection = line.querySelector(".selectionInput");
    
    let customizedInput;

    if (selectedAttr == "gender") {
        customizedInput = document.createElement("input");
        customizedInput.type = "text";
        customizedInput.maxLength = "1";
        customizedInput.placeholder = "Enter M or F";
        customizedInput.className = "selectionInput";
        customizedInput.required = true;
    }
    else if (selectedAttr == "age") {
        customizedInput = document.createElement("input");
        customizedInput.type = "number";
        customizedInput.min = "0";
        customizedInput.placeholder = "Enter M or F";
        customizedInput.className = "selectionInput";
        customizedInput.required = true;
    } else {
        customizedInput = document.createElement("input");
        customizedInput.type = "text";
        customizedInput.maxLength = "20";
        customizedInput.placeholder = "Enter value";
        customizedInput.className = "selectionInput";
        customizedInput.required = true;
    }

    if (selectedAttr == "breed") customizedInput.placeholder = "e.g ragdoll";
    if (selectedAttr == "color") customizedInput.placeholder = "e.g black";
    if (selectedAttr == "shelter") customizedInput.placeholder = "e.g 100 King St";
    if (selectedAttr == "age") customizedInput.placeholder = "e.g 1";

    currentSelection.replaceWith(customizedInput);
}

// apply to the first attribute line hardcoded in html
const firstLine = document.querySelector(".attributeLine");
const firstLineAttr = firstLine.querySelector(".attr");
firstLineAttr.addEventListener("change", (e) => {updateSelectionInput(firstLine, e.target.value)});


function deleteAttribute(event){
    event.preventDefault();

    const attributeToDelete = event.target.closest(".attributeLine");
    attributeToDelete.remove();   
}

async function selectFromAnimal(event) {
    event.preventDefault();

    const selectedAttributes = document.querySelectorAll(".attributeLine");

    const attributeList = [];

    selectedAttributes.forEach(a => {
        let logicValue = a.querySelector(".logic");
        if (logicValue) {
            logicValue = logicValue.value;
        } else {
            logicValue = "";
        }
        
        const attr = a.querySelector(".attr").value;
        const userInput = a.querySelector(".selectionInput").value;

        attributeList.push({
            logic: logicValue,
            attribute: attr,
            userInput: userInput
        })

    })
    const response = await fetch("/selection", {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
            attributes: attributeList
        })
    });
    
    const responseData = await response.json();
    const messageElement = document.getElementById("selectionMessage");

    if (responseData.success) {
        messageElement.textContent = `Animals selected successfully.`;

        // if no data returned ([])
        if (!responseData.data || responseData.data.length == 0) {
            messageElement.textContent = "No matching animal found."
            renderStaticTable(responseData.data, "selectionTableBody");
        }
        else {
            renderStaticTable(responseData.data, "selectionTableBody");
        }

    } else {
        alert("Error in Selection!");
    }
}

// PROJECTION
let checkedBoxesInOrder = [];

function boxChecked(checkbox) {
    const attribute = checkbox.getAttribute("data-field");

    if (checkbox.checked) {
        checkedBoxesInOrder.push(attribute);
    } else {
        checkedBoxesInOrder = checkedBoxesInOrder.filter(i => i !== attribute);
        // console.log(checkedBoxesInOrder);
    }
}

async function viewVolunteer(event) {
    event.preventDefault();
    
    const response = await fetch("/projection", {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
            attributes: checkedBoxesInOrder
        })
    });
    
    const responseData = await response.json();
    const messageElement = document.getElementById("projectionMessage");

    if (responseData.success) {
        messageElement.textContent = `Search Success.`;

        // if no data returned ([])
        if (!responseData.data || responseData.data.length == 0) {
            messageElement.textContent = "No Volunteer Record Available."
            renderDynamicTable(responseData.data, checkedBoxesInOrder);
        }
        else {
            renderDynamicTable(responseData.data, checkedBoxesInOrder);
        }
    } else {
        alert("Error in Projection!");
    }
}

// JOIN
async function joinAdopterAndAnimal(event) {
    event.preventDefault();
    
    const adopterName = document.getElementById("adopterName").value;

    const response = await fetch("/join", {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
            adopterName: adopterName,
        })
    });
    
    const responseData = await response.json();
    const messageElement = document.getElementById("joinMessage");
    if (responseData.success) {
        // error handling
        if (responseData.status == "user_not_found") {
            messageElement.textContent = "No matching adopter name. Please enter a valid adopter name or register the user as adopter."
        } else if (responseData.status == "no_record") {
            messageElement.textContent = "No adoption record for this user."
        }
        else if (responseData.status == "success") {
            messageElement.textContent = "Search Success.";
        }
        // render table
        renderStaticTable(responseData.data, "joinTableBody");

    } else {
        alert("Error in Join!");
    }
}

// Helper functions

function renderDynamicTable (data, attributes) {

    const tableHeader = document.getElementById("projectionTableHeader1");
    const tableBody = document.getElementById("projectionTableBody");

    if (tableHeader && tableBody) {
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';
    };

    if (attributes) {
        attributes.forEach(attr => {
            const head = document.createElement("th");
            head.textContent = attr;
            tableHeader.appendChild(head);
        });
    }

    data.forEach(entry => {
        const row = tableBody.insertRow();

        entry.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

function renderStaticTable(data, id) {
    const tableBody = document.getElementById(id);

    if (tableBody) {
        tableBody.innerHTML = '';
    }

    data.forEach(entry => {
        const row = tableBody.insertRow();

        entry.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
};



// ----------------------- END OF Sujin's Script -------------------------------------------

// AGGREGATE WITH GROUP BY

async function getTotalBreedForCategories() {
    const response = await fetch("/get-all-types-animals", {
        method: 'GET'
    });

    const responseData = await response.json();
    console.log(responseData); 
    const messageElement = document.getElementById('breedAllCategoriesResultMsg');
    const tableBody = document.getElementById('breedAllCategoriesTableBody');


    if (responseData.success) {
        const rows = responseData.data; 
        tableBody.innerHTML = '';

        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
        
        messageElement.textContent = `Results calculated successfully!`;
    } else {
        alert("Error in finding results!");
    }
}

// AGGREGATE HAVING

async function getSheltersWith5PlusStaff() {
    const response = await fetch("/get-shelters-with-more-than-5-staff", {
        method: 'GET'
    });

    const responseData = await response.json();
    console.log(responseData); 
    const messageElement = document.getElementById('shelterTenResultsMsg');
    const tableBody = document.getElementById('sheltersMoreThan5TableBody');


    if (responseData.success) {
        const rows = responseData.data; 
        tableBody.innerHTML = '';

        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
        
        messageElement.textContent = `Results calculated successfully!`;
    } else {
        alert("Error in finding results!");
    }
}

// NESTED AGGREGATE GROUP BY

async function getSheltersMoreThanAvgNumAnimals() {
    const response = await fetch("/get-shelters-with-more-than-average-animals", {
        method: 'GET'
    });

    const responseData = await response.json(); 
    const messageElement = document.getElementById('higherThanAverageNumAnimalsMsg');
    const tableBody = document.getElementById('higherThanAverageNumAnimalsTableBody');


    if (responseData.success) {
        const rows = responseData.data; 
        tableBody.innerHTML = '';

        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
        
        messageElement.textContent = `Results calculated successfully!`;
    } else {
        alert("Error in finding results!");
    }
}


// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function() {
    document.getElementById("breedAllCategories").addEventListener("click", getTotalBreedForCategories);
    document.getElementById("getSheltersWithMoreThan5Staff").addEventListener("click", getSheltersWith5PlusStaff);
    document.getElementById("higherThanAverageNumAnimalsButton").addEventListener("click", getSheltersMoreThanAvgNumAnimals);

    document.getElementById("selectionAnimal").addEventListener("submit",selectFromAnimal);
    document.getElementById("addAttributeBtn").addEventListener("click", addAttribute);
    document.getElementById("projectVolunteer").addEventListener("submit",viewVolunteer);
    document.getElementById("joinAdopterAnimal").addEventListener("submit",joinAdopterAndAnimal);

    checkDbConnection();
    
};
