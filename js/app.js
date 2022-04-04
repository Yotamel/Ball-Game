const WALL = 'WALL';
const FLOOR = 'FLOOR';
const BALL = 'BALL';
const GAMER = 'GAMER'; //gBoard[3][8].gameElement
const GLUE = 'GLUE'
const GLUED = 'GLUED'

const GAMER_IMG = '<img src="img/gamer.png" />';
const BALL_IMG = '<img src="img/ball.png" />';
const GLUE_IMG = '<img src="img/floor-roots.png" />'
const GLUED_IMG = '<img src="img/gamer-entangled.png" />'

const PICKUP_SFX = new Audio('sound/pickup.mp3')
const GLUE_SFX = new Audio('sound/entangle.mp3')
var gBoard;
var gGamerPos;
var gBallInterval
var gGlueInterval
var gBallCount
var gGameWon
var elResetBtn = document.querySelector('.button')

function initGame() {
	gGamerPos = { i: 2, j: 9 };
	gBallCount = 0
	renderBallCount()
	elResetBtn.style.display = 'none'
	gGameWon = false
	gBoard = buildBoard();
	renderBoard(gBoard);
	gBallInterval = setInterval(function () { generateItem(BALL, BALL_IMG); }, 3000);
	gGlueInterval = setInterval(function () { generateItem(GLUE, GLUE_IMG); }, 5000);
}

function buildBoard() {
	// Create the Matrix
	var board = createMat(11, 13)
	var jMiddle = (board.length - 1) / 2 + 1
	var iMiddle = (board[0].length - 1) / 2 - 1


	// Put FLOOR everywhere and WALL at edges
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[0].length; j++) {
			// Put FLOOR in a regular cell
			var cell = { type: FLOOR, gameElement: null };

			// Place Walls at edges
			if (i === 0 && j !== jMiddle || i === board.length - 1 && j !== jMiddle || j === 0 && i !== iMiddle || j === board[0].length - 1 && i !== iMiddle) {
				cell.type = WALL;
			}
			// Add created cell to The game board
			board[i][j] = cell;
		}
	}

	// Place the gamer at selected position
	board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;

	// Place the Balls (currently randomly chosen positions)
	board[3][8].gameElement = BALL;
	board[7][4].gameElement = BALL;

	console.log(board);
	return board;
}

// Render the board to an HTML table
function renderBoard(board) {

	var strHTML = '';
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>\n';
		for (var j = 0; j < board[0].length; j++) {
			var currCell = board[i][j];

			var cellClass = getClassName({ i: i, j: j })

			// TODO - change to short if statement
			// if (currCell.type === FLOOR) cellClass += ' floor';
			// else if (currCell.type === WALL) cellClass += ' wall';
			cellClass += (currCell.type === FLOOR) ? ' floor' : ' wall';

			//TODO - Change To template string
			strHTML += '\t<td class="cell ' + cellClass +
				'"  onclick="moveTo(' + i + ',' + j + ')" >\n';

			// TODO - change to switch case statement
			if (currCell.gameElement === GAMER) {
				strHTML += GAMER_IMG;
			} else if (currCell.gameElement === BALL) {
				strHTML += BALL_IMG;
			}

			strHTML += '\t</td>\n';
		}
		strHTML += '</tr>\n';
	}
	var elBoard = document.querySelector('.board');
	elBoard.innerHTML = strHTML;
}

// Move the player to a specific location
function moveTo(i, j) {
	i = wrapGamer(i, true)
	j = wrapGamer(j, false)
	var targetCell = gBoard[i][j];
	var glued = false
	if (targetCell.type === WALL || gGameWon || gBoard[gGamerPos.i][gGamerPos.j].gameElement === GLUED) return;

	// Calculate distance to make sure we are moving to a neighbor cell
	var iAbsDiff = Math.abs(i - gGamerPos.i);
	var jAbsDiff = Math.abs(j - gGamerPos.j);

	// If the clicked Cell is one of the four allowed
	if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0) || (iAbsDiff === gBoard.length - 1 && jAbsDiff === 0) ||
	 (jAbsDiff === gBoard[0].length - 1 && iAbsDiff === 0) ) {

		if (targetCell.gameElement === BALL) {
			gBallCount++
			PICKUP_SFX.play()
			renderBallCount()
		}
		if (targetCell.gameElement === GLUE) {
			glued = true
			GLUE_SFX.play()
		}
		// MOVING from current position
		// Model:
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
		// Dom:
		renderCell(gGamerPos, '');

		// MOVING to selected position
		gGamerPos.i = i;
		gGamerPos.j = j;
		if (!glued) {
			//Model:
			gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
			// DOM:
			renderCell(gGamerPos, GAMER_IMG);
			gGameWon = winCheck()
		} else if (glued) {
			//Model:
			gBoard[gGamerPos.i][gGamerPos.j].gameElement = GLUED;
			// DOM:
			renderCell(gGamerPos, GLUED_IMG);
			setTimeout(() => { breakFree() }, 3000);
		}


	} // else console.log('TOO FAR', iAbsDiff, jAbsDiff);

}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
	var cellSelector = '.' + getClassName(location)
	var elCell = document.querySelector(cellSelector);
	elCell.innerHTML = value;
}

// Move the player by keyboard arrows
function handleKey(event) {

	var i = gGamerPos.i;
	var j = gGamerPos.j;
	console.log(`in handdleKey currPos i = ${i} j = ${j}`)


	switch (event.key) {
		case 'ArrowLeft':
			moveTo(i, j - 1);
			break;
		case 'ArrowRight':
			moveTo(i, j + 1);
			break;
		case 'ArrowUp':
			moveTo(i - 1, j);
			break;
		case 'ArrowDown':
			moveTo(i + 1, j);
			break;

	}

}

// Returns the class name for a specific cell
function getClassName(location) {
	var cellClass = 'cell-' + location.i + '-' + location.j;
	return cellClass;
}

function wrapGamer(idx, checkCol) {
	if (idx < 0) {
		return checkCol ? gBoard.length - 1 : gBoard[0].length - 1
	} else if (checkCol && idx === gBoard.length || !checkCol && idx === gBoard[0].length) {
		return 0
	} else return idx

	// if (isI) {
	// 	switch (idx === gBoard.length || idx < 0) {
	// 		case idx === gBoard.length:
	// 			return 0;
	// 		case idx < 0:
	// 			return (gBoard.length - 1)
	// 		default:
	// 			return idx
	// 	}
	// } else {
	// 	switch (idx === gBoard[0].length || idx < 0) {
	// 		case idx === gBoard[0].length:
	// 			return 0
	// 		case idx < 0:
	// 			return gBoard[0].length - 1
	// 		default:
	// 			return idx
	// 	}
	// }
}

function generateItem(item, itemImg) {
	var itemIndex = getItemPosition()
	while (gBoard[itemIndex.i][itemIndex.j].gameElement) itemIndex = getItemPosition()
	gBoard[itemIndex.i][itemIndex.j].gameElement = item
	renderCell(itemIndex, itemImg)
}

function getItemPosition() {
	var row = getRandomInt(1, gBoard[0].length - 3)
	var col = getRandomInt(1, gBoard.length + 1)
	return { i: row, j: col }
}

function renderBallCount() {
	var elBallCount = document.querySelector('.ballCount span')
	elBallCount.innerHTML = gBallCount
}

function noBalls() {
	for (i = 0; i < gBoard.length; i++) {
		for (j = 0; j < gBoard[0].length; j++) {
			if (gBoard[i][j].gameElement === BALL) return false
		}
	}
	return true
}

function breakFree() {
	//Model:
	gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
	// DOM:
	renderCell(gGamerPos, GAMER_IMG);
}

function winCheck() {
	if (noBalls()) {
		clearInterval(gBallInterval)
		clearInterval(gGlueInterval)
		var elHeader = document.querySelector('.ballCount span')
		elResetBtn.style.display = 'flex';
		elHeader.innerHTML += '   You Won!'
		return true
		return false


	}
}