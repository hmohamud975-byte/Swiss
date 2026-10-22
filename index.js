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


// The first track is repeated to make the ninth card.
let displayTracks = [
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

    loadLyrics({
    title: selectedTrack.title,
    artist: selectedTrack.artist
});

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



/* =========================================
   SWISS UPLOAD MENU
========================================= */

const addMusicButton = document.getElementById("library-toggle");
const uploadMenu = document.getElementById("upload-menu");

const uploadFormContainer = document.getElementById("upload-form-container");
const musicUploadForm = document.getElementById("music-upload-form");
const uploadFormTitle = document.getElementById("upload-form-title");
const uploadTitle = document.getElementById("upload-title");
const uploadArtist = document.getElementById("upload-artist");
const uploadFile = document.getElementById("upload-file");
const uploadCover = document.getElementById("upload-cover");
const coverPreview = document.getElementById("upload-cover-preview");
const coverPlaceholder = document.getElementById("cover-placeholder");

// Preview the selected album cover.
uploadCover.addEventListener("change", () => {
    const file = uploadCover.files[0];

    if (!file) {
        coverPreview.hidden = true;
        coverPreview.removeAttribute("src");
        coverPlaceholder.hidden = false;
        return;
    }

    if (!file.type.startsWith("image/")) {
        uploadCover.value = "";
        uploadStatus.textContent = "Please choose an image file.";
        return;
    }

    coverPreview.src = URL.createObjectURL(file);
    coverPreview.hidden = false;
    coverPlaceholder.hidden = true;
    uploadStatus.textContent = "";
});

const uploadStatus = document.getElementById("upload-status");
const cancelUploadButton = document.getElementById("cancel-upload");

let selectedUploadType = "song";

if (addMusicButton && uploadMenu) {
    addMusicButton.addEventListener("click", () => {
        uploadMenu.hidden = !uploadMenu.hidden;
    });

    document.querySelectorAll(".upload-option").forEach(option => {
        option.addEventListener("click", () => {
            selectedUploadType = option.dataset.uploadType;

            const titles = {
                song: "Upload a Song",
                video: "Upload Music Video",
                podcast: "Publish a Podcast"
            };

            uploadFormTitle.textContent =
                titles[selectedUploadType] || "Upload to Swiss";

            uploadFile.accept =
                selectedUploadType === "video"
                    ? "video/*"
                    : "audio/*";

            uploadFile.value = "";
            uploadTitle.value = "";
            uploadArtist.value = "";
            uploadStatus.textContent = "";

            uploadMenu.hidden = true;
            uploadFormContainer.hidden = false;
        });
    });

    document.addEventListener("click", event => {
        if (
            !uploadMenu.contains(event.target) &&
            !addMusicButton.contains(event.target)
        ) {
            uploadMenu.hidden = true;
        }
    });
}

cancelUploadButton.addEventListener("click", () => {
    uploadFormContainer.hidden = true;
    musicUploadForm.reset();
    uploadStatus.textContent = "";
});


musicUploadForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = uploadTitle.value.trim();
    const artist = uploadArtist.value.trim();
    const file = uploadFile.files[0];

    if (!title || !artist || !file) {
        uploadStatus.textContent =
            "Please fill in every field and choose a file.";
        return;
    }

    const isVideo = selectedUploadType === "video";

    if (isVideo && !file.type.startsWith("video/")) {
        uploadStatus.textContent = "Choose a valid video file.";
        return;
    }

    if (!isVideo && !file.type.startsWith("audio/")) {
        uploadStatus.textContent = "Choose a valid audio file.";
        return;
    }

    // Create a temporary URL for the selected media.
    const mediaURL = URL.createObjectURL(file);

    // Create a post for the Swiss feed.
    const coverFile = uploadCover.files[0];
    const post = {
        id: `upload-${Date.now()}`,
        title,
        artist,
        album: "Swiss Uploads",
        genre: "Your Uploads",
        duration: "0:00",
cover: coverFile
    ? URL.createObjectURL(coverFile)
    : tracks[0].cover,        audio: mediaURL,
        type: selectedUploadType,
        fileName: file.name
    };

    // Add songs and podcasts to the existing music player.
    if (!isVideo) {
        tracks.push(post);
        displayTracks.push(post);
        renderEverything();
    }

    // Create the profile posts area if it doesn't exist.
    let profilePosts = document.getElementById("swiss-profile-posts");

    if (!profilePosts) {
        profilePosts = document.createElement("section");
        profilePosts.id = "swiss-profile-posts";
        profilePosts.className = "swiss-profile-posts";

        const profileSection = document.getElementById("profile");

        if (profileSection) {
            profileSection.appendChild(profilePosts);
        } else {
            document.querySelector("main").appendChild(profilePosts);
        }

        profilePosts.innerHTML = `
            <h2>Your posts ✨</h2>
            <div id="swiss-profile-post-list"></div>
        `;
    }

    const postList = document.getElementById(
        "swiss-profile-post-list"
    );

    const postCard = document.createElement("article");
    postCard.className = "swiss-post-card";

    const postTitle = document.createElement("h3");
    postTitle.textContent = title;

    const postArtist = document.createElement("p");
    postArtist.textContent = `By ${artist}`;

    const postType = document.createElement("span");
    postType.textContent = isVideo
        ? "MUSIC VIDEO · POSTED"
        : "♫ MUSIC · POSTED";

    postCard.append(postType, postTitle, postArtist);

    if (isVideo) {
        const video = document.createElement("video");
        video.src = mediaURL;
        video.controls = true;
        video.preload = "metadata";
        video.className = "swiss-post-media";
        postCard.appendChild(video);
    } else {
        const audioPlayer = document.createElement("audio");
        audioPlayer.src = mediaURL;
        audioPlayer.controls = true;
        audioPlayer.preload = "metadata";
        audioPlayer.className = "swiss-post-media";
        postCard.appendChild(audioPlayer);
    }

    postList.prepend(postCard);

    // Close and reset the upload form.
    uploadFormContainer.hidden = true;
    uploadMenu.hidden = true;
    musicUploadForm.reset();

    // Show a proper success notification.
    let toast = document.getElementById("swiss-upload-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "swiss-upload-toast";
        toast.className = "swiss-upload-toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }

    toast.textContent = `✓ ${title} posted successfully!`;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);

    console.log("Swiss post created:", post);
});

const lyricsStatus = document.getElementById("lyrics-status");
const lyricsLines = document.getElementById("lyrics-lines");

let syncedLyrics = [];
let activeLyricIndex = -1;
let lyricsRequestId = 0;

// Convert timestamps such as [01:23.45] into seconds.
function parseLrc(lrc) {
    return lrc.split("\n")
        .map(line => {
            const match = line.match(
                /^\[(\d{2,}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*)$/
            );

            if (!match) return null;

            return {
                time: Number(match[1]) * 60 +
                      Number(match[2]),
                text: match[3].trim()
            };
        })
        .filter(line => line && line.text)
        .sort((a, b) => a.time - b.time);
}

// Fetch timed lyrics for the selected track.
async function loadLyrics(track) {
    const requestId = ++lyricsRequestId;

    syncedLyrics = [];
    activeLyricIndex = -1;
    lyricsLines.replaceChildren();
    lyricsStatus.textContent = "Finding synced lyrics...";

    try {
        const params = new URLSearchParams({
            track_name: track.title,
            artist_name: track.artist
        });

        // Duration improves matching when available.
        if (track.duration > 0) {
            params.set("duration", Math.round(track.duration));
        }

        const response = await fetch(
            `https://lrclib.net/api/get?${params}`
        );

        if (!response.ok) {
            throw new Error("Lyrics not found");
        }

        const data = await response.json();

        // Ignore an old response if another song was selected.
        if (requestId !== lyricsRequestId) return;

        if (!data.syncedLyrics) {
            lyricsStatus.textContent =
                "Synced lyrics aren't available for this song.";
            return;
        }

        syncedLyrics = parseLrc(data.syncedLyrics);

        if (!syncedLyrics.length) {
            lyricsStatus.textContent =
                "No usable timed lyrics were found.";
            return;
        }

        lyricsStatus.textContent = "";

        syncedLyrics.forEach((line, index) => {
            const element = document.createElement("div");

            element.className = "lyric-line";
            element.textContent = line.text;
            element.dataset.index = index;

            lyricsLines.appendChild(element);
        });

        updateActiveLyric();
    } catch (error) {
        if (requestId !== lyricsRequestId) return;

        lyricsStatus.textContent =
            "Couldn't load synced lyrics. Try another song.";
        console.error("Lyrics error:", error);
    }
}

// Match the audio position to the correct lyric.
function updateActiveLyric() {
    if (!audio || !syncedLyrics.length) return;

    const time = audio.currentTime;
    let index = -1;

    for (let i = 0; i < syncedLyrics.length; i++) {
        if (syncedLyrics[i].time <= time) {
            index = i;
        } else {
            break;
        }
    }

    if (index === activeLyricIndex) return;

    activeLyricIndex = index;

    document.querySelectorAll(".lyric-line").forEach(
        (element, i) => {
            element.classList.toggle("active", i === index);
        }
    );

    if (index >= 0) {
        lyricsLines.children[index].scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

audio?.addEventListener("timeupdate", updateActiveLyric);
audio?.addEventListener("seeked", updateActiveLyric);
    

   
// =========================================
// INITIALIZE SWISS
// =========================================

renderEverything();
