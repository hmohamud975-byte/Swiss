"use strict";
console.log("Music application started.");
console.log("Tracks loaded:", tracks.length);
console.log("First track:", tracks[0].title);


/* =========================================
   SWISS MUSIC PLAYER
========================================= */

// Check that track.js loaded correctly.
if (typeof tracks === "undefined" || tracks.length === 0) {
    throw new Error("No tracks found. Check that track.js loads first.");
}

const trackGrid = document.getElementById("track-grid");
const libraryList = document.getElementById("library-list");

const mainSearch = document.getElementById("main-search");
const librarySearch = document.getElementById("library-search");

const trackCount = document.getElementById("track-count");
const collectionCount = document.getElementById("collection-count");
const emptyMessage = document.getElementById("empty-message");

const currentCover = document.getElementById("current-cover");
const currentTitle = document.getElementById("current-title");
const currentArtist = document.getElementById("current-artist");

const playButton = document.getElementById("main-play-button");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const shuffleButton = document.getElementById("shuffle-button");
const repeatButton = document.getElementById("repeat-button");
const favoriteButton = document.getElementById("favorite-button");

const progressBar = document.getElementById("progress-bar");
const currentTimeDisplay = document.getElementById("current-time");
const durationDisplay = document.getElementById("duration");
const volumeBar = document.getElementById("volume-bar");


// Audio engine
const audio = new Audio();
audio.volume = Number(volumeBar.value);
audio.preload = "metadata";


// Nine cards from eight records.
// The first track is repeated to make the ninth card.
const displayTracks = [
    ...tracks,
    tracks[0]
];

let currentTrack = null;
let currentIndex = -1;
let activeGenre = "All";
let isShuffling = false;
let isRepeating = false;

const likedTracks = new Set();


// =========================================
// HELPER FUNCTIONS
// =========================================

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}


function getTrackDuration(track) {
    return track.duration || "0:00";
}


function getVisibleTracks() {
    const query = (
        mainSearch.value || librarySearch.value
    ).trim().toLowerCase();

    return tracks.filter(track => {
        const matchesGenre =
            activeGenre === "All" ||
            track.genre.toLowerCase() === activeGenre.toLowerCase();

        const searchableText = [
            track.title,
            track.artist,
            track.album,
            track.genre
        ].join(" ").toLowerCase();

        return matchesGenre && searchableText.includes(query);
    });
}


// =========================================
// RENDER THE NINE MUSIC CARDS
// =========================================

function renderTrackCards() {
    const visibleTracks = getVisibleTracks();

    // Preserve the ninth card when all tracks are shown.
    const cardsToDisplay =
        activeGenre === "All" &&
        !mainSearch.value.trim() &&
        !librarySearch.value.trim()
            ? displayTracks
            : visibleTracks;

    trackGrid.innerHTML = "";

    cardsToDisplay.forEach(track => {
        // The repeated card gets a unique card index.
        const cardIndex = displayTracks.indexOf(track);

        const card = document.createElement("article");
        card.className = "track-card";

        const isPlaying =
            currentTrack?.id === track.id &&
            !audio.paused;

        card.classList.toggle("playing", isPlaying);

        card.innerHTML = `
            <div class="track-artwork">
                <img
                    src="${track.cover}"
                    alt="${track.title} album cover"
                    loading="lazy"
                >

                <button
                    type="button"
                    class="track-play"
                    aria-label="Play ${track.title}"
                >
                    <i class="fa-solid ${
                        isPlaying ? "fa-pause" : "fa-play"
                    }"></i>
                </button>
            </div>

            <h3></h3>
            <p class="track-artist"></p>

            <div class="track-meta">
                <span class="track-genre"></span>
                <span class="track-duration"></span>
            </div>
        `;

        // Insert track text safely.
        card.querySelector("h3").textContent = track.title;
        card.querySelector(".track-artist").textContent = track.artist;
        card.querySelector(".track-genre").textContent = track.genre;
        card.querySelector(".track-duration").textContent =
            getTrackDuration(track);

        card.addEventListener("click", () => {
            const index = displayTracks.findIndex(
                item => item.id === track.id
            );

            playTrack(index);
        });

        trackGrid.appendChild(card);
    });

    emptyMessage.hidden = cardsToDisplay.length !== 0;

    collectionCount.textContent =
        `${cardsToDisplay.length} ${cardsToDisplay.length === 1 ? "song" : "songs"}`;
}


// =========================================
// RENDER YOUR LIBRARY
// =========================================

function renderLibrary() {
    const visibleTracks = getVisibleTracks();

    libraryList.innerHTML = "";

    visibleTracks.forEach(track => {
        const item = document.createElement("div");

        item.className = "library-track";

        if (currentTrack?.id === track.id) {
            item.classList.add("active");
        }

        item.innerHTML = `
            <img src="${track.cover}" alt="" loading="lazy">

            <div class="library-track-info">
                <h3></h3>
                <p></p>
            </div>

            <i class="fa-solid fa-music"></i>
        `;

        item.querySelector("h3").textContent = track.title;
        item.querySelector(".library-track-info p").textContent =
            track.artist;

        item.addEventListener("click", () => {
            const index = displayTracks.findIndex(
                item => item.id === track.id
            );

            playTrack(index);
        });

        libraryList.appendChild(item);
    });

    trackCount.textContent =
        `${visibleTracks.length} ${visibleTracks.length === 1 ? "track" : "tracks"}`;
}


function renderEverything() {
    renderTrackCards();
    renderLibrary();
}


// =========================================
// PLAY A TRACK
// =========================================

async function playTrack(index) {
    if (index < 0 || index >= displayTracks.length) {
        return;
    }

    const selectedTrack = displayTracks[index];

    // If the selected song is already loaded, toggle playback.
    if (
        currentTrack?.id === selectedTrack.id &&
        audio.src &&
        audio.src.endsWith(
            encodeURI(selectedTrack.audio).replace(/%2F/g, "/")
        )
    ) {
        togglePlayback();
        return;
    }

    currentIndex = index;
    currentTrack = selectedTrack;

    audio.src = selectedTrack.audio;
    audio.load();

    currentTitle.textContent = selectedTrack.title;
    currentArtist.textContent = selectedTrack.artist;
    currentCover.src = selectedTrack.cover;
    currentCover.alt = `${selectedTrack.title} cover`;

    favoriteButton.classList.toggle(
        "liked",
        likedTracks.has(selectedTrack.id)
    );

    favoriteButton.innerHTML = likedTracks.has(selectedTrack.id)
        ? '<i class="fa-solid fa-heart"></i>'
        : '<i class="fa-regular fa-heart"></i>';

    progressBar.value = 0;
    currentTimeDisplay.textContent = "0:00";
    durationDisplay.textContent = getTrackDuration(selectedTrack);

    playButton.innerHTML = '<i class="fa-solid fa-pause"></i>';

    renderEverything();

    try {
        await audio.play();
    } catch (error) {
        playButton.innerHTML = '<i class="fa-solid fa-play"></i>';

        console.error(
            "Could not play this track. Check the MP3 path:",
            selectedTrack.audio,
            error
        );
    }

    renderEverything();
}


// =========================================
// PLAY / PAUSE
// =========================================

async function togglePlayback() {
    if (!currentTrack) {
        await playTrack(0);
        return;
    }

    if (audio.paused) {
        try {
            await audio.play();
            playButton.innerHTML =
                '<i class="fa-solid fa-pause"></i>';
        } catch (error) {
            console.error("Playback failed:", error);
        }
    } else {
        audio.pause();
    }

    renderEverything();
}


playButton.addEventListener("click", togglePlayback);


// =========================================
// NEXT / PREVIOUS TRACK
// =========================================

function nextTrack() {
    if (isShuffling && displayTracks.length > 1) {
        let nextIndex;

        do {
            nextIndex = Math.floor(
                Math.random() * displayTracks.length
            );
        } while (nextIndex === currentIndex);

        playTrack(nextIndex);
        return;
    }

    const nextIndex = (currentIndex + 1) % displayTracks.length;
    playTrack(nextIndex);
}


function previousTrack() {
    // Restart the current song if it has played for more than 3 seconds.
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    const previousIndex =
        (currentIndex - 1 + displayTracks.length) %
        displayTracks.length;

    playTrack(previousIndex);
}


nextButton.addEventListener("click", nextTrack);
previousButton.addEventListener("click", previousTrack);


// Automatically advance when a song finishes.
audio.addEventListener("ended", () => {
    if (isRepeating) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextTrack();
    }
});


// =========================================
// SHUFFLE AND REPEAT
// =========================================

shuffleButton.addEventListener("click", () => {
    isShuffling = !isShuffling;

    shuffleButton.classList.toggle("active", isShuffling);
    shuffleButton.setAttribute("aria-pressed", isShuffling);
});


repeatButton.addEventListener("click", () => {
    isRepeating = !isRepeating;

    repeatButton.classList.toggle("active", isRepeating);
    repeatButton.setAttribute("aria-pressed", isRepeating);
});


// =========================================
// SONG PROGRESS
// =========================================

audio.addEventListener("loadedmetadata", () => {
    durationDisplay.textContent = formatTime(audio.duration);
});


audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
    }

    progressBar.value =
        (audio.currentTime / audio.duration) * 100;

    currentTimeDisplay.textContent =
        formatTime(audio.currentTime);
});


progressBar.addEventListener("input", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime =
            (Number(progressBar.value) / 100) * audio.duration;
    }
});


// =========================================
// VOLUME
// =========================================

volumeBar.addEventListener("input", () => {
    audio.volume = Number(volumeBar.value);
});


// =========================================
// FAVORITES
// =========================================

favoriteButton.addEventListener("click", () => {
    if (!currentTrack) {
        return;
    }

    if (likedTracks.has(currentTrack.id)) {
        likedTracks.delete(currentTrack.id);
    } else {
        likedTracks.add(currentTrack.id);
    }

    const liked = likedTracks.has(currentTrack.id);

    favoriteButton.classList.toggle("liked", liked);

    favoriteButton.innerHTML = liked
        ? '<i class="fa-solid fa-heart"></i>'
        : '<i class="fa-regular fa-heart"></i>';

    favoriteButton.setAttribute("aria-pressed", liked);
});


// =========================================
// SEARCH
// =========================================

mainSearch.addEventListener("input", () => {
    librarySearch.value = mainSearch.value;
    renderEverything();
});

librarySearch.addEventListener("input", () => {
    mainSearch.value = librarySearch.value;
    renderEverything();
});


// =========================================
// GENRE FILTERS
// =========================================

document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        activeGenre = button.dataset.filter;

        document.querySelectorAll("[data-filter]").forEach(filter => {
            filter.classList.toggle(
                "active",
                filter.dataset.filter === activeGenre
            );
        });

        renderEverything();
    });
});


// =========================================
// NAVIGATION BUTTONS
// =========================================

document.getElementById("back-button").addEventListener("click", () => {
    history.back();
});

document.getElementById("forward-button").addEventListener("click", () => {
    history.forward();
});


// =========================================
// PLAYER STATE UPDATES
// =========================================

audio.addEventListener("play", () => {
    playButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
    renderEverything();
});

audio.addEventListener("pause", () => {
    playButton.innerHTML = '<i class="fa-solid fa-play"></i>';
    renderEverything();
});


// =========================================
// INITIALIZE SWISS
// =========================================

renderEverything();
