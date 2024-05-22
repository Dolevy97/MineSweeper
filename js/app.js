const SIZE = 4
const EMPTY = ' '
const MINE = '💣'

var gBoard
var gLevel = {
    SIZE: 4,
    MINES: 2
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

function onInitGame() {
    gBoard = createMat(gLevel.SIZE)
    console.table(gBoard)
    renderBoard(gBoard)
}

function createMat(size) {
    const mat = []
    for (var i = 0; i < size; i++) {
        mat[i] = []
        for (var j = 0; j < size; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            mat[i][j] = cell
        }
    }
    generateMines(mat)
    return mat
}

function generateMines(mat) {
    mat[0][1].isMine = true
    mat[3][3].isMine = true
    mat[2][1].isMine = true
    // var mineCount = 0
    // while (mineCount < gLevel.MINES) {
    //     var randIIdx = getRandomInt(0, gLevel.SIZE)
    //     var randJIdx = getRandomInt(0, gLevel.SIZE)
    //     if (mat[randIIdx][randJIdx] !== MINE) {
    //         mat[randIIdx][randJIdx] = MINE
    //         mineCount++
    //     }
    // }
}

function renderBoard(board) {
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]
            const className = `cell cell-${i}-${j}`
            if (cell.isMine === true) strHTML += `<td onclick="onClickCell(${i},${j})" class="${className}"></td>`
            else strHTML += `<td onclick="onClickCell(${i},${j})" class="${className}"></td>`
        }
        strHTML += '</tr>'
    }
    const elContainer = document.querySelector('.game-container')
    elContainer.innerHTML = strHTML
}

function onClickCell(cellI, cellJ) {
    if (gBoard[cellI][cellJ].isMine === true) {
        ///Clicked Mine
        renderCell(cellI, cellJ, MINE)
    } else {
        //Clicked anything else
        var currCell = gBoard[cellI][cellJ]
        currCell.isShown = true
        currCell.minesAroundCount = setMinesNegsCount(cellI, cellJ)
        var cellMineCount = currCell.minesAroundCount
        renderCell(cellI, cellJ, cellMineCount)
        gGame.shownCount++
    }
}

function renderCell(locationI, locationJ, value) {
    // Select the elCell and set the value
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
