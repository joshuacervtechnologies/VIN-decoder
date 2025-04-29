document.addEventListener("DOMContentLoaded", () => {
    const vinInput = document.getElementById("vinInput");
    const decodeBtn = document.getElementById("decodeBtn");
    const resultsDiv = document.getElementById("results");
    const countrySpan = document.getElementById("country");
    const manufacturerSpan = document.getElementById("manufacturer");
    const descriptionSpan = document.getElementById("description");
    const modelYearSpan = document.getElementById("modelYear");
    const errorDiv = document.getElementById("error");

    // Hide results initially
    resultsDiv.style.display = "none";
    errorDiv.style.display = "none";

    decodeBtn.addEventListener("click", () => {
        const vin = vinInput.value.trim().toUpperCase();
        errorDiv.textContent = ""; // Clear previous errors
        errorDiv.style.display = "none";
        resultsDiv.style.display = "none"; // Hide results while fetching

        // Basic VIN validation (length)
        if (vin.length !== 17) {
            showError("Please enter a valid 17-character VIN.");
            return;
        }

        // Construct the API URL
        const apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;

        // Fetch data from NHTSA API
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("API Response:", data); // Log the response for debugging
                // Check if Results array exists and has content
                if (data.Results && data.Results.length > 0) {
                    // Pass the whole Results array to displayResults
                    displayResults(data.Results);
                } else {
                    // Handle cases where API returns success but no results, or a specific message
                    const message = data.Message || "VIN not found or invalid response structure from API.";
                    showError(message);
                }
            })
            .catch(error => {
                console.error("Error fetching VIN data:", error);
                showError(`Failed to decode VIN. Network or server error: ${error.message}`);
            });
    });

    function displayResults(results) {
        // Clear previous results
        countrySpan.textContent = "";
        manufacturerSpan.textContent = ""; // Will display Make here
        descriptionSpan.textContent = "";
        modelYearSpan.textContent = "";

        if (!results || results.length === 0) {
            showError("No results found in API response.");
            return;
        }

        const vehicleData = results[0]; // Get the first result object

        // Check for API-level errors indicated in the response itself
        const errorCode = vehicleData.ErrorCode;
        const errorText = vehicleData.ErrorText;
        // Check if errorCode exists and is not "0"
        if (errorCode && errorCode !== "0") {
            // Use the specific error from the API if available
            showError(`VIN Decode Error (${errorCode}): ${errorText || "Failed to decode VIN."} Please check the VIN and try again.`);
            return; // Stop processing if API indicated an error
        }

        // Extract the relevant data points using direct property access
        const country = vehicleData["Plant Country"] || "N/A";
        const make = vehicleData["Make"] || "N/A"; // Use Make for Manufacturer field
        const modelYear = vehicleData["Model Year"] || "N/A";
        const model = vehicleData["Model"] || "";
        const bodyClass = vehicleData["Body Class"] || "";
        const vehicleType = vehicleData["Vehicle Type"] || "";

        // Construct a description string
        let description = `${make} ${model}`.trim();
        let descDetailParts = [bodyClass, vehicleType].filter(part => part && part !== "N/A");
        let descDetail = descDetailParts.join(", ");
        
        if (descDetail) {
            description += ` (${descDetail})`;
        }
        // Ensure description is not just empty or '()' if make/model were missing
        if (!description || description === "()") {
            description = "N/A";
        }

        // Update the DOM
        countrySpan.textContent = country;
        manufacturerSpan.textContent = make; // Display Make as Manufacturer
        descriptionSpan.textContent = description;
        modelYearSpan.textContent = modelYear;

        resultsDiv.style.display = "block"; // Show results container
        errorDiv.style.display = "none"; // Hide error message
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
        resultsDiv.style.display = "none"; // Hide results container
    }
});

