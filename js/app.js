const EMPTY = ' '
const NONE = '0'
const MINE = '💣'
const FLAG = '🚩'
const ELEMENTS = {
    elHearts: document.querySelectorAll('.heart'),
    elSmiley: document.querySelector('.smiley-btn'),
    elFlagged: document.querySelector('.num-flagged'),
    elSecs: document.querySelector(`.secs`),
    elLeaderboard: document.querySelector('.leaderboard'),
    elExterminate: document.querySelector('.exterminate-btn'),
    elSafeBtn: document.querySelector('.safe-click'),
    elSafeClick: document.querySelector('.available-safe-clicks')
}

var safe
var gBoard

var gLevel = {
    NAME: 'easy',
    SIZE: 4,
    MINES: 2
}
var gTimerInterval

var gGame = {
    isOn: false,
    isDarkMode: false,
    isHint: false,
    isFirstClick: true,
    exterminateUsed: false,
    hints: 3,
    livesLeft: 3,
    safeClicks: 3,
    shownCount: 0,
    markedCount: 0,
    flagged: gLevel.MINES,
    totalSeconds: 0,
    shownMinesCount: 0,
}

function onInitGame() {
    resetGame()
    gBoard = createMat(gLevel.SIZE)
    renderBoard(gBoard)
    loadLeaderboard(loadFromStorage('leaderboard'))
}

function resetGame() {
    gGame.isFirstClick = true
    gGame.flagged = gLevel.MINES
    gGame.livesLeft = 3
    gGame.totalSeconds = 0
    gGame.safeClicks = 3
    ELEMENTS.elSmiley.innerHTML = gGame.isDarkMode ? '😈' : '😊';
    ELEMENTS.elFlagged.innerHTML = gGame.flagged
    ELEMENTS.elSecs.innerHTML = gGame.totalSeconds
    ELEMENTS.elExterminate.disabled = true
    ELEMENTS.elSafeBtn.disabled = true
    ELEMENTS.elSafeClick.innerHTML = gGame.safeClicks
    gGame.shownCount = 0
    gGame.shownMinesCount = 0
    gGame.markedCount = 0
    gGame.isOn = true
    for (var i = 1; i <= 3; i++) {
        document.querySelector(`.hint${i}`).innerHTML = '💡'
        elHeart = document.querySelector(`.heart${i}`).hidden = false
        document.querySelector(`.heart${i}`).src = gGame.isDarkMode ? "img/darkHeart.png" : "img/Heart.png";
    }
    gGame.hints = 3
    gGame.exterminateUsed = false
    clearInterval(gTimerInterval)
}

function onChangeDifficulty(level = 'easy') {
    if (level === 'easy') {
        gLevel.NAME = 'easy'
        gLevel.SIZE = 4
        gLevel.MINES = 2
    } else if (level === 'medium') {
        gLevel.NAME = 'medium'
        gLevel.SIZE = 8
        gLevel.MINES = 12
    } else {
        gLevel.NAME = 'hard'
        gLevel.SIZE = 12
        gLevel.MINES = 32
    }
    onInitGame()
}

function createMat(size) {
    const mat = []
    for (var i = 0; i < size; i++) {
        mat[i] = []
        for (var j = 0; j < size; j++) {
            var cell = {
                currContent: EMPTY,
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            mat[i][j] = cell
        }
    }
    return mat
}

function generateMines(mat) {
    var mineCount = 0
    while (mineCount < gLevel.MINES) {
        var randIIdx = getRandomInt(0, gLevel.SIZE)
        var randJIdx = getRandomInt(0, gLevel.SIZE)
        if (!mat[randIIdx][randJIdx].isMine && !mat[randIIdx][randJIdx].isShown) {
            mat[randIIdx][randJIdx].isMine = true
            mat[randIIdx][randJIdx].currContent = MINE
            mineCount++
        }
    }
}

function renderBoard(board) {
    var strHTML = ''
    var cellSize = "width:60px;height:60px"
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]
            var className = `cell cell-${i}-${j}`
            if (i === 0 && j === 0) className += ' first-of-row'
            if (i === 0 && j === gBoard.length - 1) className += ' last-of-row'
            if (i === board.length - 1 && j === 0) className += ' first-of-col'
            if (i === board.length - 1 && j === board[0].length - 1) className += ' last-of-col'
            if (cell.isMine === true) strHTML += `<td style=${cellSize} dataI=${i} dataJ=${j} oncontextmenu="onCellMarked(event, this)" onclick="onClickCell(this,${i},${j})" class="${className}">${EMPTY}</td>`
            else strHTML += `<td style=${cellSize} dataI=${i} dataJ=${j} oncontextmenu="onCellMarked(event, this)" onclick="onClickCell(this,${i},${j})" class="${className}">${EMPTY}</td>`
        }
        strHTML += '</tr>'
    }
    const elContainer = document.querySelector('.game-container')
    elContainer.innerHTML = strHTML
}

function onClickCell(elCell, cellI, cellJ) {
    var currCell = gBoard[cellI][cellJ]
    if (!gGame.isOn || currCell.isShown || currCell.isMarked) return
    if (gGame.isHint) {
        // revealNegs(cellI, cellJ)
        console.log(`Sorry, this function doesn't work yet :(`)
    }
    currCell.isShown = true
    if (gGame.isFirstClick) {
        generateMines(gBoard)
        ELEMENTS.elExterminate.disabled = false
        ELEMENTS.elSafeBtn.disabled = false
        minesAroundForAll()
        if (currCell.minesAroundCount === 0) {
            setTimeout(() => {
                expandShown(cellI, cellJ)
            }, 10);
        }
        gTimerInterval = setInterval(setTime, 1000)
    }
    if (currCell.isMine) {
        renderCell(cellI, cellJ, MINE)
        gGame.shownCount++
        gGame.shownMinesCount++
        handleLives()
    } else {
        currCell.minesAroundCount = setMinesNegsCount(cellI, cellJ)
        var cellMineCount = currCell.minesAroundCount
        if (cellMineCount === 0 && !gGame.isFirstClick) {
            expandShown(cellI, cellJ)
        }
        currCell.currContent = cellMineCount
        if (cellMineCount === 0) renderCell(cellI, cellJ, noneHTML())
        else renderCell(cellI, cellJ, cellMineCount)
        gGame.shownCount++
    }
    gGame.isFirstClick = false

    checkGameOver()
}

function checkGameOver() {
    var flaggedMineCount = 0
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j]
            if (currCell.isMarked && currCell.isMine) flaggedMineCount++
        }
    }
    if (gGame.shownCount === (gBoard.length ** 2) - flaggedMineCount) gameOver()
}

function minesAroundForAll() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            gBoard[i][j].minesAroundCount = setMinesNegsCount(i, j)
        }
    }
}

function expandShown(cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === cellI && j === cellJ) continue
            var currCell = gBoard[i][j]
            if (setMinesNegsCount(i, j) === 0 && !currCell.isShown && !currCell.isMine) {
                currCell.isShown = true
                gGame.shownCount++
                renderCell(i, j, noneHTML())
                expandShown(i, j)
            } else if (setMinesNegsCount(i, j) > 0 && !currCell.isShown && !currCell.isMine && !gGame.isFirstClick) {
                renderCell(i, j, gBoard[i][j].minesAroundCount)
                currCell.isShown = true
                gGame.shownCount++
            }

            // console.log('gBoard[i][j]:',gBoard[i][j]);

        }
    }
    checkGameOver()
}

function onUseHint(elHint) {
    console.log(`This function doesn't work at the moment :(`)
    return
    if (!gGame.isHint && gGame.hints > 0) {
        // console.log('Hint time!')
        elHint.classList.add('clicked-hint')
        gGame.isHint = true
    } else if (gGame.isHint && gGame.hints > 1) {
        elHint.classList.remove('clicked-hint')
        gGame.isHint = false
        gGame.hints--
        elHint.innerHTML = ''
    } else {
        elHint.classList.remove('clicked-hint')
        gGame.isHint = false
        gGame.hints--
        elHint.style.opacity = 0
        elHint.style.cursor = 'default'
    }
}

function onCellMarked(e, elCell) {
    if (!gGame.isOn) return
    e.preventDefault()
    var valueI = elCell.attributes.dataI.value
    var valueJ = elCell.attributes.dataJ.value
    var currCell = gBoard[valueI][valueJ]
    if (currCell.isShown) return
    if (!currCell.isMarked && !currCell.isShown) {
        currCell.isMarked = true
        gGame.flagged--
        gGame.markedCount++
        ELEMENTS.elFlagged.innerHTML = gGame.flagged
        elCell.innerHTML = FLAG
    } else if (currCell.isShown && !currCell.isMine) return
    else {
        currCell.isMarked = false
        gGame.markedCount--
        gGame.flagged++
        ELEMENTS.elFlagged.innerHTML = gGame.flagged
        elCell.innerHTML = currCell.currContent
    }
    checkGameOver()
}

function handleLives() {
    gGame.livesLeft--
    for (var i = 3; i > gGame.livesLeft; i--) {
        elHeart = document.querySelector(`.heart${i}`).hidden = true
    }
    // console.log(`You have ${gGame.livesLeft} lives left.`)
    if (gGame.livesLeft === 0) gameOver()
    else if (!checkVictory() || gGame.livesLeft !== 1) {
        ELEMENTS.elSmiley.innerHTML = gGame.isDarkMode ? '👿' : '😥';
        setTimeout(() => {
            ELEMENTS.elSmiley.innerHTML = gGame.isDarkMode ? '😈' : '😊';
        }, 1000)
    }
}

function renderCell(locationI, locationJ, value) {
    const elCell = document.querySelector(`.cell-${locationI}-${locationJ}`)
    elCell.innerHTML = value
}

function setMinesNegsCount(cellI, cellJ) { // 7,0
    //cell.setMinesNegsCount(i,j)
    var minesAroundCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === cellI && j === cellJ) continue
            if (gBoard[i][j].isMine === true) minesAroundCount++
        }
    }
    return minesAroundCount
}

//Function not working at the moment sadly
function revealNegs(cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            var currCell = gBoard[i][j]
            if (currCell.isMine) {
                renderCell(i, j, currCell.currContent)
            } else {
                renderCell(i, j, currCell.minesAroundCount)
            }

        }
    }
}

function checkVictory() {
    var markedMineCount = 0
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMarked && gBoard[i][j].isMine ||
                gBoard[i][j].isShown && gBoard[i][j].isMine) markedMineCount++
        }
    }
    if (gGame.shownCount >= (gBoard.length ** 2 - markedMineCount) && markedMineCount === gLevel.MINES) return true
    else return false
}

function gameOver() {
    clearInterval(gTimerInterval)
    if (checkVictory()) {
        var name = prompt('Enter your name:')
        var newPlayer = { name, time: gGame.totalSeconds, difficulty: gLevel.NAME }
        var currScores = loadFromStorage('leaderboard') || []
        currScores.push(newPlayer)
        saveToStorage('leaderboard', currScores)
        sortLeaderboard()
        loadLeaderboard(currScores)
        ELEMENTS.elSmiley.innerHTML = gGame.isDarkMode ? '👹' : '😎';
    } else {
        setTimeout(() => {
            ELEMENTS.elSmiley.innerHTML = gGame.isDarkMode ? '🪦' : '😭';
        }, 100)
        console.log('You lose')
    }
    gGame.isOn = false
}

function sortLeaderboard() {
    var scores = loadFromStorage('leaderboard')
    if (scores.length <= 1) return
    scores.sort((a, b) => a.time - b.time)
    saveToStorage('leaderboard',scores)
}

function loadLeaderboard(scores) {
    if (scores) {
        sortLeaderboard()
        var strHTML = ``
        for (var i = 0; i < scores.length; i++) {
            strHTML += `<p>${i + 1}. ${scores[i].name}: ${scores[i].time} seconds (${scores[i].difficulty})</p>`
        }
        ELEMENTS.elLeaderboard.innerHTML = strHTML
    }
}

function onToggleDarkMode() {
    var elBody = document.querySelector('body')
    elBody.classList.toggle('dark-mode')
    if (!gGame.isDarkMode) {
        gGame.isDarkMode = true
        ELEMENTS.elSmiley.innerHTML = '😈'
    } else {
        gGame.isDarkMode = false
        ELEMENTS.elSmiley.innerHTML = '😊'
    }
    for (var i = 1; i <= gGame.livesLeft; i++) {
        document.querySelector(`.heart${i}`).src = gGame.isDarkMode ? "img/darkHeart.png" : "img/Heart.png";
    }

}

function onExterminate() {
    if (gGame.isFirstClick || !gGame.isOn) return
    var minesRemoved = 0
    var diff = (gLevel.MINES - gGame.shownMinesCount)
    var minesToRemove = (gLevel.NAME === 'easy') ? diff : 3;
    while (minesRemoved < minesToRemove) {
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard.length; j++) {
                var currCell = gBoard[i][j]
                if (!currCell.isShown && currCell.isMine && minesRemoved !== minesToRemove) {
                    minesRemoved++
                    currCell.isShown = true
                    gGame.shownCount++
                    gGame.shownMinesCount++
                    renderCell(i, j, MINE)
                }
            }
        }
    }
    gGame.exterminateUsed = true
    ELEMENTS.elExterminate.disabled = true
    minesAroundForAll()
    checkGameOver()
}

function getSafeCells() {
    safe = []
    if (gGame.safeClicks === 0) return
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isShown && !currCell.isMine) {
                safe.push({ i, j })
            }
        }
    }
}

function onSafeClick() {
    if (!gGame.isOn) return
    getSafeCells()
    var randIdx = getRandomInt(0, safe.length - 1)
    var elCell = document.querySelector(`.cell-${safe[randIdx].i}-${safe[randIdx].j}`)
    elCell.classList.add('safe')
    setTimeout(() => {
        elCell.classList.remove('safe')
    }, 1000)
    gGame.safeClicks--
    ELEMENTS.elSafeClick.innerHTML = gGame.safeClicks
    if (!gGame.safeClicks) ELEMENTS.elSafeBtn.disabled = true
}

function noneHTML() {
    return `<div class='empty'>${NONE}</div>`
}