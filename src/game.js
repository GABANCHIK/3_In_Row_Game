"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const GRID_SIZE = 8;
const CELL_SIZE = 100;
let board = [];
let totalScore = 0;
const gemImages = [];
const gemImageSrc = [
    "../public/images/blueGem.jpg",
    "../public/images/greenGem.jpg",
    "../public/images/purpleGem.jpg",
    "../public/images/redGem.jpg",
    "../public/images/yellowGem.jpg",
];
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
let selectedGem = null;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let isAnimating = false; // Flag to track if animations are in progress
/**
 * Loads gem images asynchronously.
 *
 * @returns Promise<void> - Resolves when all images are successfully loaded.
 * @throws Error - Rejects if any image fails to load.
 */
function loadImages() {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = [];
        for (let i = 0; i < gemImageSrc.length; i++) {
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.src = gemImageSrc[i];
                img.onload = () => resolve();
                img.onerror = () => reject(`Error with images ${img.src}`);
                gemImages[i] = img;
            });
            promises.push(promise);
        }
        yield Promise.all(promises);
    });
}
//Full random gem generator
function getRandomGemType() {
    return Math.floor(Math.random() * 5);
}
/**
 * Initializes the game board with random gems. Without matches.
 */
function initBoard() {
    board = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        const row = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            row.push({
                x,
                y,
                type: getSafeRandomGem(x, y, row),
                selected: false,
            });
        }
        board.push(row);
    }
}
/**
 * generate a random gem type, ensuring it does not create a combination of 3 identical gems horizontally or vertically;
 * @param x - row index of the gem
 * @param y - column index of the gem
 * @param currentRow - current row where the gem is located
 * @returns GemType - gem type
 */
function getSafeRandomGem(x, y, currentRow) {
    var _a, _b, _c, _d;
    let gemType;
    while (true) {
        gemType = getRandomGemType();
        const isMatchLeft = x >= 2 &&
            ((_a = currentRow[x - 1]) === null || _a === void 0 ? void 0 : _a.type) === gemType &&
            ((_b = currentRow[x - 2]) === null || _b === void 0 ? void 0 : _b.type) === gemType;
        const isMatchUp = y >= 2 &&
            ((_c = board[y - 1][x]) === null || _c === void 0 ? void 0 : _c.type) === gemType &&
            ((_d = board[y - 2][x]) === null || _d === void 0 ? void 0 : _d.type) === gemType;
        if (!isMatchLeft && !isMatchUp) {
            //if two false === no match => return;
            return gemType;
        }
    }
}
canvas.addEventListener("mousedown", (event) => {
    var _a;
    /**
     * Handles the mousedown event on the canvas.
     * Sets the gem as selected and enables dragging.
     *
     */
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const x = Math.floor(mouseX / CELL_SIZE);
    const y = Math.floor(mouseY / CELL_SIZE);
    const gem = (_a = board[y]) === null || _a === void 0 ? void 0 : _a[x];
    if (gem) {
        selectedGem = gem;
        isDragging = true;
        //for dragging
        offsetX = mouseX - gem.x * CELL_SIZE;
        offsetY = mouseY - gem.y * CELL_SIZE;
    }
});
canvas.addEventListener("mousemove", (event) => {
    /**
     * Handles the dragging of gem;
     * Ensures the gem stays within the allowed movement range.
     *
     */
    if (!isDragging || !selectedGem)
        return;
    const rect = canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;
    const startX = selectedGem.x * CELL_SIZE;
    const startY = selectedGem.y * CELL_SIZE;
    let newX = mouseX - offsetX;
    let newY = mouseY - offsetY;
    let deltaX = newX - startX;
    let deltaY = newY - startY;
    const cubeDist = Math.abs(deltaX) + Math.abs(deltaY);
    if (cubeDist > CELL_SIZE) {
        const scale = CELL_SIZE / cubeDist;
        deltaX *= scale;
        deltaY *= scale;
    }
    newX = startX + deltaX;
    newY = startY + deltaY;
    drawBoard();
    if (selectedGem.type !== null) {
        //gem
        const img = gemImages[selectedGem.type];
        ctx.drawImage(img, newX, newY, CELL_SIZE, CELL_SIZE);
    }
    else {
        ctx.fillStyle = "#333";
        ctx.fillRect(newX, newY, CELL_SIZE, CELL_SIZE);
    }
    //border
    ctx.strokeStyle = "#202020";
    ctx.lineWidth = 2;
    ctx.strokeRect(newX, newY, CELL_SIZE, CELL_SIZE);
});
canvas.addEventListener("mouseup", (event) => {
    if (!isDragging || !selectedGem || isAnimating)
        return; // Prevent interaction during animations
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const newX = Math.floor(mouseX / CELL_SIZE);
    const newY = Math.floor(mouseY / CELL_SIZE);
    const dx = Math.abs(newX - selectedGem.x);
    const dy = Math.abs(newY - selectedGem.y);
    //Move validation
    const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    if (newX >= 0 &&
        newX < GRID_SIZE &&
        newY >= 0 &&
        newY < GRID_SIZE &&
        isAdjacent &&
        (newX !== selectedGem.x || newY !== selectedGem.y)) {
        const targetGem = board[newY][newX];
        //Swap gems
        board[selectedGem.y][selectedGem.x] = Object.assign(Object.assign({}, targetGem), { x: selectedGem.x, y: selectedGem.y });
        board[newY][newX] = Object.assign(Object.assign({}, selectedGem), { x: newX, y: newY });
        const canMove = hasChainOfThree(newX, newY, selectedGem.type) ||
            hasChainOfThree(selectedGem.x, selectedGem.y, targetGem.type);
        if (!canMove) {
            board[newY][newX] = targetGem;
            board[selectedGem.y][selectedGem.x] = selectedGem;
        }
        else {
            isAnimating = true; // Set animation flag to true
            /**
             * Recursively processes matches on the game board.
             */
            function processMatchesRecursively() {
                let matches = findMatches();
                if (matches.length === 0) {
                    drawBoard();
                    isAnimating = false; // Reset animation flag after all animations
                    return;
                }
                totalScore += matches.length * 100;
                scoreElement.innerHTML = totalScore.toString();
                removeMatches(matches);
                const fallingGems = collapseBoard();
                animateFalling(fallingGems, () => {
                    processMatchesRecursively();
                });
            }
            processMatchesRecursively();
        }
    }
    isDragging = false;
    selectedGem = null;
    drawBoard();
    scoreElement.innerHTML = totalScore.toString();
});
/**
 * Scans the game board and identifies all gems that form horizontal or vertical chains of 3 or more matching types.
 *
 * @returns Gem[] - масив гемів, які формують матч 3 або більше.
 */
function findMatches() {
    const matched = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        const row = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            row.push(false);
        }
        matched.push(row);
    }
    // Horizontal matches
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE - 2; x++) {
            const type = board[y][x].type;
            if (type !== null &&
                type === board[y][x + 1].type &&
                type === board[y][x + 2].type) {
                matched[y][x] = true;
                matched[y][x + 1] = true;
                matched[y][x + 2] = true;
                let k = x + 3;
                while (k < GRID_SIZE && board[y][k].type === type) {
                    matched[y][k] = true;
                    k++;
                }
            }
        }
    }
    // Vertical matches
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 2; y++) {
            const type = board[y][x].type;
            if (type !== null &&
                type === board[y + 1][x].type &&
                type === board[y + 2][x].type) {
                matched[y][x] = true;
                matched[y + 1][x] = true;
                matched[y + 2][x] = true;
                let k = y + 3;
                while (k < GRID_SIZE && board[k][x].type === type) {
                    matched[k][x] = true;
                    k++;
                }
            }
        }
    }
    const result = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (matched[y][x]) {
                result.push(board[y][x]);
            }
        }
    }
    return result;
}
/**
 * Removes matched gems from the board by setting their type to null.
 *
 * This function is typically called after matching gems have been found.
 *
 * @param matches - An array of gems that are part of a match (3 or more identical types).
 */
function removeMatches(matches) {
    for (const gem of matches) {
        board[gem.y][gem.x].type = null;
    }
}
/**
 *  The board collapses and this causes the gem to fall
 *
 * @returns An array of gems that are falling, used for animation.
 */
function collapseBoard() {
    const fallingGems = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        let emptySpots = 0;
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
            if (board[y][x].type === null) {
                emptySpots++;
            }
            else if (emptySpots > 0) {
                const gem = board[y][x];
                const targetY = y + emptySpots;
                const fallingGem = Object.assign(Object.assign({}, gem), { x: x, y: targetY, renderY: gem.y * CELL_SIZE });
                board[targetY][x] = fallingGem;
                board[y][x].type = null;
                fallingGems.push(fallingGem);
            }
        }
        for (let y = 0; y < emptySpots; y++) {
            const gem = {
                x: x,
                y: y,
                type: getRandomGemType(),
                renderY: -(emptySpots - y + 1) * CELL_SIZE,
            };
            board[y][x] = gem;
            fallingGems.push(gem);
        }
    }
    return fallingGems;
}
/**
 * Animates the falling of gems on the board.

 *
 * @param fallingGems - An array of gems that are falling, each with a target position.
 * @param callback - An optional callback function to execute after the animation is complete.
 */
function animateFalling(fallingGems, callback) {
    const speed = 400;
    let prevTimestamp = null;
    /**
     * Performs a single step of the animation.
     *
     * @param timestamp - The current timestamp provided by requestAnimationFrame.
     */
    function step(timestamp) {
        if (prevTimestamp === null)
            prevTimestamp = timestamp;
        const delta = (timestamp - prevTimestamp) / 1000;
        prevTimestamp = timestamp;
        let animationInProgress = false;
        for (const gem of fallingGems) {
            const targetY = gem.y * CELL_SIZE;
            if (gem.renderY < targetY) {
                gem.renderY += speed * delta;
                if (gem.renderY > targetY)
                    gem.renderY = targetY;
                animationInProgress = true;
            }
        }
        drawBoardWithRenderY();
        if (animationInProgress) {
            requestAnimationFrame(step);
        }
        else {
            for (const gem of fallingGems) {
                delete gem.renderY;
            }
            callback === null || callback === void 0 ? void 0 : callback();
        }
    }
    requestAnimationFrame(step);
}
/**
 * Check matches of three or more gems

 *
 * @param x - The x-coordinate of the gem.
 * @param y - The y-coordinate of the gem.
 * @param type - The type of the gem to check for chains.
 * @returns boolean - True if a chain of three or more gems exists, otherwise false.
 */
function hasChainOfThree(x, y, type) {
    if (type === null)
        return false;
    let count = 1;
    for (let i = y - 1; i >= 0; i--) {
        if (board[i][x].type === type)
            count++;
        else
            break;
    }
    for (let i = y + 1; i < GRID_SIZE; i++) {
        if (board[i][x].type === type)
            count++;
        else
            break;
    }
    if (count >= 3)
        return true;
    count = 1;
    for (let i = x - 1; i >= 0; i--) {
        if (board[y][i].type === type)
            count++;
        else
            break;
    }
    for (let i = x + 1; i < GRID_SIZE; i++) {
        if (board[y][i].type === type)
            count++;
        else
            break;
    }
    if (count >= 3)
        return true;
    return false;
}
/**
 * Fall animations
 * Gems are drawn at their current `renderY` position if defined, otherwise at their default position.
 */
function drawBoardWithRenderY() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row of board) {
        for (let gem of row) {
            const y = gem.renderY !== undefined ? gem.renderY : gem.y * CELL_SIZE;
            if (gem.type !== null) {
                const img = gemImages[gem.type];
                ctx.drawImage(img, gem.x * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
            }
            else {
                ctx.fillStyle = "#333";
                ctx.fillRect(gem.x * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
            }
            ctx.strokeStyle = gem.selected ? "white" : "black";
            ctx.lineWidth = gem.selected ? 4 : 1;
            ctx.strokeRect(gem.x * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
        }
    }
}
/**
 * Draws the current state of the game board onto the canvas.
 */
function drawBoard() {
    for (let row of board) {
        for (let gem of row) {
            if (gem.type !== null) {
                const img = gemImages[gem.type];
                ctx.drawImage(img, gem.x * CELL_SIZE, gem.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
            ctx.strokeRect(gem.x * CELL_SIZE, gem.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}
/**
 * The main entry point of the game.
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield loadImages();
            initBoard();
            drawBoard();
        }
        catch (err) {
            console.error("Error loading images:", err);
        }
    });
}
main();
