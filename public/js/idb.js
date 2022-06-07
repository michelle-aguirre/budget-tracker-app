let db;

const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore("new_budget", { autoIncrement: true});
};

request.onsuccess = function (event) {
    db = event.target.result;

    if(navigator.onLine) {
        uploadNewBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// Will be executed if there's no internet connection
function saveRecord(record) {
    const isDeposit = record.value > 0;
    const transaction = db.transaction(["new_budget"], "readwrite");
    const budgetObjectStore = transaction.objectStore("new_budget");

    budgetObjectStore.add(record);
}

function uploadNewBudget() {
    const transaction = db.transaction(["new_budget"], "readwrite");
    const budgetObjectStore = transaction.objectStore("new_budget");
    const getAll = budgetObjectStore.getAll();

    // run this function upon a successful .getAll() execution
    getAll.onsuccess = function () {
        // if there was a data in indexedDb's store, let's send it to the api server
        if(getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                },
            })
            .then((response) => response.json())
            .then((serverResponse) => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(["new_budget"], "readwrite");
                const budgetObjectStore = transaction.objectStore("new_budget");
                budgetObjectStore.clear();

                alert("All saved changes to the budget have been submitted!");
            })
            .catch((err) => {
                console.log(err);
            });
        }
    };
}

window.addEventListener("online", uploadNewBudget());