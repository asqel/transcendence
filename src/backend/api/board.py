import api
def is_board_full(board):
	for i in board:
		for k in i:
			if k == 0:
				return False
	return True

def do_win_top_left(board, color, x, y):
	line = [0] * 7
	height = len(board)
	width = len(board[0])
	line[3] = color
	for i in range(3):
		x1 = x - i - 1
		y1 = y - i - 1
		if (y1 >= 0 and x1 >= 0):
			line[2 - i] = board[y1][x1]

		x2 = x + i + 1
		y2 = y + i + 1
		if (y2 < height and x2 < width):
			line[4 + i] = board[y2][x2]
	for i in range(len(line) - 3):
		count = 0
		for k in range(4):
			if (line[i + k] == color):
				count += 1
		if (count == 4):
			return True
	return False

def do_win_top_right(board, color, x, y):
	line = [0] * 7
	height = len(board)
	width = len(board[0])
	line[3] = color
	for i in range(3):
		x1 = x + i + 1
		y1 = y - i - 1
		if (y1 >= 0 and x1 < width):
			line[2 - i] = board[y1][x1]

		x2 = x - i - 1
		y2 = y + i + 1
		if (y2 < height and x2 >= 0):
			line[4 + i] = board[y2][x2]
	for i in range(len(line) - 3):
		count = 0
		for k in range(4):
			if (line[i + k] == color):
				count += 1
		if (count == 4):
			return True
	return False

def do_win_vert(board, color, x, y):
	line = [0] * 7
	height = len(board)
	width = len(board[0])
	line[3] = color
	for i in range(3):
		x1 = x
		y1 = y - i - 1
		if (y1 >= 0):
			line[2 - i] = board[y1][x1]

		x2 = x
		y2 = y + i + 1
		if (y2 < height):
			line[4 + i] = board[y2][x2]
	for i in range(len(line) - 3):
		count = 0
		for k in range(4):
			if (line[i + k] == color):
				count += 1
		if (count == 4):
			return True
	return False

def do_win_horiz(board, color, x, y):
	line = [0] * 7
	height = len(board)
	width = len(board[0])
	line[3] = color
	for i in range(3):
		x1 = x - i - 1
		y1 = y
		if (x1 >= 0):
			line[2 - i] = board[y1][x1]

		x2 = x + i + 1
		y2 = y
		if (x2 < width):
			line[4 + i] = board[y2][x2]
	for i in range(len(line) - 3):
		count = 0
		for k in range(4):
			if (line[i + k] == color):
				count += 1
		if (count == 4):
			return True
	return False
