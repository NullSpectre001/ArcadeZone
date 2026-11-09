
/* =================================
   ARCADEZONE - MAIN JAVASCRIPT
================================= */

// ELEMENTS
const searchInput = document.getElementById("gameSearch");
const gameCards = document.querySelectorAll(".game-card");
const noResults = document.getElementById("noResults");
const gameCount = document.querySelector(".game-count");


// GAME SEARCH
function searchGames() {

    const searchValue = searchInput.value
        .toLowerCase()
        .trim();

    let visibleGames = 0;

    gameCards.forEach(card => {

        const gameName = card.dataset.name.toLowerCase();
        const gameTitle = card.querySelector("h3").textContent.toLowerCase();
        const gameDescription = card.querySelector("p").textContent.toLowerCase();

        const matches =
            gameName.includes(searchValue) ||
            gameTitle.includes(searchValue) ||
            gameDescription.includes(searchValue);

        if (matches) {

            card.style.display = "block";
            visibleGames++;

        } else {

            card.style.display = "none";

        }

    });

    // NO RESULTS MESSAGE
    if (visibleGames === 0) {

        noResults.hidden = false;

    } else {

        noResults.hidden = true;

    }

    // UPDATE GAME COUNT
    gameCount.textContent =
        String(visibleGames).padStart(2, "0") + " JÁTÉK";
}


// SEARCH EVENT
searchInput.addEventListener("input", searchGames);


// INITIALIZE
document.addEventListener("DOMContentLoaded", () => {

    console.log("ArcadeZone successfully loaded!");

    searchGames();

});
