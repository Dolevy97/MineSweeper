const EMPTY = ' '
const NONE = '0'
const MINE = '💣'
const FLAG = '🚩'
const SCORES = []

const ELEMENTS = {
    elHearts: document.querySelectorAll('.heart'),
    elSmiley: document.querySelector('.smiley-btn'),
    elFlagged: document.querySelector('.num-flagged'),
    gElSecs: document.querySelector(`.secs`),
    leaderboard: document.querySelector('.leaderboard')
}

var gBoard

var gLevel = {
    NAME: 'easy',
    SIZE: 4,
    MINES: 2
}
var gTimerInterval

var gGame = {
    isDarkMode: false,
    hints: 3,
    isHint: false,
    livesLeft: 3,
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    flagged: gLevel.MINES,
    isFirstClick: true,
    totalSeconds: 0
}

function onInitGame() {
    resetGame()
    gBoard = createMat(gLevel.SIZE)
    renderBoard(gBoard)
}

function resetGame() {
    gGame.isFirstClick = true
    gGame.flagged = gLevel.MINES
    gGame.livesLeft = 3
    gGame.totalSeconds = 0
    ELEMENTS.elSmiley.innerHTML = gGame.isDarkMode ? '😈' : '😊';
    ELEMENTS.elFlagged.innerHTML = gGame.flagged
    ELEMENTS.gElSecs.innerHTML = gGame.totalSeconds
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.isOn = true
    for (var i = 1; i <= 3; i++) {
        document.querySelector(`.hint${i}`).innerHTML = '💡'
        elHeart = document.querySelector(`.heart${i}`).hidden = false
        document.querySelector(`.heart${i}`).src = gGame.isDarkMode ? "img/darkHeart.png" : "img/Heart.png";
    }
    gGame.hints = 3
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
    // if (!mat[0][0].isMine && !mat[0][0].isShown) {
    //     mat[0][0].isMine = true
    //     mat[0][0].currContent = MINE
    // }
    // if (!mat[3][3].isMine && !mat[3][3].isShown) {
    //     mat[3][3].isMine = true
    //     mat[3][3].currContent = MINE
    // }

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
            const className = `cell cell-${i}-${j}`
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
    if (!currCell.isMine && gGame.isFirstClick) {
        generateMines(gBoard)
        minesAroundForAll()
        gTimerInterval = setInterval(setTime, 1000)
    }
    if (gBoard[cellI][cellJ].isMine) {
        renderCell(cellI, cellJ, MINE)
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
    if (checkVictory()) gameOver()
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
    if (checkVictory()) gameOver()
}

function handleLives() {
    gGame.livesLeft--
    for (var i = 3; i > gGame.livesLeft; i--) {
        elHeart = document.querySelector(`.heart${i}`).hidden = true
    }
    console.log(`You have ${gGame.livesLeft} lives left.`)
    if (gGame.livesLeft === 0) gameOver()
    else if (!checkVictory()) {
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
    if (gGame.shownCount === (gBoard.length ** 2 - gLevel.MINES) && markedMineCount === gLevel.MINES) return true
    else return false
}

function gameOver() {
    clearInterval(gTimerInterval)
    if (checkVictory()) {
        console.log('You won!')
        var name = prompt('Enter your name')
        // var name = 'Dolev'
        var newPlayer = { name, time: gGame.totalSeconds }
        SCORES.unshift(newPlayer)
        updateLeaderboard()
        sortLeaderboard()
        ELEMENTS.elSmiley.innerHTML = gGame.isDarkMode ? '👹' : '😎';
    } else {
        console.log('You lost.')
        ELEMENTS.elSmiley.innerHTML = gGame.isDarkMode ? '🪦' : '😭';
    }
    gGame.isOn = false
}

function sortLeaderboard() {
    if (SCORES.length <= 1) return
    if (SCORES[1].time < SCORES[0].time) {
        var tempPlayer = SCORES.splice(1, 1)[0]
        SCORES.unshift(tempPlayer)
    }
    if (!(SCORES.length <= 2)) {
        if (SCORES[2].time < SCORES[1].time) {
            var tempPlayer = SCORES[2]
            SCORES[2] = SCORES[1]
            SCORES[1] = tempPlayer
            sortLeaderboard()
        } else if (SCORES[2].time <= SCORES[1].time) {
            var tempPlayer = SCORES[2]
            SCORES[2] = SCORES[1]
            SCORES[1] = tempPlayer
        }
    }
    if (SCORES.length > 3) SCORES.pop()
    //After everything is sorted and there're only 3 score holders..
    updateLeaderboard()
}

function updateLeaderboard() {
    var savedTimes = localStorage.setItem('bestTimes', JSON.stringify(SCORES))
    if (savedTimes) SCORES = JSON.parse(savedTimes)
    var strHTML = ``
    for (var i = 0; i < SCORES.length; i++) {
        strHTML += `<p>${i + 1}. ${SCORES[i].name}: ${SCORES[i].time} seconds</p>`
    }
    ELEMENTS.leaderboard.innerHTML = strHTML
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


function noneHTML() {
    return `<div class='empty'>${NONE}</div>`
}
